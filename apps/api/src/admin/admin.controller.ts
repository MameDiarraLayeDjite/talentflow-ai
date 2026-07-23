import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { UpdateJobDto } from '../jobs/dto/update-job.dto';
import { UpdateCandidateProfileDto } from '../candidates/dto/update-candidate-profile.dto';
import { UpdateCompanyProfileDto } from '../companies/dto/update-company-profile.dto';
import { AdminService } from './admin.service';
import { QueryUsersDto } from './dto/query-users.dto';
import { QueryAdminJobsDto } from './dto/query-admin-jobs.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

@UseGuards(JwtAccessGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  findUsers(@Query() query: QueryUsersDto) {
    return this.adminService.findUsers(query);
  }

  @Patch('users/:id')
  updateUser(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateAdminUserDto,
  ) {
    return this.adminService.updateUser(user.sub, id, dto);
  }

  @Delete('users/:id')
  deleteUser(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.adminService.deleteUser(user.sub, id);
  }

  @Patch('candidates/:id')
  updateCandidateProfile(
    @Param('id') id: string,
    @Body() dto: UpdateCandidateProfileDto,
  ) {
    return this.adminService.updateCandidateProfile(id, dto);
  }

  @Patch('companies/:id')
  updateCompanyProfile(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyProfileDto,
  ) {
    return this.adminService.updateCompanyProfile(id, dto);
  }

  @Get('jobs')
  findJobs(@Query() query: QueryAdminJobsDto) {
    return this.adminService.findJobs(query);
  }

  @Patch('jobs/:id')
  updateJob(@Param('id') id: string, @Body() dto: UpdateJobDto) {
    return this.adminService.updateJob(id, dto);
  }

  @Delete('jobs/:id')
  deleteJob(@Param('id') id: string) {
    return this.adminService.deleteJob(id);
  }
}
