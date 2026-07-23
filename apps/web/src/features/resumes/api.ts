import { apiFetch } from "@/lib/api-client";

export interface Resume {
  id: string;
  candidateProfileId: string;
  fileUrl: string;
  parsedSkills: string[];
  parsedAt: string | null;
  createdAt: string;
}

export function listMyResumes(accessToken: string) {
  return apiFetch<Resume[]>("/candidates/me/resumes", { accessToken });
}

export function uploadResume(accessToken: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch<Resume>("/candidates/me/resumes", {
    method: "POST",
    body: formData,
    accessToken,
  });
}
