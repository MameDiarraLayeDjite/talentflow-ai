"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Search,
  SearchX,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { CompanyAvatar } from "@/components/company-avatar";
import { cn } from "@/lib/utils";
import { relativeTime } from "@/lib/relative-time";
import { listJobs, type JobFilters, type JobWithCompany } from "@/features/jobs/api";
import { JobDetailContent } from "@/features/jobs/job-detail-content";

const CONTRACT_SHORTCUTS = ["CDI", "CDD", "Stage", "Freelance"];
const NEW_THRESHOLD_MS = 48 * 60 * 60 * 1000;
const PAGE_SIZE = 8;

function isNew(job: JobWithCompany) {
  return Date.now() - Date.parse(job.createdAt) < NEW_THRESHOLD_MS;
}

export default function JobsPage() {
  return (
    <Suspense fallback={null}>
      <JobsPageContent />
    </Suspense>
  );
}

function JobsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<JobFilters>({});
  const [draft, setDraft] = useState<JobFilters>({});
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(
    searchParams.get("job"),
  );

  const query = useQuery({
    queryKey: ["jobs", filters, page],
    queryFn: () => listJobs({ ...filters, page, limit: PAGE_SIZE }),
  });

  const jobs = query.data?.items ?? [];
  const effectiveSelectedId = selectedId ?? jobs[0]?.id ?? null;
  const selectedJob = jobs.find((j) => j.id === effectiveSelectedId);

  const applyFilters = (next: JobFilters) => {
    setFilters(next);
    setPage(1);
    setSelectedId(null);
  };

  const toggleContract = (value: string) => {
    const next = draft.contractType === value ? undefined : value;
    const nextDraft = { ...draft, contractType: next };
    setDraft(nextDraft);
    applyFilters(nextDraft);
  };

  const selectJob = (job: JobWithCompany) => {
    setSelectedId(job.id);
    router.replace(`/jobs?job=${job.id}`, { scroll: false });
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Offres</h1>
        <p className="text-muted-foreground text-sm">
          {query.data
            ? `${query.data.total} offre${query.data.total > 1 ? "s" : ""} disponible${query.data.total > 1 ? "s" : ""}`
            : "Parcours les offres publiées"}
        </p>
      </div>

      <Card className="gap-3 p-4 shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyFilters(draft);
          }}
          className="flex flex-wrap gap-2"
        >
          <div className="relative min-w-48 flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              placeholder="Titre, compétence..."
              value={draft.keyword ?? ""}
              onChange={(e) =>
                setDraft((f) => ({ ...f, keyword: e.target.value }))
              }
              className="pl-8"
            />
          </div>
          <div className="relative min-w-40">
            <MapPin className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              placeholder="Localisation"
              value={draft.location ?? ""}
              onChange={(e) =>
                setDraft((f) => ({ ...f, location: e.target.value }))
              }
              className="pl-8"
            />
          </div>
          <Button type="submit">Rechercher</Button>
        </form>

        <div className="flex flex-wrap gap-1.5">
          {CONTRACT_SHORTCUTS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => toggleContract(option)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                draft.contractType === option
                  ? "border-primary bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </Card>

      {query.isLoading && (
        <div className="text-muted-foreground flex items-center justify-center gap-2 py-12 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Chargement...
        </div>
      )}
      {query.data && jobs.length === 0 && (
        <div className="text-muted-foreground flex flex-col items-center gap-2 py-12 text-sm">
          <SearchX className="size-6" />
          Aucune offre ne correspond à ta recherche.
        </div>
      )}

      {jobs.length > 0 && (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="flex w-full flex-col gap-3 lg:max-w-md">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                onClick={(e) => {
                  if (window.matchMedia("(min-width: 1024px)").matches) {
                    e.preventDefault();
                    selectJob(job);
                  }
                }}
              >
                <Card
                  className={cn(
                    "gap-0 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
                    effectiveSelectedId === job.id &&
                      "lg:ring-primary lg:ring-2",
                  )}
                >
                  <div className="flex gap-3">
                    <CompanyAvatar name={job.companyProfile.name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="truncate font-medium">{job.title}</h2>
                        <span className="text-muted-foreground shrink-0 text-xs">
                          {relativeTime(job.createdAt)}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {job.companyProfile.name}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <MapPin className="size-3.5" />
                          {job.location}
                        </span>
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Briefcase className="size-3.5" />
                          {job.contractType}
                        </span>
                        {isNew(job) && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                            <Sparkles className="size-3" />
                            Nouveau
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
                        {job.description}
                      </p>
                      {job.requiredSkills.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {job.requiredSkills.slice(0, 4).map((skill) => (
                            <span
                              key={skill}
                              className="bg-muted rounded-full px-2.5 py-0.5 text-xs"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}

            {query.data && query.data.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
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
          </div>

          <div className="hidden flex-1 lg:block">
            <Card className="sticky top-6 p-6 shadow-sm">
              {selectedJob ? (
                <JobDetailContent job={selectedJob} />
              ) : (
                <p className="text-muted-foreground py-12 text-center text-sm">
                  Sélectionne une offre pour voir le détail.
                </p>
              )}
            </Card>
          </div>
        </div>
      )}
    </main>
  );
}
