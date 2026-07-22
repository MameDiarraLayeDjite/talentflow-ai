import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, resetDb } from './utils/test-app';
import {
  registerUser,
  setupCandidateWithResume,
  setupCompanyWithJob,
} from './utils/fixtures';

describe('Applications (e2e)', () => {
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

  it('rejects applying without a resume', async () => {
    const candidate = await registerUser(app.getHttpServer(), 'CANDIDATE');
    const { job } = await setupCompanyWithJob(app.getHttpServer());

    await request(app.getHttpServer())
      .post('/applications')
      .set('Authorization', `Bearer ${candidate.accessToken}`)
      .send({ jobId: job.id, resumeId: 'does-not-exist' })
      .expect(404);
  });

  it('lets a candidate apply and appear in their own list', async () => {
    const { candidate, resume } = await setupCandidateWithResume(
      app.getHttpServer(),
    );
    const { job } = await setupCompanyWithJob(app.getHttpServer());

    const application = await request(app.getHttpServer())
      .post('/applications')
      .set('Authorization', `Bearer ${candidate.accessToken}`)
      .send({ jobId: job.id, resumeId: resume.id })
      .expect(201);

    expect(application.body.status).toBe('RECEIVED');

    const mine = await request(app.getHttpServer())
      .get('/applications/mine')
      .set('Authorization', `Bearer ${candidate.accessToken}`)
      .expect(200);

    expect(mine.body).toHaveLength(1);
    expect(mine.body[0].job.title).toBe(job.title);
  });

  it('rejects applying twice to the same job', async () => {
    const { candidate, resume } = await setupCandidateWithResume(
      app.getHttpServer(),
    );
    const { job } = await setupCompanyWithJob(app.getHttpServer());

    await request(app.getHttpServer())
      .post('/applications')
      .set('Authorization', `Bearer ${candidate.accessToken}`)
      .send({ jobId: job.id, resumeId: resume.id })
      .expect(201);

    await request(app.getHttpServer())
      .post('/applications')
      .set('Authorization', `Bearer ${candidate.accessToken}`)
      .send({ jobId: job.id, resumeId: resume.id })
      .expect(409);
  });

  it('lets the owning company see applicants but not other companies', async () => {
    const { candidate, resume } = await setupCandidateWithResume(
      app.getHttpServer(),
    );
    const { company, job } = await setupCompanyWithJob(app.getHttpServer());

    await request(app.getHttpServer())
      .post('/applications')
      .set('Authorization', `Bearer ${candidate.accessToken}`)
      .send({ jobId: job.id, resumeId: resume.id })
      .expect(201);

    const forJob = await request(app.getHttpServer())
      .get(`/applications?jobId=${job.id}`)
      .set('Authorization', `Bearer ${company.accessToken}`)
      .expect(200);
    expect(forJob.body).toHaveLength(1);
    expect(forJob.body[0].candidateProfile.fullName).toBe('Test Candidate');

    const otherCompany = await registerUser(app.getHttpServer(), 'COMPANY');
    await request(app.getHttpServer())
      .post('/companies/me')
      .set('Authorization', `Bearer ${otherCompany.accessToken}`)
      .send({ name: 'Other Corp' })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/applications?jobId=${job.id}`)
      .set('Authorization', `Bearer ${otherCompany.accessToken}`)
      .expect(403);
  });

  it('lets the owning company move an application through the pipeline', async () => {
    const { candidate, resume } = await setupCandidateWithResume(
      app.getHttpServer(),
    );
    const { company, job } = await setupCompanyWithJob(app.getHttpServer());

    const application = await request(app.getHttpServer())
      .post('/applications')
      .set('Authorization', `Bearer ${candidate.accessToken}`)
      .send({ jobId: job.id, resumeId: resume.id })
      .expect(201);

    const updated = await request(app.getHttpServer())
      .patch(`/applications/${application.body.id}/status`)
      .set('Authorization', `Bearer ${company.accessToken}`)
      .send({ status: 'INTERVIEW' })
      .expect(200);

    expect(updated.body.status).toBe('INTERVIEW');

    const mine = await request(app.getHttpServer())
      .get('/applications/mine')
      .set('Authorization', `Bearer ${candidate.accessToken}`)
      .expect(200);
    expect(mine.body[0].status).toBe('INTERVIEW');
  });

  describe('company stats', () => {
    it('rejects a candidate requesting company stats', async () => {
      const candidate = await registerUser(app.getHttpServer(), 'CANDIDATE');

      await request(app.getHttpServer())
        .get('/applications/stats')
        .set('Authorization', `Bearer ${candidate.accessToken}`)
        .expect(403);
    });

    it('aggregates jobs and applications for the company', async () => {
      const { candidate, resume } = await setupCandidateWithResume(
        app.getHttpServer(),
      );
      const { company, job } = await setupCompanyWithJob(app.getHttpServer());

      const application = await request(app.getHttpServer())
        .post('/applications')
        .set('Authorization', `Bearer ${candidate.accessToken}`)
        .send({ jobId: job.id, resumeId: resume.id })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/applications/${application.body.id}/status`)
        .set('Authorization', `Bearer ${company.accessToken}`)
        .send({ status: 'INTERVIEW' })
        .expect(200);

      const stats = await request(app.getHttpServer())
        .get('/applications/stats')
        .set('Authorization', `Bearer ${company.accessToken}`)
        .expect(200);

      expect(stats.body.jobs.total).toBe(1);
      expect(stats.body.jobs.published).toBe(1);
      expect(stats.body.applications.total).toBe(1);
      expect(stats.body.applications.byStatus.INTERVIEW).toBe(1);
      expect(stats.body.applications.byStatus.RECEIVED).toBe(0);
      expect(stats.body.applicationsByDay).toHaveLength(14);
      const today = new Date().toISOString().slice(0, 10);
      const todayBucket = stats.body.applicationsByDay.find(
        (d: { date: string }) => d.date === today,
      );
      expect(todayBucket.count).toBe(1);
    });
  });
});
