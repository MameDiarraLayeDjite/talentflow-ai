"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCompanyStats } from "./stats-api";
import type { ApplicationStatus } from "@talentflow/types";

const STATUS_ORDER: ApplicationStatus[] = [
  "RECEIVED",
  "IN_REVIEW",
  "INTERVIEW",
  "REJECTED",
  "ACCEPTED",
];

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  RECEIVED: "Reçue",
  IN_REVIEW: "En revue",
  INTERVIEW: "Entretien",
  REJECTED: "Refusée",
  ACCEPTED: "Acceptée",
};

// Validated categorical palette (light mode) — see dataviz skill.
// RECEIVED uses an intentional low-chroma neutral (a "not yet acted on" state);
// the other four are the skill's blue/amber/red/green slots, all-pairs validated.
const STATUS_COLOR: Record<ApplicationStatus, string> = {
  RECEIVED: "#64748b",
  IN_REVIEW: "#2a78d6",
  INTERVIEW: "#eda100",
  REJECTED: "#e34948",
  ACCEPTED: "#1baf7a",
};

const TREND_COLOR = "#2a78d6";

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
});

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <Card className="gap-1 p-4 shadow-sm">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
    </Card>
  );
}

function StatusBarChart({
  byStatus,
}: {
  byStatus: Record<ApplicationStatus, number>;
}) {
  const max = Math.max(1, ...STATUS_ORDER.map((s) => byStatus[s]));

  return (
    <div className="flex flex-col gap-3">
      {STATUS_ORDER.map((status) => {
        const count = byStatus[status];
        const pct = (count / max) * 100;
        return (
          <div key={status} className="flex items-center gap-3">
            <span className="text-muted-foreground w-20 shrink-0 text-sm">
              {STATUS_LABEL[status]}
            </span>
            <div className="h-2.5 flex-1 overflow-hidden">
              <div
                className="h-2.5 transition-all"
                style={{
                  width: `${Math.max(pct, count > 0 ? 2 : 0)}%`,
                  backgroundColor: STATUS_COLOR[status],
                  borderRadius: "0 4px 4px 0",
                }}
                title={`${STATUS_LABEL[status]} : ${count}`}
              />
            </div>
            <span className="w-6 shrink-0 text-right text-sm tabular-nums">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TrendChart({
  data,
}: {
  data: { date: string; count: number }[];
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const labelEvery = Math.ceil(data.length / 5);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-24 items-end gap-1">
        {data.map((d) => (
          <div
            key={d.date}
            className="flex h-full flex-1 flex-col items-center justify-end"
          >
            <div
              className="w-full max-w-4 rounded-t-sm"
              style={{
                height: `${Math.max((d.count / max) * 100, d.count > 0 ? 4 : 1)}%`,
                backgroundColor: d.count > 0 ? TREND_COLOR : "#e1e0d9",
              }}
              title={`${d.date} : ${d.count} candidature${d.count > 1 ? "s" : ""}`}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1">
        {data.map((d, i) => (
          <div key={d.date} className="flex-1 text-center">
            {i % labelEvery === 0 && (
              <span className="text-muted-foreground text-[10px]">
                {WEEKDAY_FORMATTER.format(new Date(d.date))}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CompanyStats({ accessToken }: { accessToken: string }) {
  const query = useQuery({
    queryKey: ["companyStats"],
    queryFn: () => getCompanyStats(accessToken),
  });

  if (query.isLoading) {
    return (
      <div className="text-muted-foreground flex items-center justify-center gap-2 py-12 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Chargement des statistiques...
      </div>
    );
  }

  if (!query.data || query.data.jobs.total === 0) {
    return (
      <p className="text-muted-foreground py-4 text-sm">
        Publie ta première offre pour voir apparaître tes statistiques ici.
      </p>
    );
  }

  const { jobs, applications, applicationsByDay } = query.data;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Offres publiées" value={jobs.published} />
        <StatTile label="Offres au total" value={jobs.total} />
        <StatTile label="Candidatures reçues" value={applications.total} />
      </div>

      {applications.total === 0 ? (
        <p className="text-muted-foreground text-sm">
          Aucune candidature reçue pour l&apos;instant.
        </p>
      ) : (
        <>
          <Card className="p-4 shadow-sm">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-sm font-medium">
                Candidatures par statut
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <StatusBarChart byStatus={applications.byStatus} />
            </CardContent>
          </Card>

          <Card className="p-4 shadow-sm">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-sm font-medium">
                Candidatures des 14 derniers jours
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <TrendChart data={applicationsByDay} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
