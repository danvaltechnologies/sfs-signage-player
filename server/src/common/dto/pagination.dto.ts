import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize?: number;

  @IsOptional()
  @IsString()
  brandId?: string;

  get skip(): number {
    return ((this.page ?? 1) - 1) * (this.pageSize ?? 50);
  }

  get take(): number {
    return this.pageSize ?? 50;
  }
}
