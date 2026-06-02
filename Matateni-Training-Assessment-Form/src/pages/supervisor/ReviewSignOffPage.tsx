import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppStore } from "../../store/app-store";
import { ExactAssessmentFormPage } from "../trainer/ExactAssessmentFormPage";

export function ReviewSignOffPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const forms = useAppStore((s) => s.forms);
  const currentUser = useAppStore((s) => s.currentUser);
  const formIdFromQuery = searchParams.get("formId");

  const target = formIdFromQuery
    ? forms.find((f) => f.id === formIdFromQuery && f.assignedSupervisorId === currentUser?.id)
    : undefined;

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
