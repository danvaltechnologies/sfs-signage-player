import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { AuditSeverity } from "@prisma/client";

import { CurrentUser, type AuthUser } from "../../common/auth/current-user.decorator";
import { RequireModule } from "../../common/auth/permissions";
import { AuditService } from "./audit.service";

@ApiTags("audit")
@RequireModule("audit")
@Controller("audit")
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query("brandId") brandId?: string,
    @Query("category") category?: string,
    @Query("severity") severity?: AuditSeverity,
    @Query("search") search?: string,
  ) {
    return this.audit.list(user, { brandId, category, severity, search });
  }
}
