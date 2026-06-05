import { useMemo, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Clock3, Users } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { useAppStore } from "../../store/app-store";

export function SupervisorDashboardPage() {
  const forms = useAppStore((s) => s.forms);
  const currentUser = useAppStore((s) => s.currentUser);

  const assignedForms = useMemo(
    () => forms.filter((form) => form.assignedSupervisorId === currentUser?.id),
    [forms, currentUser?.id]
  );

  const pendingReviews = assignedForms.filter((form) => form.status === "TRAINERASSESSMENTPENDING");
  const returnedForms = assignedForms.filter((form) => form.status === "FOLLOWUPPENDING");
  const approvedForms = assignedForms.filter((form) => form.status === "COMPLETED");
  const totalResponses = assignedForms.reduce((sum, form) => sum + form.feedbackResponses, 0);

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Supervisor Dashboard</h1>
        <p className="text-sm text-slate-500">
          Quick overview of forms assigned to you. Open Review & Sign-Off to action pending, returned, or approved forms.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Pending review" value={pendingReviews.length} detail="Forms awaiting your action" icon={<Clock3 className="size-4 text-blue-600" />} />
        <SummaryCard label="Returned" value={returnedForms.length} detail="Sent back for trainer updates" icon={<AlertTriangle className="size-4 text-amber-600" />} />
        <SummaryCard label="Approved" value={approvedForms.length} detail="Completed sign-off records" icon={<CheckCircle2 className="size-4 text-emerald-600" />} />
        <SummaryCard label="Trainee responses" value={totalResponses} detail="Responses across assigned forms" icon={<Users className="size-4 text-violet-600" />} />
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  icon
}: {
  label: string;
  value: number;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <Card className="border-slate-200 bg-gradient-to-b from-white to-slate-50/50 shadow-sm">
      <CardContent className="space-y-2.5 p-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
          <div className="rounded-lg bg-slate-100 p-2">{icon}</div>
        </div>
        <div className="space-y-0.5">
          <p className="text-2xl font-semibold leading-none text-slate-900">{value}</p>
          <p className="text-[12px] text-slate-500">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}
