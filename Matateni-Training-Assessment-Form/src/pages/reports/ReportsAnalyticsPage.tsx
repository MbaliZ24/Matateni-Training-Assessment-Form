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

export function ReportsAnalyticsPage() {
  const forms = useAppStore((s) => s.forms);
  const totalFeedbackResponses = forms.reduce((sum, form) => sum + form.feedbackResponses, 0);
  const totalTrainees = forms.reduce((sum, form) => sum + form.trainees, 0);
  const scoredForms = forms.filter((form) => form.averageScore > 0);
  const averageScore =
    scoredForms.length === 0
      ? 0
      : scoredForms.reduce((sum, form) => sum + form.averageScore, 0) / scoredForms.length;
  const effectiveness = Math.round((averageScore / 5) * 100);
  const approvalRate = Math.round((forms.filter((f) => f.status === "Approved").length / forms.length) * 100 || 0);
  const responseRate = Math.round((totalFeedbackResponses / Math.max(1, totalTrainees)) * 100);
  const departmentPerformance = Array.from(
    forms.reduce((groups, form) => {
      const key = form.department || "Unassigned";
      const group = groups.get(key) ?? { score: 0, count: 0 };

      if (form.averageScore > 0) {
        group.score += form.averageScore;
        group.count += 1;
      }

      groups.set(key, group);
      return groups;
    }, new Map<string, { score: number; count: number }>())
  ).map(([department, group]) => ({
    department,
    value: group.count === 0 ? 0 : Math.round((group.score / group.count / 5) * 100)
  }));
  const monthlyTrend = Array.from(
    forms.reduce((groups, form) => {
      const month = (form.submittedAt ?? form.createdAt).slice(0, 7);
      groups.set(month, (groups.get(month) ?? 0) + 1);
      return groups;
    }, new Map<string, number>())
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7);
  const maxMonthlyCount = Math.max(1, ...monthlyTrend.map(([, count]) => count));

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-slate-500">Training effectiveness</p>
          <p className="text-3xl font-bold">{effectiveness}%</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Average score</p>
          <p className="text-3xl font-bold">{averageScore.toFixed(1)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Approval rate</p>
          <p className="text-3xl font-bold">{approvalRate}%</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Feedback response rate</p>
          <p className="text-3xl font-bold">{responseRate}%</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Department Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {departmentPerformance.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No department data yet.</p>
            ) : (
              departmentPerformance.map((row) => (
                <MetricBar key={row.department} label={row.department} value={row.value} />
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-52 items-end gap-3 rounded-xl bg-slate-50 p-4">
              {monthlyTrend.length === 0 ? (
                <p className="m-auto text-sm text-slate-500">No submitted forms yet.</p>
              ) : (
                monthlyTrend.map(([month, count]) => (
                  <div
                    key={month}
                    className="flex-1 rounded-t bg-slate-800"
                    title={`${month}: ${count}`}
                    style={{ height: `${Math.max(8, Math.round((count / maxMonthlyCount) * 100))}%` }}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
