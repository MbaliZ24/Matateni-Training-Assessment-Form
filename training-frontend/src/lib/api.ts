export type CreateTrainingSessionDto = {
  TrainerId: string;
  Title: string;
  Department?: string;
  TrainingDate?: string;
  DurationDays?: number;
  DurationHours?: number;
  NumberOfTrainees?: number;
  TrainingFormat: string[];
  TargetAudience?: string;
  Objectives: string[];
  FeedbackOpenHours?: number;
};

export type CreateFeedbackAnswerDto = {
  Question: string;
  Answer: string;
  Rating?: number | null;
};

export type CreateFeedbackSubmissionDto = {
  TrainingSessionId: number;
  TraineeName: string;
  Answers: CreateFeedbackAnswerDto[];
};

export type TrainingSessionSummaryDto = {
  id: number;
  trainerId: string;
  assignedSupervisorId?: string | null;
  submittedPayload?: string | null;
  draftPayload?: string | null;
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
  supervisorReviewDecision?: string | null;
  supervisorReviewComments?: string | null;
  supervisorSignedBy?: string | null;
  supervisorSignedAt?: string | null;
};

export type SubmitSupervisorSignoffDto = {
  Decision: "Approve" | "Needs Changes";
  Comments: string;
  SupervisorName: string;
  SupervisorSignature: string;
  FormSnapshot?: string | null;
};

export type FeedbackAnswerDto = {
  question: string;
  answer: string;
  rating?: number | null;
};

export type TraineeFeedbackEntryDto = {
  traineeName: string;
  submittedAt: string;
  answers: FeedbackAnswerDto[];
};

type ApiRole = 0 | 1 | 2;

type AuthResponseDto = {
  token: string;
  userId: string;
  fullName: string;
  email: string;
  role: ApiRole | "TRAINER" | "SUPERVISOR" | "ADMIN" | "trainer" | "supervisor" | "admin";
  supervisorId?: string | null;
};

type UserDto = AuthResponseDto & {
  departmentId?: string | null;
  department?: string;
};

type RegisterUserDto = {
  FullName: string;
  Email: string;
  Password: string;
  Role: ApiRole;
  DepartmentId?: string | null;
  SupervisorId?: string | null;
};

type UpdateUserDto = {
  Role?: ApiRole;
  DepartmentId?: string | null;
  SupervisorId?: string | null;
};

type LoginDto = {
  Email: string;
  Password: string;
};

export type CreateTrainerReportDto = {
  TrainingSessionId: number;
  TraineeAssessments: {
    TraineeName: string;
    DemonstratedUnderstanding: boolean;
    CanPerformIndependently: boolean;
    Status: string;
  }[];
  SkillApplicationLevel: string;
  PerformanceImproved: boolean;
  SupportNeeded: string;
  Comments?: string | null;
  WhatWorkedWell: string;
  Improvements: string;
  TrainerComment: string;
  SupervisorComment?: string | null;
  EffectivenessRating: string;
  Recommendation: string;
  TrainerName: string;
  TrainerSignature: string;
  FormSnapshot?: string | null;
};

export type PublicTrainingSessionDto = {
  id: number;
  title: string;
  status: string;
  feedbackClosesAt?: string | null;
  feedbackOpen: boolean;
};

export type SaveTrainingSessionDraftDto = {
  SessionId?: number | null;
  TrainerId: string;
  Title: string;
  Department?: string;
  TrainingDate?: string;
  DurationDays?: number;
  DurationHours?: number;
  NumberOfTrainees?: number;
  TrainingFormat: string[];
  TargetAudience?: string;
  Objectives: string[];
  DraftPayload?: string | null;
};

export type PublishTrainingSessionDto = {
  TrainerId: string;
  FeedbackOpenHours: number;
};

export type TrainingSessionDetailDto = {
  id: number;
  trainerId: string;
  title: string;
  department?: string | null;
  trainingDate?: string | null;
  durationDays?: number | null;
  durationHours?: number | null;
  numberOfTrainees?: number | null;
  trainingFormat: string[];
  targetAudience?: string | null;
  objectives: string[];
  status: string;
  draftPayload?: string | null;
  submittedPayload?: string | null;
  assignedSupervisorId?: string | null;
  feedbackClosesAt?: string | null;
  createdAt: string;
};

export const TRAINEE_FEEDBACK_STATEMENTS = [
  "The training objectives were clear.",
  "The content was relevant to my role.",
  "The trainer was knowledgeable and organised.",
  "The pace and duration of training were appropriate.",
  "Practical exercises / workplace examples were useful.",
  "The training will help me perform my job more effectively."
] as const;

const apiBase = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

