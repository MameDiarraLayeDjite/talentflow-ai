import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, resetDb } from './utils/test-app';
import {
  setupCandidateWithResume,
  setupCompanyWithJob,
} from './utils/fixtures';

describe('Notifications (e2e)', () => {
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

  it('notifies the company when a candidate applies', async () => {
    const { candidate, resume } = await setupCandidateWithResume(
      app.getHttpServer(),
    );
    const { company, job } = await setupCompanyWithJob(app.getHttpServer());

    const before = await request(app.getHttpServer())
      .get('/notifications')
      .set('Authorization', `Bearer ${company.accessToken}`)
      .expect(200);
    expect(before.body).toHaveLength(0);

    await request(app.getHttpServer())
      .post('/applications')
      .set('Authorization', `Bearer ${candidate.accessToken}`)
      .send({ jobId: job.id, resumeId: resume.id })
      .expect(201);

    const after = await request(app.getHttpServer())
      .get('/notifications')
      .set('Authorization', `Bearer ${company.accessToken}`)
      .expect(200);

    expect(after.body).toHaveLength(1);
    expect(after.body[0].type).toBe('NEW_APPLICATION');
    expect(after.body[0].read).toBe(false);
    expect(after.body[0].payload.jobTitle).toBe(job.title);
  });

  it('notifies the candidate when their application status changes', async () => {
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
      .send({ status: 'ACCEPTED' })
      .expect(200);

    const notifications = await request(app.getHttpServer())
      .get('/notifications')
      .set('Authorization', `Bearer ${candidate.accessToken}`)
      .expect(200);

    expect(notifications.body).toHaveLength(1);
    expect(notifications.body[0].type).toBe('APPLICATION_STATUS_CHANGED');
    expect(notifications.body[0].payload.status).toBe('ACCEPTED');
  });

  it('marks a notification as read', async () => {
    const { candidate, resume } = await setupCandidateWithResume(
      app.getHttpServer(),
    );
    const { company, job } = await setupCompanyWithJob(app.getHttpServer());

    await request(app.getHttpServer())
      .post('/applications')
      .set('Authorization', `Bearer ${candidate.accessToken}`)
      .send({ jobId: job.id, resumeId: resume.id })
      .expect(201);

    const list = await request(app.getHttpServer())
      .get('/notifications')
      .set('Authorization', `Bearer ${company.accessToken}`)
      .expect(200);
    const notificationId = list.body[0].id as string;

    const updated = await request(app.getHttpServer())
      .patch(`/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${company.accessToken}`)
      .expect(200);
    expect(updated.body.read).toBe(true);
  });

  it('rejects marking someone else’s notification as read', async () => {
    const { candidate, resume } = await setupCandidateWithResume(
      app.getHttpServer(),
    );
    const { company, job } = await setupCompanyWithJob(app.getHttpServer());

    await request(app.getHttpServer())
      .post('/applications')
      .set('Authorization', `Bearer ${candidate.accessToken}`)
      .send({ jobId: job.id, resumeId: resume.id })
      .expect(201);

    const list = await request(app.getHttpServer())
      .get('/notifications')
      .set('Authorization', `Bearer ${company.accessToken}`)
      .expect(200);
    const notificationId = list.body[0].id as string;

    await request(app.getHttpServer())
      .patch(`/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${candidate.accessToken}`)
      .expect(403);
  });
});
