import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, resetDb } from './utils/test-app';
import { createCandidateProfile, registerUser } from './utils/fixtures';
import { buildFakePdf } from './utils/fake-pdf';

describe('Resumes (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDb(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects uploading a resume before creating a candidate profile', async () => {
    const candidate = await registerUser(app.getHttpServer(), 'CANDIDATE');

    await request(app.getHttpServer())
      .post('/candidates/me/resumes')
      .set('Authorization', `Bearer ${candidate.accessToken}`)
      .attach('file', buildFakePdf('CV'), {
        filename: 'cv.pdf',
        contentType: 'application/pdf',
      })
      .expect(404);
  });

  it('rejects a non-PDF file', async () => {
    const candidate = await registerUser(app.getHttpServer(), 'CANDIDATE');
    await createCandidateProfile(app.getHttpServer(), candidate.accessToken);

    await request(app.getHttpServer())
      .post('/candidates/me/resumes')
      .set('Authorization', `Bearer ${candidate.accessToken}`)
      .attach('file', Buffer.from('not a pdf'), {
        filename: 'cv.txt',
        contentType: 'text/plain',
      })
      .expect(400);
  });

  it('rejects a request without a file', async () => {
    const candidate = await registerUser(app.getHttpServer(), 'CANDIDATE');
    await createCandidateProfile(app.getHttpServer(), candidate.accessToken);

    await request(app.getHttpServer())
      .post('/candidates/me/resumes')
      .set('Authorization', `Bearer ${candidate.accessToken}`)
      .expect(400);
  });

  it('uploads a PDF, stores a reachable fileUrl and extracts known skills', async () => {
    const candidate = await registerUser(app.getHttpServer(), 'CANDIDATE');
    await createCandidateProfile(app.getHttpServer(), candidate.accessToken);

    const res = await request(app.getHttpServer())
      .post('/candidates/me/resumes')
      .set('Authorization', `Bearer ${candidate.accessToken}`)
      .attach('file', buildFakePdf('React NestJS PostgreSQL'), {
        filename: 'cv.pdf',
        contentType: 'application/pdf',
      })
      .expect(201);

    expect(res.body.fileUrl).toContain('/uploads/resumes/');
    expect(res.body.parsedSkills.sort()).toEqual(
      ['React', 'NestJS', 'PostgreSQL'].sort(),
    );
    expect(res.body.parsedAt).not.toBeNull();

    const mine = await request(app.getHttpServer())
      .get('/candidates/me/resumes')
      .set('Authorization', `Bearer ${candidate.accessToken}`)
      .expect(200);
    expect(mine.body).toHaveLength(1);
    expect(mine.body[0].id).toBe(res.body.id);
  });
});
