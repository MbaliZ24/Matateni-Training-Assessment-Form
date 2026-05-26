import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useAppStore } from "../../store/app-store";

function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-slate-900" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function SupervisorReportsPage() {
  const forms = useAppStore((s) => s.forms);
  const pending = forms.filter((f) => ["Submitted", "Under Review"].includes(f.status)).length;
  const approved = forms.filter((f) => f.status === "Approved").length;
  const needsCorrection = forms.filter((f) => f.status === "Needs Correction").length;
  const rejected = forms.filter((f) => f.status === "Rejected").length;
  const approvalRate = Math.round((approved / Math.max(1, forms.length)) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="text-sm text-slate-500">Supervisor reporting and review analytics.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-slate-500">Pending Reviews</p>
          <p className="text-3xl font-bold">{pending}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Approved</p>
          <p className="text-3xl font-bold">{approved}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Needs Correction</p>
          <p className="text-3xl font-bold">{needsCorrection}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Rejected</p>
          <p className="text-3xl font-bold">{rejected}</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Review Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <MetricBar label="Approval Rate" value={approvalRate} />
            <MetricBar label="Review Completion" value={Math.max(10, 100 - Math.min(90, pending * 10))} />
            <MetricBar label="Correction Turnaround" value={Math.max(20, 100 - needsCorrection * 8)} />
            <MetricBar label="Overall Quality" value={Math.max(30, approvalRate - rejected * 5)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-52 items-end gap-3 rounded-xl bg-slate-50 p-4">
              {[
                { label: "Pending", value: pending },
                { label: "Approved", value: approved },
                { label: "Correction", value: needsCorrection },
                { label: "Rejected", value: rejected }
              ].map((item) => {
                const pct = Math.max(10, Math.round((item.value / Math.max(1, forms.length)) * 100));
                return (
                  <div key={item.label} className="flex flex-1 flex-col items-center justify-end gap-2">
                    <div className="w-full rounded-t bg-slate-800" style={{ height: `${pct}%` }} />
                    <p className="text-[11px] text-slate-600">{item.label}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
