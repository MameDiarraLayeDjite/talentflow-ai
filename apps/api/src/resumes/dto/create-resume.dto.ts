import { IsUrl } from 'class-validator';

export class CreateResumeDto {
  @IsUrl()
  fileUrl: string;
}
