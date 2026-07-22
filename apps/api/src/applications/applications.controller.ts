import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { QueryApplicationsDto } from './dto/query-applications.dto';

@UseGuards(JwtAccessGuard, RolesGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Roles('CANDIDATE')
  @Post()
  apply(@CurrentUser() user: JwtPayload, @Body() dto: CreateApplicationDto) {
    return this.applicationsService.apply(user.sub, dto);
  }

  @Roles('CANDIDATE')
  @Get('mine')
  findMine(@CurrentUser() user: JwtPayload) {
    return this.applicationsService.findMine(user.sub);
  }

  @Roles('COMPANY')
  @Get('stats')
  getStats(@CurrentUser() user: JwtPayload) {
    return this.applicationsService.getCompanyStats(user.sub);
  }

  @Roles('COMPANY')
  @Get()
  findForJob(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryApplicationsDto,
  ) {
    return this.applicationsService.findForJob(user.sub, query.jobId);
  }

  @Roles('COMPANY')
  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.applicationsService.updateStatus(user.sub, id, dto);
  }
}
