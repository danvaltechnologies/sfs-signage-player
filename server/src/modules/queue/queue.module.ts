import { Module } from "@nestjs/common";

import { PosWebhookController } from "./pos-webhook.controller";
import { PlayerQueueController } from "./player-queue.controller";
import { QueueController } from "./queue.controller";
import { QueueService } from "./queue.service";

@Module({
  controllers: [QueueController, PosWebhookController, PlayerQueueController],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
