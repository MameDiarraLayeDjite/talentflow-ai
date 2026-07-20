import { IsString } from 'class-validator';

export class QueryApplicationsDto {
  @IsString()
  jobId: string;
}
