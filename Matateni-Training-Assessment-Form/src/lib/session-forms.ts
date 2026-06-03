import type { Status, TrainingForm } from "../types";

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
