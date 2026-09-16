import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/current-user.decorator";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? "change-me",
    });
  }

  async validate(payload: { sub: string }): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: true, brands: true },
    });
    if (!user || user.status === "SUSPENDED") {
      throw new UnauthorizedException("Account is not active");
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roleKey: user.role.key,
      tier: user.role.tier,
      allBrands: user.role.allBrands,
      brandIds: user.brands.map((b) => b.brandId),
      modules: user.modules.length ? user.modules : user.role.modules,
      canPublish: user.role.canPublish,
      canApprove: user.role.canApprove,
      canManageUsers: user.role.canManageUsers,
    };
  }
}
