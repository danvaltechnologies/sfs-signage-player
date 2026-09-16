import { Controller, Headers, HttpCode, Post, RawBodyRequest, Req, UnauthorizedException } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import type { PosChannel } from "@prisma/client";

import { Public } from "../../common/auth/public.decorator";
import { QueueService } from "./queue.service";

type Incoming = {
  order_id?: string;
  ticket?: string;
  brand_id?: string;
  outlet_id?: string;
  channel?: string;
  customer?: string;
  paid_at?: string;
  items?: Array<{ name?: string; quantity?: number }>;
};

const channels: Record<string, PosChannel> = {
  Counter: "COUNTER",
  Kiosk: "KIOSK",
  "Drive-thru": "DRIVE_THRU",
  Delivery: "DELIVERY",
};

/**
 * POS -> QMS webhook. Any till system (or the middleware in front of it) posts a
 * paid order here.
 *
 * Signature: `x-sundry-signature: sha256=<hex>` where the digest is
 * HMAC-SHA256 of the raw request body keyed with POS_WEBHOOK_SECRET.
 */
@ApiTags("pos")
@Controller("public/pos")
export class PosWebhookController {
  constructor(private readonly queue: QueueService) {}

  @Public()
  @Post("orders")
  @HttpCode(202)
  async ingest(
    @Req() req: RawBodyRequest<Request>,
    @Headers("x-sundry-signature") signature: string | undefined,
  ) {
    const secret = process.env.POS_WEBHOOK_SECRET;
    if (!secret) throw new UnauthorizedException("POS webhook secret is not configured");

    const raw = req.rawBody?.toString("utf8") ?? JSON.stringify(req.body ?? {});
    if (!this.signatureValid(raw, signature, secret)) {
      throw new UnauthorizedException("invalid signature");
    }

    const payload = JSON.parse(raw) as Incoming;
    const orderId = String(payload.order_id ?? "").trim();
    const brandId = String(payload.brand_id ?? "").trim();
    const items = (payload.items ?? [])
      .map((i) => ({ name: String(i?.name ?? "").trim().slice(0, 80), quantity: Number(i?.quantity ?? 1) }))
      .filter((i) => i.name.length > 0)
      .slice(0, 40);

    if (!orderId || orderId.length > 64) throw new UnauthorizedException("order_id is required");
    if (items.length === 0) throw new UnauthorizedException("at least one item is required");

    const order = await this.queue.ingest({
      orderId,
      brandId,
      items,
      ...(payload.outlet_id ? { outletId: String(payload.outlet_id).trim() } : {}),
      ...(payload.ticket ? { ticket: String(payload.ticket).trim().slice(0, 16) } : {}),
      ...(payload.customer ? { customer: String(payload.customer).trim().slice(0, 60) } : {}),
      ...(payload.paid_at ? { paidAt: String(payload.paid_at).slice(0, 40) } : {}),
      ...(payload.channel && channels[payload.channel] ? { channel: channels[payload.channel] } : {}),
    });

    return {
      accepted: true,
      ticket: order.ticket,
      stage: order.stage,
      prep_minutes: order.prepMinutes,
      ready_at: order.readyAt.toISOString(),
    };
  }

  private signatureValid(raw: string, header: string | undefined, secret: string): boolean {
    if (!header) return false;
    const provided = header.startsWith("sha256=") ? header.slice(7) : header;
    const expected = createHmac("sha256", secret).update(raw).digest("hex");
    const a = Buffer.from(provided, "utf8");
    const b = Buffer.from(expected, "utf8");
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
