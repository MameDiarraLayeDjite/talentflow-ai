"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { listAdminJobs, updateAdminJobStatus } from "@/features/admin/api";
import type { JobStatus } from "@talentflow/types";

const PAGE_SIZE = 20;

const STATUS_FILTERS: { label: string; value: JobStatus | undefined }[] = [
  { label: "Tous", value: undefined },
  { label: "Brouillon", value: "DRAFT" },
  { label: "Publiées", value: "PUBLISHED" },
  { label: "Fermées", value: "CLOSED" },
];

const STATUS_LABEL: Record<JobStatus, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publiée",
  CLOSED: "Fermée",
};

const STATUS_BADGE: Record<JobStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  PUBLISHED:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  CLOSED: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
};

export default function AdminJobsPage() {
  const { user, isLoading, accessToken } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<JobStatus | undefined>(undefined);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    } else if (!isLoading && user && user.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [isLoading, user, router]);

  const query = useQuery({
    queryKey: ["adminJobs", status, page],
    queryFn: () =>
      listAdminJobs(accessToken!, { status, page, limit: PAGE_SIZE }),
    enabled: !!accessToken && user?.role === "ADMIN",
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, next }: { id: string; next: JobStatus }) =>
      updateAdminJobStatus(accessToken!, id, next),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminJobs"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });

  if (isLoading || !user || user.role !== "ADMIN") {
    return null;
  }

  const jobs = query.data?.items ?? [];

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
      <div>
        <Link href="/admin" className="text-muted-foreground text-sm">
          ← Administration
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Offres</h1>
        <p className="text-muted-foreground text-sm">
          {query.data
            ? `${query.data.total} offre${query.data.total > 1 ? "s" : ""}`
            : "Modérer les offres publiées sur la plateforme"}
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={() => {
              setStatus(f.value);
              setPage(1);
            }}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              status === f.value
                ? "border-primary bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {query.isLoading && (
        <div className="text-muted-foreground flex items-center justify-center gap-2 py-12 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Chargement...
        </div>
      )}

      {query.data && jobs.length === 0 && (
        <p className="text-muted-foreground py-12 text-center text-sm">
          Aucune offre ne correspond à ce filtre.
        </p>
      )}

      {jobs.length > 0 && (
        <Card className="gap-0 divide-y p-0 shadow-sm">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{job.title}</p>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                      STATUS_BADGE[job.status],
                    )}
                  >
                    {STATUS_LABEL[job.status]}
                  </span>
                </div>
                <p className="text-muted-foreground truncate text-sm">
                  {job.companyProfile.name} · {job.location}
                </p>
              </div>
              <div className="flex gap-1.5">
                {(["DRAFT", "PUBLISHED", "CLOSED"] as JobStatus[])
                  .filter((s) => s !== job.status)
                  .map((s) => (
                    <Button
                      key={s}
                      variant="outline"
                      size="sm"
                      disabled={statusMutation.isPending}
                      onClick={() =>
                        statusMutation.mutate({ id: job.id, next: s })
                      }
                    >
                      {STATUS_LABEL[s]}
                    </Button>
                  ))}
              </div>
            </div>
          ))}
        </Card>
      )}

      {query.data && query.data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="size-4" />
            Précédent
          </Button>
          <span className="text-muted-foreground text-sm">
            Page {query.data.page} / {query.data.totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= query.data.totalPages}
            onClick={() =>
              setPage((p) => Math.min(query.data!.totalPages, p + 1))
            }
          >
            Suivant
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </main>
  );
}
