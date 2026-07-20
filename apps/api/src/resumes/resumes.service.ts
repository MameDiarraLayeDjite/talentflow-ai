import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResumeDto } from './dto/create-resume.dto';

@Injectable()
export class ResumesService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOwnCandidateProfile(userId: string) {
    const candidateProfile = await this.prisma.candidateProfile.findUnique({
      where: { userId },
    });
    if (!candidateProfile) {
      throw new NotFoundException(
        "Crée d'abord ton profil candidat avant d'ajouter un CV",
      );
    }
    return candidateProfile;
  }

  async create(userId: string, dto: CreateResumeDto) {
    const candidateProfile = await this.getOwnCandidateProfile(userId);
    return this.prisma.resume.create({
      data: {
        candidateProfileId: candidateProfile.id,
        fileUrl: dto.fileUrl,
      },
    });
  }

  async findMine(userId: string) {
    const candidateProfile = await this.getOwnCandidateProfile(userId);
    return this.prisma.resume.findMany({
      where: { candidateProfileId: candidateProfile.id },
      orderBy: { createdAt: 'desc' },
    });
  }
}
