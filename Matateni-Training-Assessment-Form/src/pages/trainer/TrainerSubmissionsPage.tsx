import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ClipboardCopy, Download, Eye, Pencil, QrCode, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { StatusBadge } from "../../components/ui/status-badge";
import { useAppStore } from "../../store/app-store";
import { exportSignedFormPdf } from "../../lib/export";
import {
  isInStatuses,
  TRAINER_CONTINUE_ASSESSMENT_STATUSES,
  TRAINER_MY_ASSESSMENTS_STATUSES
} from "../../lib/form-status";
import { getTrainerSessions, getTrainingSessionQrUrl } from "../../lib/api";
import { mapBackendSessionToForm } from "../../lib/session-forms";
import type { TrainingForm } from "../../types";

export function TrainerSubmissionsPage() {
  const navigate = useNavigate();
  const forms = useAppStore((s) => s.forms);
  const users = useAppStore((s) => s.users);
  const currentUser = useAppStore((s) => s.currentUser);
  const addForm = useAppStore((s) => s.addForm);
  const [backendForms, setBackendForms] = useState<TrainingForm[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [qrForm, setQrForm] = useState<TrainingForm | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const trainerId = currentUser?.id;
    if (!trainerId) {
      setBackendForms([]);
      return;
    }

    let cancelled = false;
    setIsFetching(true);
    setFetchError(null);

    getTrainerSessions(trainerId)
      .then((sessions) => {
        if (cancelled) return;
        const fetchedForms = sessions
          .map((session) =>
            mapBackendSessionToForm(session, {
              fallbackSupervisorId: currentUser?.supervisorId,
              fallbackDepartment: currentUser?.department
            })
          )
          .filter((form) => isInStatuses(form.status, TRAINER_MY_ASSESSMENTS_STATUSES));

        fetchedForms.forEach(addForm);
        setBackendForms(fetchedForms);
      })
      .catch(() => {
        if (!cancelled) setFetchError("Unable to fetch assessments from the backend.");
      })
      .finally(() => {
        if (!cancelled) setIsFetching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [addForm, currentUser?.department, currentUser?.id, currentUser?.supervisorId]);

  const myAssessments = useMemo(() => {
    const formsById = new Map<string, TrainingForm>();
    backendForms.forEach((form) => formsById.set(form.id, form));
    forms.forEach((form) => {
      if (
        form.trainerId === currentUser?.id &&
        isInStatuses(form.status, TRAINER_MY_ASSESSMENTS_STATUSES)
      ) {
        formsById.set(form.id, form);
      }
    });

    return Array.from(formsById.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [backendForms, forms, currentUser?.id]);

  const supervisorName = (supervisorId?: string) =>
    users.find((u) => u.id === supervisorId)?.name ||
    users.find((u) => u.id === supervisorId)?.email ||
    "Not assigned";

  const traineeLink = (form: TrainingForm) => {
    const origin =
      typeof window !== "undefined" && window.location?.origin ? window.location.origin : "";
    return `${origin}/trainee-feedback?formId=${form.id}`;
  };

  const qrUrl = (form: TrainingForm) => {
    const sessionId = form.backendSessionId ?? Number(form.id.replace(/^F-/, ""));
    if (Number.isFinite(sessionId) && sessionId > 0) {
      return getTrainingSessionQrUrl(sessionId);
    }
    return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(traineeLink(form))}`;
  };

  const canShowQr = (form: TrainingForm) => isInStatuses(form.status, TRAINER_CONTINUE_ASSESSMENT_STATUSES);

  const canContinueForm = (form: TrainingForm) =>
    isInStatuses(form.status, TRAINER_CONTINUE_ASSESSMENT_STATUSES) || form.status === "Needs Correction";

  const copyLink = async (form: TrainingForm) => {
    await navigator.clipboard?.writeText(traineeLink(form));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-[1080px] space-y-3">
      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-slate-900">My Assessments</CardTitle>
          <p className="text-xs text-slate-500">
            {isFetching
              ? "Loading assessments..."
              : "Published and submitted training assessments. Open QR for trainee feedback, then continue the form from Section D."}
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
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Supervisor</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {myAssessments.map((form) => (
                  <tr key={form.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-700">{form.id}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-800">{form.title}</td>
                    <td className="px-4 py-2.5 text-slate-700">{form.submittedAt || form.date || form.createdAt}</td>
                    <td className="px-4 py-2.5 text-slate-700">{supervisorName(form.assignedSupervisorId)}</td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={form.status} />
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {canShowQr(form) ? (
                          <button
                            type="button"
                            onClick={() => {
                              setQrForm(form);
                              setCopied(false);
                            }}
                            className="inline-flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100"
                            title="Trainee QR / link"
                            aria-label="Trainee QR / link"
                          >
                            <QrCode className="size-4" />
                          </button>
                        ) : null}
                        {canContinueForm(form) ? (
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/trainer/create?formId=${encodeURIComponent(form.id)}&section=D`
                              )
                            }
                            className="inline-flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100"
                            title="Continue assessment (Section D)"
                            aria-label="Continue assessment"
                          >
                            <Pencil className="size-4" />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/trainer/submissions/view?formId=${encodeURIComponent(form.id)}`)
                          }
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
                {myAssessments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                      No published assessments yet. Publish from Assessments to see them here.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {qrForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Trainee feedback — QR & link</h3>
                <p className="mt-1 text-sm text-slate-600">{qrForm.title}</p>
                <p className="font-mono text-xs text-slate-500">{qrForm.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setQrForm(null)}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex flex-col items-center gap-4">
              <img
                src={qrUrl(qrForm)}
                alt="Trainee feedback QR code"
                className="h-[240px] w-[240px] rounded-lg border border-slate-200 bg-white p-2"
              />
              <p className="break-all rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700">
                {traineeLink(qrForm)}
              </p>
              <button
                type="button"
                onClick={() => copyLink(qrForm)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:border-brand-ruby hover:text-brand-ruby"
              >
                {copied ? <Check className="size-4 text-emerald-600" /> : <ClipboardCopy className="size-4" />}
                {copied ? "Copied" : "Copy link"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setQrForm(null);
                  navigate(`/trainer/create?formId=${encodeURIComponent(qrForm.id)}&section=D`);
                }}
                className="text-sm font-semibold text-brand-ruby hover:underline"
              >
                Continue assessment from Section D →
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
