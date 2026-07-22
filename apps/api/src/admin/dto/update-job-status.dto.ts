import { IsIn } from 'class-validator';
import type { JobStatus } from '@talentflow/types';

export class UpdateJobStatusDto {
  @IsIn(['DRAFT', 'PUBLISHED', 'CLOSED'])
  status: JobStatus;
}
