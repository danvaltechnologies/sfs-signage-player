import { Body, Controller, Delete, Get, Param, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Prisma, ScreenStatus, ScreenType } from "@prisma/client";
import { randomInt } from "node:crypto";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { Public } from "../../common/auth/public.decorator";
import { CurrentUser, type AuthUser } from "../../common/auth/current-user.decorator";
import { RequireModule, assertBrandScope, brandScopeWhere } from "../../common/auth/permissions";

class CreateScreenDto {
  @IsString()
  brandId!: string;

  /** Store the screen belongs to; supplies the LOC and STORE# segments. */
  @IsString()
  outletId!: string;

  /** Zone code where the screen physically sits, e.g. "CTR". */
  @IsOptional()
  @IsEnum(["CTR", "DIN", "DRV", "ENT", "KIT", "TKA"])
  zone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  region?: string;

  @IsEnum(["MENU_BOARD", "PROMO", "QUEUE"])
  type!: ScreenType;
}

/** SCREENTYPE segment of the screen ID. */
const SCREEN_TYPE_CODE: Record<string, string> = {
  MENU_BOARD: "MNU",
  PROMO: "PRO",
  QUEUE: "QMS",
};

class HeartbeatDto {
  @IsString()
  code!: string;

  @IsOptional()
  @IsString()
  playing?: string;

  @IsOptional()
  @IsString()
  firmware?: string;

  @IsOptional()
  @IsEnum(["ONLINE", "SYNCING", "FAILED", "OFFLINE"])
  status?: ScreenStatus;
}

const pin = () => String(randomInt(100_000, 999_999));

