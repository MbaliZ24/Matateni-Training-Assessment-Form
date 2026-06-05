import { Link, useSearchParams } from "react-router-dom";
import { ExactAssessmentFormPage } from "./ExactAssessmentFormPage";
import { useAppStore } from "../../store/app-store";

export function TrainerSubmissionViewPage() {
  const [searchParams] = useSearchParams();
  const forms = useAppStore((state) => state.forms);
  const formId = searchParams.get("formId");
  const target = forms.find((form) => form.id === formId);

  if (!target) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Submission not found</h1>
          <p className="mt-2 text-sm text-slate-600">
            We could not find that trainer submission. Return to My Submissions and open it again.
          </p>
          <Link
            to="/trainer/submissions"
            className="mt-4 inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Back to My Submissions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {target.status === "FOLLOWUPPENDING" ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
          <p className="font-semibold">Supervisor feedback</p>
          <p className="mt-1">{target.supervisorReview?.comments || "The supervisor returned this submission for updates."}</p>
          {(target.supervisorReview?.actionItems?.length ?? 0) > 0 ? (
            <ul className="mt-2 list-disc pl-5 text-xs">
              {target.supervisorReview?.actionItems.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <ExactAssessmentFormPage
        readOnly={
          target.status !== "DRAFT" &&
          target.status !== "OPENFORFEEDBACK" &&
          target.status !== "FEEDBACKCLOSED" &&
          target.status !== "FOLLOWUPPENDING"
        }
        reviewFormId={target.id}
        submittedData={target.submittedData}
      />
    </div>
  );
}
