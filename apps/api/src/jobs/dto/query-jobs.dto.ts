import { IsOptional, IsString } from 'class-validator';

export class QueryJobsDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  contractType?: string;
}
