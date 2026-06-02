type CreateTrainingSessionDto = {
  TrainerId: number;
  Title: string;
  Department?: string;
  TrainingDate?: string;
  DurationDays?: number;
  DurationHours?: number;
  NumberOfTrainees?: number;
  TrainingFormat: string[];
  TargetAudience?: string;
  Objectives: string[];
};

type CreateFeedbackAnswerDto = {
  Question: string;
  Answer: string;
  Rating?: number | null;
};

type CreateFeedbackSubmissionDto = {
  TrainingSessionId: number;
  TraineeName: string;
  Answers: CreateFeedbackAnswerDto[];
};

type ApiRole = 0 | 1 | 2;

type AuthResponseDto = {
  token: string;
  userId: string;
  fullName: string;
  email: string;
  role: ApiRole | "TRAINER" | "SUPERVISOR" | "ADMIN" | "trainer" | "supervisor" | "admin";
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
};

type LoginDto = {
  Email: string;
  Password: string;
};

type CreateTrainerReportDto = {
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
};

const apiBase = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";

function getApiUrl(path: string) {
  return apiBase ? `${apiBase}${path}` : path;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(getApiUrl(path), init);
  const contentType = response.headers.get("content-type");

  if (!response.ok) {
    const errorText = contentType?.includes("application/json") ? await response.json().then((json) => JSON.stringify(json)) : await response.text();
    throw new Error(errorText || response.statusText);
  }

  if (contentType?.includes("application/json")) {
    return response.json();
  }

  return Promise.resolve({} as T);
}

export async function createTrainingSession(payload: CreateTrainingSessionDto) {
  return fetchJson<{ sessionId: number; message: string }>("/api/TrainingSessions", {
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

export async function getFeedbackSummary(sessionId: number) {
  return fetchJson<unknown>(`/api/Feedback/session/${sessionId}/summary`);
}

export function getTrainingSessionQrUrl(sessionId: number) {
  return getApiUrl(`/api/TrainingSessions/${sessionId}/qr`);
}

export async function loginUser(payload: LoginDto) {
  return fetchJson<AuthResponseDto>("/api/Auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
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

export async function saveTrainerReport(payload: CreateTrainerReportDto) {
  return fetchJson<{ id: number; message: string }>("/api/TrainerReport", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function getTrainerReportBySessionId(sessionId: number) {
  return fetchJson<unknown>(`/api/TrainerReport/session/${sessionId}`);
}

export async function submitTrainerReport(reportId: number) {
  return fetchJson<string>(`/api/TrainerReport/${reportId}/submit`, {
    method: "POST"
  });
}
