import { apiFetch } from "@/lib/api-client";
import type { JobStatus, UserRole } from "@talentflow/types";
import type { JobWithCompany } from "@/features/jobs/api";

export interface AdminStats {
  users: { total: number; CANDIDATE: number; COMPANY: number; ADMIN: number };
  jobs: { total: number; DRAFT: number; PUBLISHED: number; CLOSED: number };
  applications: { total: number };
}

export interface AdminUser {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
  candidateProfile: { fullName: string } | null;
  companyProfile: { name: string } | null;
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

export function deleteAdminUser(accessToken: string, id: string) {
  return apiFetch<void>(`/admin/users/${id}`, {
    method: "DELETE",
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

export function updateAdminJobStatus(
  accessToken: string,
  id: string,
  status: JobStatus,
) {
  return apiFetch<JobWithCompany>(`/admin/jobs/${id}/status`, {
    method: "PATCH",
    body: { status },
    accessToken,
  });
}
