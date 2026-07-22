import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryUsersDto } from './dto/query-users.dto';
import { QueryAdminJobsDto } from './dto/query-admin-jobs.dto';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [usersByRole, jobsByStatus, applicationsTotal] = await Promise.all([
      this.prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
      this.prisma.job.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.application.count(),
    ]);

    const users = { total: 0, CANDIDATE: 0, COMPANY: 0, ADMIN: 0 };
    for (const row of usersByRole) {
      users[row.role] = row._count._all;
      users.total += row._count._all;
    }

    const jobs = { total: 0, DRAFT: 0, PUBLISHED: 0, CLOSED: 0 };
    for (const row of jobsByStatus) {
      jobs[row.status] = row._count._all;
      jobs.total += row._count._all;
    }

    return { users, jobs, applications: { total: applicationsTotal } };
  }

  async findUsers(query: QueryUsersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = query.role ? { role: query.role } : {};

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          candidateProfile: { select: { fullName: true } },
          companyProfile: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async deleteUser(adminUserId: string, targetUserId: string) {
    if (adminUserId === targetUserId) {
      throw new ForbiddenException(
        'Tu ne peux pas supprimer ton propre compte',
      );
    }
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    await this.prisma.user.delete({ where: { id: targetUserId } });
    return { success: true };
  }

  async findJobs(query: QueryAdminJobsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = query.status ? { status: query.status } : {};

    const [items, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        include: { companyProfile: { select: { name: true, logoUrl: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async updateJobStatus(jobId: string, dto: UpdateJobStatusDto) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('Offre introuvable');
    }
    return this.prisma.job.update({
      where: { id: jobId },
      data: { status: dto.status },
    });
  }
}
