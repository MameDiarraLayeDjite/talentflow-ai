import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCandidateProfileDto } from './dto/create-candidate-profile.dto';
import { UpdateCandidateProfileDto } from './dto/update-candidate-profile.dto';

@Injectable()
export class CandidatesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateCandidateProfileDto) {
    const existing = await this.prisma.candidateProfile.findUnique({
      where: { userId },
    });
    if (existing) {
      throw new ConflictException('Un profil candidat existe déjà');
    }

    return this.prisma.candidateProfile.create({
      data: { userId, skills: [], ...dto },
    });
  }

  async findMine(userId: string) {
    const profile = await this.prisma.candidateProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('Profil candidat introuvable');
    }
    return profile;
  }

  async update(userId: string, dto: UpdateCandidateProfileDto) {
    await this.findMine(userId);
    return this.prisma.candidateProfile.update({
      where: { userId },
      data: dto,
    });
  }
}
