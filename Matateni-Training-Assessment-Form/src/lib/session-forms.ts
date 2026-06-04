import type { Status, TrainingForm } from "../types";

const FEEDBACK_STATEMENTS = [
  "The training objectives were clear.",
  "The content was relevant to my role.",
  "The trainer was knowledgeable and organised.",
  "The pace and duration of training were appropriate.",
  "Practical exercises / workplace examples were useful.",
  "The training will help me perform my job more effectively."
] as const;

export type ApiFeedbackEntry = {
  traineeName: string;
  submittedAt: string;
  answers: { question: string; answer: string; rating: number | null }[];
};

function normalizeFeedbackEntry(raw: Record<string, unknown>): ApiFeedbackEntry {
  const answersRaw = (raw.answers ?? raw.Answers ?? []) as Record<string, unknown>[];
  return {
    traineeName: String(raw.traineeName ?? raw.TraineeName ?? ""),
    submittedAt: String(raw.submittedAt ?? raw.SubmittedAt ?? ""),
    answers: answersRaw.map((answer) => ({
      question: String(answer.question ?? answer.Question ?? ""),
      answer: String(answer.answer ?? answer.Answer ?? ""),
      rating:
        typeof answer.rating === "number"
          ? answer.rating
          : typeof answer.Rating === "number"
            ? answer.Rating
            : null
    }))
  };
}

export function mapApiFeedbackEntries(rawEntries: unknown[]): NonNullable<TrainingForm["supervisorOnlyFeedback"]> {
  return rawEntries.map((raw) => {
    const entry = normalizeFeedbackEntry(raw as Record<string, unknown>);
    const statementRatings = FEEDBACK_STATEMENTS.map((statement, index) => {
      const match = entry.answers.find(
        (answer) => answer.question.trim().toLowerCase() === statement.trim().toLowerCase()
      );
      if (match?.rating != null) return match.rating;
      const rated = entry.answers.filter((answer) => answer.rating != null);
      return rated[index]?.rating ?? null;
    });
    const numericRatings = statementRatings.filter((rating): rating is number => typeof rating === "number");
    const averageScore =
      numericRatings.length === 0
        ? 0
        : Number((numericRatings.reduce((sum, rating) => sum + rating, 0) / numericRatings.length).toFixed(1));
    const commentAnswer = entry.answers.find((answer) =>
      answer.question.toLowerCase().includes("additional comments")
    );

    return {
      traineeName: entry.traineeName,
      employeeId: "",
      departmentRole: "",
      feedbackDate: entry.submittedAt ? entry.submittedAt.slice(0, 10) : "",
      averageScore,
      comment: commentAnswer?.answer ?? "",
      statementRatings
    };
  });
}

type SessionSummary = {
  id: number;
  trainerId: string;
  assignedSupervisorId?: string | null;
  submittedPayload?: string | null;
  title: string;
  department?: string | null;
  trainingDate?: string | null;
  numberOfTrainees?: number | null;
  feedbackResponses: number;
  averageScore: number;
  status: string;
  recommendation: string;
  createdAt: string;
  feedbackClosesAt?: string | null;
  submittedAt?: string | null;
};

type TrainerDraftSnapshot = {
  trainerName?: string;
  trainerDepartment?: string;
  trainingTitle?: string;
  trainingDate?: string;
  trainingDurationDays?: string;
  trainingDurationHours?: string;
  numberOfTrainees?: string;
  feedbackOpenHours?: string;
  objectives?: string[];
  observedImprovement?: "Yes" | "No" | "";
  trainingFormats?: string[];
  targetUserGroup?: string;
  followUpSupervisorName?: string;
  applicationExtent?: string;
  observedImprovementDetails?: string;
  supportNeeded?: string;
  barriersComment?: string;
  workedWellComment?: string;
  effectivenessRating?: string;
  recommendationChoice?: string;
  trainerFutureSessionComment?: string;
  supervisorFutureSessionComment?: string;
  trainees?: { name: string; understanding: "Yes" | "No" | ""; independent: "Yes" | "No" | "" }[];
  signatures?: TrainingForm["submittedData"] extends infer S
    ? S extends { signatures?: infer Sig }
      ? Sig
      : never
    : never;
  signOff?: {
    trainerName?: string;
    trainerDate?: string;
    supervisorName?: string;
    supervisorDate?: string;
  };
  traineeRoster?: { name: string; departmentOrRole: string; attendance: "Yes" | "No" | "" }[];
};

