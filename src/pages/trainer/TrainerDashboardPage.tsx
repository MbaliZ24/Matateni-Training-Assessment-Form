import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { StatusBadge } from "../../components/ui/status-badge";
import { Button } from "../../components/ui/button";
import { useAppStore } from "../../store/app-store";
import { Link } from "react-router-dom";

export function TrainerDashboardPage() {
  const user = useAppStore((s) => s.currentUser);
  const forms = useAppStore((s) => s.forms).filter((f) => f.trainerId === user?.id);

  const stat = (label: string, count: number) => (
    <Card className="p-4"><p className="text-xs uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-3xl font-bold text-slate-900">{count}</p></Card>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stat("Draft forms", forms.filter((f) => f.status === "Draft").length)}
        {stat("Waiting feedback", forms.filter((f) => f.status === "Waiting for Feedback").length)}
        {stat("Submitted", forms.filter((f) => f.status === "Submitted").length)}
        {stat("Approved", forms.filter((f) => f.status === "Approved").length)}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between"><CardTitle>Quick actions</CardTitle><Link to="/trainer/create"><Button>Create New Assessment</Button></Link></CardHeader>
        <CardContent className="flex flex-wrap gap-2"><Button variant="secondary">Upload Trainee List</Button><Button variant="outline">Export Recent Forms</Button><Button variant="outline">View Feedback Summary</Button></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent Trainings</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead><tr className="border-b text-left text-slate-500"><th className="pb-2">Form</th><th className="pb-2">Department</th><th className="pb-2">Date</th><th className="pb-2">Feedback</th><th className="pb-2">Avg Score</th><th className="pb-2">Status</th></tr></thead>
              <tbody>
                {forms.map((f) => (
                  <tr key={f.id} className="border-b border-slate-100"><td className="py-3 font-medium text-slate-800">{f.title}</td><td className="py-3">{f.department}</td><td className="py-3">{f.date}</td><td className="py-3">{f.feedbackResponses}/{f.trainees}</td><td className="py-3">{f.averageScore.toFixed(1)}</td><td className="py-3"><StatusBadge status={f.status} /></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Feedback Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Average response rate</p><p className="text-2xl font-bold">82%</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Overall satisfaction</p><p className="text-2xl font-bold">4.3/5</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Common issue</p><p className="text-2xl font-bold">Pace</p></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
