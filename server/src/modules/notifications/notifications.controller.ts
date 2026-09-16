import { Body, Controller, Delete, Get, Param, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { IsObject, IsOptional, IsString } from "class-validator";

import { CurrentUser, type AuthUser } from "../../common/auth/current-user.decorator";
import { NotificationsService } from "./notifications.service";
import { PushService } from "./push.service";

class PushSubscribeDto {
  @IsString()
  endpoint!: string;

  @IsObject()
  keys!: { p256dh: string; auth: string };

  @IsOptional()
  @IsString()
  userAgent?: string;
}

@ApiTags("notifications")
@Controller("notifications")
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly push: PushService,
  ) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query("unread") unread?: string) {
    return this.notifications.list(user.id, unread === "true");
  }

  @Get("unread-count")
  async unreadCount(@CurrentUser() user: AuthUser) {
    return { count: await this.notifications.unreadCount(user.id) };
  }

  @Post(":id/read")
  markRead(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.notifications.markRead(user.id, id);
  }

  @Post("read-all")
  markAllRead(@CurrentUser() user: AuthUser) {
    return this.notifications.markAllRead(user.id);
  }

  @Get("push/public-key")
  publicKey() {
    return { publicKey: this.push.publicKey };
  }

  @Post("push/subscribe")
  subscribe(@CurrentUser() user: AuthUser, @Body() dto: PushSubscribeDto) {
    return this.push.subscribe(user.id, dto);
  }

  @Delete("push/subscribe")
  unsubscribe(@CurrentUser() user: AuthUser, @Body() dto: { endpoint: string }) {
    return this.push.unsubscribe(user.id, dto.endpoint);
  }
}
