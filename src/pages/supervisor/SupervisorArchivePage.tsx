import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Eye, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useAppStore } from "../../store/app-store";
import { exportSignedFormPdf } from "../../lib/export";

function statusPill(status: string) {
  if (status === "Approved") return "bg-emerald-50 text-emerald-700";
  if (status === "Under Review" || status === "Submitted") return "bg-amber-50 text-amber-700";
  if (status === "Needs Correction") return "bg-rose-50 text-rose-700";
  if (status === "Rejected") return "bg-red-50 text-red-700";
  return "bg-slate-100 text-slate-700";
}

function statusLabel(status: string) {
  if (status === "Needs Correction") return "Returned";
  return status;
}

export function SupervisorArchivePage() {
  const navigate = useNavigate();
  const forms = useAppStore((s) => s.forms);
  const currentUser = useAppStore((s) => s.currentUser);
  const setSelectedReviewFormId = useAppStore((s) => s.setSelectedReviewFormId);

  const rows = useMemo(
    () =>
      forms
        .filter(
          (f) =>
            f.assignedSupervisorId === currentUser?.id &&
            ["Approved", "Needs Correction", "Rejected"].includes(f.status)
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    [forms, currentUser?.id]
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Forms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0">
          <div className="grid gap-2 lg:grid-cols-[1fr_auto]">
            <label className="relative block">
              <input
                type="text"
                placeholder="Search training or assessment..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm text-slate-700 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              />
              <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            </label>

            <button
              type="button"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <Download className="size-4" />
              Export
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold">Training</th>
                  <th className="px-5 py-3 text-left font-semibold">Date Conducted</th>
                  <th className="px-5 py-3 text-left font-semibold">Signed Date</th>
                  <th className="px-5 py-3 text-left font-semibold">Status</th>
                  <th className="px-5 py-3 text-left font-semibold">Signed By</th>
                  <th className="px-5 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((f) => (
                  <tr key={f.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">{f.title}</td>
                    <td className="px-5 py-3 text-slate-700">{f.date}</td>
                    <td className="px-5 py-3 text-slate-700">
                      {(f.supervisorReview?.submittedAt ?? f.supervisorReview?.updatedAt ?? f.submittedAt ?? f.createdAt).slice(0, 10)}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusPill(f.status)}`}>
                        {statusLabel(f.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-700">{f.supervisorReview?.submittedBy || "Supervisor"}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReviewFormId(f.id);
                            navigate(`/supervisor/review?formId=${encodeURIComponent(f.id)}`);
                          }}
                          className="inline-flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100"
                          title="View Signed Form"
                        >
                          <Eye className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => exportSignedFormPdf(f, { includeTraineeComments: true })}
                          className="inline-flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100"
                          title="Download PDF"
                        >
                          <Download className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
