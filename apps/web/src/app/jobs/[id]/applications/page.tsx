"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import {
  listApplicationsForJob,
  updateApplicationStatus,
} from "@/features/applications/api";
import type { ApplicationStatus } from "@talentflow/types";

const STATUS_OPTIONS: ApplicationStatus[] = [
  "RECEIVED",
  "IN_REVIEW",
  "INTERVIEW",
  "REJECTED",
  "ACCEPTED",
];

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  RECEIVED: "Reçue",
  IN_REVIEW: "En revue",
  INTERVIEW: "Entretien",
  REJECTED: "Refusée",
  ACCEPTED: "Acceptée",
};

export default function JobApplicationsPage() {
  const { user, isLoading, accessToken } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user || !accessToken) {
    return null;
  }

  return <ApplicationsList accessToken={accessToken} />;
}

function ApplicationsList({ accessToken }: { accessToken: string }) {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["jobApplications", params.id],
    queryFn: () => listApplicationsForJob(accessToken, params.id),
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      updateApplicationStatus(accessToken, id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["jobApplications", params.id],
      });
    },
  });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Candidatures reçues</h1>

      {query.isLoading && <p className="text-muted-foreground text-sm">Chargement...</p>}
      {query.data?.length === 0 && (
        <p className="text-muted-foreground text-sm">
          Aucune candidature pour l&apos;instant.
        </p>
      )}
      {query.data?.map((application) => (
        <Card key={application.id}>
          <CardHeader>
            <CardTitle className="text-base">
              {application.candidateProfile.fullName}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {application.candidateProfile.title && (
              <p className="text-muted-foreground">
                {application.candidateProfile.title}
              </p>
            )}
            {application.candidateProfile.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {application.candidateProfile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="bg-muted rounded-full px-2.5 py-0.5 text-xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
            <a
              href={application.resume.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Voir le CV
            </a>

            <select
              value={application.status}
              onChange={(e) =>
                mutation.mutate({
                  id: application.id,
                  status: e.target.value as ApplicationStatus,
                })
              }
              className="border-input h-9 w-fit rounded-md border bg-transparent px-3 text-sm"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABEL[status]}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
      ))}
    </main>
  );
}
