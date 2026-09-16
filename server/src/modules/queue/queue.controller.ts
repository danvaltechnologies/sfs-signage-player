import { Body, Controller, Get, Param, Post, Put, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

import { CurrentUser, type AuthUser } from "../../common/auth/current-user.decorator";
import { RequireModule, assertBrandScope } from "../../common/auth/permissions";
import { QueueService } from "./queue.service";

class TimingsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(240)
  defaultMinutes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(240)
  autoCollectAfter?: number;
}

class MinutesDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(240)
  minutes!: number;
}

@ApiTags("queue")
@RequireModule("queue")
@Controller("queue")
export class QueueController {
  constructor(private readonly queue: QueueService) {}

  /** Live counter board: tickets, POS link health and wait stats. */
  @Get("board")
  board(
    @CurrentUser() user: AuthUser,
    @Query("brandId") brandId?: string,
    @Query("outletId") outletId?: string,
  ) {
    return this.queue.board(user, { brandId, outletId });
  }

  @Post("orders/:orderId/collect")
  collect(@CurrentUser() user: AuthUser, @Param("orderId") orderId: string) {
    return this.queue.markCollected(user, orderId);
  }

  @Get("prep-config")
  prepConfig(@CurrentUser() user: AuthUser, @Query("brandId") brandId?: string) {
    return this.queue.prepConfig(user, brandId);
  }

  @Put("prep-config/:brandId")
  setTimings(@CurrentUser() user: AuthUser, @Param("brandId") brandId: string, @Body() dto: TimingsDto) {
    assertBrandScope(user, brandId);
    return this.queue.setBrandTimings(user, brandId, dto);
  }

  @Put("prep-rules/:ruleId")
  setRule(@CurrentUser() user: AuthUser, @Param("ruleId") ruleId: string, @Body() dto: MinutesDto) {
    return this.queue.setPrepRule(user, ruleId, dto.minutes);
  }
}