function getApiUrl(path: string) {
  return apiBase ? `${apiBase}${path}` : path;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await fetch(getApiUrl(path), { ...init, headers });
  const contentType = response.headers.get("content-type");

  if (!response.ok) {
    const errorText = contentType?.includes("application/json")
      ? await response.json().then((json) => JSON.stringify(json))
      : await response.text();
    throw new Error(errorText || response.statusText);
  }

  if (contentType?.includes("application/json")) {
    return response.json();
  }

  return Promise.resolve({} as T);
}

export function buildTraineeFeedbackAnswers(
  statementRatings: (number | null)[],
  comment: string
): CreateFeedbackAnswerDto[] {
  const answers: CreateFeedbackAnswerDto[] = statementRatings.map((rating, index) => ({
    Question: TRAINEE_FEEDBACK_STATEMENTS[index],
    Answer: "",
    Rating: rating ?? null
  }));

  if (comment.trim()) {
    answers.push({ Question: "Additional comments", Answer: comment.trim(), Rating: null });
  }

  return answers;
}

export async function getTrainerSessions(trainerId: string) {
  return fetchJson<TrainingSessionSummaryDto[]>(`/api/TrainingSessions/trainer/${encodeURIComponent(trainerId)}`);
}

export async function getSupervisorSessions(supervisorId: string) {
  return fetchJson<TrainingSessionSummaryDto[]>(`/api/TrainingSessions/supervisor/${encodeURIComponent(supervisorId)}`);
}

export async function getAllTrainingSessions() {
  return fetchJson<TrainingSessionSummaryDto[]>("/api/TrainingSessions");
}

export async function getPublicTrainingSession(sessionId: number) {
  return fetchJson<PublicTrainingSessionDto>(`/api/TrainingSessions/${sessionId}/public`);
}

export async function saveTrainingSessionDraft(payload: SaveTrainingSessionDraftDto) {
  return fetchJson<{ sessionId: number; message: string }>("/api/TrainingSessions/draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function getTrainingSession(sessionId: number) {
  return fetchJson<TrainingSessionDetailDto>(`/api/TrainingSessions/${sessionId}`);
}

export async function deleteTrainingSessionDraft(sessionId: number, trainerId: string) {
  return fetchJson<{ message: string }>(
    `/api/TrainingSessions/${sessionId}/draft?trainerId=${encodeURIComponent(trainerId)}`,
    { method: "DELETE" }
  );
}

export async function publishTrainingSession(sessionId: number, payload: PublishTrainingSessionDto) {
  return fetchJson<{ sessionId: number; message: string }>(`/api/TrainingSessions/${sessionId}/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function submitFeedback(payload: CreateFeedbackSubmissionDto) {
  return fetchJson<{ submissionId: number; message: string }>("/api/Feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function getSessionFeedbackEntries(sessionId: number) {
  return fetchJson<TraineeFeedbackEntryDto[]>(`/api/Feedback/session/${sessionId}/entries`);
}

export function getTrainingSessionQrUrl(sessionId: number) {
  return getApiUrl(`/api/TrainingSessions/${sessionId}/qr`);
}

export async function loginUser(payload: LoginDto) {
  const raw = await fetchJson<AuthResponseDto & Record<string, unknown>>("/api/Auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return {
    token: String(raw.token ?? raw.Token ?? ""),
    userId: String(raw.userId ?? raw.UserId ?? ""),
    fullName: String(raw.fullName ?? raw.FullName ?? ""),
    email: String(raw.email ?? raw.Email ?? ""),
    role: (raw.role ?? raw.Role ?? 0) as AuthResponseDto["role"],
    supervisorId: (raw.supervisorId ?? raw.SupervisorId ?? null) as string | null | undefined
  };
}

export async function registerUser(payload: RegisterUserDto) {
  return fetchJson<AuthResponseDto>("/api/Auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function getUsers() {
  return fetchJson<UserDto[]>("/api/Auth/users");
}

export async function updateUserApi(userId: string, payload: UpdateUserDto) {
  return fetchJson<UserDto>(`/api/Auth/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function saveTrainerReport(payload: CreateTrainerReportDto) {
  return fetchJson<{ id: number; message: string }>("/api/TrainerReport", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function submitTrainerReport(reportId: number, formSnapshot?: string) {
  return fetchJson<string>(`/api/TrainerReport/${reportId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ FormSnapshot: formSnapshot ?? null })
  });
}

export async function submitSupervisorSignoff(sessionId: number, payload: SubmitSupervisorSignoffDto) {
  return fetchJson<{ message: string }>(`/api/TrainerReport/session/${sessionId}/supervisor-signoff`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}
