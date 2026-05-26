import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useAppStore } from "../../store/app-store";

function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-slate-500"><span>{label}</span><span>{value}%</span></div>
      <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-slate-900" style={{ width: `${value}%` }} /></div>
    </div>
  );
}

export function ReportsAnalyticsPage() {
  const forms = useAppStore((s) => s.forms);
  const approvalRate = Math.round((forms.filter((f) => f.status === "Approved").length / forms.length) * 100 || 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-4">
        <Card className="p-4"><p className="text-xs text-slate-500">Training effectiveness</p><p className="text-3xl font-bold">87%</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Average score</p><p className="text-3xl font-bold">4.2</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Approval rate</p><p className="text-3xl font-bold">{approvalRate}%</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Feedback response rate</p><p className="text-3xl font-bold">81%</p></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Department Performance</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <MetricBar label="Operations" value={88} />
            <MetricBar label="Safety" value={92} />
            <MetricBar label="Compliance" value={79} />
            <MetricBar label="Engineering" value={84} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Monthly Trend</CardTitle></CardHeader>
          <CardContent>
            <div className="flex h-52 items-end gap-3 rounded-xl bg-slate-50 p-4">
              {[56, 64, 62, 72, 76, 84, 88].map((v, i) => <div key={i} className="flex-1 rounded-t bg-slate-800" style={{ height: `${v}%` }} />)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
