import { apiFetch } from "@/lib/api-client";
import type { JobStatus, UserRole } from "@talentflow/types";
import type { JobInput, JobWithCompany } from "@/features/jobs/api";

export interface AdminStats {
  users: { total: number; CANDIDATE: number; COMPANY: number; ADMIN: number };
  jobs: { total: number; DRAFT: number; PUBLISHED: number; CLOSED: number };
  applications: { total: number };
}

export interface AdminCandidateProfile {
  id: string;
  fullName: string;
  title: string | null;
  bio: string | null;
  skills: string[];
}

export interface AdminCompanyProfile {
  id: string;
  name: string;
  sector: string | null;
  description: string | null;
}

export interface AdminUser {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
  candidateProfile: AdminCandidateProfile | null;
  companyProfile: AdminCompanyProfile | null;
}

export interface PaginatedUsers {
  items: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedAdminJobs {
  items: JobWithCompany[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function getAdminStats(accessToken: string) {
  return apiFetch<AdminStats>("/admin/stats", { accessToken });
}

export function listAdminUsers(
  accessToken: string,
  params: { role?: UserRole; page?: number; limit?: number } = {},
) {
  const search = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)]),
  );
  const query = search.toString();
  return apiFetch<PaginatedUsers>(`/admin/users${query ? `?${query}` : ""}`, {
    accessToken,
  });
}

export function updateAdminUser(
  accessToken: string,
  id: string,
  body: { email?: string; role?: UserRole },
) {
  return apiFetch<AdminUser>(`/admin/users/${id}`, {
    method: "PATCH",
    body,
    accessToken,
  });
}

export function deleteAdminUser(accessToken: string, id: string) {
  return apiFetch<void>(`/admin/users/${id}`, {
    method: "DELETE",
    accessToken,
  });
}

export function updateAdminCandidateProfile(
  accessToken: string,
  id: string,
  body: Partial<Pick<AdminCandidateProfile, "fullName" | "title" | "bio" | "skills">>,
) {
  return apiFetch<AdminCandidateProfile>(`/admin/candidates/${id}`, {
    method: "PATCH",
    body,
    accessToken,
  });
}

export function updateAdminCompanyProfile(
  accessToken: string,
  id: string,
  body: Partial<Pick<AdminCompanyProfile, "name" | "sector" | "description">>,
) {
  return apiFetch<AdminCompanyProfile>(`/admin/companies/${id}`, {
    method: "PATCH",
    body,
    accessToken,
  });
}

export function listAdminJobs(
  accessToken: string,
  params: { status?: JobStatus; page?: number; limit?: number } = {},
) {
  const search = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)]),
  );
  const query = search.toString();
  return apiFetch<PaginatedAdminJobs>(`/admin/jobs${query ? `?${query}` : ""}`, {
    accessToken,
  });
}

export function updateAdminJob(
  accessToken: string,
  id: string,
  body: Partial<JobInput> & { status?: JobStatus },
) {
  return apiFetch<JobWithCompany>(`/admin/jobs/${id}`, {
    method: "PATCH",
    body,
    accessToken,
  });
}

export function deleteAdminJob(accessToken: string, id: string) {
  return apiFetch<void>(`/admin/jobs/${id}`, {
    method: "DELETE",
    accessToken,
  });
}
