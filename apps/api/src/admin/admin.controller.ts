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
import { AdminService } from './admin.service';
import { QueryUsersDto } from './dto/query-users.dto';
import { QueryAdminJobsDto } from './dto/query-admin-jobs.dto';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';

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

  @Delete('users/:id')
  deleteUser(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.adminService.deleteUser(user.sub, id);
  }

  @Get('jobs')
  findJobs(@Query() query: QueryAdminJobsDto) {
    return this.adminService.findJobs(query);
  }

  @Patch('jobs/:id/status')
  updateJobStatus(@Param('id') id: string, @Body() dto: UpdateJobStatusDto) {
    return this.adminService.updateJobStatus(id, dto);
  }
}
