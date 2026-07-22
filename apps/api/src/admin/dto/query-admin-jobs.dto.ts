import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import type { JobStatus } from '@talentflow/types';

export class QueryAdminJobsDto {
  @IsOptional()
  @IsIn(['DRAFT', 'PUBLISHED', 'CLOSED'])
  status?: JobStatus;

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
