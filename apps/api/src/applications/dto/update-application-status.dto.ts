import { IsIn } from 'class-validator';
import type { ApplicationStatus } from '@talentflow/types';

export class UpdateApplicationStatusDto {
  @IsIn(['RECEIVED', 'IN_REVIEW', 'INTERVIEW', 'REJECTED', 'ACCEPTED'])
  status: ApplicationStatus;
}
