import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { StatusBadge } from "../../components/ui/status-badge";
import { useAppStore } from "../../store/app-store";

export function EvidenceResponsesPage() {
  const forms = useAppStore((s) => s.forms);
  const currentUser = useAppStore((s) => s.currentUser);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const trainerForms = useMemo(
    () =>
      forms
        .filter((form) => form.trainerId === currentUser?.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [forms, currentUser?.id]
  );

  const respondedForms = useMemo(
    () => trainerForms.filter((form) => (form.supervisorOnlyFeedback?.length ?? 0) > 0),
    [trainerForms]
  );

  const selectedForm = useMemo(
    () =>
      (selectedId ? trainerForms.find((form) => form.id === selectedId) : undefined) ??
      trainerForms[0],
    [trainerForms, selectedId]
  );

  const totalSubmitted = trainerForms.length;
  const totalApproved = trainerForms.filter((form) => form.status === "Approved").length;
  const responsesReceived = respondedForms.length;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3 lg:gap-4">
        <Card className="rounded-2xl border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-500">Forms submitted</p>
          <p className="text-3xl font-bold">{totalSubmitted}</p>
        </Card>
        <Card className="rounded-2xl border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-500">Approved</p>
          <p className="text-3xl font-bold">{totalApproved}</p>
        </Card>
        <Card className="rounded-2xl border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-500">Responses received</p>
          <p className="text-3xl font-bold">{responsesReceived}</p>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-base">Submitted Forms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {trainerForms.length === 0 ? (
              <p className="text-sm text-slate-600">No submitted forms yet.</p>
            ) : (
              trainerForms.map((form) => (
                <button
                  key={form.id}
                  type="button"
                  onClick={() => setSelectedId(form.id)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    selectedForm?.id === form.id
                      ? "border-slate-900 bg-slate-50"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-800">{form.title}</p>
                      <p className="text-xs text-slate-500">
                        {form.id} - {form.department} - {form.date}
                      </p>
                    </div>
                    <StatusBadge status={form.status} />
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-base">Supervisor / Trainee Responses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {respondedForms.length === 0 ? (
              <p className="text-sm text-slate-600">No responses received yet.</p>
            ) : (
              respondedForms.map((form) => {
                const count = form.supervisorOnlyFeedback?.length ?? 0;
                return (
                  <button
                    key={form.id}
                    type="button"
                    onClick={() => setSelectedId(form.id)}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      selectedForm?.id === form.id
                        ? "border-slate-900 bg-slate-50"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-800">{form.title}</p>
                        <p className="text-xs text-slate-500">
                          {count} response{count === 1 ? "" : "s"}
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        New
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {selectedForm ? (
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle>Form Detail - {selectedForm.id}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 text-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Submitted by trainer</p>
                <p className="mt-1 font-medium text-slate-800">
                  {selectedForm.submittedData?.trainerName || "N/A"}
                </p>
                <p className="text-slate-600">
                  {selectedForm.submittedData?.trainingTitle || selectedForm.title}
                </p>
                <p className="text-slate-500">
                  Trainees: {selectedForm.trainees} - Avg score: {selectedForm.averageScore}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Supervisor review status</p>
                <div className="mt-1">
                  <StatusBadge status={selectedForm.status} />
                </div>
                <p className="mt-2 text-slate-600">
                  Recommendation: {selectedForm.recommendation || "N/A"}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Responses received for this form
              </p>
              {(selectedForm.supervisorOnlyFeedback?.length ?? 0) === 0 ? (
                <p className="mt-2 text-slate-600">No responses received for this form yet.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {selectedForm.supervisorOnlyFeedback?.map((entry, index) => (
                    <article
                      key={`${entry.traineeName}-${index}`}
                      className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                    >
                      <p className="font-medium text-slate-800">
                        {entry.traineeName || "Anonymous trainee"}
                        {entry.employeeId ? ` (${entry.employeeId})` : ""}
                      </p>
                      <p className="text-xs text-slate-500">
                        {entry.departmentRole || "No role"}
                        {entry.feedbackDate ? ` - ${entry.feedbackDate}` : ""}
                      </p>
                      <p className="mt-1 text-slate-700">{entry.comment || "No comment provided."}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-600">
                        Score: {entry.averageScore.toFixed(1)} / 5
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

