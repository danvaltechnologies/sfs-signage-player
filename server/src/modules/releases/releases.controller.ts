import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString, Matches, Min } from "class-validator";

import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { Public } from "../../common/auth/public.decorator";
import { CurrentUser, type AuthUser } from "../../common/auth/current-user.decorator";
import { RequireModule } from "../../common/auth/permissions";

class PublishReleaseDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  versionCode!: number;

  @IsString()
  versionName!: string;

  /** Public https URL the boxes download the APK from. */
  @IsString()
  apkUrl!: string;

  @IsOptional()
  @Matches(/^[a-f0-9]{64}$/i, { message: "sha256 must be a 64-character hex digest" })
  sha256?: string;

  @IsOptional()
  @IsBoolean()
  mandatory?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * Over-the-air updates for the Android player.
 *
 * Boxes poll `GET /api/public/player/update?versionCode=<their build>` and
 * install the returned APK when its versionCode is higher. Publishing a release
 * is a console action, recorded in the audit log like every other change.
 */
@ApiTags("player")
@Controller()
export class ReleasesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Player-facing update feed (no console session). */
  @Public()
  @Get("public/player/update")
  async latest(@Query("versionCode") versionCode?: string) {
    const release = await this.prisma.playerRelease.findFirst({
      where: { published: true },
      orderBy: { versionCode: "desc" },
    });
    if (!release) return { versionCode: 0, versionName: "", apkUrl: "" };
    const current = Number(versionCode ?? 0);
    return {
      versionCode: release.versionCode,
      versionName: release.versionName,
      apkUrl: release.apkUrl,
      sha256: release.sha256,
      mandatory: release.mandatory,
      notes: release.notes,
      updateAvailable: release.versionCode > current,
    };
  }

  /** Release history, shown in the console. */
  @RequireModule("screens")
  @Get("player/releases")
  list() {
    return this.prisma.playerRelease.findMany({ orderBy: { versionCode: "desc" }, take: 50 });
  }

  /** Publishes a build; every paired box picks it up on its next check. */
  @RequireModule("screens")
  @Post("player/releases")
  async publish(@CurrentUser() user: AuthUser, @Body() dto: PublishReleaseDto) {
    const release = await this.prisma.playerRelease.upsert({
      where: { versionCode: dto.versionCode },
      create: {
        versionCode: dto.versionCode,
        versionName: dto.versionName,
        apkUrl: dto.apkUrl,
        sha256: dto.sha256 ?? null,
        mandatory: dto.mandatory ?? false,
        notes: dto.notes ?? null,
        published: true,
        publishedById: user.id,
      },
      update: {
        versionName: dto.versionName,
        apkUrl: dto.apkUrl,
        sha256: dto.sha256 ?? null,
        mandatory: dto.mandatory ?? false,
        notes: dto.notes ?? null,
        published: true,
        publishedById: user.id,
      },
    });
    await this.audit.record({
      actorId: user.id,
      actorName: user.name,
      module: "screens",
      action: "Player release published",
      detail: `${user.name} published player ${release.versionName} (build ${release.versionCode}) to the fleet`,
      category: "system",
      severity: "NOTICE",
    });
    return release;
  }
}
