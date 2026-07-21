import { apiFetch } from "@/lib/api-client";
import type { JobStatus } from "@talentflow/types";

export interface Job {
  id: string;
  companyProfileId: string;
  title: string;
  description: string;
  requiredSkills: string[];
  contractType: string;
  location: string;
  status: JobStatus;
  createdAt: string;
}

export interface JobWithCompany extends Job {
  companyProfile: { name: string; logoUrl: string | null };
}

export interface JobInput {
  title: string;
  description: string;
  contractType: string;
  location: string;
  requiredSkills?: string[];
}

export interface JobFilters {
  keyword?: string;
  location?: string;
  contractType?: string;
}

export function listJobs(filters: JobFilters = {}) {
  const params = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => Boolean(v)) as [
      string,
      string,
    ][],
  );
  const query = params.toString();
  return apiFetch<JobWithCompany[]>(`/jobs${query ? `?${query}` : ""}`);
}

export function getJob(id: string) {
  return apiFetch<JobWithCompany>(`/jobs/${id}`);
}

export function listMyJobs(accessToken: string) {
  return apiFetch<Job[]>("/jobs/mine", { accessToken });
}

export function createJob(accessToken: string, body: JobInput) {
  return apiFetch<Job>("/jobs", { method: "POST", body, accessToken });
}

export function updateJob(
  accessToken: string,
  id: string,
  body: Partial<JobInput> & { status?: JobStatus },
) {
  return apiFetch<Job>(`/jobs/${id}`, {
    method: "PATCH",
    body,
    accessToken,
  });
}
