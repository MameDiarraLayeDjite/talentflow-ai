import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateJobDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsString()
  @MinLength(10)
  description: string;

  @IsString()
  contractType: string;

  @IsString()
  location: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredSkills?: string[];
}
