import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { QueryJobsDto } from './dto/query-jobs.dto';

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOwnCompanyProfile(userId: string) {
    const companyProfile = await this.prisma.companyProfile.findUnique({
      where: { userId },
    });
    if (!companyProfile) {
      throw new NotFoundException(
        "Crée d'abord ton profil entreprise avant de publier une offre",
      );
    }
    return companyProfile;
  }

  async create(userId: string, dto: CreateJobDto) {
    const companyProfile = await this.getOwnCompanyProfile(userId);
    return this.prisma.job.create({
      data: {
        companyProfileId: companyProfile.id,
        title: dto.title,
        description: dto.description,
        contractType: dto.contractType,
        location: dto.location,
        requiredSkills: dto.requiredSkills ?? [],
        status: 'PUBLISHED',
      },
    });
  }

  async findAll(query: QueryJobsDto) {
    return this.prisma.job.findMany({
      where: {
        status: 'PUBLISHED',
        ...(query.location
          ? { location: { contains: query.location, mode: 'insensitive' } }
          : {}),
        ...(query.contractType ? { contractType: query.contractType } : {}),
        ...(query.keyword
          ? {
              OR: [
                { title: { contains: query.keyword, mode: 'insensitive' } },
                {
                  description: {
                    contains: query.keyword,
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : {}),
      },
      include: { companyProfile: { select: { name: true, logoUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMine(userId: string) {
    const companyProfile = await this.getOwnCompanyProfile(userId);
    return this.prisma.job.findMany({
      where: { companyProfileId: companyProfile.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: { companyProfile: { select: { name: true, logoUrl: true } } },
    });
    if (!job || job.status !== 'PUBLISHED') {
      throw new NotFoundException('Offre introuvable');
    }
    return job;
  }

  async update(userId: string, jobId: string, dto: UpdateJobDto) {
    const companyProfile = await this.getOwnCompanyProfile(userId);
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('Offre introuvable');
    }
    if (job.companyProfileId !== companyProfile.id) {
      throw new ForbiddenException("Cette offre ne t'appartient pas");
    }

    return this.prisma.job.update({ where: { id: jobId }, data: dto });
  }
}
