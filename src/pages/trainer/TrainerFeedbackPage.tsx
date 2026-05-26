import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useAppStore } from "../../store/app-store";
import { cn } from "../../lib/utils";
import { exportCsvRows, exportSignedFormPdf } from "../../lib/export";

export function TrainerFeedbackPage() {
  const forms = useAppStore((s) => s.forms);
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
  const selected = useMemo(
    () => (selectedId ? feedbackForms.find((f) => f.id === selectedId) : undefined) ?? feedbackForms[0],
    [feedbackForms, selectedId]
  );

  useEffect(() => {
    if (selected?.id && !selected.trainerFeedbackReadAt) markRead(selected.id);
  }, [selected?.id, selected?.trainerFeedbackReadAt, markRead]);

  const unreadCount = feedbackForms.filter((f) => !f.trainerFeedbackReadAt).length;
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

  return (
    <div className="mx-auto max-w-[1180px] space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Feedback</h1>
            <p className="text-sm text-slate-500">Supervisor feedback sent to you</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {unreadCount} unread
            </span>
            <button
              type="button"
              onClick={exportTrainerCsv}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
            >
              Export CSV
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card className="rounded-xl border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Feedback Inbox</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {feedbackForms.length === 0 ? (
              <p className="text-sm text-slate-500">No supervisor feedback yet.</p>
            ) : (
              feedbackForms.map((form) => {
                const unread = !form.trainerFeedbackReadAt;
                return (
                  <button
                    key={form.id}
                    type="button"
                    onClick={() => setSelectedId(form.id)}
                    className={cn(
                      "w-full rounded-lg border p-3 text-left transition",
                      selected?.id === form.id
                        ? "border-slate-900 bg-slate-50"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">{form.title}</p>
                      <p className="text-xs text-slate-500">
                        {(form.supervisorReview?.decision ?? "Sign-off")} •{" "}
                        {(form.supervisorReview?.updatedAt ?? form.createdAt).slice(0, 10)}
                      </p>
                    </div>
                      {unread ? <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">New</span> : null}
                    </div>
                    <p className="mt-2 text-xs text-slate-600">Status: {form.status}</p>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Feedback Detail</CardTitle>
          </CardHeader>
          <CardContent>
            {!selected ? (
              <p className="text-sm text-slate-500">Select an item from the inbox.</p>
            ) : (
              <div className="space-y-4 text-sm">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Decision</p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {selected.supervisorReview?.decision ?? (selected.status === "Approved" ? "Approved" : selected.status)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Reviewer</p>
                    <p className="mt-1 font-semibold text-slate-900">{selected.supervisorReview?.submittedBy || "Supervisor"}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Due Date</p>
                    <p className="mt-1 font-semibold text-slate-900">{selected.supervisorReview?.dueDate || "Not set"}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Supervisor comments</p>
                  <p className="mt-1 text-slate-800">
                    {selected.supervisorReview?.comments || "No written comments were captured for this sign-off."}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Action items</p>
                  {(selected.supervisorReview?.actionItems?.length ?? 0) === 0 ? (
                    <p className="mt-1 text-slate-600">No action items.</p>
                  ) : (
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-800">
                      {selected.supervisorReview?.actionItems.map((item, idx) => (
                        <li key={`${item}-${idx}`}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Section notes</p>
                  {(selected.supervisorReview?.sectionFeedback?.length ?? 0) === 0 ? (
                    <p className="mt-1 text-slate-600">No section-level notes.</p>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {selected.supervisorReview?.sectionFeedback.map((entry) => (
                        <div key={entry.section} className="rounded-md border border-slate-100 bg-slate-50 p-2.5">
                          <p className="font-medium text-slate-800">
                            {entry.section} - {entry.verdict}
                          </p>
                          <p className="text-slate-600">{entry.comment || "No section comment."}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Timeline</p>
                  <ul className="mt-2 space-y-1 text-slate-700">
                    <li>• Trainer submitted form ({selected.createdAt})</li>
                    <li>
                      • Supervisor{" "}
                      {selected.supervisorReview
                        ? selected.supervisorReview.stage === "draft"
                          ? "saved draft"
                          : "submitted feedback"
                        : "signed off"}{" "}
                      ({(selected.supervisorReview?.updatedAt ?? selected.createdAt).slice(0, 10)})
                    </li>
                    {selected.status === "Approved" ? <li>• Final approval completed</li> : null}
                  </ul>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => selected && exportSignedFormPdf(selected, { includeTraineeComments: false })}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    Download Signed Form (PDF)
                  </button>
                  <Link
                    to="/trainer/create"
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    Apply Changes
                  </Link>
                  <button className="rounded-lg border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                    Resubmit
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
