import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, resetDb } from './utils/test-app';
import { registerUser } from './utils/fixtures';

describe('Auth (e2e)', () => {
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

  it('registers a new user and returns tokens', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'fatou@example.com',
        password: 'password123',
        role: 'CANDIDATE',
      })
      .expect(201);

    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.refreshToken).toEqual(expect.any(String));
  });

  it('rejects registering the same email twice', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'dup@example.com',
        password: 'password123',
        role: 'CANDIDATE',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'dup@example.com',
        password: 'password123',
        role: 'CANDIDATE',
      })
      .expect(409);
  });

  it('rejects login with wrong password', async () => {
    const user = await registerUser(app.getHttpServer(), 'CANDIDATE');

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: 'wrong-password' })
      .expect(401);
  });

  it('logs in with correct credentials', async () => {
    const user = await registerUser(app.getHttpServer(), 'CANDIDATE');

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: user.password })
      .expect(200);

    expect(res.body.accessToken).toEqual(expect.any(String));
  });

  it('refreshes tokens with a valid refresh token', async () => {
    const user = await registerUser(app.getHttpServer(), 'CANDIDATE');

    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Authorization', `Bearer ${user.refreshToken}`)
      .expect(200);

    expect(res.body.accessToken).toEqual(expect.any(String));
  });

  it('rejects refresh using an access token', async () => {
    const user = await registerUser(app.getHttpServer(), 'CANDIDATE');

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(401);
  });

  it('invalidates the refresh token after logout', async () => {
    const user = await registerUser(app.getHttpServer(), 'CANDIDATE');

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Authorization', `Bearer ${user.refreshToken}`)
      .expect(401);
  });
});
