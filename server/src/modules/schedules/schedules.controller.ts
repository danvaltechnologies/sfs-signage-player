import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { ApprovalState, Prisma } from "@prisma/client";
import { Type } from "class-transformer";
import { IsArray, IsDate, IsOptional, IsString, MaxLength } from "class-validator";

import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { ApprovalsService } from "../approvals/approvals.service";
import { NotificationsService } from "../notifications/notifications.service";
import { CurrentUser, type AuthUser } from "../../common/auth/current-user.decorator";
import {
  RequireCapability,
  RequireModule,
  assertBrandScope,
  brandScopeWhere,
} from "../../common/auth/permissions";

class CreateScheduleDto {
  @IsString()
  brandId!: string;

  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  playlistId?: string;

  @Type(() => Date)
  @IsDate()
  startsAt!: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endsAt?: Date;

  /** Optional daypart window, e.g. "17:00-22:00". */
  @IsOptional()
  @IsString()
  @MaxLength(20)
  daypart?: string;

  /** Screens this campaign targets; empty targets every screen in the brand. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  screenIds?: string[];
}

@ApiTags("schedules")
@RequireModule("schedules")
@Controller("schedules")
export class SchedulesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly approvals: ApprovalsService,
    private readonly notifications: NotificationsService,
  ) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query("brandId") brandId?: string,
    @Query("approval") approval?: ApprovalState,
  ) {
    const where: Prisma.ScheduleWhereInput = {
      ...brandScopeWhere(user, brandId),
      ...(approval ? { approval } : {}),
    };
    return this.prisma.schedule.findMany({
      where,
      orderBy: { startsAt: "asc" },
      include: { playlist: { include: { items: { orderBy: { position: "asc" }, include: { media: true } } } } },
    });
  }

  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateScheduleDto) {
    assertBrandScope(user, dto.brandId);
    const schedule = await this.prisma.schedule.create({
      data: {
        brandId: dto.brandId,
        name: dto.name,
        playlistId: dto.playlistId ?? null,
        startsAt: dto.startsAt,
        endsAt: dto.endsAt ?? null,
        daypart: dto.daypart ?? null,
        screenIds: dto.screenIds ?? [],
        approval: "DRAFT",
      },
    });
    await this.audit.record({
      actorId: user.id,
      actorName: user.name,
      brandId: dto.brandId,
      module: "schedules",
      action: "Campaign created",
      detail: `${user.name} created campaign "${dto.name}"`,
      category: "content",
    });
    return schedule;
  }

  @Put(":id")
  async update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: Partial<CreateScheduleDto>) {
    const existing = await this.prisma.schedule.findUniqueOrThrow({ where: { id } });
    assertBrandScope(user, existing.brandId);
    return this.prisma.schedule.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.playlistId !== undefined ? { playlistId: dto.playlistId ?? null } : {}),
        ...(dto.startsAt ? { startsAt: dto.startsAt } : {}),
        ...(dto.endsAt !== undefined ? { endsAt: dto.endsAt ?? null } : {}),
        ...(dto.daypart !== undefined ? { daypart: dto.daypart ?? null } : {}),
        ...(dto.screenIds ? { screenIds: dto.screenIds } : {}),
        approval: "DRAFT",
        published: false,
      },
    });
  }

  @Post(":id/submit")
  async submit(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() body: { note?: string }) {
    const schedule = await this.prisma.schedule.findUniqueOrThrow({ where: { id } });
    return this.approvals.submit(user, {
      kind: "SCHEDULE",
      entityId: schedule.id,
      brandId: schedule.brandId,
      title: schedule.name,
      ...(body?.note ? { note: body.note } : {}),
    });
  }

  /** Pushes an approved campaign to its target screens. */
  @RequireCapability("canPublish")
  @Post(":id/publish")
  async publish(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    const schedule = await this.prisma.schedule.findUniqueOrThrow({ where: { id } });
    assertBrandScope(user, schedule.brandId);
    await this.approvals.assertApproved("SCHEDULE", schedule.id);

    const targets = await this.prisma.screen.findMany({
      where: {
        brandId: schedule.brandId,
        ...(schedule.screenIds.length ? { id: { in: schedule.screenIds } } : {}),
      },
      select: { id: true },
    });
    await this.prisma.$transaction([
      this.prisma.schedule.update({ where: { id }, data: { published: true } }),
      this.prisma.screen.updateMany({
        where: { id: { in: targets.map((t) => t.id) } },
        data: { status: "SYNCING", playing: schedule.name },
      }),
    ]);

    await this.audit.record({
      actorId: user.id,
      actorName: user.name,
      brandId: schedule.brandId,
      module: "schedules",
      action: "Campaign published",
      detail: `${user.name} published "${schedule.name}" to ${targets.length} screen(s)`,
      category: "publishing",
      severity: "NOTICE",
    });
    await this.notifications.notifyOperators(schedule.brandId, {
      title: "Campaign published",
      body: `"${schedule.name}" is rolling out to ${targets.length} screen(s).`,
      link: "/schedules",
      category: "publishing",
    });

    return { ok: true as const, screens: targets.length };
  }

  @Delete(":id")
  async remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    const existing = await this.prisma.schedule.findUniqueOrThrow({ where: { id } });
    assertBrandScope(user, existing.brandId);
    await this.prisma.schedule.delete({ where: { id } });
    return { ok: true as const };
  }
}
