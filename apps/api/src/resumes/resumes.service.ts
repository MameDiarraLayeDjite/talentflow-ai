import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PDFParse } from 'pdf-parse';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { extractSkills } from './skills-dictionary';

async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

@Injectable()
export class ResumesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

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

  async create(userId: string, file: Express.Multer.File) {
    const candidateProfile = await this.getOwnCandidateProfile(userId);

    const key = `resumes/${candidateProfile.id}/${randomUUID()}-${file.originalname}`;
    const fileUrl = await this.storageService.uploadFile(
      file.buffer,
      key,
      file.mimetype,
    );

    let parsedSkills: string[] = [];
    let parsedAt: Date | null = null;
    try {
      const text = await extractPdfText(file.buffer);
      parsedSkills = extractSkills(text);
      parsedAt = new Date();
    } catch {
      // Le CV reste utilisable même si l'extraction échoue (PDF scanné, corrompu, etc.)
    }

    return this.prisma.resume.create({
      data: {
        candidateProfileId: candidateProfile.id,
        fileUrl,
        parsedSkills,
        parsedAt,
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
