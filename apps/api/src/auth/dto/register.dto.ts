import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';
import type { UserRole } from '@talentflow/types';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsIn(['CANDIDATE', 'COMPANY'])
  role: UserRole;
}
