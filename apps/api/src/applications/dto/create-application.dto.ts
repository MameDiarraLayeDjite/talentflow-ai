import { IsString } from 'class-validator';

export class CreateApplicationDto {
  @IsString()
  jobId: string;

  @IsString()
  resumeId: string;
}
