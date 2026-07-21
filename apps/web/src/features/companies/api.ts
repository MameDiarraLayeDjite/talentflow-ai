import { apiFetch } from "@/lib/api-client";

export interface CompanyProfile {
  id: string;
  userId: string;
  name: string;
  logoUrl: string | null;
  description: string | null;
  sector: string | null;
}

export interface CompanyProfileInput {
  name: string;
  logoUrl?: string;
  description?: string;
  sector?: string;
}

export function getMyCompanyProfile(accessToken: string) {
  return apiFetch<CompanyProfile>("/companies/me", { accessToken });
}

export function createMyCompanyProfile(
  accessToken: string,
  body: CompanyProfileInput,
) {
  return apiFetch<CompanyProfile>("/companies/me", {
    method: "POST",
    body,
    accessToken,
  });
}

export function updateMyCompanyProfile(
  accessToken: string,
  body: Partial<CompanyProfileInput>,
) {
  return apiFetch<CompanyProfile>("/companies/me", {
    method: "PATCH",
    body,
    accessToken,
  });
}
