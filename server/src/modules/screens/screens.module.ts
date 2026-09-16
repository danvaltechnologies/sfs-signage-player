import { Module } from "@nestjs/common";

import { ScreensController } from "./screens.controller";

@Module({ controllers: [ScreensController] })
export class ScreensModule {}
