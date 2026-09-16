import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import type { AuthUser } from "./current-user.decorator";

export const MODULE_KEY = "requiredModule";
export const CAPABILITY_KEY = "requiredCapability";

export type Capability = "canPublish" | "canApprove" | "canManageUsers";

/** Restricts a controller/route to users whose role grants this console module. */
export const RequireModule = (moduleKey: string) => SetMetadata(MODULE_KEY, moduleKey);

/** Restricts a route to users with a specific capability flag. */
export const RequireCapability = (capability: Capability) => SetMetadata(CAPABILITY_KEY, capability);

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string>(MODULE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const capability = this.reflector.getAllAndOverride<Capability>(CAPABILITY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const user = context.switchToHttp().getRequest<{ user?: AuthUser }>().user;
    if (!user) return true; // public routes are handled by JwtAuthGuard

    if (required && !user.modules.includes(required)) {
      throw new ForbiddenException(`Your role does not include the ${required} module`);
    }
    if (capability && !user[capability]) {
      throw new ForbiddenException("Your role does not allow this action");
    }
    return true;
  }
}

/** Throws unless the user's brand scope covers the brand being touched. */
export function assertBrandScope(user: AuthUser, brandId: string): void {
  if (user.allBrands) return;
  if (!user.brandIds.includes(brandId)) {
    throw new ForbiddenException("This brand is outside your access scope");
  }
}

/** Prisma `where` fragment limiting rows to the user's brands. */
export function brandScopeWhere(user: AuthUser, brandId?: string): { brandId?: string | { in: string[] } } {
  if (brandId) {
    assertBrandScope(user, brandId);
    return { brandId };
  }
  return user.allBrands ? {} : { brandId: { in: user.brandIds } };
}