@ApiTags("screens")
@Controller("screens")
export class ScreensController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @RequireModule("screens")
  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query("brandId") brandId?: string,
    @Query("status") status?: ScreenStatus,
    @Query("search") search?: string,
  ) {
    const where: Prisma.ScreenWhereInput = {
      ...brandScopeWhere(user, brandId),
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { code: { contains: search, mode: "insensitive" } },
              { location: { contains: search, mode: "insensitive" } },
              { city: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    return this.prisma.screen.findMany({ where, orderBy: [{ brandId: "asc" }, { code: "asc" }] });
  }

  /** Fleet health counts, used by the Overview and brand dashboards. */
  @RequireModule("screens")
  @Get("health")
  async health(@CurrentUser() user: AuthUser, @Query("brandId") brandId?: string) {
    const grouped = await this.prisma.screen.groupBy({
      by: ["brandId", "status"],
      where: brandScopeWhere(user, brandId),
      _count: { _all: true },
    });
    return grouped.map((row) => ({
      brandId: row.brandId,
      status: row.status,
      count: row._count._all,
    }));
  }

  /**
   * Registers a screen and builds its ID from the naming convention:
   * BRAND-LOC-STORE#-ZONE-SCREENTYPE-##  e.g. KLM-PHC-16-CTR-MNU-01
   */
  @RequireModule("screens")
  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateScreenDto) {
    assertBrandScope(user, dto.brandId);
    const brand = await this.prisma.brand.findUniqueOrThrow({ where: { id: dto.brandId } });
    const outlet = await this.prisma.outlet.findUniqueOrThrow({ where: { id: dto.outletId } });
    const zone = dto.zone ?? "CTR";
    const brandSegment = brand.code ?? dto.brandId.slice(0, 3).toUpperCase();
    const locSegment = outlet.cityCode ?? outlet.city.slice(0, 3).toUpperCase();
    const storeSegment = (outlet.storeNo ?? "01").padStart(2, "0");
    const typeSegment = SCREEN_TYPE_CODE[dto.type] ?? "MNU";
    const prefix = [brandSegment, locSegment, storeSegment, zone, typeSegment].join("-");
    const siblings = await this.prisma.screen.count({
      where: { outletId: outlet.id, zone, type: dto.type },
    });
    const code = `${prefix}-${String(siblings + 1).padStart(2, "0")}`;
    const screen = await this.prisma.screen.create({
      data: {
        brandId: dto.brandId,
        outletId: outlet.id,
        code,
        zone,
        location: dto.location ?? outlet.name,
        city: dto.city ?? outlet.city,
        region: dto.region ?? outlet.region,
        type: dto.type,
        status: "OFFLINE",
        pairingCode: pin(),
      },
    });
    await this.audit.record({
      actorId: user.id,
      actorName: user.name,
      brandId: dto.brandId,
      module: "screens",
      action: "Screen added",
      detail: `${user.name} added screen ${code} at ${outlet.name}, ${outlet.city} (${outlet.storeCode ?? "no store code"})`,
      category: "screens",
    });
    return screen;
  }

  /** Issues a fresh pairing PIN for a player that needs to be re-paired. */
  @RequireModule("screens")
  @Post(":id/pairing-code")
  async regeneratePairing(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    const screen = await this.prisma.screen.findUniqueOrThrow({ where: { id } });
    assertBrandScope(user, screen.brandId);
    const updated = await this.prisma.screen.update({
      where: { id },
      data: { pairingCode: pin(), pairedAt: null },
    });
    await this.audit.record({
      actorId: user.id,
      actorName: user.name,
      brandId: screen.brandId,
      module: "screens",
      action: "Pairing PIN regenerated",
      detail: `${user.name} regenerated the pairing PIN for ${screen.code}`,
      category: "screens",
      severity: "NOTICE",
    });
    return { id: updated.id, pairingCode: updated.pairingCode };
  }

  @RequireModule("screens")
  @Post(":id/resync")
  async resync(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    const screen = await this.prisma.screen.findUniqueOrThrow({ where: { id } });
    assertBrandScope(user, screen.brandId);
    await this.prisma.screen.update({ where: { id }, data: { status: "SYNCING" } });
    await this.audit.record({
      actorId: user.id,
      actorName: user.name,
      brandId: screen.brandId,
      module: "screens",
      action: "Resync requested",
      detail: `${user.name} requested a resync for ${screen.code}`,
      category: "screens",
    });
    return { ok: true as const };
  }

  @RequireModule("screens")
  @Delete(":id")
  async remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    const screen = await this.prisma.screen.findUniqueOrThrow({ where: { id } });
    assertBrandScope(user, screen.brandId);
    await this.prisma.screen.delete({ where: { id } });
    return { ok: true as const };
  }

  /**
   * Player-facing pairing: the device posts the PIN shown on its screen and
   * receives its screen identity. No console session required.
   */
  @Public()
  @Post("pair")
  async pair(@Body() body: { pairingCode: string }) {
    const screen = await this.prisma.screen.findFirst({
      where: { pairingCode: String(body?.pairingCode ?? "").trim() },
    });
    if (!screen) return { paired: false as const };
    const updated = await this.prisma.screen.update({
      where: { id: screen.id },
      data: { pairedAt: new Date(), pairingCode: null, status: "SYNCING", lastSeenAt: new Date() },
    });
    return {
      paired: true as const,
      screen: { id: updated.id, code: updated.code, brandId: updated.brandId, type: updated.type },
    };
  }

  /** Player heartbeat; drives the online/offline health signal. */
  @Public()
  @Post("heartbeat")
  async heartbeat(@Body() dto: HeartbeatDto) {
    const screen = await this.prisma.screen.findUnique({ where: { code: dto.code } });
    if (!screen) return { ok: false as const };
    await this.prisma.screen.update({
      where: { id: screen.id },
      data: {
        lastSeenAt: new Date(),
        status: dto.status ?? "ONLINE",
        ...(dto.playing ? { playing: dto.playing } : {}),
        ...(dto.firmware ? { firmware: dto.firmware } : {}),
      },
    });
    return { ok: true as const };
  }

  /** What an individual player should be showing right now. */
  @Public()
  @Get(":code/playback")
  async playback(@Param("code") code: string) {
    const screen = await this.prisma.screen.findUnique({ where: { code } });
    if (!screen) return { slides: [], ticker: null };
    const now = new Date();
    const schedule = await this.prisma.schedule.findFirst({
      where: {
        brandId: screen.brandId,
        published: true,
        approval: "APPROVED",
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
      },
      orderBy: { startsAt: "desc" },
      include: { playlist: { include: { items: { orderBy: { position: "asc" }, include: { media: true } } } } },
    });
    const announcement = await this.prisma.announcement.findFirst({
      where: {
        brandId: screen.brandId,
        published: true,
        approval: "APPROVED",
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
      },
      orderBy: { startsAt: "desc" },
    });
    return {
      campaign: schedule ? { id: schedule.id, name: schedule.name } : null,
      slides:
        schedule?.playlist?.items
          .filter((item) => item.active)
          .map((item) => ({
            label: item.label,
            url: item.media?.url ?? null,
            kind: item.media?.kind ?? "IMAGE",
            duration: item.duration ?? item.media?.duration ?? null,
          })) ?? [],
      ticker: announcement ? { title: announcement.title, body: announcement.body } : null,
    };
  }
}
