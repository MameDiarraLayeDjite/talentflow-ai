"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { listMyJobs } from "@/features/jobs/api";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publiée",
  CLOSED: "Fermée",
};

export default function MyJobsPage() {
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

  return <MyJobsList accessToken={accessToken} />;
}

function MyJobsList({ accessToken }: { accessToken: string }) {
  const query = useQuery({
    queryKey: ["myJobs"],
    queryFn: () => listMyJobs(accessToken),
  });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Mes offres</h1>

      {query.isLoading && <p className="text-muted-foreground text-sm">Chargement...</p>}
      {query.data?.length === 0 && (
        <p className="text-muted-foreground text-sm">
          Tu n&apos;as encore publié aucune offre.
        </p>
      )}
      {query.data?.map((job) => (
        <Link key={job.id} href={`/jobs/${job.id}/applications`}>
          <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-base">{job.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              {job.location} · {job.contractType} ·{" "}
              {STATUS_LABEL[job.status] ?? job.status}
            </CardContent>
          </Card>
        </Link>
      ))}
    </main>
  );
}
