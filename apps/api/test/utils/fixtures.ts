import request from 'supertest';
import type { App } from 'supertest/types';
import type { UserRole } from '@talentflow/types';

let counter = 0;
function uniqueEmail(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now()}_${counter}@example.com`;
}

export interface AuthedUser {
  email: string;
  password: string;
  role: UserRole;
  accessToken: string;
  refreshToken: string;
}

export async function registerUser(
  app: App,
  role: UserRole,
  overrides: Partial<{ email: string; password: string }> = {},
): Promise<AuthedUser> {
  const email = overrides.email ?? uniqueEmail(role.toLowerCase());
  const password = overrides.password ?? 'password123';

  const res = await request(app)
    .post('/auth/register')
    .send({ email, password, role })
    .expect(201);

  return {
    email,
    password,
    role,
    accessToken: res.body.accessToken as string,
    refreshToken: res.body.refreshToken as string,
  };
}

export async function createCandidateProfile(
  app: App,
  accessToken: string,
  body: Partial<{
    fullName: string;
    title: string;
    bio: string;
    skills: string[];
  }> = {},
) {
  const res = await request(app)
    .post('/candidates/me')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ fullName: 'Test Candidate', ...body })
    .expect(201);
  return res.body;
}

export async function createCompanyProfile(
  app: App,
  accessToken: string,
  body: Partial<{ name: string; sector: string; description: string }> = {},
) {
  const res = await request(app)
    .post('/companies/me')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ name: 'Test Company', ...body })
    .expect(201);
  return res.body;
}

export async function createJob(
  app: App,
  accessToken: string,
  body: Partial<{
    title: string;
    description: string;
    contractType: string;
    location: string;
    requiredSkills: string[];
  }> = {},
) {
  const res = await request(app)
    .post('/jobs')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      title: 'Test Job',
      description: 'A test job description long enough to pass validation',
      contractType: 'CDI',
      location: 'Dakar',
      ...body,
    })
    .expect(201);
  return res.body;
}

export async function createResume(
  app: App,
  accessToken: string,
  fileUrl = 'https://storage.example.com/test-cv.pdf',
) {
  const res = await request(app)
    .post('/candidates/me/resumes')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ fileUrl })
    .expect(201);
  return res.body;
}

export async function setupCandidateWithResume(app: App) {
  const candidate = await registerUser(app, 'CANDIDATE');
  await createCandidateProfile(app, candidate.accessToken);
  const resume = await createResume(app, candidate.accessToken);
  return { candidate, resume };
}

export async function setupCompanyWithJob(
  app: App,
  jobOverrides?: Parameters<typeof createJob>[2],
) {
  const company = await registerUser(app, 'COMPANY');
  await createCompanyProfile(app, company.accessToken);
  const job = await createJob(app, company.accessToken, jobOverrides);
  return { company, job };
}
