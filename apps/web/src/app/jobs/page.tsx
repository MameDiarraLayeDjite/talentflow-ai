"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Loader2, MapPin, Search, SearchX } from "lucide-react";
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Offres</h1>
        <p className="text-muted-foreground text-sm">
          {query.data
            ? `${query.data.length} offre${query.data.length > 1 ? "s" : ""} disponible${query.data.length > 1 ? "s" : ""}`
            : "Parcours les offres publiées"}
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setFilters(draft);
        }}
        className="flex flex-wrap gap-2"
      >
        <div className="relative min-w-48 flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            placeholder="Mot-clé"
            value={draft.keyword ?? ""}
            onChange={(e) =>
              setDraft((f) => ({ ...f, keyword: e.target.value }))
            }
            className="pl-8"
          />
        </div>
        <Input
          placeholder="Localisation"
          value={draft.location ?? ""}
          onChange={(e) =>
            setDraft((f) => ({ ...f, location: e.target.value }))
          }
          className="max-w-40"
        />
        <Input
          placeholder="Type de contrat"
          value={draft.contractType ?? ""}
          onChange={(e) =>
            setDraft((f) => ({ ...f, contractType: e.target.value }))
          }
          className="max-w-40"
        />
        <Button type="submit" variant="outline">
          Rechercher
        </Button>
      </form>

      <div className="flex flex-col gap-3">
        {query.isLoading && (
          <div className="text-muted-foreground flex items-center gap-2 py-12 text-sm justify-center">
            <Loader2 className="size-4 animate-spin" />
            Chargement...
          </div>
        )}
        {query.data?.length === 0 && (
          <div className="text-muted-foreground flex flex-col items-center gap-2 py-12 text-sm">
            <SearchX className="size-6" />
            Aucune offre ne correspond à ta recherche.
          </div>
        )}
        {query.data?.map((job) => (
          <Link key={job.id} href={`/jobs/${job.id}`}>
            <Card className="hover:bg-muted/50 transition-colors">
              <CardHeader>
                <CardTitle className="text-base">{job.title}</CardTitle>
                <p className="text-muted-foreground text-sm">
                  {job.companyProfile.name}
                </p>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {job.location}
                </span>
                <span className="text-muted-foreground flex items-center gap-1">
                  <Briefcase className="size-3.5" />
                  {job.contractType}
                </span>
                {job.requiredSkills.slice(0, 4).map((skill) => (
                  <span
                    key={skill}
                    className="bg-muted rounded-full px-2.5 py-0.5 text-xs"
                  >
                    {skill}
                  </span>
                ))}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
