import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma, RoleTier, UserStatus } from "@prisma/client";
import { randomBytes } from "node:crypto";
import * as bcrypt from "bcryptjs";

import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { MailService } from "../mail/mail.service";
import { assertBrandScope } from "../../common/auth/permissions";
import type { AuthUser } from "../../common/auth/current-user.decorator";

const selection = {
  id: true,
  email: true,
  name: true,
  status: true,
  jobTitle: true,
  modules: true,
  lastLoginAt: true,
  createdAt: true,
  role: true,
  brands: { select: { brandId: true } },
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly mail: MailService,
  ) {}

  list(user: AuthUser, filters: { brandId?: string; search?: string }) {
    const scope: Prisma.UserWhereInput = user.allBrands
      ? {}
      : { brands: { some: { brandId: { in: user.brandIds } } } };
    if (filters.brandId) {
      assertBrandScope(user, filters.brandId);
      scope.brands = { some: { brandId: filters.brandId } };
    }
    return this.prisma.user.findMany({
      where: {
        ...scope,
        ...(filters.search
          ? {
              OR: [
                { name: { contains: filters.search, mode: "insensitive" } },
                { email: { contains: filters.search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: selection,
      orderBy: { name: "asc" },
    });
  }

  roles() {
    return this.prisma.role.findMany({ orderBy: [{ tier: "asc" }, { name: "asc" }] });
  }

  createRole(dto: {
    key: string;
    name: string;
    tier: RoleTier;
    allBrands: boolean;
    modules: string[];
    canPublish: boolean;
    canApprove: boolean;
    canManageUsers: boolean;
    description?: string;
  }) {
    return this.prisma.role.create({ data: { ...dto, description: dto.description ?? null } });
  }

  async invite(
    actor: AuthUser,
    dto: { email: string; name: string; roleKey: string; brandIds: string[]; modules?: string[]; jobTitle?: string },
  ) {
    const role = await this.prisma.role.findUnique({ where: { key: dto.roleKey } });
    if (!role) throw new BadRequestException("Unknown role");
    // A brand admin can only grant access to brands they themselves cover.
    if (!actor.allBrands) {
      if (role.allBrands) throw new ForbiddenException("You cannot grant organisation-wide access");
      dto.brandIds.forEach((brandId) => assertBrandScope(actor, brandId));
    }

    const tempPassword = randomBytes(9).toString("base64url");
    const created = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        name: dto.name,
        roleId: role.id,
        status: "INVITED",
        modules: dto.modules ?? [],
        jobTitle: dto.jobTitle ?? null,
        passwordHash: await bcrypt.hash(tempPassword, 12),
        brands: { create: dto.brandIds.map((brandId) => ({ brandId })) },
      },
      select: selection,
    });

    await this.mail.send({
      to: created.email,
      subject: "You have been invited to the Sundry Foods console",
      heading: `Welcome, ${created.name}`,
      lines: [
        `${actor.name} invited you as <strong>${role.name}</strong>.`,
        `Sign in with your email and this temporary password: <strong>${tempPassword}</strong>`,
        "You will be asked to change it after your first sign-in.",
      ],
      ctaLabel: "Sign in",
      ctaPath: "/",
    });

    await this.audit.record({
      actorId: actor.id,
      actorName: actor.name,
      module: "users",
      action: "User invited",
      detail: `${actor.name} invited ${created.email} as ${role.name}`,
      category: "access",
      severity: "NOTICE",
    });

    return created;
  }

  async update(
    actor: AuthUser,
    id: string,
    dto: { name?: string; roleKey?: string; brandIds?: string[]; modules?: string[]; status?: UserStatus },
  ) {
    const existing = await this.prisma.user.findUnique({ where: { id }, include: { brands: true } });
    if (!existing) throw new NotFoundException("User not found");
    if (!actor.allBrands) {
      existing.brands.forEach((b) => assertBrandScope(actor, b.brandId));
      dto.brandIds?.forEach((brandId) => assertBrandScope(actor, brandId));
    }

    const role = dto.roleKey
      ? await this.prisma.role.findUniqueOrThrow({ where: { key: dto.roleKey } })
      : null;
    if (role && !actor.allBrands && role.allBrands) {
      throw new ForbiddenException("You cannot grant organisation-wide access");
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(role ? { roleId: role.id } : {}),
        ...(dto.modules ? { modules: dto.modules } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.brandIds
          ? { brands: { deleteMany: {}, create: dto.brandIds.map((brandId) => ({ brandId })) } }
          : {}),
      },
      select: selection,
    });

    await this.audit.record({
      actorId: actor.id,
      actorName: actor.name,
      module: "users",
      action: "Access updated",
      detail: `${actor.name} updated access for ${updated.email}`,
      category: "access",
      severity: "NOTICE",
      metadata: { brandIds: dto.brandIds ?? null, modules: dto.modules ?? null, status: dto.status ?? null },
    });

    return updated;
  }

  async resendInvite(actor: AuthUser, id: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id } });
    const tempPassword = randomBytes(9).toString("base64url");
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash: await bcrypt.hash(tempPassword, 12), status: "INVITED" },
    });
    await this.mail.send({
      to: user.email,
      subject: "Your Sundry Foods console invite",
      heading: `Hello ${user.name}`,
      lines: [
        `${actor.name} re-sent your invite.`,
        `Temporary password: <strong>${tempPassword}</strong>`,
      ],
      ctaLabel: "Sign in",
      ctaPath: "/",
    });
    return { ok: true as const };
  }
}
