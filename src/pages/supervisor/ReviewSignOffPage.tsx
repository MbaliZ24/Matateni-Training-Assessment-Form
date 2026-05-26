import { useAppStore } from "../../store/app-store";
import { ExactAssessmentFormPage } from "../trainer/ExactAssessmentFormPage";

export function ReviewSignOffPage() {
  const forms = useAppStore((s) => s.forms);
  const selectedReviewFormId = useAppStore((s) => s.selectedReviewFormId);

  const target =
    (selectedReviewFormId ? forms.find((f) => f.id === selectedReviewFormId) : undefined) ??
    forms.find((f) => f.status === "Submitted" || f.status === "Under Review") ??
    forms[0];

  if (!target) return <p>No form selected.</p>;

  return (
    <div className="space-y-5">
      <ExactAssessmentFormPage readOnly submittedData={target.submittedData} reviewFormId={target.id} />
    </div>
  );
}
