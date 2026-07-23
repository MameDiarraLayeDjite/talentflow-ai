"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  Loader2,
  MapPin,
  Pencil,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { relativeTime } from "@/lib/relative-time";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { deleteJob, listMyJobs, updateJob, type Job } from "@/features/jobs/api";
import { JobEditDialog } from "@/features/jobs/job-edit-dialog";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publiée",
  CLOSED: "Fermée",
};

const STATUS_CLASSES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
  PUBLISHED:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  CLOSED: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
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
  const queryClient = useQueryClient();
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Job | null>(null);

  const query = useQuery({
    queryKey: ["myJobs"],
    queryFn: () => listMyJobs(accessToken),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteJob(accessToken, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myJobs"] });
      setPendingDelete(null);
    },
  });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Mes offres</h1>
        <Link
          href="/jobs/new"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm"
        >
          <PlusCircle className="size-4" />
          Publier une offre
        </Link>
      </div>

      {query.isLoading && (
        <div className="text-muted-foreground flex items-center justify-center gap-2 py-12 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Chargement...
        </div>
      )}
      {query.data?.length === 0 && (
        <p className="text-muted-foreground py-12 text-center text-sm">
          Tu n&apos;as encore publié aucune offre.
        </p>
      )}
      {query.data?.map((job) => (
        <Card
          key={job.id}
          className="gap-0 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/jobs/${job.id}/applications`}
              className="min-w-0 flex-1"
            >
              <h2 className="font-medium">{job.title}</h2>
            </Link>
            <span className="text-muted-foreground shrink-0 text-xs">
              {relativeTime(job.createdAt)}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <MapPin className="size-3.5" />
              {job.location}
            </span>
            <span className="text-muted-foreground flex items-center gap-1">
              <Briefcase className="size-3.5" />
              {job.contractType}
            </span>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                STATUS_CLASSES[job.status],
              )}
            >
              {STATUS_LABEL[job.status] ?? job.status}
            </span>
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingJob(job)}
            >
              <Pencil className="size-4" />
              Modifier
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPendingDelete(job)}
            >
              <Trash2 className="size-4" />
              Supprimer
            </Button>
          </div>
        </Card>
      ))}

      {editingJob && (
        <JobEditDialog
          job={editingJob}
          open={!!editingJob}
          onOpenChange={(open) => !open && setEditingJob(null)}
          onSubmit={(values) => updateJob(accessToken, editingJob.id, values)}
          invalidateQueryKeys={[["myJobs"]]}
        />
      )}

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette offre ?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{pendingDelete?.title}&quot; sera définitivement
              supprimée, ainsi que les candidatures reçues. Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() =>
                pendingDelete && deleteMutation.mutate(pendingDelete.id)
              }
            >
              {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
