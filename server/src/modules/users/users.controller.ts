import { Body, Controller, Get, Param, Post, Put, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { RoleTier, UserStatus } from "@prisma/client";
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

import { CurrentUser, type AuthUser } from "../../common/auth/current-user.decorator";
import { RequireCapability, RequireModule } from "../../common/auth/permissions";
import { UsersService } from "./users.service";

class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MaxLength(80)
  name!: string;

  @IsString()
  roleKey!: string;

  /** Brands this user may work in. Ignored for all-brand roles. */
  @IsArray()
  @IsString({ each: true })
  brandIds!: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  modules?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(80)
  jobTitle?: string;
}

class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  roleKey?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  brandIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  modules?: string[];

  @IsOptional()
  @IsEnum(["ACTIVE", "INVITED", "SUSPENDED"])
  status?: UserStatus;
}

class CreateRoleDto {
  @IsString()
  key!: string;

  @IsString()
  name!: string;

  @IsEnum(["ORGANIZATION", "BRAND", "OUTLET"])
  tier!: RoleTier;

  @IsBoolean()
  allBrands!: boolean;

  @IsArray()
  @IsString({ each: true })
  modules!: string[];

  @IsBoolean()
  canPublish!: boolean;

  @IsBoolean()
  canApprove!: boolean;

  @IsBoolean()
  canManageUsers!: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}

@ApiTags("users")
@RequireModule("users")
@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query("brandId") brandId?: string,
    @Query("search") search?: string,
  ) {
    return this.users.list(user, { brandId, search });
  }

  @Get("roles")
  roles() {
    return this.users.roles();
  }

  @RequireCapability("canManageUsers")
  @Post("roles")
  createRole(@Body() dto: CreateRoleDto) {
    return this.users.createRole(dto);
  }

  @RequireCapability("canManageUsers")
  @Post()
  invite(@CurrentUser() user: AuthUser, @Body() dto: CreateUserDto) {
    return this.users.invite(user, dto);
  }

  @RequireCapability("canManageUsers")
  @Put(":id")
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(user, id, dto);
  }

  @RequireCapability("canManageUsers")
  @Post(":id/resend-invite")
  resend(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.users.resendInvite(user, id);
  }
}
