import { apiFetch } from "@/lib/api-client";

export interface CandidateProfile {
  id: string;
  userId: string;
  fullName: string;
  title: string | null;
  bio: string | null;
  skills: string[];
}

export interface CandidateProfileInput {
  fullName: string;
  title?: string;
  bio?: string;
  skills?: string[];
}

export function getMyCandidateProfile(accessToken: string) {
  return apiFetch<CandidateProfile>("/candidates/me", { accessToken });
}

export function createMyCandidateProfile(
  accessToken: string,
  body: CandidateProfileInput,
) {
  return apiFetch<CandidateProfile>("/candidates/me", {
    method: "POST",
    body,
    accessToken,
  });
}

export function updateMyCandidateProfile(
  accessToken: string,
  body: Partial<CandidateProfileInput>,
) {
  return apiFetch<CandidateProfile>("/candidates/me", {
    method: "PATCH",
    body,
    accessToken,
  });
}
