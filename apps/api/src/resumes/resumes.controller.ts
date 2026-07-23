import {
  BadRequestException,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { ResumesService } from './resumes.service';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

@UseGuards(JwtAccessGuard, RolesGuard)
@Roles('CANDIDATE')
@Controller('candidates/me/resumes')
export class ResumesController {
  constructor(private readonly resumesService: ResumesService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
          cb(
            new BadRequestException('Seuls les fichiers PDF sont acceptés'),
            false,
          );
          return;
        }
        cb(null, true);
      },
    }),
  )
  create(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Fichier requis');
    }
    return this.resumesService.create(user.sub, file);
  }

  @Get()
  findMine(@CurrentUser() user: JwtPayload) {
    return this.resumesService.findMine(user.sub);
  }
}
