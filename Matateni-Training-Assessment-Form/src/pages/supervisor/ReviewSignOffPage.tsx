import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppStore } from "../../store/app-store";
import { getTrainingSession } from "../../lib/api";
import { mapBackendSessionToForm } from "../../lib/session-forms";
import type { TrainingForm } from "../../types";
import { ExactAssessmentFormPage } from "../trainer/ExactAssessmentFormPage";

export function ReviewSignOffPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const forms = useAppStore((s) => s.forms);
  const currentUser = useAppStore((s) => s.currentUser);
  const addForm = useAppStore((s) => s.addForm);
  const formIdFromQuery = searchParams.get("formId");
  const [loadedForm, setLoadedForm] = useState<TrainingForm | null>(null);
  const [loading, setLoading] = useState(false);

  const target =
    (formIdFromQuery
      ? forms.find((f) => f.id === formIdFromQuery && f.assignedSupervisorId === currentUser?.id)
      : undefined) ?? loadedForm;

  useEffect(() => {
    if (!formIdFromQuery || !currentUser?.id) return;
    if (forms.some((f) => f.id === formIdFromQuery)) return;

    const sessionId = Number(formIdFromQuery.replace(/^F-/, ""));
    if (!Number.isFinite(sessionId) || sessionId <= 0) return;

    let cancelled = false;
    setLoading(true);

    getTrainingSession(sessionId)
      .then((session) => {
        if (cancelled) return;
        const payload = session.submittedPayload ?? session.draftPayload;
        const mapped = mapBackendSessionToForm(
          {
            id: session.id,
            trainerId: session.trainerId,
            assignedSupervisorId: session.assignedSupervisorId ?? currentUser.id,
            submittedPayload: payload,
            title: session.title,
            department: session.department,
            trainingDate: session.trainingDate,
            numberOfTrainees: session.numberOfTrainees,
            feedbackResponses: 0,
            averageScore: 0,
            status: "Submitted",
            recommendation: "Pending supervisor review",
            createdAt: session.createdAt,
            feedbackClosesAt: session.feedbackClosesAt
          },
          { fallbackSupervisorId: currentUser.id }
        );
        mapped.status = "Submitted";
        addForm(mapped);
        setLoadedForm(mapped);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [addForm, currentUser?.id, formIdFromQuery, forms]);

  if (loading) {
    return <p className="text-center text-sm text-slate-600">Loading assessment for review…</p>;
  }

  if (!target) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">No Form Selected</h2>
        <p className="mt-2 text-sm text-slate-600">
          Open a form from Incoming Forms, then click <span className="font-medium">Review</span>.
        </p>
        <button
          type="button"
          onClick={() => navigate("/supervisor")}
          className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Go To Incoming Forms
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ExactAssessmentFormPage readOnly submittedData={target.submittedData} reviewFormId={target.id} />
    </div>
  );
}
