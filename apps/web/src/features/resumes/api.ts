import { apiFetch } from "@/lib/api-client";

export interface Resume {
  id: string;
  candidateProfileId: string;
  fileUrl: string;
  createdAt: string;
}

export function listMyResumes(accessToken: string) {
  return apiFetch<Resume[]>("/candidates/me/resumes", { accessToken });
}

export function createResume(accessToken: string, fileUrl: string) {
  return apiFetch<Resume>("/candidates/me/resumes", {
    method: "POST",
    body: { fileUrl },
    accessToken,
  });
}
