import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

function scoreClasses(score: number): string {
  if (score >= 70) {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400";
  }
  if (score >= 40) {
    return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400";
  }
  return "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300";
}

export function MatchScoreBadge({ score }: { score: number | null }) {
  if (score === null) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        scoreClasses(score),
      )}
      title="Score de correspondance avec les compétences requises"
    >
      <Sparkles className="size-3" />
      {score}%
    </span>
  );
}
