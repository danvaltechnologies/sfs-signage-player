import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { ApprovalState, Prisma } from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { ApprovalsService } from "../approvals/approvals.service";
import { CurrentUser, type AuthUser } from "../../common/auth/current-user.decorator";
import { RequireModule, assertBrandScope, brandScopeWhere } from "../../common/auth/permissions";

class PlaylistItemDto {
  @IsOptional()
  @IsString()
  mediaId?: string;

  @IsString()
  @MaxLength(120)
  label!: string;

  /** Seconds; omit for full-length video playback. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3600)
  duration?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

class CreatePlaylistDto {
  @IsString()
  brandId!: string;

  @IsString()
  @MaxLength(120)
  name!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlaylistItemDto)
  items!: PlaylistItemDto[];
}

@ApiTags("playlists")
@RequireModule("playlists")
@Controller("playlists")
export class PlaylistsController {
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
    const where: Prisma.PlaylistWhereInput = {
      ...brandScopeWhere(user, brandId),
      ...(approval ? { approval } : {}),
    };
    return this.prisma.playlist.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { items: { orderBy: { position: "asc" }, include: { media: true } } },
    });
  }

  @Get(":id")
  get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.prisma.playlist.findFirstOrThrow({
      where: { id, ...brandScopeWhere(user) },
      include: { items: { orderBy: { position: "asc" }, include: { media: true } } },
    });
  }

  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreatePlaylistDto) {
    assertBrandScope(user, dto.brandId);
    const playlist = await this.prisma.playlist.create({
      data: {
        brandId: dto.brandId,
        name: dto.name,
        approval: "DRAFT",
        items: {
          create: dto.items.map((item, index) => ({
            mediaId: item.mediaId ?? null,
            label: item.label,
            duration: item.duration ?? null,
            position: index,
            active: item.active ?? true,
          })),
        },
      },
      include: { items: { orderBy: { position: "asc" } } },
    });
    await this.audit.record({
      actorId: user.id,
      actorName: user.name,
      brandId: dto.brandId,
      module: "playlists",
      action: "Playlist created",
      detail: `${user.name} created playlist "${dto.name}" with ${dto.items.length} item(s)`,
      category: "content",
    });
    return playlist;
  }

  @Put(":id")
  async update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: CreatePlaylistDto) {
    const existing = await this.prisma.playlist.findUniqueOrThrow({ where: { id } });
    assertBrandScope(user, existing.brandId);
    await this.prisma.playlistItem.deleteMany({ where: { playlistId: id } });
    return this.prisma.playlist.update({
      where: { id },
      data: {
        name: dto.name,
        // Editing a reviewed playlist returns it to draft so it goes through approval again.
        approval: "DRAFT",
        items: {
          create: dto.items.map((item, index) => ({
            mediaId: item.mediaId ?? null,
            label: item.label,
            duration: item.duration ?? null,
            position: index,
            active: item.active ?? true,
          })),
        },
      },
      include: { items: { orderBy: { position: "asc" } } },
    });
  }

  @Post(":id/submit")
  async submit(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() body: { note?: string }) {
    const playlist = await this.prisma.playlist.findUniqueOrThrow({ where: { id } });
    return this.approvals.submit(user, {
      kind: "PLAYLIST",
      entityId: playlist.id,
      brandId: playlist.brandId,
      title: playlist.name,
      ...(body?.note ? { note: body.note } : {}),
    });
  }

  @Delete(":id")
  async remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    const existing = await this.prisma.playlist.findUniqueOrThrow({ where: { id } });
    assertBrandScope(user, existing.brandId);
    await this.prisma.playlist.delete({ where: { id } });
    return { ok: true as const };
  }
}
