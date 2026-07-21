import { apiFetch } from "@/lib/api-client";
import type { ApplicationStatus } from "@talentflow/types";

export interface Application {
  id: string;
  jobId: string;
  candidateProfileId: string;
  resumeId: string;
  status: ApplicationStatus;
  matchScore: number | null;
  createdAt: string;
}

export interface MyApplication extends Application {
  job: {
    title: string;
    location: string;
    contractType: string;
    companyProfile: { name: string };
  };
}

export interface JobApplication extends Application {
  candidateProfile: {
    fullName: string;
    title: string | null;
    skills: string[];
  };
  resume: { fileUrl: string };
}

export function applyToJob(
  accessToken: string,
  body: { jobId: string; resumeId: string },
) {
  return apiFetch<Application>("/applications", {
    method: "POST",
    body,
    accessToken,
  });
}

export function listMyApplications(accessToken: string) {
  return apiFetch<MyApplication[]>("/applications/mine", { accessToken });
}

export function listApplicationsForJob(accessToken: string, jobId: string) {
  return apiFetch<JobApplication[]>(`/applications?jobId=${jobId}`, {
    accessToken,
  });
}

export function updateApplicationStatus(
  accessToken: string,
  id: string,
  status: ApplicationStatus,
) {
  return apiFetch<Application>(`/applications/${id}/status`, {
    method: "PATCH",
    body: { status },
    accessToken,
  });
}
