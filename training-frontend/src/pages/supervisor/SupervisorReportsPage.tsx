import { useMemo } from "react";
import { AlertTriangle, BadgeCheck, BarChart3, CheckCircle2, Lightbulb, Target, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { statusLabel } from "../../lib/form-status";
import { useAppStore } from "../../store/app-store";

function pct(value: number, total: number) {
  return Math.round((value / Math.max(1, total)) * 100);
}

function kpiTrendColor(value: number) {
  if (value >= 75) return "text-emerald-600";
  if (value >= 50) return "text-amber-600";
  return "text-rose-600";
}

function monthKey(dateIso: string) {
  const d = new Date(`${dateIso}T00:00:00`);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export function SupervisorReportsPage() {
  const forms = useAppStore((s) => s.forms);
  const currentUser = useAppStore((s) => s.currentUser);
  const users = useAppStore((s) => s.users);

  const assignedForms = useMemo(
    () => forms.filter((f) => f.assignedSupervisorId === currentUser?.id),
    [forms, currentUser?.id]
  );

  const total = assignedForms.length;
  const approved = assignedForms.filter((f) => f.status === "COMPLETED").length;
  const needsCorrection = assignedForms.filter((f) => f.status === "FOLLOWUPPENDING").length;

  const totalInvited = assignedForms.reduce((acc, f) => acc + f.trainees, 0);
  const totalResponses = assignedForms.reduce((acc, f) => acc + f.feedbackResponses, 0);
  const responseRate = pct(totalResponses, totalInvited);
  const approvalRate = pct(approved, total);
  const avgRating =
    assignedForms.length > 0
      ? (assignedForms.reduce((acc, f) => acc + f.averageScore, 0) / Math.max(1, assignedForms.length)).toFixed(1)
      : "0.0";

  const monthly = useMemo(() => {
    const grouped = new Map<string, { forms: number; approved: number; responses: number; invited: number }>();

    assignedForms.forEach((f) => {
      const key = monthKey(f.date);
      if (!grouped.has(key)) grouped.set(key, { forms: 0, approved: 0, responses: 0, invited: 0 });
      const row = grouped.get(key)!;
      row.forms += 1;
      row.responses += f.feedbackResponses;
      row.invited += f.trainees;
      if (f.status === "COMPLETED") row.approved += 1;
    });

    const keys = Array.from(grouped.keys()).sort();
    return keys.slice(-6).map((k) => {
      const row = grouped.get(k)!;
      return {
        key: k,
        label: monthLabel(k),
        forms: row.forms,
        approvedRate: pct(row.approved, row.forms),
        responseRate: pct(row.responses, row.invited)
      };
    });
  }, [assignedForms]);

  const performanceRows = useMemo(() => {
    return [...assignedForms]
      .map((f) => ({
        id: f.id,
        title: f.title,
        trainer: users.find((u) => u.id === f.trainerId)?.name ?? "Unknown Trainer",
        department: f.department,
        date: f.date,
        invited: f.trainees,
        responses: f.feedbackResponses,
        responseRate: pct(f.feedbackResponses, f.trainees),
        averageScore: f.averageScore,
        status: f.status
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [assignedForms, users]);

  const focusAreaAverages = useMemo(() => {
    const labels = [
      "Objective clarity",
      "Role relevance",
      "Trainer delivery",
      "Pace and duration",
      "Practical examples",
      "Workplace application"
    ];
    const totals = labels.map(() => ({ total: 0, count: 0 }));

    assignedForms.forEach((form) => {
      (form.supervisorOnlyFeedback ?? []).forEach((feedback) => {
        (feedback.statementRatings ?? []).forEach((score, idx) => {
          if (typeof score === "number" && totals[idx]) {
            totals[idx].total += score;
            totals[idx].count += 1;
          }
        });
      });
    });

    return labels
      .map((label, idx) => ({
        label,
        average: totals[idx].count > 0 ? Number((totals[idx].total / totals[idx].count).toFixed(2)) : null
      }))
      .filter((x) => x.average !== null) as { label: string; average: number }[];
  }, [assignedForms]);

  const strongestTrainings = useMemo(() => {
    return [...assignedForms]
      .map((form) => {
        const rr = pct(form.feedbackResponses, form.trainees);
        const qualityIndex = Number((form.averageScore * 0.7 + (rr / 100) * 5 * 0.3).toFixed(2));
        return {
          id: form.id,
          title: form.title,
          trainer: users.find((u) => u.id === form.trainerId)?.name ?? "Unknown Trainer",
          qualityIndex,
          averageScore: form.averageScore,
          responseRate: rr
        };
      })
      .sort((a, b) => b.qualityIndex - a.qualityIndex)
      .slice(0, 3);
  }, [assignedForms, users]);

  const atRiskTrainings = useMemo(() => {
    return [...assignedForms]
      .map((form) => {
        const rr = pct(form.feedbackResponses, form.trainees);
        const riskPoints =
          (form.averageScore < 4 ? 2 : 0) +
          (rr < 60 ? 2 : rr < 75 ? 1 : 0) +
          (form.status === "FOLLOWUPPENDING" ? 3 : 0);
        return {
          id: form.id,
          title: form.title,
          trainer: users.find((u) => u.id === form.trainerId)?.name ?? "Unknown Trainer",
          riskPoints,
          averageScore: form.averageScore,
          responseRate: rr,
          status: form.status
        };
      })
      .filter((f) => f.riskPoints > 0)
      .sort((a, b) => b.riskPoints - a.riskPoints)
      .slice(0, 3);
  }, [assignedForms, users]);

  const trainerCoachingPriorities = useMemo(() => {
    const byTrainer = new Map<string, { name: string; forms: number; avg: number; corrections: number; responses: number; invited: number }>();
    assignedForms.forEach((form) => {
      const id = form.trainerId;
      const name = users.find((u) => u.id === id)?.name ?? "Unknown Trainer";
      if (!byTrainer.has(id)) byTrainer.set(id, { name, forms: 0, avg: 0, corrections: 0, responses: 0, invited: 0 });
      const row = byTrainer.get(id)!;
      row.forms += 1;
      row.avg += form.averageScore;
      if (["FOLLOWUPPENDING"].includes(form.status)) row.corrections += 1;
      row.responses += form.feedbackResponses;
      row.invited += form.trainees;
    });

    return Array.from(byTrainer.values())
      .map((row) => ({
        name: row.name,
        forms: row.forms,
        avgScore: Number((row.avg / Math.max(1, row.forms)).toFixed(1)),
        correctionRate: pct(row.corrections, row.forms),
        responseRate: pct(row.responses, row.invited)
      }))
      .sort((a, b) => (b.correctionRate * 0.6 + (100 - b.responseRate) * 0.4) - (a.correctionRate * 0.6 + (100 - a.responseRate) * 0.4))
      .slice(0, 4);
  }, [assignedForms, users]);

  const maxForms = Math.max(1, ...monthly.map((m) => m.forms));

  return (
    <div className="space-y-4">
      <header className="space-y-0.5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reports</h1>
        <p className="text-sm text-slate-500">Supervisor analytics for review quality, response performance, and training outcomes.</p>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-200">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Forms</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{total}</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600"><BarChart3 className="size-5" /></div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Approval Rate</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{approvalRate}%</p>
              <p className={`text-xs font-medium ${kpiTrendColor(approvalRate)}`}>Quality gate health</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600"><BadgeCheck className="size-5" /></div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Response Rate</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{responseRate}%</p>
              <p className="text-xs text-slate-500">{totalResponses} / {totalInvited} responses</p>
            </div>
            <div className="rounded-xl bg-violet-50 p-2.5 text-violet-600"><TrendingUp className="size-5" /></div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Average Rating</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{avgRating} / 5</p>
              <p className={`text-xs font-medium ${kpiTrendColor(Math.round((Number(avgRating) / 5) * 100))}`}>Learner sentiment</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600"><CheckCircle2 className="size-5" /></div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3 md:grid-cols-[1.35fr_1fr]">
        <Card className="border-slate-200">
          <CardHeader className="pb-1">
            <CardTitle>Monthly Review Trend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              {monthly.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">No monthly data available yet.</p>
              ) : (
                <div className="grid grid-cols-6 items-end gap-2">
                  {monthly.map((m) => (
                    <div key={m.key} className="flex min-w-0 flex-col items-center gap-2">
                      <div className="flex h-28 w-full max-w-[72px] items-end rounded-md bg-white p-1">
                        <div
                          className="w-full rounded-sm bg-slate-900"
                          style={{ height: `${Math.max(12, (m.forms / maxForms) * 100)}%` }}
                          title={`${m.forms} forms`}
                        />
                      </div>
                      <p className="text-[11px] font-medium text-slate-700">{m.label}</p>
                      <p className="text-[10px] text-slate-500">{m.approvedRate}% approved</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              {monthly.slice(-3).map((m) => (
                <div key={`${m.key}-meta`} className="rounded-lg border border-slate-100 bg-white p-2.5 text-xs">
                  <p className="font-semibold text-slate-800">{m.label}</p>
                  <div className="mt-1 space-y-0.5 text-slate-600">
                    <p>Forms: {m.forms}</p>
                    <p>Approved: {m.approvedRate}%</p>
                    <p>Responses: {m.responseRate}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-1">
            <CardTitle>Review Funnel Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              <div className="grid gap-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Total Submitted</span>
                  <span className="font-semibold text-slate-800">{total}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200">
                  <div className="h-2 rounded-full bg-slate-900" style={{ width: "100%" }} />
                </div>

                <div className="mt-1 flex items-center justify-between text-slate-600">
                  <span>Reviewed (Signed Off + Needs Correction)</span>
                  <span className="font-semibold text-slate-800">{approved + needsCorrection}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-blue-600"
                    style={{ width: `${pct(approved + needsCorrection, total)}%` }}
                  />
                </div>

                <div className="mt-1 flex items-center justify-between text-slate-600">
                  <span>Signed Off</span>
                  <span className="font-semibold text-slate-800">{approved}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200">
                  <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${pct(approved, total)}%` }} />
                </div>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-100 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Throughput</p>
                <p className="mt-1 text-xl font-bold text-slate-900">{pct(approved + needsCorrection, total)}%</p>
                <p className="text-xs text-slate-500">of forms have completed review cycle</p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Approval Yield</p>
                <p className="mt-1 text-xl font-bold text-slate-900">{pct(approved, approved + needsCorrection)}%</p>
                <p className="text-xs text-slate-500">signed off out of reviewed forms</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3">
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle>Training Performance Table</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Training</th>
                    <th className="px-4 py-3 font-semibold">Trainer</th>
                    <th className="px-4 py-3 font-semibold">Department</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Invited</th>
                    <th className="px-4 py-3 font-semibold">Responses</th>
                    <th className="px-4 py-3 font-semibold">Response Rate</th>
                    <th className="px-4 py-3 font-semibold">Rating</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceRows.map((t) => (
                    <tr key={t.id} className="border-t border-slate-100">
                      <td className="px-4 py-2.5 font-medium text-slate-800">{t.title}</td>
                      <td className="px-4 py-2.5 text-slate-700">{t.trainer}</td>
                      <td className="px-4 py-2.5 text-slate-700">{t.department}</td>
                      <td className="px-4 py-2.5 text-slate-700">{t.date}</td>
                      <td className="px-4 py-2.5 text-slate-700">{t.invited}</td>
                      <td className="px-4 py-2.5 text-slate-700">{t.responses}</td>
                      <td className="px-4 py-2.5 text-slate-700">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 rounded-full bg-slate-100">
                            <div
                              className={`h-2 rounded-full ${t.responseRate >= 75 ? "bg-emerald-500" : t.responseRate >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
                              style={{ width: `${Math.max(4, t.responseRate)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{t.responseRate}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">
                        <span className="inline-flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="size-3.5 text-amber-500" />
                          {t.averageScore.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            t.status === "COMPLETED"
                              ? "bg-emerald-100 text-emerald-700"
                              : t.status === "FOLLOWUPPENDING"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {statusLabel(t.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {performanceRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-sm text-slate-500">No training records available.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.15fr_1fr]">
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle>Improvement Intelligence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <p className="mb-2 inline-flex items-center gap-2 font-semibold text-emerald-800">
                <CheckCircle2 className="size-4" /> Strongest Training Results
              </p>
              <div className="space-y-1.5">
                {strongestTrainings.length === 0 ? (
                  <p className="text-emerald-700">No completed training results are available yet.</p>
                ) : (
                  strongestTrainings.map((t) => (
                    <p key={t.id} className="text-emerald-800">
                      <span className="font-semibold">{t.title}</span> - {t.trainer} - {t.averageScore.toFixed(1)}/5 average rating - {t.responseRate}% response rate
                    </p>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="mb-2 inline-flex items-center gap-2 font-semibold text-amber-800">
                <AlertTriangle className="size-4" /> Trainings Requiring Attention
              </p>
              <div className="space-y-1.5">
                {atRiskTrainings.length === 0 ? (
                  <p className="text-amber-700">No training records currently meet the attention threshold.</p>
                ) : (
                  atRiskTrainings.map((t) => (
                    <p key={t.id} className="text-amber-800">
                      <span className="font-semibold">{t.title}</span> - {t.trainer} - risk score {t.riskPoints} - {statusLabel(t.status)}
                    </p>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="mb-2 inline-flex items-center gap-2 font-semibold text-slate-800">
                <Lightbulb className="size-4" /> Lowest-Rated Feedback Areas
              </p>
              <div className="space-y-2">
                {focusAreaAverages.length === 0 ? (
                  <p className="text-sm text-slate-500">No trainee feedback is available yet to identify weak areas.</p>
                ) : (
                  [...focusAreaAverages].sort((a, b) => a.average - b.average).slice(0, 3).map((area) => {
                  const score = area.average;
                  const scorePct = Math.round((score / 5) * 100);
                  return (
                    <div key={area.label}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700">{area.label}</span>
                        <span className={kpiTrendColor(scorePct)}>{score.toFixed(1)} / 5</span>
                      </div>
                      <div className="h-2 rounded-full bg-white">
                        <div
                          className={`h-2 rounded-full ${scorePct >= 75 ? "bg-emerald-500" : scorePct >= 60 ? "bg-amber-500" : "bg-rose-500"}`}
                          style={{ width: `${Math.max(8, scorePct)}%` }}
                        />
                      </div>
                    </div>
                  );
                }))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle>Trainer Coaching Priorities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-sm">
            {trainerCoachingPriorities.length === 0 ? (
              <p className="text-slate-500">No trainer-level performance data is available yet.</p>
            ) : (
              trainerCoachingPriorities.map((trainer) => (
                <div key={trainer.name} className="rounded-lg border border-slate-100 p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="font-semibold text-slate-800">{trainer.name}</p>
                    <span className="text-xs text-slate-500">{trainer.forms} forms</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-slate-500">Avg Score</p>
                      <p className="font-semibold text-slate-700">{trainer.avgScore}/5</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Correction Rate</p>
                      <p className={kpiTrendColor(100 - trainer.correctionRate)}>{trainer.correctionRate}%</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Response Rate</p>
                      <p className={kpiTrendColor(trainer.responseRate)}>{trainer.responseRate}%</p>
                    </div>
                  </div>
                </div>
              ))
            )}

            {trainerCoachingPriorities.length > 0 ? (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-xs">
                <p className="mb-1 inline-flex items-center gap-1.5 font-semibold text-indigo-800">
                  <Target className="size-3.5" /> Current highest-priority coaching candidate
                </p>
                <p className="text-indigo-700">
                  {trainerCoachingPriorities[0].name} currently has the highest combined correction-pressure and response-risk profile based on recorded forms.
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}


