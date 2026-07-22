import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import type { UserRole } from '@talentflow/types';

export class QueryUsersDto {
  @IsOptional()
  @IsIn(['CANDIDATE', 'COMPANY', 'ADMIN'])
  role?: UserRole;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
