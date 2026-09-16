import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { PosChannel, PosOrder, PrepRule } from "@prisma/client";

import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { brandScopeWhere } from "../../common/auth/permissions";
import type { AuthUser } from "../../common/auth/current-user.decorator";

export type PosStageName = "PLACED" | "PREPARING" | "READY" | "COLLECTED";

export type IngestInput = {
  orderId: string;
  brandId: string;
  outletId?: string;
  ticket?: string;
  channel?: PosChannel;
  customer?: string;
  items: Array<{ name: string; quantity?: number }>;
  paidAt?: string;
};

/**
 * The POS only reports that an order was placed and paid. Preparing / Ready /
 * Collected are derived from the prep minutes configured per brand and product
 * line, so counter boards advance on their own.
 */
@Injectable()
export class QueueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  resolvePrepMinutes(
    config: { defaultMinutes: number; rules: PrepRule[] } | null,
    itemNames: string[],
  ): number {
    if (!config) return 8;
    const text = itemNames.join(" ").toLowerCase();
    const matched = config.rules
      .filter((rule) => rule.keywords.some((k) => text.includes(k.toLowerCase())))
      .map((rule) => rule.minutes);
    return matched.length ? Math.max(...matched) : config.defaultMinutes;
  }

  deriveStage(
    order: Pick<PosOrder, "placedAt" | "prepMinutes" | "collectedAt">,
    autoCollectAfter: number,
    now = Date.now(),
  ) {
    const placedAt = order.placedAt.getTime();
    const readyAt = placedAt + order.prepMinutes * 60_000;
    const elapsedMs = now - placedAt;
    let stage: PosStageName;
    if (order.collectedAt || now >= readyAt + autoCollectAfter * 60_000) stage = "COLLECTED";
    else if (now >= readyAt) stage = "READY";
    else if (elapsedMs >= 60_000) stage = "PREPARING";
    else stage = "PLACED";
    return {
      stage,
      readyAt: new Date(readyAt),
      elapsed: Math.max(0, Math.floor(elapsedMs / 60_000)),
      overdue: stage !== "READY" && stage !== "COLLECTED" && now > readyAt,
    };
  }

  /** Records a paid POS order (idempotent on the POS order id). */
  async ingest(input: IngestInput) {
    const config = await this.prisma.brandPrepConfig.findUnique({
      where: { brandId: input.brandId },
      include: { rules: true },
    });
    const brand = await this.prisma.brand.findUnique({ where: { id: input.brandId } });
    if (!brand) throw new BadRequestException("unknown brand_id");

    const itemNames = input.items.map((i) => i.name);
    const parsed = input.paidAt ? Date.parse(input.paidAt) : Date.now();
    const placedAt = new Date(Number.isFinite(parsed) ? parsed : Date.now());
    const prepMinutes = this.resolvePrepMinutes(config, itemNames);
    const itemsLabel = input.items
      .map((i) => (i.quantity && i.quantity > 1 ? `${i.name} x${i.quantity}` : i.name))
      .join(", ");
    const ticket = input.ticket ?? `#${input.orderId.slice(-4).toUpperCase()}`;

    const order = await this.prisma.posOrder.upsert({
      where: { id: input.orderId },
      create: {
        id: input.orderId,
        brandId: input.brandId,
        outletId: input.outletId ?? null,
        ticket,
        channel: input.channel ?? "COUNTER",
        customer: input.customer ?? "Guest",
        itemsLabel,
        itemNames,
        placedAt,
        prepMinutes,
      },
      update: { ticket, itemsLabel, itemNames, placedAt, prepMinutes },
    });

    const derived = this.deriveStage(order, config?.autoCollectAfter ?? 6);
    return { ...order, ...derived };
  }

  async board(user: AuthUser, filters: { brandId?: string; outletId?: string }) {
    const since = new Date(Date.now() - 3 * 3_600_000);
    const orders = await this.prisma.posOrder.findMany({
      where: {
        ...brandScopeWhere(user, filters.brandId),
        ...(filters.outletId ? { outletId: filters.outletId } : {}),
        placedAt: { gte: since },
      },
      orderBy: { placedAt: "asc" },
      take: 500,
    });
    const configs = await this.prisma.brandPrepConfig.findMany({ include: { rules: true } });
    const byBrand = new Map(configs.map((c) => [c.brandId, c]));
    const now = Date.now();

    const tickets = orders.map((order) => ({
      ...order,
      ...this.deriveStage(order, byBrand.get(order.brandId)?.autoCollectAfter ?? 6, now),
    }));

    // POS link health per outlet, based on how recently an order arrived.
    const lastByOutlet = new Map<string, number>();
    for (const t of tickets) {
      if (!t.outletId) continue;
      lastByOutlet.set(t.outletId, Math.max(lastByOutlet.get(t.outletId) ?? 0, t.placedAt.getTime()));
    }
    const links = [...lastByOutlet.entries()].map(([outletId, at]) => ({
      outletId,
      lastOrderAt: new Date(at),
      posLink: now - at < 15 * 60_000 ? "connected" : now - at < 60 * 60_000 ? "degraded" : "offline",
    }));

    const waiting = tickets.filter((t) => t.stage === "PLACED" || t.stage === "PREPARING");
    return {
      serverTime: new Date(now),
      tickets,
      links,
      stats: {
        waiting: waiting.length,
        ready: tickets.filter((t) => t.stage === "READY").length,
        collected: tickets.filter((t) => t.stage === "COLLECTED").length,
        overdue: tickets.filter((t) => t.overdue).length,
        averageWaitMinutes: waiting.length
          ? Math.round(waiting.reduce((sum, t) => sum + t.elapsed, 0) / waiting.length)
          : 0,
      },
    };
  }

  async markCollected(user: AuthUser, orderId: string) {
    const order = await this.prisma.posOrder.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException("Order not found");
    await this.prisma.posOrder.update({ where: { id: orderId }, data: { collectedAt: new Date() } });
    await this.audit.record({
      actorId: user.id,
      actorName: user.name,
      brandId: order.brandId,
      module: "queue",
      action: "Order collected",
      detail: `${user.name} marked ticket ${order.ticket} as collected`,
      category: "queue",
    });
    return { ok: true as const };
  }

  prepConfig(user: AuthUser, brandId?: string) {
    return this.prisma.brandPrepConfig.findMany({
      where: brandScopeWhere(user, brandId),
      include: { rules: { orderBy: { product: "asc" } } },
    });
  }

  async setBrandTimings(user: AuthUser, brandId: string, patch: { defaultMinutes?: number; autoCollectAfter?: number }) {
    const config = await this.prisma.brandPrepConfig.upsert({
      where: { brandId },
      create: {
        brandId,
        defaultMinutes: patch.defaultMinutes ?? 8,
        autoCollectAfter: patch.autoCollectAfter ?? 6,
      },
      update: {
        ...(patch.defaultMinutes !== undefined ? { defaultMinutes: patch.defaultMinutes } : {}),
        ...(patch.autoCollectAfter !== undefined ? { autoCollectAfter: patch.autoCollectAfter } : {}),
      },
    });
    await this.audit.record({
      actorId: user.id,
      actorName: user.name,
      brandId,
      module: "queue",
      action: "Prep timings updated",
      detail: `${user.name} updated the queue timings for ${brandId}`,
      category: "queue",
      severity: "NOTICE",
    });
    return config;
  }

  async setPrepRule(user: AuthUser, ruleId: string, minutes: number) {
    const rule = await this.prisma.prepRule.findUnique({ where: { id: ruleId } });
    if (!rule) throw new NotFoundException("Prep rule not found");
    const updated = await this.prisma.prepRule.update({ where: { id: ruleId }, data: { minutes } });
    await this.audit.record({
      actorId: user.id,
      actorName: user.name,
      brandId: rule.brandId,
      module: "queue",
      action: "Prep time updated",
      detail: `${user.name} set "${rule.product}" prep time to ${minutes} min`,
      category: "queue",
    });
    return updated;
  }
}
