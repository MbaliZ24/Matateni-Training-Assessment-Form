import { cn } from "../../lib/utils";
import type { Status } from "../../types";

const map: Record<Status, string> = {
  Draft: "bg-slate-100 text-slate-700",
  "Waiting for Feedback": "bg-blue-100 text-blue-700",
  Submitted: "bg-indigo-100 text-indigo-700",
  "Under Review": "bg-amber-100 text-amber-700",
  Approved: "bg-emerald-100 text-emerald-700",
  "Needs Correction": "bg-orange-100 text-orange-700",
  Rejected: "bg-red-100 text-red-700",
  Completed: "bg-violet-100 text-violet-700"
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold", map[status], className)}>{status}</span>;
}
