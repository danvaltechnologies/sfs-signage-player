import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { ApprovalKind, ApprovalState } from "@prisma/client";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

import { CurrentUser, type AuthUser } from "../../common/auth/current-user.decorator";
import { RequireCapability, RequireModule } from "../../common/auth/permissions";
import { ApprovalsService } from "./approvals.service";

class SubmitDto {
  @IsEnum(["MEDIA", "PLAYLIST", "SCHEDULE", "ANNOUNCEMENT"])
  kind!: ApprovalKind;

  @IsString()
  entityId!: string;

  @IsString()
  brandId!: string;

  @IsString()
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  note?: string;
}

class ReviewDto {
  @IsEnum(["APPROVED", "REJECTED"])
  decision!: "APPROVED" | "REJECTED";

  @IsOptional()
  @IsString()
  @MaxLength(600)
  note?: string;
}

@ApiTags("approvals")
@RequireModule("approvals")
@Controller("approvals")
export class ApprovalsController {
  constructor(private readonly approvals: ApprovalsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query("brandId") brandId?: string,
    @Query("state") state?: ApprovalState,
    @Query("kind") kind?: ApprovalKind,
  ) {
    return this.approvals.list(user, { brandId, state, kind });
  }

  @Get("pending-count")
  async pendingCount(@CurrentUser() user: AuthUser) {
    return { count: await this.approvals.pendingCount(user) };
  }

  @Post("submit")
  submit(@CurrentUser() user: AuthUser, @Body() dto: SubmitDto) {
    return this.approvals.submit(user, dto);
  }

  @RequireCapability("canApprove")
  @Post(":id/review")
  review(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: ReviewDto) {
    return this.approvals.review(user, id, dto.decision, dto.note);
  }
}
