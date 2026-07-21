"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Briefcase, MapPin } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getJob } from "@/features/jobs/api";
import { useAuth } from "@/lib/auth-context";
import { ApplyForm } from "@/features/applications/apply-form";

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const { user, accessToken } = useAuth();

  const query = useQuery({
    queryKey: ["job", params.id],
    queryFn: () => getJob(params.id),
  });

  if (query.isLoading) {
    return null;
  }
  if (query.isError || !query.data) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <p className="text-muted-foreground text-sm">Offre introuvable.</p>
      </main>
    );
  }

  const job = query.data;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-6">
      <Link
        href="/jobs"
        className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-3.5" />
        Retour aux offres
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{job.title}</CardTitle>
          <p className="text-muted-foreground text-sm">
            {job.companyProfile.name}
          </p>
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-sm">
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" />
              {job.location}
            </span>
            <span className="flex items-center gap-1">
              <Briefcase className="size-3.5" />
              {job.contractType}
            </span>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="whitespace-pre-wrap text-sm">{job.description}</p>

          {job.requiredSkills.length > 0 && (
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
          )}

          {user?.role === "CANDIDATE" && accessToken && (
            <ApplyForm accessToken={accessToken} jobId={job.id} />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
