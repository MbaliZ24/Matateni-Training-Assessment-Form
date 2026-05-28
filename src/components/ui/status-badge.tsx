// Status badge mapping for workflow states (draft -> completed).
import { cn } from "../../lib/utils";
import type { Status } from "../../types";

const map: Record<Status, string> = {
  Draft: "bg-slate-100 text-slate-700",
  "Waiting for Feedback": "bg-rose-100 text-rose-800",
  Submitted: "bg-slate-200 text-slate-800",
  "Under Review": "bg-amber-100 text-amber-800",
  Approved: "bg-emerald-100 text-emerald-700",
  "Needs Correction": "bg-orange-100 text-orange-700",
  Completed: "bg-rose-50 text-rose-900"
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold", map[status], className)}>{status}</span>;
}


