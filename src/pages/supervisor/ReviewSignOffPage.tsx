// Supervisor review surface: renders the exact submitted form in read-only mode.
import { useAppStore } from "../../store/app-store";
import { ExactAssessmentFormPage } from "../trainer/ExactAssessmentFormPage";

export function ReviewSignOffPage() {
  const forms = useAppStore((s) => s.forms);
  const selectedReviewFormId = useAppStore((s) => s.selectedReviewFormId);
  const target =
    (selectedReviewFormId ? forms.find((f) => f.id === selectedReviewFormId) : undefined) ??
    forms.find((f) => f.status === "Submitted") ??
    forms[0];

  if (!target) return <p>No form selected.</p>;

  return (
    <div className="space-y-5">
      <ExactAssessmentFormPage readOnly submittedData={target.submittedData} />
      <section className="rounded-2xl border border-brand-line bg-white p-5 shadow-panel">
        <h2 className="mb-3 text-lg font-semibold text-brand-ink">Supervisor-only Trainee Comments</h2>
        {(target.supervisorOnlyFeedback?.length ?? 0) === 0 ? (
          <p className="text-sm text-slate-600">No trainee comments submitted yet.</p>
        ) : (
          <div className="space-y-3">
            {target.supervisorOnlyFeedback?.map((item, index) => (
              <article key={`${item.traineeName}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-800">
                  {item.traineeName || "Anonymous trainee"} {item.employeeId ? `(${item.employeeId})` : ""}
                </p>
                <p className="text-xs text-slate-500">
                  {item.departmentRole || "No department/role"} {item.feedbackDate ? `• ${item.feedbackDate}` : ""}
                </p>
                <p className="mt-2 text-sm text-slate-700">{item.comment || "No comment provided."}</p>
                <p className="mt-1 text-xs font-semibold text-slate-600">Score: {item.averageScore.toFixed(1)} / 5</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