export function toUiStatus(status: string): Status {
  const normalized = status.trim().toLowerCase();
  if (normalized === "submitted") return "Submitted";
  if (normalized === "under review") return "Under Review";
  if (normalized === "approved") return "Approved";
  if (normalized === "completed") return "Completed";
  if (normalized === "needs correction") return "Needs Correction";
  if (normalized === "feedback closed") return "Feedback Closed";
  if (normalized === "trainer assessment pending") return "Trainer Assessment Pending";
  if (normalized === "follow-up pending" || normalized === "followup pending") return "Follow-up Pending";
  if (normalized === "waiting for feedback") return "Waiting for Feedback";
  return "Draft";
}

function formatDate(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function snapshotToSubmittedData(snapshot: TrainerDraftSnapshot): TrainingForm["submittedData"] {
  return {
    trainerName: snapshot.trainerName ?? "",
    trainerDepartment: snapshot.trainerDepartment,
    trainingTitle: snapshot.trainingTitle ?? "",
    trainingDate: snapshot.trainingDate ?? "",
    durationDays: snapshot.trainingDurationDays ?? "",
    durationHours: snapshot.trainingDurationHours ?? "",
    numberOfTrainees: snapshot.numberOfTrainees ?? "",
    feedbackOpenHours: snapshot.feedbackOpenHours,
    objectives: snapshot.objectives ?? [],
    passRate: "-",
    averageScoreDisplay: "-",
    observedImprovement: snapshot.observedImprovement ?? "",
    trainingFormats: snapshot.trainingFormats ?? [],
    targetUserGroup: snapshot.targetUserGroup ?? "",
    followUpSupervisorName: snapshot.followUpSupervisorName,
    applicationExtent: snapshot.applicationExtent,
    observedImprovementDetails: snapshot.observedImprovementDetails,
    supportNeeded: snapshot.supportNeeded,
    barriersComment: snapshot.barriersComment,
    workedWellComment: snapshot.workedWellComment,
    effectivenessRating: snapshot.effectivenessRating,
    recommendationChoice: snapshot.recommendationChoice,
    trainerFutureSessionComment: snapshot.trainerFutureSessionComment,
    supervisorFutureSessionComment: snapshot.supervisorFutureSessionComment,
    trainees: snapshot.trainees,
    signatures: snapshot.signatures,
    signOff: snapshot.signOff,
    traineeRoster: snapshot.traineeRoster ?? []
  };
}

export function parseFormSnapshot(payload?: string | null): TrainingForm["submittedData"] | undefined {
  if (!payload) return undefined;
  try {
    return snapshotToSubmittedData(JSON.parse(payload) as TrainerDraftSnapshot);
  } catch {
    return undefined;
  }
}

export function mapBackendSessionToForm(
  session: SessionSummary,
  options?: { fallbackSupervisorId?: string; fallbackDepartment?: string }
): TrainingForm {
  const submittedData = parseFormSnapshot(session.submittedPayload);

  return {
    id: `F-${session.id}`,
    title: session.title || "Training Assessment",
    trainerId: session.trainerId,
    backendSessionId: session.id,
    assignedSupervisorId: session.assignedSupervisorId ?? options?.fallbackSupervisorId,
    department: session.department || options?.fallbackDepartment || "",
    date: formatDate(session.trainingDate) || formatDate(session.createdAt),
    trainees: session.numberOfTrainees ?? 0,
    feedbackResponses: session.feedbackResponses,
    averageScore: session.averageScore,
    status: toUiStatus(session.status),
    recommendation: session.recommendation || "Pending supervisor review",
    createdAt: formatDate(session.createdAt),
    feedbackClosesAt: session.feedbackClosesAt ?? undefined,
    submittedAt: formatDate(session.submittedAt),
    submittedData
  };
}
