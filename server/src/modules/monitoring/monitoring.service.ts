import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";

import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { NotificationsService } from "../notifications/notifications.service";
import { QueueService } from "../queue/queue.service";

/**
 * Background watchers that produce the console's alerts:
 *  - a screen that stops sending heartbeats is flipped to offline and reported
 *  - a queue ticket running well past its ready time raises an alert
 */
@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
    private readonly queue: QueueService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkScreens(): Promise<void> {
    const minutes = Number(process.env.SCREEN_OFFLINE_AFTER_MINUTES ?? 15);
    const cutoff = new Date(Date.now() - minutes * 60_000);
    const stale = await this.prisma.screen.findMany({
      where: {
        status: { not: "OFFLINE" },
        OR: [{ lastSeenAt: null, pairedAt: { lt: cutoff } }, { lastSeenAt: { lt: cutoff } }],
      },
    });
    if (!stale.length) return;

    await this.prisma.screen.updateMany({
      where: { id: { in: stale.map((s) => s.id) } },
      data: { status: "OFFLINE" },
    });

    for (const screen of stale) {
      await this.audit.record({
        actorName: "System",
        brandId: screen.brandId,
        module: "screens",
        action: "Screen offline",
        detail: `${screen.code} at ${screen.location} stopped reporting for over ${minutes} minutes`,
        category: "screens",
        severity: "CRITICAL",
      });
      await this.notifications.notifyOperators(screen.brandId, {
        title: `Screen offline: ${screen.code}`,
        body: `${screen.code} at ${screen.location}, ${screen.city} has not reported in for over ${minutes} minutes.`,
        link: "/screens",
        category: "screens",
        severity: "CRITICAL",
        email: true,
      });
    }
    this.logger.warn(`${stale.length} screen(s) marked offline`);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkOverdueOrders(): Promise<void> {
    const grace = Number(process.env.QUEUE_OVERDUE_ALERT_MINUTES ?? 5);
    const orders = await this.prisma.posOrder.findMany({
      where: {
        collectedAt: null,
        overdueAlertSentAt: null,
        placedAt: { gte: new Date(Date.now() - 3 * 3_600_000) },
      },
    });
    const configs = await this.prisma.brandPrepConfig.findMany({ include: { rules: true } });
    const byBrand = new Map(configs.map((c) => [c.brandId, c]));
    const now = Date.now();

    for (const order of orders) {
      const config = byBrand.get(order.brandId);
      const { stage, readyAt } = this.queue.deriveStage(order, config?.autoCollectAfter ?? 6, now);
      if (stage === "COLLECTED") continue;
      if (now < readyAt.getTime() + grace * 60_000) continue;

      await this.prisma.posOrder.update({
        where: { id: order.id },
        data: { overdueAlertSentAt: new Date() },
      });
      await this.audit.record({
        actorName: "System",
        brandId: order.brandId,
        module: "queue",
        action: "Order running late",
        detail: `Ticket ${order.ticket} is more than ${grace} minutes past its ready time`,
        category: "queue",
        severity: "CRITICAL",
      });
      await this.notifications.notifyOperators(order.brandId, {
        title: `Order running late: ${order.ticket}`,
        body: `${order.ticket} (${order.itemsLabel}) is over ${grace} minutes past its promised ready time.`,
        link: "/queue",
        category: "queue",
        severity: "CRITICAL",
        email: true,
      });
    }
  }
}
