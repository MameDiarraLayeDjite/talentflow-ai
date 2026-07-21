import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, resetDb } from './utils/test-app';
import {
  createCandidateProfile,
  createCompanyProfile,
  registerUser,
} from './utils/fixtures';

describe('Profiles (e2e)', () => {
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

  describe('candidate profile', () => {
    it('creates a profile for the current user', async () => {
      const user = await registerUser(app.getHttpServer(), 'CANDIDATE');

      const profile = await createCandidateProfile(
        app.getHttpServer(),
        user.accessToken,
        {
          fullName: 'Fatou Diop',
          skills: ['React', 'Node'],
        },
      );

      expect(profile.fullName).toBe('Fatou Diop');
      expect(profile.skills).toEqual(['React', 'Node']);
    });

    it('rejects creating a second profile for the same user', async () => {
      const user = await registerUser(app.getHttpServer(), 'CANDIDATE');
      await createCandidateProfile(app.getHttpServer(), user.accessToken);

      await request(app.getHttpServer())
        .post('/candidates/me')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ fullName: 'Second Attempt' })
        .expect(409);
    });

    it('rejects a company account creating a candidate profile', async () => {
      const user = await registerUser(app.getHttpServer(), 'COMPANY');

      await request(app.getHttpServer())
        .post('/candidates/me')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ fullName: 'Should Fail' })
        .expect(403);
    });

    it('requires authentication', async () => {
      await request(app.getHttpServer()).get('/candidates/me').expect(401);
    });

    it('updates an existing profile', async () => {
      const user = await registerUser(app.getHttpServer(), 'CANDIDATE');
      await createCandidateProfile(app.getHttpServer(), user.accessToken, {
        skills: ['React'],
      });

      const res = await request(app.getHttpServer())
        .patch('/candidates/me')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ skills: ['React', 'Docker'] })
        .expect(200);

      expect(res.body.skills).toEqual(['React', 'Docker']);
    });
  });

  describe('company profile', () => {
    it('creates a profile for the current user', async () => {
      const user = await registerUser(app.getHttpServer(), 'COMPANY');

      const profile = await createCompanyProfile(
        app.getHttpServer(),
        user.accessToken,
        {
          name: 'Acme SARL',
        },
      );

      expect(profile.name).toBe('Acme SARL');
    });

    it('rejects a candidate account creating a company profile', async () => {
      const user = await registerUser(app.getHttpServer(), 'CANDIDATE');

      await request(app.getHttpServer())
        .post('/companies/me')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ name: 'Should Fail' })
        .expect(403);
    });
  });
});
