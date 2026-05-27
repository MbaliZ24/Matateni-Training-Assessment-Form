// Public trainee feedback form (no login) with the original matrix-style rating experience.
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useAppStore } from "../../store/app-store";
import { useSearchParams } from "react-router-dom";

const feedbackStatements = [
  "The training objectives were clear.",
  "The content was relevant to my role.",
  "The trainer was knowledgeable and organised.",
  "The pace and duration of training were appropriate.",
  "Practical exercises / workplace examples were useful.",
  "The training will help me perform my job more effectively."
];

const ratingScale = [1, 2, 3, 4, 5] as const;

export function TraineeFeedbackPage() {
  const [searchParams] = useSearchParams();
  const formId = searchParams.get("formId") ?? "";
  const forms = useAppStore((s) => s.forms);
  const submitTraineeFeedback = useAppStore((s) => s.submitTraineeFeedback);
  const targetForm = forms.find((f) => f.id === formId);
  const [traineeName, setTraineeName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [departmentRole, setDepartmentRole] = useState("");
  const [feedbackDate, setFeedbackDate] = useState("");
  const [ratings, setRatings] = useState<(number | null)[]>(Array(feedbackStatements.length).fill(null));
  const [comments, setComments] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showThanksModal, setShowThanksModal] = useState(false);

  const averageScore = useMemo(() => {
    const selected = ratings.filter((score): score is number => score !== null);
    if (selected.length === 0) return "-";
    const avg = selected.reduce((sum, score) => sum + score, 0) / selected.length;
    return `${avg.toFixed(1)} / 5`;
  }, [ratings]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 px-3 py-4 md:px-0 md:py-6">
      <Card>
        <CardHeader>
          <CardTitle>Trainee Self-Feedback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-xl border border-brand-line bg-slate-50 p-4">
            <p className="mb-3 text-sm font-semibold text-brand-ink">Trainee Information</p>
            <p className="mb-3 text-xs text-slate-500">Training Form ID: {formId || "Missing formId in link"}</p>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                type="text"
                placeholder="Trainee full name"
                value={traineeName}
                onChange={(e) => setTraineeName(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
              />
              <input
                type="text"
                placeholder="Employee number / ID"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
              />
              <input
                type="text"
                placeholder="Department / role"
                value={departmentRole}
                onChange={(e) => setDepartmentRole(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
              />
              <input
                type="date"
                value={feedbackDate}
                onChange={(e) => setFeedbackDate(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-brand-line">
            <table className="min-w-[760px] w-full border-collapse text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="border border-brand-line px-4 py-3 text-left font-semibold">Statement</th>
                  {ratingScale.map((rating) => (
                    <th key={rating} className="border border-brand-line px-4 py-3 text-center font-semibold">
                      {rating}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {feedbackStatements.map((statement, rowIndex) => (
                  <tr key={statement} className="odd:bg-white even:bg-slate-50">
                    <td className="border border-brand-line px-4 py-3 text-slate-800">{statement}</td>
                    {ratingScale.map((rating) => (
                      <td key={rating} className="border border-brand-line px-4 py-3 text-center">
                        <input
                          type="radio"
                          name={`feedback-${rowIndex}`}
                          aria-label={`${statement} rating ${rating}`}
                          checked={ratings[rowIndex] === rating}
                          onChange={() =>
                            setRatings((prev) => {
                              const next = [...prev];
                              next[rowIndex] = rating;
                              return next;
                            })
                          }
                          className="accent-brand-ruby"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="max-w-md rounded-xl border border-brand-line bg-slate-50 p-4">
            <p className="mb-1 text-sm font-semibold text-brand-ink">Average Score (auto-calculated)</p>
            <p className="text-lg font-bold text-slate-800">{averageScore}</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Additional comments</label>
            <textarea
              className="h-28 w-full rounded-lg border border-slate-300 p-3"
              placeholder="Share any feedback that can improve future sessions"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              disabled={!targetForm}
              onClick={() => {
                const selected = ratings.filter((score): score is number => score !== null);
                const averageValue =
                  selected.length === 0
                    ? 0
                    : Number(
                        (selected.reduce((sum, score) => sum + score, 0) / selected.length).toFixed(1)
                      );

                const ok = submitTraineeFeedback({
                  formId,
                  traineeName: traineeName.trim(),
                  employeeId: employeeId.trim(),
                  departmentRole: departmentRole.trim(),
                  feedbackDate,
                  averageScore: averageValue,
                  comment: comments.trim(),
                  statementRatings: ratings
                });
                setSubmitted(ok);

                if (ok) {
                  // Clear all local form fields so trainee-entered info is not retained on screen.
                  setTraineeName("");
                  setEmployeeId("");
                  setDepartmentRole("");
                  setFeedbackDate("");
                  setRatings(Array(feedbackStatements.length).fill(null));
                  setComments("");
                  setShowThanksModal(true);
                }
              }}
              className="min-w-40"
            >
              Submit Feedback
            </Button>
            {!targetForm ? <p className="text-sm text-red-700">Invalid or missing training link. Ask your trainer for the correct feedback link.</p> : null}
            {submitted ? <p className="text-sm text-emerald-700">Thank you. Your feedback was submitted.</p> : null}
          </div>
        </CardContent>
      </Card>

      {showThanksModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
            <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-rose-100 p-2">
              <img
                src="/matateni-logo.png"
                alt="Matateni logo"
                className="h-10 w-10 object-contain"
              />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Thank You!</h3>
            <p className="mt-2 text-sm text-slate-600">
              We really appreciate your feedback.
            </p>
            <button
              type="button"
              onClick={() => setShowThanksModal(false)}
              className="mt-5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-ruby hover:text-brand-ruby"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
