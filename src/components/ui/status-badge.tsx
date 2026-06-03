// Status badge mapping for backend-aligned workflow states.
import { cn } from "../../lib/utils";
import { statusLabel } from "../../lib/form-status";
import type { Status } from "../../types";

const map: Record<Status, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  OPENFORFEEDBACK: "bg-rose-100 text-rose-800",
  FEEDBACKCLOSED: "bg-violet-100 text-violet-800",
  TRAINERASSESSMENTPENDING: "bg-amber-100 text-amber-800",
  FOLLOWUPPENDING: "bg-orange-100 text-orange-700",
  COMPLETED: "bg-emerald-100 text-emerald-700"
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold", map[status], className)}>
      {statusLabel(status)}
    </span>
  );
}
