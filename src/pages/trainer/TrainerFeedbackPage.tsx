import { useEffect, useMemo, useState } from "react";
import { Download, Eye, UserRoundCheck } from "lucide-react";
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
  const [openDetailsForId, setOpenDetailsForId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const visibleForms = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return feedbackForms;
    return feedbackForms.filter((f) => {
      const reviewer = f.supervisorReview?.submittedBy ?? "supervisor";
      return (
        f.title.toLowerCase().includes(query) ||
        f.status.toLowerCase().includes(query) ||
        f.id.toLowerCase().includes(query) ||
        reviewer.toLowerCase().includes(query)
      );
    });
  }, [feedbackForms, search]);

  const selected = useMemo(
    () => (selectedId ? feedbackForms.find((f) => f.id === selectedId) : undefined) ?? feedbackForms[0],
    [feedbackForms, selectedId]
  );

  const openDetails = useMemo(
    () => (openDetailsForId ? feedbackForms.find((f) => f.id === openDetailsForId) : undefined),
    [feedbackForms, openDetailsForId]
  );

  useEffect(() => {
    if (selected?.id && !selected.trainerFeedbackReadAt) markRead(selected.id);
  }, [selected?.id, selected?.trainerFeedbackReadAt, markRead]);

  useEffect(() => {
    if (openDetails?.id && !openDetails.trainerFeedbackReadAt) markRead(openDetails.id);
  }, [openDetails?.id, openDetails?.trainerFeedbackReadAt, markRead]);

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

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Feedback</h1>
            <p className="text-xs text-slate-500">Supervisor responses and decisions</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={exportTrainerCsv}
              className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Export CSV
            </button>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium",
                assignedSupervisor
                  ? "border-slate-200 bg-slate-50 text-slate-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              )}
            >
              <UserRoundCheck className="size-3.5" />
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
          <CardContent className="space-y-2.5 pt-0">
            <div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, status, ID, or supervisor..."
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              />
            </div>
            {feedbackForms.length === 0 ? <p className="text-sm text-slate-500">No supervisor feedback yet.</p> : null}
            {feedbackForms.length > 0 && visibleForms.length === 0 ? (
              <p className="text-sm text-slate-500">No results for “{search}”.</p>
            ) : null}
            {visibleForms.map((form) => {
              const unread = !form.trainerFeedbackReadAt;
              const reviewedAt = (form.supervisorReview?.updatedAt ?? form.createdAt).slice(0, 10);
              const reviewer = form.supervisorReview?.submittedBy || "Supervisor";

              return (
                <div
                  key={form.id}
                  className={cn(
                    "rounded-xl border p-3.5 transition",
                    selected?.id === form.id
                      ? "border-blue-200 bg-blue-50/40"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/70"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button type="button" onClick={() => setSelectedId(form.id)} className="min-w-0 text-left">
                      <p className="truncate text-base font-semibold text-slate-900">{form.title}</p>
                      <span
                        className={cn(
                          "mt-1.5 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                          getStatusClasses(form.status)
                        )}
                      >
                        {form.status}
                      </span>
                      <p className="mt-1.5 text-[12px] text-slate-500">
                        {reviewedAt} - {reviewer}
                      </p>
                    </button>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {unread ? (
                        <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">New</span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setOpenDetailsForId(form.id)}
                        className="inline-flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-white hover:text-slate-900"
                        title="View details"
                        aria-label={`View feedback details for ${form.title}`}
                      >
                        <Eye className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => exportSignedFormPdf(form, { includeTraineeComments: false })}
                        className="inline-flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-white hover:text-slate-900"
                        title="Download signed form"
                        aria-label={`Download signed form for ${form.title}`}
                      >
                        <Download className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      {openDetails ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4" onClick={() => setOpenDetailsForId(null)}>
          <div
            className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{openDetails.title}</h3>
                <p className="text-xs text-slate-500">{openDetails.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpenDetailsForId(null)}
                className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 p-2.5">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Decision</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {openDetails.supervisorReview?.decision ?? openDetails.status}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-2.5">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Reviewer</p>
                <p className="mt-1 font-semibold text-slate-900">{openDetails.supervisorReview?.submittedBy || "Supervisor"}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-2.5">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Due Date</p>
                <p className="mt-1 font-semibold text-slate-900">{openDetails.supervisorReview?.dueDate || "Not set"}</p>
              </div>
            </div>

            <div className="mt-2 rounded-lg border border-slate-200 p-2.5">
              <p className="text-[10px] uppercase tracking-wide text-slate-500">Supervisor comments</p>
              <p className="mt-1.5 text-sm text-slate-800">
                {openDetails.supervisorReview?.comments || "No written comments were captured for this sign-off."}
              </p>
            </div>

            <div className="mt-2 rounded-lg border border-slate-200 p-2.5">
              <p className="text-[10px] uppercase tracking-wide text-slate-500">Action items</p>
              {(openDetails.supervisorReview?.actionItems?.length ?? 0) === 0 ? (
                <p className="mt-1.5 text-sm text-slate-600">No action items.</p>
              ) : (
                <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-slate-800">
                  {openDetails.supervisorReview?.actionItems.map((item, idx) => (
                    <li key={`${item}-${idx}`}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
