import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

import { PrismaService } from "../../common/prisma/prisma.service";
import { CurrentUser, type AuthUser } from "../../common/auth/current-user.decorator";
import { assertBrandScope, brandScopeWhere } from "../../common/auth/permissions";

class OutletDto {
  @IsString()
  @MaxLength(80)
  name!: string;

  @IsString()
  @MaxLength(60)
  city!: string;

  @IsString()
  @MaxLength(60)
  region!: string;
}

class BrandDto {
  @IsString()
  @MaxLength(40)
  id!: string;

  @IsString()
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsString()
  accent?: string;
}

@ApiTags("brands")
@Controller("brands")
export class BrandsController {
  constructor(private readonly prisma: PrismaService) {}

  /** Brands the signed-in user may switch between; all-brands roles see everything. */
  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.prisma.brand.findMany({
      where: user.allBrands ? {} : { id: { in: user.brandIds } },
      orderBy: { name: "asc" },
      include: { outlets: { orderBy: { name: "asc" } } },
    });
  }

  @Get("outlets")
  outlets(@CurrentUser() user: AuthUser) {
    return this.prisma.outlet.findMany({
      where: brandScopeWhere(user),
      orderBy: [{ brandId: "asc" }, { name: "asc" }],
    });
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: BrandDto) {
    if (!user.allBrands) assertBrandScope(user, dto.id);
    return this.prisma.brand.create({
      data: { id: dto.id, name: dto.name, accent: dto.accent ?? "accent" },
    });
  }

  @Post(":brandId/outlets")
  createOutlet(@CurrentUser() user: AuthUser, @Param("brandId") brandId: string, @Body() dto: OutletDto) {
    assertBrandScope(user, brandId);
    return this.prisma.outlet.create({ data: { ...dto, brandId } });
  }

  @Put(":brandId")
  update(@CurrentUser() user: AuthUser, @Param("brandId") brandId: string, @Body() dto: Partial<BrandDto>) {
    assertBrandScope(user, brandId);
    return this.prisma.brand.update({
      where: { id: brandId },
      data: { ...(dto.name ? { name: dto.name } : {}), ...(dto.accent ? { accent: dto.accent } : {}) },
    });
  }
}
