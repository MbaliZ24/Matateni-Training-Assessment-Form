import { normalizeStatus } from "./form-status";
import { TRAINEE_FEEDBACK_STATEMENTS, type TraineeFeedbackEntryDto, type TrainingSessionSummaryDto } from "./api";
import type { TrainingForm } from "../types";

function parsePayload(payload: string | null | undefined): TrainingForm["submittedData"] | undefined {
  if (!payload) return undefined;
  try {
    const parsed = JSON.parse(payload) as { submittedData?: TrainingForm["submittedData"] } & TrainingForm["submittedData"];
    return parsed.submittedData ?? parsed;
  } catch {
    return undefined;
  }
}

export function feedbackEntriesToSupervisorOnly(entries: TraineeFeedbackEntryDto[]): NonNullable<TrainingForm["supervisorOnlyFeedback"]> {
  return entries.map((entry) => {
    const statementRatings = TRAINEE_FEEDBACK_STATEMENTS.map(
      (question) => entry.answers.find((answer) => answer.question === question)?.rating ?? null
    );
    const numeric = statementRatings.filter((rating): rating is number => rating !== null);
    const averageScore =
      numeric.length === 0
        ? 0
        : Number((numeric.reduce((sum, rating) => sum + rating, 0) / numeric.length).toFixed(1));
    const comment = entry.answers.find((answer) => answer.question === "Additional comments")?.answer ?? "";

    return {
      traineeName: entry.traineeName,
      employeeId: "",
      departmentRole: "",
      feedbackDate: entry.submittedAt.slice(0, 10),
      averageScore,
      comment,
      statementRatings
    };
  });
}

export function sessionSummaryToForm(session: TrainingSessionSummaryDto): TrainingForm {
  const payload = session.submittedPayload ?? session.draftPayload ?? null;
  const submittedData = parsePayload(payload);

  const supervisorReview =
    session.supervisorReviewDecision === "Approve" || session.supervisorReviewDecision === "Needs Changes"
      ? {
          decision: session.supervisorReviewDecision as "Approve" | "Needs Changes",
          comments: session.supervisorReviewComments ?? "",
          actionItems: [] as string[],
          sectionFeedback: [] as { section: string; verdict: "OK" | "Revise"; comment: string }[],
          stage: "submitted" as const,
          submittedAt: session.supervisorSignedAt ?? undefined,
          submittedBy: session.supervisorSignedBy ?? undefined,
          updatedAt: session.supervisorSignedAt ?? session.submittedAt ?? session.createdAt
        }
      : undefined;

  return {
    id: `F-${session.id}`,
    backendSessionId: session.id,
    title: session.title,
    trainerId: session.trainerId,
    assignedSupervisorId: session.assignedSupervisorId ?? undefined,
    department: session.department ?? "",
    date: session.trainingDate
      ? new Date(session.trainingDate).toISOString().slice(0, 10)
      : new Date(session.createdAt).toISOString().slice(0, 10),
    trainees: session.numberOfTrainees ?? 0,
    feedbackResponses: session.feedbackResponses,
    averageScore: session.averageScore,
    status: normalizeStatus(session.status),
    recommendation: session.recommendation,
    createdAt: session.createdAt,
    submittedAt: session.submittedAt ?? undefined,
    submittedData: submittedData
      ? {
          ...submittedData,
          feedbackDeadline:
            submittedData.feedbackDeadline ??
            (session.feedbackClosesAt ? new Date(session.feedbackClosesAt).toISOString() : undefined)
        }
      : session.feedbackClosesAt
        ? {
            trainerName: "",
            trainingTitle: session.title,
            trainingDate: session.trainingDate
              ? new Date(session.trainingDate).toISOString().slice(0, 10)
              : "",
            durationDays: "",
            durationHours: "",
            numberOfTrainees: String(session.numberOfTrainees ?? ""),
            objectives: [],
            passRate: "",
            averageScoreDisplay: String(session.averageScore),
            traineeRoster: [],
            feedbackDeadline: new Date(session.feedbackClosesAt).toISOString()
          }
        : undefined,
    supervisorReview,
    supervisorReviewHistory: supervisorReview ? [supervisorReview] : undefined
  };
}
