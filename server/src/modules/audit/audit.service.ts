import { Injectable } from "@nestjs/common";
import type { AuditSeverity, Prisma } from "@prisma/client";

import { PrismaService } from "../../common/prisma/prisma.service";
import { brandScopeWhere } from "../../common/auth/permissions";
import type { AuthUser } from "../../common/auth/current-user.decorator";

export type AuditInput = {
  actorId?: string | null;
  actorName: string;
  brandId?: string | null;
  module: string;
  action: string;
  detail: string;
  category: string;
  severity?: AuditSeverity;
  metadata?: Prisma.InputJsonValue;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  record(input: AuditInput) {
    return this.prisma.auditEvent.create({
      data: {
        actorId: input.actorId ?? null,
        actorName: input.actorName,
        brandId: input.brandId ?? null,
        module: input.module,
        action: input.action,
        detail: input.detail,
        category: input.category,
        severity: input.severity ?? "INFO",
        ...(input.metadata === undefined ? {} : { metadata: input.metadata }),
      },
    });
  }

  async list(
    user: AuthUser,
    filters: { brandId?: string; category?: string; severity?: AuditSeverity; search?: string; take?: number },
  ) {
    const where: Prisma.AuditEventWhereInput = {
      ...brandScopeWhere(user, filters.brandId),
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.severity ? { severity: filters.severity } : {}),
      ...(filters.search
        ? {
            OR: [
              { detail: { contains: filters.search, mode: "insensitive" } },
              { action: { contains: filters.search, mode: "insensitive" } },
              { actorName: { contains: filters.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };



    return this.prisma.auditEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(filters.take ?? 200, 500),
    });
  }
}
