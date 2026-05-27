import { useEffect, useMemo, useState } from "react";
import { Download, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useAppStore } from "../../store/app-store";
import { cn } from "../../lib/utils";
import { exportCsvRows, exportSignedFormPdf } from "../../lib/export";

export function TrainerFeedbackPage() {
  const forms = useAppStore((s) => s.forms);
  const users = useAppStore((s) => s.users);
  const currentUser = useAppStore((s) => s.currentUser);
  const markRead = useAppStore((s) => s.markTrainerFeedbackRead);

  const feedbackForms = useMemo(
    () =>
      forms
        .filter(
          (f) =>
            f.trainerId === currentUser?.id &&
            (!!f.supervisorReview || ["Approved", "Needs Correction", "Rejected", "Under Review"].includes(f.status))
        )
        .sort((a, b) =>
          (b.supervisorReview?.updatedAt ?? b.createdAt).localeCompare(a.supervisorReview?.updatedAt ?? a.createdAt)
        ),
    [forms, currentUser?.id]
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const selected = useMemo(
    () => (selectedId ? feedbackForms.find((f) => f.id === selectedId) : undefined) ?? feedbackForms[0],
    [feedbackForms, selectedId]
  );

  useEffect(() => {
    if (selected?.id && !selected.trainerFeedbackReadAt) markRead(selected.id);
  }, [selected?.id, selected?.trainerFeedbackReadAt, markRead]);

  const unreadCount = feedbackForms.filter((f) => !f.trainerFeedbackReadAt).length;
  const assignedSupervisor = useMemo(() => {
    const assignedId = currentUser?.supervisorId;
    if (!assignedId) return undefined;
    return users.find((u) => u.id === assignedId && u.role === "supervisor");
  }, [currentUser?.supervisorId, users]);

  const exportTrainerCsv = () => {
    exportCsvRows(
      "trainer-feedback",
      ["Form ID", "Title", "Status", "Decision", "Reviewer", "Updated"],
      feedbackForms.map((f) => [
        f.id,
        f.title,
        f.status,
        f.supervisorReview?.decision ?? "",
        f.supervisorReview?.submittedBy ?? "",
        (f.supervisorReview?.updatedAt ?? f.createdAt).slice(0, 10)
      ])
    );
  };

  const getStatusClasses = (status?: string) => {
    if (status === "Approved") return "bg-emerald-100 text-emerald-700";
    if (status === "Needs Correction") return "bg-amber-100 text-amber-700";
    if (status === "Rejected") return "bg-rose-100 text-rose-700";
    return "bg-slate-100 text-slate-700";
  };

  const openDetails = (formId: string) => {
    setSelectedId(formId);
    setDetailsOpen(true);
  };

  return (
    <div className="mx-auto max-w-[560px] space-y-2.5">
      <section className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Feedback</h1>
            <p className="text-xs text-slate-500">Supervisor responses and decisions</p>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
              Unread: {unreadCount}
            </span>
            <button
              type="button"
              onClick={exportTrainerCsv}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Export CSV
            </button>
            <span
              className={cn(
                "rounded-full border px-3 py-1 text-[11px] font-medium",
                assignedSupervisor
                  ? "border-slate-200 bg-slate-50 text-slate-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              )}
            >
              {assignedSupervisor
                ? `Assigned: ${assignedSupervisor.name || assignedSupervisor.email}`
                : "Assigned: Not set"}
            </span>
          </div>
        </div>
      </section>

      <section>
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Inbox</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {feedbackForms.length === 0 ? (
              <p className="text-sm text-slate-500">No supervisor feedback yet.</p>
            ) : (
              feedbackForms.map((form) => {
                const unread = !form.trainerFeedbackReadAt;
                const reviewedAt = (form.supervisorReview?.updatedAt ?? form.createdAt).slice(0, 10);
                const reviewer = form.supervisorReview?.submittedBy || "Supervisor";

                return (
                  <div
                    key={form.id}
                    className={cn(
                      "w-full rounded-xl border p-3.5 transition",
                      selected?.id === form.id
                        ? "border-blue-200 bg-blue-50/40"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/70"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{form.title}</p>
                        <span
                          className={cn(
                            "mt-1.5 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                            getStatusClasses(form.status)
                          )}
                        >
                          {form.status}
                        </span>
                        <p className="mt-1.5 text-[11px] text-slate-500">
                          {reviewedAt} • {reviewer}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {unread ? (
                          <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">New</span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => openDetails(form.id)}
                          className="rounded-md p-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                          title="View details"
                          aria-label="View details"
                        >
                          <Eye className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => exportSignedFormPdf(form, { includeTraineeComments: false })}
                          className="rounded-md p-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                          title="Download signed form"
                          aria-label="Download signed form"
                        >
                          <Download className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </section>

      {detailsOpen && selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-900">Feedback Details</h2>
              <button
                type="button"
                onClick={() => setDetailsOpen(false)}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
            <div className="space-y-3 p-4 text-sm">
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200 p-2.5">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">Decision</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {selected.supervisorReview?.decision ?? selected.status}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-2.5">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">Reviewer</p>
                  <p className="mt-1 font-semibold text-slate-900">{selected.supervisorReview?.submittedBy || "Supervisor"}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-2.5">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">Due Date</p>
                  <p className="mt-1 font-semibold text-slate-900">{selected.supervisorReview?.dueDate || "Not set"}</p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-2.5">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Supervisor comments</p>
                <p className="mt-1.5 text-slate-800">
                  {selected.supervisorReview?.comments || "No written comments were captured for this sign-off."}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 p-2.5">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Action items</p>
                {(selected.supervisorReview?.actionItems?.length ?? 0) === 0 ? (
                  <p className="mt-1.5 text-slate-600">No action items.</p>
                ) : (
                  <ul className="mt-1.5 list-disc space-y-1 pl-5 text-slate-800">
                    {selected.supervisorReview?.actionItems.map((item, idx) => (
                      <li key={`${item}-${idx}`}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

