import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, resetDb } from './utils/test-app';
import {
  registerAdmin,
  registerUser,
  setupCandidateWithResume,
  setupCompanyWithJob,
} from './utils/fixtures';

describe('Admin (e2e)', () => {
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

  it('rejects a non-admin requesting stats', async () => {
    const candidate = await registerUser(app.getHttpServer(), 'CANDIDATE');

    await request(app.getHttpServer())
      .get('/admin/stats')
      .set('Authorization', `Bearer ${candidate.accessToken}`)
      .expect(403);
  });

  it('requires authentication', async () => {
    await request(app.getHttpServer()).get('/admin/stats').expect(401);
  });

  it('aggregates platform-wide stats', async () => {
    const admin = await registerAdmin(app);
    const { candidate, resume } = await setupCandidateWithResume(
      app.getHttpServer(),
    );
    const { job } = await setupCompanyWithJob(app.getHttpServer());

    await request(app.getHttpServer())
      .post('/applications')
      .set('Authorization', `Bearer ${candidate.accessToken}`)
      .send({ jobId: job.id, resumeId: resume.id })
      .expect(201);

    const stats = await request(app.getHttpServer())
      .get('/admin/stats')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    expect(stats.body.users.total).toBe(3);
    expect(stats.body.users.CANDIDATE).toBe(1);
    expect(stats.body.users.COMPANY).toBe(1);
    expect(stats.body.users.ADMIN).toBe(1);
    expect(stats.body.jobs.total).toBe(1);
    expect(stats.body.jobs.PUBLISHED).toBe(1);
    expect(stats.body.applications.total).toBe(1);
  });

  it('lists users with pagination and role filter', async () => {
    const admin = await registerAdmin(app);
    await registerUser(app.getHttpServer(), 'CANDIDATE');
    await registerUser(app.getHttpServer(), 'COMPANY');

    const all = await request(app.getHttpServer())
      .get('/admin/users')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    expect(all.body.total).toBe(3);

    const candidatesOnly = await request(app.getHttpServer())
      .get('/admin/users?role=CANDIDATE')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    expect(candidatesOnly.body.items).toHaveLength(1);
    expect(candidatesOnly.body.items[0].role).toBe('CANDIDATE');
  });

  it('lets an admin delete a user but not themselves', async () => {
    const admin = await registerAdmin(app);
    await registerUser(app.getHttpServer(), 'CANDIDATE');

    const usersRes = await request(app.getHttpServer())
      .get('/admin/users?role=CANDIDATE')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    const candidateId = usersRes.body.items[0].id as string;

    await request(app.getHttpServer())
      .delete(`/admin/users/${candidateId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    const afterDelete = await request(app.getHttpServer())
      .get('/admin/users?role=CANDIDATE')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    expect(afterDelete.body.total).toBe(0);
  });

  it('rejects an admin deleting their own account', async () => {
    const admin = await registerAdmin(app);
    const meRes = await request(app.getHttpServer())
      .get('/admin/users?role=ADMIN')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    const adminId = meRes.body.items[0].id as string;

    await request(app.getHttpServer())
      .delete(`/admin/users/${adminId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(403);
  });

  it('lists jobs across all companies and lets an admin close one', async () => {
    const admin = await registerAdmin(app);
    const { job } = await setupCompanyWithJob(app.getHttpServer());

    const jobsRes = await request(app.getHttpServer())
      .get('/admin/jobs')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    expect(jobsRes.body.total).toBe(1);
    expect(jobsRes.body.items[0].id).toBe(job.id);

    const updated = await request(app.getHttpServer())
      .patch(`/admin/jobs/${job.id}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'CLOSED' })
      .expect(200);
    expect(updated.body.status).toBe('CLOSED');

    const closedOnly = await request(app.getHttpServer())
      .get('/admin/jobs?status=CLOSED')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    expect(closedOnly.body.total).toBe(1);
  });
});
