// Public trainee feedback form (no login) with a guided, mobile-friendly rating experience.
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useAppStore } from "../../store/app-store";

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
  const feedbackDeadline = targetForm?.submittedData?.feedbackDeadline ?? "";
  const [traineeName, setTraineeName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [departmentRole, setDepartmentRole] = useState("");
  const [feedbackDate, setFeedbackDate] = useState("");
  const [ratings, setRatings] = useState<(number | null)[]>(Array(feedbackStatements.length).fill(null));
  const [comments, setComments] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showThanksModal, setShowThanksModal] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showValidationHints, setShowValidationHints] = useState(false);

  const normalize = (value: string) => value.trim().toLowerCase();
  // Prefer employee id when available, then fall back to name+role so duplicate submissions are blocked in the UI.
  const submissionKey = employeeId.trim()
    ? `employee:${normalize(employeeId)}`
    : `name:${normalize(traineeName)}|role:${normalize(departmentRole)}`;

  const hasAlreadySubmitted = useMemo(() => {
    if (!targetForm) return false;
    if (!traineeName.trim() && !employeeId.trim()) return false;
    return (targetForm.supervisorOnlyFeedback ?? []).some((entry) => {
      const existingKey =
        entry.submissionKey ||
        (entry.employeeId.trim()
          ? `employee:${normalize(entry.employeeId)}`
          : `name:${normalize(entry.traineeName)}|role:${normalize(entry.departmentRole)}`);
      return existingKey === submissionKey;
    });
  }, [targetForm, traineeName, employeeId, departmentRole, submissionKey]);

  const averageScore = useMemo(() => {
    const selected = ratings.filter((score): score is number => score !== null);
    if (selected.length === 0) return "-";
    const avg = selected.reduce((sum, score) => sum + score, 0) / selected.length;
    return `${avg.toFixed(1)} / 5`;
  }, [ratings]);

  const isDeadlineExpired = useMemo(() => {
    if (!feedbackDeadline) return false;
    const parsed = new Date(feedbackDeadline);
    return !Number.isNaN(parsed.getTime()) && parsed.getTime() < Date.now();
  }, [feedbackDeadline]);

  const formattedDeadline = useMemo(() => {
    if (!feedbackDeadline) return "";
    const parsed = new Date(feedbackDeadline);
    return Number.isNaN(parsed.getTime()) ? "" : parsed.toLocaleString();
  }, [feedbackDeadline]);

  const validationErrors = useMemo(
    () => ({
      traineeName: traineeName.trim() ? "" : "Enter your full name.",
      departmentRole: departmentRole.trim() ? "" : "Enter your department or role.",
      feedbackDate: feedbackDate ? "" : "Select the date you are submitting this feedback.",
      ratings: ratings.every((score) => score !== null) ? "" : "Rate every statement before submitting."
    }),
    [traineeName, departmentRole, feedbackDate, ratings]
  );

  const isFormValid = Object.values(validationErrors).every((value) => !value);

  const inputClassName = (hasError: boolean) =>
    `rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition focus:ring-2 ${
      hasError
        ? "border-rose-300 bg-rose-50/40 text-rose-900 focus:border-rose-400 focus:ring-rose-100"
        : "border-slate-300 focus:border-slate-900 focus:ring-slate-200"
    }`;

  const handleSubmit = async () => {
    setSubmitError("");
    setShowValidationHints(true);

    if (!targetForm) {
      setSubmitted(false);
      setSubmitError("Invalid or missing training link. Ask your trainer for the correct feedback link.");
      return;
    }

    if (isDeadlineExpired) {
      setSubmitted(false);
      setSubmitError("This feedback window has closed. Please contact your trainer.");
      return;
    }

    if (hasAlreadySubmitted) {
      setSubmitted(false);
      setSubmitError("This trainee has already submitted feedback for this training.");
      return;
    }

    if (!isFormValid) {
      setSubmitted(false);
      setSubmitError("Please complete the required fields before submitting.");
      return;
    }

    const selected = ratings.filter((score): score is number => score !== null);
    const averageValue =
      selected.length === 0
        ? 0
        : Number((selected.reduce((sum, score) => sum + score, 0) / selected.length).toFixed(1));

    const ok = await submitTraineeFeedback({
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
      setShowValidationHints(false);
      setShowThanksModal(true);
    } else {
      setSubmitError("This trainee has already submitted feedback for this training.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 px-3 py-4 md:px-0 md:py-6">
      <Card>
        <CardHeader>
          <CardTitle>Trainee Self-Feedback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-2xl border border-brand-line bg-gradient-to-b from-slate-50 to-white px-6 py-7 text-center">
            <p className="text-base font-semibold text-brand-ink">Before you start</p>
            <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-slate-700">
              This short form captures your view of the training session and how useful it was to your role.
              Please complete it once, honestly, and as close to the training date as possible.
            </p>
            <div className="mx-auto mt-4 inline-flex max-w-2xl items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 shadow-sm">
              Your responses are used for training follow-up, internal reporting, and quality improvement.
            </div>
          </div>

          <div className="rounded-xl border border-brand-line bg-slate-50 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-brand-ink">Trainee Information</p>
              <p className="text-xs text-slate-500">Fields marked with * are required.</p>
            </div>
            {formattedDeadline ? (
              <p className={`mb-3 text-xs font-medium ${isDeadlineExpired ? "text-red-700" : "text-slate-600"}`}>
                Feedback deadline: {formattedDeadline}
              </p>
            ) : null}
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-700">Full name *</span>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={traineeName}
                  onChange={(e) => {
                    setTraineeName(e.target.value);
                    if (submitError) setSubmitError("");
                  }}
                  className={inputClassName(showValidationHints && !!validationErrors.traineeName)}
                />
                {showValidationHints && validationErrors.traineeName ? (
                  <span className="text-xs text-rose-700">{validationErrors.traineeName}</span>
                ) : null}
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-700">Employee number / ID</span>
                <input
                  type="text"
                  placeholder="Optional"
                  value={employeeId}
                  onChange={(e) => {
                    setEmployeeId(e.target.value);
                    if (submitError) setSubmitError("");
                  }}
                  className={inputClassName(false)}
                />
                <span className="text-xs text-slate-500">
                  Optional, but helpful for preventing duplicate submissions and matching your response to the session.
                </span>
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-700">Department / role *</span>
                <input
                  type="text"
                  placeholder="Enter your department or role"
                  value={departmentRole}
                  onChange={(e) => {
                    setDepartmentRole(e.target.value);
                    if (submitError) setSubmitError("");
                  }}
                  className={inputClassName(showValidationHints && !!validationErrors.departmentRole)}
                />
                {showValidationHints && validationErrors.departmentRole ? (
                  <span className="text-xs text-rose-700">{validationErrors.departmentRole}</span>
                ) : null}
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-700">Submission date *</span>
                <input
                  type="date"
                  value={feedbackDate}
                  onChange={(e) => {
                    setFeedbackDate(e.target.value);
                    if (submitError) setSubmitError("");
                  }}
                  className={inputClassName(showValidationHints && !!validationErrors.feedbackDate)}
                />
                {showValidationHints && validationErrors.feedbackDate ? (
                  <span className="text-xs text-rose-700">{validationErrors.feedbackDate}</span>
                ) : null}
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-brand-line">
            <div className="border-b border-brand-line bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-brand-ink">Training rating</p>
              <p className="mt-1 text-xs text-slate-500">Score each statement from 1 to 5, where 1 is lowest and 5 is highest.</p>
              {showValidationHints && validationErrors.ratings ? (
                <p className="mt-2 text-xs font-medium text-rose-700">{validationErrors.ratings}</p>
              ) : null}
            </div>
            <div className="hidden overflow-x-auto md:block">
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
            <div className="space-y-3 p-4 md:hidden">
              {feedbackStatements.map((statement, rowIndex) => (
                <div key={statement} className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-sm font-medium text-slate-800">{statement}</p>
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {ratingScale.map((rating) => (
                      <label
                        key={rating}
                        className={`flex cursor-pointer items-center justify-center rounded-lg border px-2 py-2 text-sm font-semibold transition ${
                          ratings[rowIndex] === rating
                            ? "border-brand-ruby bg-rose-50 text-brand-ruby"
                            : "border-slate-200 bg-slate-50 text-slate-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`feedback-mobile-${rowIndex}`}
                          aria-label={`${statement} rating ${rating}`}
                          checked={ratings[rowIndex] === rating}
                          onChange={() =>
                            setRatings((prev) => {
                              const next = [...prev];
                              next[rowIndex] = rating;
                              return next;
                            })
                          }
                          className="sr-only"
                        />
                        {rating}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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
            <p className="mt-2 text-xs text-slate-500">
              Optional. Please keep comments focused on the training experience and workplace value.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
            By submitting this form, you confirm that the information provided is accurate to the best of your knowledge
            and intended only for internal training follow-up and reporting.
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button disabled={!targetForm || isDeadlineExpired || hasAlreadySubmitted} onClick={handleSubmit} className="min-w-40">
              Submit Feedback
            </Button>
            {!targetForm ? <p className="text-sm text-red-700">Invalid or missing training link. Ask your trainer for the correct feedback link.</p> : null}
            {targetForm && isDeadlineExpired ? <p className="text-sm text-red-700">This feedback window has closed. Please contact your trainer.</p> : null}
            {targetForm && hasAlreadySubmitted ? <p className="text-sm text-red-700">This trainee has already submitted feedback for this training.</p> : null}
            {submitError ? <p className="text-sm text-red-700">{submitError}</p> : null}
            {submitted ? <p className="text-sm text-emerald-700">Thank you. Your feedback was submitted.</p> : null}
          </div>
        </CardContent>
      </Card>

      {showThanksModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
            <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-rose-100 p-2">
              <img src="/matateni-logo.png" alt="Matateni logo" className="h-10 w-10 object-contain" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Thank You!</h3>
            <p className="mt-2 text-sm text-slate-600">We really appreciate your feedback.</p>
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
