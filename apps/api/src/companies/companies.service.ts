import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyProfileDto } from './dto/create-company-profile.dto';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateCompanyProfileDto) {
    const existing = await this.prisma.companyProfile.findUnique({
      where: { userId },
    });
    if (existing) {
      throw new ConflictException('Un profil entreprise existe déjà');
    }

    return this.prisma.companyProfile.create({
      data: { userId, ...dto },
    });
  }

  async findMine(userId: string) {
    const profile = await this.prisma.companyProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('Profil entreprise introuvable');
    }
    return profile;
  }

  async update(userId: string, dto: UpdateCompanyProfileDto) {
    await this.findMine(userId);
    return this.prisma.companyProfile.update({
      where: { userId },
      data: dto,
    });
  }
}
