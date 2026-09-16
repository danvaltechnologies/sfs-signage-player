import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";

import { PrismaModule } from "./common/prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { BrandsModule } from "./modules/brands/brands.module";
import { ScreensModule } from "./modules/screens/screens.module";
import { MediaModule } from "./modules/media/media.module";
import { PlaylistsModule } from "./modules/playlists/playlists.module";
import { SchedulesModule } from "./modules/schedules/schedules.module";
import { AnnouncementsModule } from "./modules/announcements/announcements.module";
import { ApprovalsModule } from "./modules/approvals/approvals.module";
import { QueueModule } from "./modules/queue/queue.module";
import { AuditModule } from "./modules/audit/audit.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { MailModule } from "./modules/mail/mail.module";
import { MonitoringModule } from "./modules/monitoring/monitoring.module";
import { HealthModule } from "./modules/health/health.module";
import { ReleasesModule } from "./modules/releases/releases.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 300 }]),
    PrismaModule,
    MailModule,
    NotificationsModule,
    AuditModule,
    AuthModule,
    UsersModule,
    BrandsModule,
    ScreensModule,
    MediaModule,
    PlaylistsModule,
    SchedulesModule,
    AnnouncementsModule,
    ApprovalsModule,
    QueueModule,
    MonitoringModule,
    HealthModule,
    ReleasesModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
