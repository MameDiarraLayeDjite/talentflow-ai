import { cn } from "@/lib/utils";
import type { ApplicationStatus } from "@talentflow/types";

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  RECEIVED: "Reçue",
  IN_REVIEW: "En revue",
  INTERVIEW: "Entretien",
  REJECTED: "Refusée",
  ACCEPTED: "Acceptée",
};

const STATUS_CLASSES: Record<ApplicationStatus, string> = {
  RECEIVED: "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
  IN_REVIEW: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  INTERVIEW:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  ACCEPTED:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
};

export function ApplicationStatusBadge({
  status,
}: {
  status: ApplicationStatus;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_CLASSES[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
