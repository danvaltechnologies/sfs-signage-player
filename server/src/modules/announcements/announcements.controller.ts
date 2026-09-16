import { Body, Controller, Delete, Get, Param, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { ApprovalState, Prisma } from "@prisma/client";
import { Type } from "class-transformer";
import { IsDate, IsIn, IsOptional, IsString, MaxLength } from "class-validator";

import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { ApprovalsService } from "../approvals/approvals.service";
import { CurrentUser, type AuthUser } from "../../common/auth/current-user.decorator";
import {
  RequireCapability,
  RequireModule,
  assertBrandScope,
  brandScopeWhere,
} from "../../common/auth/permissions";

class CreateAnnouncementDto {
  @IsString()
  brandId!: string;

  @IsString()
  @MaxLength(140)
  title!: string;

  @IsString()
  @MaxLength(600)
  body!: string;

  @IsOptional()
  @IsIn(["low", "normal", "urgent"])
  priority?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startsAt?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endsAt?: Date;
}

@ApiTags("announcements")
@RequireModule("announcements")
@Controller("announcements")
export class AnnouncementsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly approvals: ApprovalsService,
  ) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query("brandId") brandId?: string,
    @Query("approval") approval?: ApprovalState,
  ) {
    const where: Prisma.AnnouncementWhereInput = {
      ...brandScopeWhere(user, brandId),
      ...(approval ? { approval } : {}),
    };
    return this.prisma.announcement.findMany({ where, orderBy: { createdAt: "desc" } });
  }

  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateAnnouncementDto) {
    assertBrandScope(user, dto.brandId);
    const announcement = await this.prisma.announcement.create({
      data: {
        brandId: dto.brandId,
        title: dto.title,
        body: dto.body,
        priority: dto.priority ?? "normal",
        startsAt: dto.startsAt ?? new Date(),
        endsAt: dto.endsAt ?? null,
        approval: "DRAFT",
      },
    });
    await this.audit.record({
      actorId: user.id,
      actorName: user.name,
      brandId: dto.brandId,
      module: "announcements",
      action: "Announcement created",
      detail: `${user.name} created announcement "${dto.title}"`,
      category: "content",
    });
    return announcement;
  }

  @Post(":id/submit")
  async submit(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() body: { note?: string }) {
    const announcement = await this.prisma.announcement.findUniqueOrThrow({ where: { id } });
    return this.approvals.submit(user, {
      kind: "ANNOUNCEMENT",
      entityId: announcement.id,
      brandId: announcement.brandId,
      title: announcement.title,
      ...(body?.note ? { note: body.note } : {}),
    });
  }

  @RequireCapability("canPublish")
  @Post(":id/publish")
  async publish(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    const announcement = await this.prisma.announcement.findUniqueOrThrow({ where: { id } });
    assertBrandScope(user, announcement.brandId);
    await this.approvals.assertApproved("ANNOUNCEMENT", announcement.id);
    const updated = await this.prisma.announcement.update({ where: { id }, data: { published: true } });
    await this.audit.record({
      actorId: user.id,
      actorName: user.name,
      brandId: announcement.brandId,
      module: "announcements",
      action: "Announcement published",
      detail: `${user.name} published announcement "${announcement.title}"`,
      category: "publishing",
      severity: "NOTICE",
    });
    return updated;
  }

  @Delete(":id")
  async remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    const existing = await this.prisma.announcement.findUniqueOrThrow({ where: { id } });
    assertBrandScope(user, existing.brandId);
    await this.prisma.announcement.delete({ where: { id } });
    return { ok: true as const };
  }
}
