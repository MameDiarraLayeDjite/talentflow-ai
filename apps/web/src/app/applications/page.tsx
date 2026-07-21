"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { listMyApplications } from "@/features/applications/api";
import type { ApplicationStatus } from "@talentflow/types";

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  RECEIVED: "Reçue",
  IN_REVIEW: "En revue",
  INTERVIEW: "Entretien",
  REJECTED: "Refusée",
  ACCEPTED: "Acceptée",
};

export default function MyApplicationsPage() {
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

  return <MyApplicationsList accessToken={accessToken} />;
}

function MyApplicationsList({ accessToken }: { accessToken: string }) {
  const query = useQuery({
    queryKey: ["myApplications"],
    queryFn: () => listMyApplications(accessToken),
  });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Mes candidatures</h1>

      {query.isLoading && <p className="text-muted-foreground text-sm">Chargement...</p>}
      {query.data?.length === 0 && (
        <p className="text-muted-foreground text-sm">
          Tu n&apos;as encore postulé à aucune offre.
        </p>
      )}
      {query.data?.map((application) => (
        <Card key={application.id}>
          <CardHeader>
            <CardTitle className="text-base">{application.job.title}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground flex items-center justify-between text-sm">
            <span>
              {application.job.companyProfile.name} · {application.job.location}
            </span>
            <span className="text-foreground font-medium">
              {STATUS_LABEL[application.status]}
            </span>
          </CardContent>
        </Card>
      ))}
    </main>
  );
}
