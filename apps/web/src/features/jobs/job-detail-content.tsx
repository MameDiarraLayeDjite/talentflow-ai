"use client";

import { Briefcase, Clock, MapPin } from "lucide-react";
import { CompanyAvatar } from "@/components/company-avatar";
import { relativeTime } from "@/lib/relative-time";
import { useAuth } from "@/lib/auth-context";
import { ApplyForm } from "@/features/applications/apply-form";
import type { JobWithCompany } from "./api";

export function JobDetailContent({ job }: { job: JobWithCompany }) {
  const { user, accessToken } = useAuth();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex items-start gap-3">
          <CompanyAvatar
            name={job.companyProfile.name}
            className="size-12 text-base"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight">
              {job.title}
            </h1>
            <p className="text-muted-foreground text-sm">
              {job.companyProfile.name}
            </p>
          </div>
        </div>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-sm">
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" />
            {job.location}
          </span>
          <span className="flex items-center gap-1">
            <Briefcase className="size-3.5" />
            {job.contractType}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />
            Publiée {relativeTime(job.createdAt)}
          </span>
        </div>
      </div>

      <div>
        <h2 className="mb-1.5 text-sm font-medium">Description du poste</h2>
        <p className="text-muted-foreground whitespace-pre-wrap text-sm">
          {job.description}
        </p>
      </div>

      {job.requiredSkills.length > 0 && (
        <div>
          <h2 className="mb-1.5 text-sm font-medium">Compétences requises</h2>
          <div className="flex flex-wrap gap-2">
            {job.requiredSkills.map((skill) => (
              <span
                key={skill}
                className="bg-muted rounded-full px-2.5 py-0.5 text-xs"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {user?.role === "CANDIDATE" && accessToken && (
        <ApplyForm accessToken={accessToken} jobId={job.id} />
      )}
    </div>
  );
}
