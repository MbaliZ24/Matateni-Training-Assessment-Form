import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useAppStore } from "../../store/app-store";

export function AdminFeedbackPage() {
  const forms = useAppStore((s) => s.forms);

  const totals = useMemo(() => {
    const totalResponses = forms.reduce((sum, form) => sum + form.feedbackResponses, 0);
    const totalInvited = forms.reduce((sum, form) => sum + form.trainees, 0);
    const responseRate = totalInvited > 0 ? Math.round((totalResponses / totalInvited) * 100) : 0;
    const lowPerforming = forms.filter((form) => form.averageScore > 0 && form.averageScore < 3.5);
    return { totalResponses, totalInvited, responseRate, lowPerforming };
  }, [forms]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-slate-500">Responses Captured</p>
          <p className="text-3xl font-bold text-slate-900">{totals.totalResponses}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Response Rate</p>
          <p className="text-3xl font-bold text-slate-900">{totals.responseRate}%</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Low-score Trainings</p>
          <p className="text-3xl font-bold text-slate-900">{totals.lowPerforming.length}</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Feedback Improvement Watchlist</CardTitle>
        </CardHeader>
        <CardContent>
          {totals.lowPerforming.length === 0 ? (
            <p className="text-sm text-slate-500">No low-score trainings currently. Great quality trend.</p>
          ) : (
            <div className="space-y-2">
              {totals.lowPerforming.map((form) => (
                <div key={form.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="font-medium text-slate-900">{form.title}</p>
                  <p className="text-sm text-slate-600">
                    Avg rating: {form.averageScore.toFixed(1)} / 5 • Responses: {form.feedbackResponses}/{form.trainees}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

