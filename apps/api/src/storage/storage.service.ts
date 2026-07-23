import { Injectable, Logger } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const LOCAL_UPLOAD_DIR = join(process.cwd(), 'uploads');

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client | null = null;
  private readonly bucket = process.env.R2_BUCKET_NAME;
  private readonly publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, '');
  private readonly useCloud: boolean;

  constructor() {
    this.useCloud = Boolean(
      process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      this.bucket &&
      this.publicUrl,
    );

    if (this.useCloud) {
      this.s3 = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
      });
      this.logger.log('Storage: Cloudflare R2');
    } else {
      mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
      this.logger.warn(
        'Storage: disque local (R2_* non configuré) — ne pas utiliser en production',
      );
    }
  }

  async uploadFile(
    buffer: Buffer,
    key: string,
    contentType: string,
  ): Promise<string> {
    if (this.useCloud && this.s3) {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        }),
      );
      return `${this.publicUrl}/${key}`;
    }

    const filePath = join(LOCAL_UPLOAD_DIR, key);
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, buffer);
    const base = (
      process.env.API_PUBLIC_URL ?? 'http://localhost:3001'
    ).replace(/\/$/, '');
    return `${base}/uploads/${key}`;
  }
}
