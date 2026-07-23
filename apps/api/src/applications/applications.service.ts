import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, type Application } from '../../generated/prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';

function computeMatchScore(
  parsedSkills: string[],
  requiredSkills: string[],
): number | null {
  if (requiredSkills.length === 0) {
    return null;
  }
  const parsedSet = new Set(parsedSkills.map((s) => s.toLowerCase()));
  const matched = requiredSkills.filter((s) =>
    parsedSet.has(s.toLowerCase()),
  ).length;
  return Math.round((matched / requiredSkills.length) * 100);
}

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async getOwnCandidateProfile(userId: string) {
    const candidateProfile = await this.prisma.candidateProfile.findUnique({
      where: { userId },
    });
    if (!candidateProfile) {
      throw new NotFoundException(
        "Crée d'abord ton profil candidat avant de postuler",
      );
    }
    return candidateProfile;
  }

  private async getOwnCompanyProfile(userId: string) {
    const companyProfile = await this.prisma.companyProfile.findUnique({
      where: { userId },
    });
    if (!companyProfile) {
      throw new NotFoundException("Crée d'abord ton profil entreprise");
    }
    return companyProfile;
  }

  async apply(userId: string, dto: CreateApplicationDto) {
    const candidateProfile = await this.getOwnCandidateProfile(userId);

    const job = await this.prisma.job.findUnique({
      where: { id: dto.jobId },
      include: { companyProfile: { select: { userId: true } } },
    });
    if (!job || job.status !== 'PUBLISHED') {
      throw new NotFoundException('Offre introuvable');
    }

    const resume = await this.prisma.resume.findUnique({
      where: { id: dto.resumeId },
    });
    if (!resume || resume.candidateProfileId !== candidateProfile.id) {
      throw new NotFoundException('CV introuvable');
    }

    const matchScore = computeMatchScore(
      resume.parsedSkills,
      job.requiredSkills,
    );

    let application: Application;
    try {
      application = await this.prisma.application.create({
        data: {
          jobId: dto.jobId,
          candidateProfileId: candidateProfile.id,
          resumeId: dto.resumeId,
          status: 'RECEIVED',
          matchScore,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Tu as déjà postulé à cette offre');
      }
      throw error;
    }

    await this.notificationsService.create(
      job.companyProfile.userId,
      'NEW_APPLICATION',
      {
        applicationId: application.id,
        jobId: job.id,
        jobTitle: job.title,
        candidateName: candidateProfile.fullName,
      },
    );

    return application;
  }

  async findMine(userId: string) {
    const candidateProfile = await this.getOwnCandidateProfile(userId);
    return this.prisma.application.findMany({
      where: { candidateProfileId: candidateProfile.id },
      include: {
        job: {
          select: {
            title: true,
            location: true,
            contractType: true,
            companyProfile: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findForJob(userId: string, jobId: string) {
    const companyProfile = await this.getOwnCompanyProfile(userId);
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('Offre introuvable');
    }
    if (job.companyProfileId !== companyProfile.id) {
      throw new ForbiddenException("Cette offre ne t'appartient pas");
    }

    return this.prisma.application.findMany({
      where: { jobId },
      include: {
        candidateProfile: {
          select: { fullName: true, title: true, skills: true },
        },
        resume: { select: { fileUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(
    userId: string,
    applicationId: string,
    dto: UpdateApplicationStatusDto,
  ) {
    const companyProfile = await this.getOwnCompanyProfile(userId);
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
        candidateProfile: { select: { userId: true } },
      },
    });
    if (!application) {
      throw new NotFoundException('Candidature introuvable');
    }
    if (application.job.companyProfileId !== companyProfile.id) {
      throw new ForbiddenException('Cette candidature ne te concerne pas');
    }

    const updated = await this.prisma.application.update({
      where: { id: applicationId },
      data: { status: dto.status },
    });

    await this.notificationsService.create(
      application.candidateProfile.userId,
      'APPLICATION_STATUS_CHANGED',
      {
        applicationId: updated.id,
        jobId: application.job.id,
        jobTitle: application.job.title,
        status: updated.status,
      },
    );

    return updated;
  }

  async getCompanyStats(userId: string) {
    const companyProfile = await this.getOwnCompanyProfile(userId);

    const daysBack = 13;
    const rangeStart = new Date();
    rangeStart.setHours(0, 0, 0, 0);
    rangeStart.setDate(rangeStart.getDate() - daysBack);

    const [jobsByStatus, applicationsByStatus, recentApplications] =
      await Promise.all([
        this.prisma.job.groupBy({
          by: ['status'],
          where: { companyProfileId: companyProfile.id },
          _count: { _all: true },
        }),
        this.prisma.application.groupBy({
          by: ['status'],
          where: { job: { companyProfileId: companyProfile.id } },
          _count: { _all: true },
        }),
        this.prisma.application.findMany({
          where: {
            job: { companyProfileId: companyProfile.id },
            createdAt: { gte: rangeStart },
          },
          select: { createdAt: true },
        }),
      ]);

    const jobsCount = { DRAFT: 0, PUBLISHED: 0, CLOSED: 0 };
    for (const row of jobsByStatus) {
      jobsCount[row.status] = row._count._all;
    }

    const applicationsCount = {
      RECEIVED: 0,
      IN_REVIEW: 0,
      INTERVIEW: 0,
      REJECTED: 0,
      ACCEPTED: 0,
    };
    for (const row of applicationsByStatus) {
      applicationsCount[row.status] = row._count._all;
    }

    const byDay = new Map<string, number>();
    for (let i = 0; i <= daysBack; i++) {
      const d = new Date(rangeStart);
      d.setDate(d.getDate() + i);
      byDay.set(d.toISOString().slice(0, 10), 0);
    }
    for (const application of recentApplications) {
      const key = application.createdAt.toISOString().slice(0, 10);
      byDay.set(key, (byDay.get(key) ?? 0) + 1);
    }

    return {
      jobs: {
        total: jobsCount.DRAFT + jobsCount.PUBLISHED + jobsCount.CLOSED,
        published: jobsCount.PUBLISHED,
        closed: jobsCount.CLOSED,
        draft: jobsCount.DRAFT,
      },
      applications: {
        total: Object.values(applicationsCount).reduce((a, b) => a + b, 0),
        byStatus: applicationsCount,
      },
      applicationsByDay: Array.from(byDay.entries()).map(([date, count]) => ({
        date,
        count,
      })),
    };
  }
}
