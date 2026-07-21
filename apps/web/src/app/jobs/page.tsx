"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listJobs, type JobFilters } from "@/features/jobs/api";

export default function JobsPage() {
  const [filters, setFilters] = useState<JobFilters>({});
  const [draft, setDraft] = useState<JobFilters>({});

  const query = useQuery({
    queryKey: ["jobs", filters],
    queryFn: () => listJobs(filters),
  });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Offres</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setFilters(draft);
        }}
        className="flex flex-wrap gap-2"
      >
        <Input
          placeholder="Mot-clé"
          value={draft.keyword ?? ""}
          onChange={(e) => setDraft((f) => ({ ...f, keyword: e.target.value }))}
          className="max-w-40"
        />
        <Input
          placeholder="Localisation"
          value={draft.location ?? ""}
          onChange={(e) => setDraft((f) => ({ ...f, location: e.target.value }))}
          className="max-w-40"
        />
        <Input
          placeholder="Type de contrat"
          value={draft.contractType ?? ""}
          onChange={(e) => setDraft((f) => ({ ...f, contractType: e.target.value }))}
          className="max-w-40"
        />
        <Button type="submit" variant="outline">
          Rechercher
        </Button>
      </form>

      <div className="flex flex-col gap-3">
        {query.isLoading && <p className="text-muted-foreground text-sm">Chargement...</p>}
        {query.data?.length === 0 && (
          <p className="text-muted-foreground text-sm">Aucune offre trouvée.</p>
        )}
        {query.data?.map((job) => (
          <Link key={job.id} href={`/jobs/${job.id}`}>
            <Card className="hover:bg-muted/50 transition-colors">
              <CardHeader>
                <CardTitle className="text-base">{job.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                {job.companyProfile.name} · {job.location} · {job.contractType}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
