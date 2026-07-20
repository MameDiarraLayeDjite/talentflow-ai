import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { ResumesService } from './resumes.service';
import { CreateResumeDto } from './dto/create-resume.dto';

@UseGuards(JwtAccessGuard, RolesGuard)
@Roles('CANDIDATE')
@Controller('candidates/me/resumes')
export class ResumesController {
  constructor(private readonly resumesService: ResumesService) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateResumeDto) {
    return this.resumesService.create(user.sub, dto);
  }

  @Get()
  findMine(@CurrentUser() user: JwtPayload) {
    return this.resumesService.findMine(user.sub);
  }
}
