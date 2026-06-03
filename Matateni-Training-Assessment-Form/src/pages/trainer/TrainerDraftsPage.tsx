import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { StatusBadge } from "../../components/ui/status-badge";
import { useAppStore } from "../../store/app-store";
import { isInStatuses, TRAINER_DRAFT_STATUSES } from "../../lib/form-status";
import { getTrainerSessions } from "../../lib/api";
import { mapBackendSessionToForm } from "../../lib/session-forms";
import type { TrainingForm } from "../../types";

export function TrainerDraftsPage() {
  const navigate = useNavigate();
  const forms = useAppStore((s) => s.forms);
  const currentUser = useAppStore((s) => s.currentUser);
  const addForm = useAppStore((s) => s.addForm);
  const [backendDrafts, setBackendDrafts] = useState<TrainingForm[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const trainerId = currentUser?.id;
    if (!trainerId) {
      setBackendDrafts([]);
      return;
    }

    let cancelled = false;
    setIsFetching(true);
    setFetchError(null);

    getTrainerSessions(trainerId)
      .then((sessions) => {
        if (cancelled) return;
        const drafts = sessions
          .filter((session) => session.status.trim().toLowerCase() === "draft")
          .map((session) => {
            const form = mapBackendSessionToForm(session, {
              fallbackSupervisorId: currentUser?.supervisorId,
              fallbackDepartment: currentUser?.department
            });
            addForm(form);
            return form;
          });

        setBackendDrafts(drafts);
      })
      .catch(() => {
        if (!cancelled) setFetchError("Unable to load drafts from the server.");
      })
      .finally(() => {
        if (!cancelled) setIsFetching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [addForm, currentUser?.department, currentUser?.id, currentUser?.supervisorId]);

  const myDrafts = useMemo(() => {
    const byId = new Map<string, TrainingForm>();
    backendDrafts.forEach((form) => byId.set(form.id, form));
    forms.forEach((form) => {
      if (form.trainerId === currentUser?.id && isInStatuses(form.status, TRAINER_DRAFT_STATUSES)) {
        byId.set(form.id, form);
      }
    });

    return Array.from(byId.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [backendDrafts, forms, currentUser?.id]);

  return (
    <div className="mx-auto max-w-[980px] space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">My Drafts</h1>
          <p className="text-sm text-slate-600">
            Save work in progress, edit anytime, then publish when Section A and objectives are ready.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/trainer/create")}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
        >
          <Plus className="size-4" />
          New assessment
        </button>
      </div>

      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-slate-900">Draft assessments</CardTitle>
          <p className="text-xs text-slate-500">
            {isFetching ? "Loading drafts..." : "Only you can see drafts until you publish."}
          </p>
          {fetchError ? <p className="text-xs text-red-600">{fetchError}</p> : null}
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Form ID</th>
                  <th className="px-4 py-3 font-semibold">Training</th>
                  <th className="px-4 py-3 font-semibold">Last updated</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {myDrafts.map((form) => (
                  <tr key={form.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-700">{form.id}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-800">{form.title}</td>
                    <td className="px-4 py-2.5 text-slate-700">{form.date || form.createdAt}</td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={form.status} />
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => navigate(`/trainer/create?formId=${encodeURIComponent(form.id)}`)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        <Pencil className="size-3.5" />
                        Continue editing
                      </button>
                    </td>
                  </tr>
                ))}
                {myDrafts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                      No drafts yet. Start a new assessment and use Save draft.
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
