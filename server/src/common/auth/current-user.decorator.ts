import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  roleKey: string;
  tier: "ORGANIZATION" | "BRAND" | "OUTLET";
  allBrands: boolean;
  brandIds: string[];
  modules: string[];
  canPublish: boolean;
  canApprove: boolean;
  canManageUsers: boolean;
};

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser => {
  return ctx.switchToHttp().getRequest<{ user: AuthUser }>().user;
});
