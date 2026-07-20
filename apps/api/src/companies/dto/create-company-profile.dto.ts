import { IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class CreateCompanyProfileDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  sector?: string;
}
