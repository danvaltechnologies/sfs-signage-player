import { Injectable } from "@nestjs/common";
import type { AuditSeverity } from "@prisma/client";

import { PrismaService } from "../../common/prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import { PushService } from "./push.service";

export type NotifyInput = {
  title: string;
  body: string;
  link?: string;
  category?: string;
  severity?: AuditSeverity;
  /** Also send an SMTP email alert. */
  email?: boolean;
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly push: PushService,
  ) {}

  async notifyUsers(userIds: string[], input: NotifyInput): Promise<void> {
    const unique = [...new Set(userIds)];
    if (!unique.length) return;

    const created = await this.prisma.$transaction(
      unique.map((userId) =>
        this.prisma.notification.create({
          data: {
            userId,
            title: input.title,
            body: input.body,
            link: input.link ?? null,
            category: input.category ?? "system",
            severity: input.severity ?? "INFO",
          },
        }),
      ),
    );

    await Promise.all(
      created.map((n) => this.push.sendToUser(n.userId, { title: n.title, body: n.body, link: n.link })),
    );

    if (input.email) {
      const users = await this.prisma.user.findMany({
        where: { id: { in: unique }, status: "ACTIVE" },
        select: { id: true, email: true },
      });
      if (users.length) {
        const sent = await this.mail.send({
          to: users.map((u) => u.email),
          subject: input.title,
          heading: input.title,
          lines: [input.body],
          ctaLabel: input.link ? "Open the console" : undefined,
          ctaPath: input.link,
        });
        if (sent) {
          await this.prisma.notification.updateMany({
            where: { id: { in: created.map((n) => n.id) } },
            data: { emailedAt: new Date() },
          });
        }
      }
    }
  }

  /** Targets everyone who can approve content for a brand (brand admins + org level). */
  async notifyApprovers(brandId: string, input: NotifyInput): Promise<void> {
    const users = await this.prisma.user.findMany({
      where: {
        status: "ACTIVE",
        role: { canApprove: true },
        OR: [{ role: { allBrands: true } }, { brands: { some: { brandId } } }],
      },
      select: { id: true },
    });
    await this.notifyUsers(users.map((u) => u.id), input);
  }

  /** Targets operators who should hear about screen or queue incidents for a brand. */
  async notifyOperators(brandId: string, input: NotifyInput): Promise<void> {
    const users = await this.prisma.user.findMany({
      where: {
        status: "ACTIVE",
        OR: [{ role: { allBrands: true } }, { brands: { some: { brandId } } }],
      },
      select: { id: true },
    });
    await this.notifyUsers(users.map((u) => u.id), input);
  }

  list(userId: string, unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { readAt: null } : {}) },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  unreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, readAt: null } });
  }

  async markRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({ where: { id, userId }, data: { readAt: new Date() } });
    return { ok: true as const };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true as const };
  }
}
