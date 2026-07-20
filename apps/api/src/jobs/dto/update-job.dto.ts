import { PartialType } from '@nestjs/mapped-types';
import { IsIn, IsOptional } from 'class-validator';
import type { JobStatus } from '@talentflow/types';
import { CreateJobDto } from './create-job.dto';

export class UpdateJobDto extends PartialType(CreateJobDto) {
  @IsOptional()
  @IsIn(['DRAFT', 'PUBLISHED', 'CLOSED'])
  status?: JobStatus;
}
