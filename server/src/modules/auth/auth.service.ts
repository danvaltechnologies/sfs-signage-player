import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { createHash, randomBytes } from "node:crypto";
import * as bcrypt from "bcryptjs";

import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../../common/auth/current-user.decorator";

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  async login(email: string, password: string, ip?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { role: true, brands: true },
    });
    if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException("Email or password is incorrect");
    }
    if (user.status !== "ACTIVE") {
      throw new UnauthorizedException("This account is not active yet");
    }

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await this.audit.record({
      actorId: user.id,
      actorName: user.name,
      module: "auth",
      action: "Signed in",
      detail: `${user.email} signed in${ip ? ` from ${ip}` : ""}`,
      category: "security",
      severity: "INFO",
    });

    return {
      ...(await this.issueTokens(user.id)),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: { key: user.role.key, name: user.role.name, tier: user.role.tier },
        allBrands: user.role.allBrands,
        brandIds: user.brands.map((b) => b.brandId),
        modules: user.modules.length ? user.modules : user.role.modules,
        canPublish: user.role.canPublish,
        canApprove: user.role.canApprove,
        canManageUsers: user.role.canManageUsers,
      },
    };
  }

  async refresh(refreshToken: string) {
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(refreshToken) },
    });
    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException("Session expired, please sign in again");
    }
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });
    return this.issueTokens(record.userId);
  }

  async logout(refreshToken: string): Promise<{ ok: true }> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  async changePassword(user: AuthUser, currentPassword: string, newPassword: string) {
    const record = await this.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    if (!record.passwordHash || !(await bcrypt.compare(currentPassword, record.passwordHash))) {
      throw new UnauthorizedException("Current password is incorrect");
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(newPassword, 12) },
    });
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.audit.record({
      actorId: user.id,
      actorName: user.name,
      module: "auth",
      action: "Password changed",
      detail: `${user.email} changed their password`,
      category: "security",
      severity: "NOTICE",
    });
    return { ok: true as const };
  }

  private async issueTokens(userId: string) {
    const accessToken = await this.jwt.signAsync({ sub: userId }, {
      secret: process.env.JWT_SECRET,
      expiresIn: (process.env.JWT_EXPIRES_IN ?? "15m") as `${number}m`,
    });
    const refreshToken = randomBytes(48).toString("hex");
    const days = Number((process.env.JWT_REFRESH_EXPIRES_IN ?? "30d").replace(/\D/g, "")) || 30;
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + days * 86_400_000),
      },
    });
    return { accessToken, refreshToken, tokenType: "Bearer" as const };
  }
}
