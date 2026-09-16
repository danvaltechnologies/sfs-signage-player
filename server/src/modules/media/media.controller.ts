import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { ApprovalState, MediaKind, Prisma } from "@prisma/client";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, IsUrl, Max, MaxLength, Min } from "class-validator";

import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { ApprovalsService } from "../approvals/approvals.service";
import { CurrentUser, type AuthUser } from "../../common/auth/current-user.decorator";
import { RequireModule, assertBrandScope, brandScopeWhere } from "../../common/auth/permissions";

class CreateMediaDto {
  @IsString()
  brandId!: string;

  @IsString()
  @MaxLength(120)
  name!: string;

  @IsEnum(["IMAGE", "VIDEO"])
  kind!: MediaKind;

  /** Seconds. Omit for "full length" — the video plays to its natural end. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3600)
  duration?: number;

  @IsUrl({ require_tld: false })
  url!: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  thumbnailUrl?: string;
}

@ApiTags("media")
@RequireModule("media")
@Controller("media")
export class MediaController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly approvals: ApprovalsService,
  ) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query("brandId") brandId?: string,
    @Query("search") search?: string,
    @Query("kind") kind?: MediaKind,
    @Query("approval") approval?: ApprovalState,
  ) {
    const where: Prisma.MediaAssetWhereInput = {
      ...brandScopeWhere(user, brandId),
      ...(kind ? { kind } : {}),
      ...(approval ? { approval } : {}),
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
    };
    return this.prisma.mediaAsset.findMany({ where, orderBy: { createdAt: "desc" }, take: 500 });
  }

  @Get(":id")
  get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.prisma.mediaAsset.findFirstOrThrow({ where: { id, ...brandScopeWhere(user) } });
  }

  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateMediaDto) {
    assertBrandScope(user, dto.brandId);
    const media = await this.prisma.mediaAsset.create({
      data: {
        brandId: dto.brandId,
        name: dto.name,
        kind: dto.kind,
        duration: dto.kind === "VIDEO" ? (dto.duration ?? null) : (dto.duration ?? 10),
        url: dto.url,
        thumbnailUrl: dto.thumbnailUrl ?? null,
        approval: "DRAFT",
      },
    });
    await this.audit.record({
      actorId: user.id,
      actorName: user.name,
      brandId: dto.brandId,
      module: "media",
      action: "Creative uploaded",
      detail: `${user.name} added creative "${dto.name}"`,
      category: "content",
    });
    return media;
  }

  @Put(":id")
  async update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: Partial<CreateMediaDto>) {
    const existing = await this.prisma.mediaAsset.findUniqueOrThrow({ where: { id } });
    assertBrandScope(user, existing.brandId);
    return this.prisma.mediaAsset.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.url ? { url: dto.url } : {}),
        ...(dto.thumbnailUrl ? { thumbnailUrl: dto.thumbnailUrl } : {}),
        ...(dto.duration !== undefined ? { duration: dto.duration } : {}),
      },
    });
  }

  /** Sends the creative to a line manager for approval. */
  @Post(":id/submit")
  async submit(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() body: { note?: string }) {
    const media = await this.prisma.mediaAsset.findUniqueOrThrow({ where: { id } });
    return this.approvals.submit(user, {
      kind: "MEDIA",
      entityId: media.id,
      brandId: media.brandId,
      title: media.name,
      ...(body?.note ? { note: body.note } : {}),
    });
  }

  @Delete(":id")
  async remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    const existing = await this.prisma.mediaAsset.findUniqueOrThrow({ where: { id } });
    assertBrandScope(user, existing.brandId);
    await this.prisma.mediaAsset.delete({ where: { id } });
    await this.audit.record({
      actorId: user.id,
      actorName: user.name,
      brandId: existing.brandId,
      module: "media",
      action: "Creative deleted",
      detail: `${user.name} deleted creative "${existing.name}"`,
      category: "content",
      severity: "NOTICE",
    });
    return { ok: true as const };
  }
}
