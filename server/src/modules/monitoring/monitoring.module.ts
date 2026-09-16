import { Module } from "@nestjs/common";

import { QueueModule } from "../queue/queue.module";
import { MonitoringService } from "./monitoring.service";

@Module({
  imports: [QueueModule],
  providers: [MonitoringService],
})
export class MonitoringModule {}
