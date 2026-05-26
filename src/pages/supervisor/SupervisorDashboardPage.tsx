import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { StatusBadge } from "../../components/ui/status-badge";
import { useAppStore } from "../../store/app-store";

export function SupervisorDashboardPage() {
  const forms = useAppStore((s) => s.forms);
  const pending = forms.filter((f) => ["Submitted", "Under Review"].includes(f.status));

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-slate-500">Pending reviews</p>
          <p className="text-3xl font-bold">{pending.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Approved</p>
          <p className="text-3xl font-bold">{forms.filter((f) => f.status === "Approved").length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Rejected</p>
          <p className="text-3xl font-bold">{forms.filter((f) => f.status === "Rejected").length}</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Review Queue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {pending.map((f) => (
            <div key={f.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 p-3">
              <div>
                <p className="font-medium text-slate-800">{f.title}</p>
                <p className="text-xs text-slate-500">{f.department} - {f.date}</p>
              </div>
              <StatusBadge status={f.status} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
