"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Loader2, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { listMyApplications } from "@/features/applications/api";
import { ApplicationStatusBadge } from "@/features/applications/status-badge";

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
      <h1 className="text-2xl font-semibold tracking-tight">Mes candidatures</h1>

      {query.isLoading && (
        <div className="text-muted-foreground flex items-center justify-center gap-2 py-12 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Chargement...
        </div>
      )}
      {query.data?.length === 0 && (
        <div className="text-muted-foreground flex flex-col items-center gap-2 py-12 text-sm">
          <ClipboardList className="size-6" />
          Tu n&apos;as encore postulé à aucune offre.
        </div>
      )}
      {query.data?.map((application) => (
        <Card key={application.id}>
          <CardHeader>
            <CardTitle className="text-base">{application.job.title}</CardTitle>
            <p className="text-muted-foreground text-sm">
              {application.job.companyProfile.name}
            </p>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <MapPin className="size-3.5" />
              {application.job.location}
            </span>
            <ApplicationStatusBadge status={application.status} />
          </CardContent>
        </Card>
      ))}
    </main>
  );
}
