import { IsEmail, IsIn, IsOptional } from 'class-validator';
import type { UserRole } from '@talentflow/types';

export class UpdateAdminUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsIn(['CANDIDATE', 'COMPANY', 'ADMIN'])
  role?: UserRole;
}
