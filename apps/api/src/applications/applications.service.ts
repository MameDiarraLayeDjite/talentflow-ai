import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

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

    try {
      return await this.prisma.application.create({
        data: {
          jobId: dto.jobId,
          candidateProfileId: candidateProfile.id,
          resumeId: dto.resumeId,
          status: 'RECEIVED',
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
      include: { job: true },
    });
    if (!application) {
      throw new NotFoundException('Candidature introuvable');
    }
    if (application.job.companyProfileId !== companyProfile.id) {
      throw new ForbiddenException('Cette candidature ne te concerne pas');
    }

    return this.prisma.application.update({
      where: { id: applicationId },
      data: { status: dto.status },
    });
  }
}
