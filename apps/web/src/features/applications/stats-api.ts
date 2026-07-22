import { apiFetch } from "@/lib/api-client";
import type { ApplicationStatus } from "@talentflow/types";

export interface CompanyStats {
  jobs: {
    total: number;
    published: number;
    closed: number;
    draft: number;
  };
  applications: {
    total: number;
    byStatus: Record<ApplicationStatus, number>;
  };
  applicationsByDay: { date: string; count: number }[];
}

export function getCompanyStats(accessToken: string) {
  return apiFetch<CompanyStats>("/applications/stats", { accessToken });
}
