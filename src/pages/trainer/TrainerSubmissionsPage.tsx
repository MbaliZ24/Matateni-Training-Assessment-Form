import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { StatusBadge } from "../../components/ui/status-badge";
import { useAppStore } from "../../store/app-store";
import { exportSignedFormPdf } from "../../lib/export";

export function TrainerSubmissionsPage() {
  const navigate = useNavigate();
  const forms = useAppStore((s) => s.forms);
  const users = useAppStore((s) => s.users);
  const currentUser = useAppStore((s) => s.currentUser);

  const mySubmissions = useMemo(
    () =>
      forms
        .filter(
          (f) =>
            f.trainerId === currentUser?.id &&
            ["Submitted", "Under Review", "Approved", "Needs Correction", "Rejected", "Completed"].includes(f.status)
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [forms, currentUser?.id]
  );

  const supervisorName = (supervisorId?: string) =>
    users.find((u) => u.id === supervisorId)?.name ||
    users.find((u) => u.id === supervisorId)?.email ||
    "Not assigned";

  return (
    <div className="mx-auto max-w-[980px] space-y-3">
      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-slate-900">My Submissions</CardTitle>
          <p className="text-xs text-slate-500">Proof of submitted training assessments.</p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Form ID</th>
                  <th className="px-4 py-3 font-semibold">Training</th>
                  <th className="px-4 py-3 font-semibold">Submitted</th>
                  <th className="px-4 py-3 font-semibold">Supervisor</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mySubmissions.map((form) => (
                  <tr key={form.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-700">{form.id}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-800">{form.title}</td>
                    <td className="px-4 py-2.5 text-slate-700">{form.createdAt}</td>
                    <td className="px-4 py-2.5 text-slate-700">{supervisorName(form.assignedSupervisorId)}</td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={form.status} />
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/trainer/submissions/view?formId=${encodeURIComponent(form.id)}`)}
                          className="inline-flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100"
                          title="View details"
                          aria-label="View details"
                        >
                          <Eye className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => exportSignedFormPdf(form, { includeTraineeComments: false })}
                          className="inline-flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100"
                          title="Download PDF"
                          aria-label="Download PDF"
                        >
                          <Download className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {mySubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                      No submissions yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
