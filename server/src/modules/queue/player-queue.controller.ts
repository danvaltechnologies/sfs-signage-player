import { Controller, Get, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { Public } from "../../common/auth/public.decorator";
import { PrismaService } from "../../common/prisma/prisma.service";
import { QueueService } from "./queue.service";

/**
 * Counter board feed for the Android player. A queue screen (SCREENTYPE "QMS")
 * asks for its own board by screen code — no console session involved, and only
 * ticket numbers are returned, never order or customer detail beyond the name
 * the till supplied for calling out.
 */
@ApiTags("player")
@Controller("public/queue")
export class PlayerQueueController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
  ) {}

  @Public()
  @Get("board/:code")
  async board(@Param("code") code: string) {
    const screen = await this.prisma.screen.findUnique({ where: { code } });
    if (!screen) return { tickets: [], averageWaitMinutes: 0 };

    const since = new Date(Date.now() - 3 * 3_600_000);
    const orders = await this.prisma.posOrder.findMany({
      where: {
        brandId: screen.brandId,
        ...(screen.outletId ? { outletId: screen.outletId } : {}),
        placedAt: { gte: since },
      },
      orderBy: { placedAt: "asc" },
      take: 100,
    });
    const config = await this.prisma.brandPrepConfig.findUnique({ where: { brandId: screen.brandId } });
    const now = Date.now();

    const tickets = orders
      .map((order) => ({
        order,
        derived: this.queue.deriveStage(order, config?.autoCollectAfter ?? 6, now),
      }))
      .filter(({ derived }) => derived.stage !== "COLLECTED")
      .map(({ order, derived }) => ({
        ticket: order.ticket,
        stage: derived.stage,
        customer: order.customer,
        waitingMinutes: derived.elapsed,
      }));

    const waiting = tickets.filter((t) => t.stage === "PLACED" || t.stage === "PREPARING");
    return {
      tickets,
      averageWaitMinutes: waiting.length
        ? Math.round(waiting.reduce((sum, t) => sum + (t.waitingMinutes ?? 0), 0) / waiting.length)
        : 0,
    };
  }
}
