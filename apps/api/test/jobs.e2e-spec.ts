import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, resetDb } from './utils/test-app';
import {
  createCompanyProfile,
  createJob,
  registerUser,
} from './utils/fixtures';

describe('Jobs (e2e)', () => {
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

  it('rejects creating a job without a company profile', async () => {
    const user = await registerUser(app.getHttpServer(), 'COMPANY');

    await request(app.getHttpServer())
      .post('/jobs')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        title: 'Dev Full Stack',
        description: 'On cherche un dev full stack experimente',
        contractType: 'CDI',
        location: 'Dakar',
      })
      .expect(404);
  });

  it('rejects a candidate creating a job', async () => {
    const user = await registerUser(app.getHttpServer(), 'CANDIDATE');

    await request(app.getHttpServer())
      .post('/jobs')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        title: 'Should Fail',
        description: 'This should be rejected regardless',
        contractType: 'CDI',
        location: 'Dakar',
      })
      .expect(403);
  });

  it('publishes a job that immediately appears in the public list', async () => {
    const user = await registerUser(app.getHttpServer(), 'COMPANY');
    await createCompanyProfile(app.getHttpServer(), user.accessToken, {
      name: 'Acme Jobs',
    });
    const job = await createJob(app.getHttpServer(), user.accessToken, {
      title: 'Développeur Full Stack',
      requiredSkills: ['React', 'NestJS'],
    });

    expect(job.status).toBe('PUBLISHED');

    const list = await request(app.getHttpServer()).get('/jobs').expect(200);
    expect(list.body.items.map((j: { id: string }) => j.id)).toContain(job.id);
    expect(list.body.total).toBeGreaterThanOrEqual(1);
  });

  it('filters the public list by keyword', async () => {
    const user = await registerUser(app.getHttpServer(), 'COMPANY');
    await createCompanyProfile(app.getHttpServer(), user.accessToken);
    await createJob(app.getHttpServer(), user.accessToken, {
      title: 'React Developer',
      description: 'React frontend role with a long enough description',
    });
    await createJob(app.getHttpServer(), user.accessToken, {
      title: 'Backend Engineer',
      description: 'Backend role with a long enough description text',
    });

    const res = await request(app.getHttpServer())
      .get('/jobs?keyword=React')
      .expect(200);

    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].title).toBe('React Developer');
    expect(res.body.total).toBe(1);
  });

  it('paginates the public list', async () => {
    const user = await registerUser(app.getHttpServer(), 'COMPANY');
    await createCompanyProfile(app.getHttpServer(), user.accessToken);
    for (let i = 0; i < 3; i++) {
      await createJob(app.getHttpServer(), user.accessToken, {
        title: `Job ${i}`,
      });
    }

    const firstPage = await request(app.getHttpServer())
      .get('/jobs?limit=2&page=1')
      .expect(200);
    expect(firstPage.body.items).toHaveLength(2);
    expect(firstPage.body.total).toBe(3);
    expect(firstPage.body.totalPages).toBe(2);

    const secondPage = await request(app.getHttpServer())
      .get('/jobs?limit=2&page=2')
      .expect(200);
    expect(secondPage.body.items).toHaveLength(1);
  });

  it('returns 404 for a job that does not exist', async () => {
    await request(app.getHttpServer()).get('/jobs/does-not-exist').expect(404);
  });

  it('hides a closed job from the public list and detail', async () => {
    const user = await registerUser(app.getHttpServer(), 'COMPANY');
    await createCompanyProfile(app.getHttpServer(), user.accessToken);
    const job = await createJob(app.getHttpServer(), user.accessToken);

    await request(app.getHttpServer())
      .patch(`/jobs/${job.id}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ status: 'CLOSED' })
      .expect(200);

    await request(app.getHttpServer()).get(`/jobs/${job.id}`).expect(404);

    const list = await request(app.getHttpServer()).get('/jobs').expect(200);
    expect(list.body.items).toHaveLength(0);

    const mine = await request(app.getHttpServer())
      .get('/jobs/mine')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);
    expect(mine.body).toHaveLength(1);
    expect(mine.body[0].status).toBe('CLOSED');
  });

  it('rejects updating a job owned by a different company', async () => {
    const owner = await registerUser(app.getHttpServer(), 'COMPANY');
    await createCompanyProfile(app.getHttpServer(), owner.accessToken);
    const job = await createJob(app.getHttpServer(), owner.accessToken);

    const otherCompany = await registerUser(app.getHttpServer(), 'COMPANY');
    await createCompanyProfile(app.getHttpServer(), otherCompany.accessToken, {
      name: 'Other Corp',
    });

    await request(app.getHttpServer())
      .patch(`/jobs/${job.id}`)
      .set('Authorization', `Bearer ${otherCompany.accessToken}`)
      .send({ status: 'CLOSED' })
      .expect(403);
  });

  it('lets the owning company delete its own job', async () => {
    const user = await registerUser(app.getHttpServer(), 'COMPANY');
    await createCompanyProfile(app.getHttpServer(), user.accessToken);
    const job = await createJob(app.getHttpServer(), user.accessToken);

    await request(app.getHttpServer())
      .delete(`/jobs/${job.id}`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(200);

    await request(app.getHttpServer()).get(`/jobs/${job.id}`).expect(404);
  });

  it('rejects deleting a job owned by a different company', async () => {
    const owner = await registerUser(app.getHttpServer(), 'COMPANY');
    await createCompanyProfile(app.getHttpServer(), owner.accessToken);
    const job = await createJob(app.getHttpServer(), owner.accessToken);

    const otherCompany = await registerUser(app.getHttpServer(), 'COMPANY');
    await createCompanyProfile(app.getHttpServer(), otherCompany.accessToken, {
      name: 'Other Corp',
    });

    await request(app.getHttpServer())
      .delete(`/jobs/${job.id}`)
      .set('Authorization', `Bearer ${otherCompany.accessToken}`)
      .expect(403);
  });

  it('rejects a candidate deleting a job', async () => {
    const owner = await registerUser(app.getHttpServer(), 'COMPANY');
    await createCompanyProfile(app.getHttpServer(), owner.accessToken);
    const job = await createJob(app.getHttpServer(), owner.accessToken);
    const candidate = await registerUser(app.getHttpServer(), 'CANDIDATE');

    await request(app.getHttpServer())
      .delete(`/jobs/${job.id}`)
      .set('Authorization', `Bearer ${candidate.accessToken}`)
      .expect(403);
  });
});
