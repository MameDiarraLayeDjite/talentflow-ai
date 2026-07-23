import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateJobDto } from '../jobs/dto/update-job.dto';
import { UpdateCandidateProfileDto } from '../candidates/dto/update-candidate-profile.dto';
import { UpdateCompanyProfileDto } from '../companies/dto/update-company-profile.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { QueryAdminJobsDto } from './dto/query-admin-jobs.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

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
          candidateProfile: {
            select: {
              id: true,
              fullName: true,
              title: true,
              bio: true,
              skills: true,
            },
          },
          companyProfile: {
            select: { id: true, name: true, sector: true, description: true },
          },
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

  async updateUser(
    adminUserId: string,
    targetUserId: string,
    dto: UpdateAdminUserDto,
  ) {
    if (dto.role && targetUserId === adminUserId) {
      throw new ForbiddenException('Tu ne peux pas changer ton propre rôle');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing) {
        throw new ConflictException('Cet email est déjà utilisé');
      }
    }
    return this.prisma.user.update({
      where: { id: targetUserId },
      data: dto,
      select: { id: true, email: true, role: true, createdAt: true },
    });
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

  async updateJob(jobId: string, dto: UpdateJobDto) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('Offre introuvable');
    }
    return this.prisma.job.update({ where: { id: jobId }, data: dto });
  }

  async deleteJob(jobId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('Offre introuvable');
    }
    await this.prisma.job.delete({ where: { id: jobId } });
    return { success: true };
  }

  async updateCandidateProfile(
    profileId: string,
    dto: UpdateCandidateProfileDto,
  ) {
    const profile = await this.prisma.candidateProfile.findUnique({
      where: { id: profileId },
    });
    if (!profile) {
      throw new NotFoundException('Profil candidat introuvable');
    }
    return this.prisma.candidateProfile.update({
      where: { id: profileId },
      data: dto,
    });
  }

  async updateCompanyProfile(profileId: string, dto: UpdateCompanyProfileDto) {
    const profile = await this.prisma.companyProfile.findUnique({
      where: { id: profileId },
    });
    if (!profile) {
      throw new NotFoundException('Profil entreprise introuvable');
    }
    return this.prisma.companyProfile.update({
      where: { id: profileId },
      data: dto,
    });
  }
}
