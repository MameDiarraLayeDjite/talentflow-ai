"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getJob } from "@/features/jobs/api";
import { JobDetailContent } from "@/features/jobs/job-detail-content";

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();

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

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-6">
      <Link
        href="/jobs"
        className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-3.5" />
        Retour aux offres
      </Link>

      <Card className="p-6 shadow-sm">
        <JobDetailContent job={query.data} />
      </Card>
    </main>
  );
}
