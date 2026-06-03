import { useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  ShieldCheck,
  Users,
  UserCheck,
  XCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useAppStore } from "../../store/app-store";
import { isInStatuses, REVIEW_QUEUE_STATUSES, statusLabel } from "../../lib/form-status";

function pct(value: number, total: number) {
  return Math.round((value / Math.max(1, total)) * 100);
}

export function AdminDashboardPage() {
  const users = useAppStore((s) => s.users);
  const forms = useAppStore((s) => s.forms);

  const supervisors = useMemo(() => users.filter((u) => u.role === "supervisor"), [users]);
  const trainers = useMemo(() => users.filter((u) => u.role === "trainer"), [users]);

  const assignedForms = useMemo(() => forms.filter((f) => !!f.assignedSupervisorId), [forms]);
  const unassignedForms = useMemo(() => forms.filter((f) => !f.assignedSupervisorId), [forms]);
  const pendingReviewForms = useMemo(
    () => forms.filter((f) => isInStatuses(f.status, REVIEW_QUEUE_STATUSES)),
    [forms]
  );
  const signedOffForms = useMemo(() => forms.filter((f) => f.status === "COMPLETED"), [forms]);
  const needsCorrectionForms = useMemo(() => forms.filter((f) => f.status === "FOLLOWUPPENDING"), [forms]);

  const totalInvited = useMemo(() => forms.reduce((sum, form) => sum + form.trainees, 0), [forms]);
  const totalResponses = useMemo(() => forms.reduce((sum, form) => sum + form.feedbackResponses, 0), [forms]);
  const responseRate = pct(totalResponses, totalInvited);

  const trainerCoverage = useMemo(() => {
    const assignedTrainerCount = trainers.filter((t) => !!t.supervisorId).length;
    return {
      assigned: assignedTrainerCount,
      unassigned: Math.max(0, trainers.length - assignedTrainerCount),
      rate: pct(assignedTrainerCount, trainers.length)
    };
  }, [trainers]);

  const supervisorLoad = useMemo(() => {
    return supervisors
      .map((supervisor) => {
        const load = forms.filter((form) => form.assignedSupervisorId === supervisor.id).length;
        const pending = forms.filter(
          (form) => form.assignedSupervisorId === supervisor.id && isInStatuses(form.status, REVIEW_QUEUE_STATUSES)
        ).length;
        return {
          id: supervisor.id,
          name: supervisor.name || supervisor.email,
          department: supervisor.department,
          load,
          pending
        };
      })
      .sort((a, b) => b.pending - a.pending || b.load - a.load);
  }, [supervisors, forms]);

  const recentActivity = useMemo(() => {
    return [...forms]
      .sort((a, b) => (b.supervisorReview?.updatedAt ?? b.createdAt).localeCompare(a.supervisorReview?.updatedAt ?? a.createdAt))
      .slice(0, 8)
      .map((form) => ({
        id: form.id,
        title: form.title,
        status: form.status,
        when: (form.supervisorReview?.updatedAt ?? form.createdAt).slice(0, 10),
        by: form.supervisorReview?.submittedBy || form.submittedData?.trainerName || "System"
      }));
  }, [forms]);

  return (
    <div className="space-y-4">
      <header className="space-y-0.5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
        <p className="text-sm text-slate-500">Global oversight of assessments, routing, review workflow, and account readiness.</p>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-200 bg-gradient-to-b from-white to-slate-50/50 shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Platform Users</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{users.length}</p>
              <p className="text-xs text-slate-500">{trainers.length} trainers • {supervisors.length} supervisors</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
              <Users className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-gradient-to-b from-white to-slate-50/50 shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Forms</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{forms.length}</p>
              <p className="text-xs text-slate-500">{assignedForms.length} assigned • {unassignedForms.length} unassigned</p>
            </div>
            <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
              <ClipboardList className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-gradient-to-b from-white to-slate-50/50 shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pending Reviews</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{pendingReviewForms.length}</p>
              <p className="text-xs text-slate-500">Needs supervisor action</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
              <ShieldCheck className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-gradient-to-b from-white to-slate-50/50 shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Response Rate</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{responseRate}%</p>
              <p className="text-xs text-slate-500">{totalResponses} / {totalInvited} trainee responses</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
              <Activity className="size-5" />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.35fr_1fr]">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-1">
            <CardTitle>Supervisor Workload</CardTitle>
          </CardHeader>
          <CardContent>
            {supervisorLoad.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No supervisors configured.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="pb-2">Supervisor</th>
                      <th className="pb-2">Department</th>
                      <th className="pb-2">Assigned Forms</th>
                      <th className="pb-2">Pending</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supervisorLoad.map((row) => (
                      <tr key={row.id} className="border-b border-slate-100">
                        <td className="py-3 font-medium text-slate-900">{row.name}</td>
                        <td className="text-slate-700">{row.department}</td>
                        <td className="text-slate-700">{row.load}</td>
                        <td>
                          <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                            {row.pending}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-1">
            <CardTitle>Control Signals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <div className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center gap-2 text-slate-900">
                <UserCheck className="size-4 text-blue-600" />
                <p className="text-sm font-semibold">Trainer Supervisor Assignment</p>
              </div>
              <p className="mt-1 text-sm text-slate-700">{trainerCoverage.assigned} / {trainers.length} trainers mapped</p>
              <p className="text-xs text-slate-500">Coverage: {trainerCoverage.rate}%</p>
            </div>

            <div className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center gap-2 text-slate-900">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <p className="text-sm font-semibold">Signed-Off Forms</p>
              </div>
              <p className="mt-1 text-sm text-slate-700">{signedOffForms.length} approved forms completed</p>
            </div>

            <div className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center gap-2 text-slate-900">
                <AlertTriangle className="size-4 text-amber-600" />
                <p className="text-sm font-semibold">Needs Correction</p>
              </div>
              <p className="mt-1 text-sm text-slate-700">{forms.filter((f) => f.status === "FOLLOWUPPENDING").length} forms require trainer updates</p>
            </div>

            <div className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center gap-2 text-slate-900">
                <XCircle className="size-4 text-rose-600" />
                <p className="text-sm font-semibold">Needs Correction Forms</p>
              </div>
              <p className="mt-1 text-sm text-slate-700">{needsCorrectionForms.length} forms returned for correction</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-1">
            <CardTitle>Recent Platform Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No activity yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Form</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Actor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivity.map((event) => (
                      <tr key={event.id} className="border-b border-slate-100">
                        <td className="py-3 text-slate-700">{event.when}</td>
                        <td>
                          <p className="font-medium text-slate-900">{event.title}</p>
                          <p className="text-xs text-slate-500">{event.id}</p>
                        </td>
                        <td className="text-slate-700">{statusLabel(event.status)}</td>
                        <td className="text-slate-700">{event.by || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}


