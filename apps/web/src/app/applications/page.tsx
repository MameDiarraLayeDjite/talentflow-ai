"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Loader2, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CompanyAvatar } from "@/components/company-avatar";
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Mes candidatures
        </h1>
        {query.data && query.data.length > 0 && (
          <p className="text-muted-foreground text-sm">
            {query.data.length} candidature{query.data.length > 1 ? "s" : ""}
          </p>
        )}
      </div>

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
        <Card key={application.id} className="gap-0 p-4 shadow-sm">
          <div className="flex gap-3">
            <CompanyAvatar name={application.job.companyProfile.name} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h2 className="truncate font-medium">
                  {application.job.title}
                </h2>
                <ApplicationStatusBadge status={application.status} />
              </div>
              <p className="text-muted-foreground text-sm">
                {application.job.companyProfile.name}
              </p>
              <span className="text-muted-foreground mt-2 flex items-center gap-1 text-sm">
                <MapPin className="size-3.5" />
                {application.job.location}
              </span>
            </div>
          </div>
        </Card>
      ))}
    </main>
  );
}
