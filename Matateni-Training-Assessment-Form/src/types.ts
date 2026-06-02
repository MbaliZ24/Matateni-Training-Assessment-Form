// Shared domain types so pages, store, and UI stay aligned.
export type Role = "trainer" | "supervisor" | "admin";

export type Status =
  | "Draft"
  | "Waiting for Feedback"
  | "Submitted"
  | "Under Review"
  | "Approved"
  | "Needs Correction"
  | "Completed";

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  department: string;
  supervisorId?: string;
  isActive?: boolean;
};

export type TrainingForm = {
  id: string;
  title: string;
  trainerId: string;
  assignedSupervisorId?: string;
  department: string;
  date: string;
  trainees: number;
  feedbackResponses: number;
  averageScore: number;
  status: Status;
  recommendation: string;
  createdAt: string;
  submittedAt?: string;
  submittedData?: {
    trainerName: string;
    trainerDepartment?: string;
    trainingTitle: string;
    trainingDate: string;
    durationDays: string;
    durationHours: string;
    numberOfTrainees: string;
    objectives: string[];
    passRate: string;
    averageScoreDisplay: string;
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
    perStatementAverages?: number[];
    trainerFutureSessionComment?: string;
    supervisorFutureSessionComment?: string;
    trainees?: { name: string; understanding: "Yes" | "No" | ""; independent: "Yes" | "No" | "" }[];
    signatures?: {
      trainer: boolean;
      supervisor: boolean;
      trainerImage?: string;
      supervisorImage?: string;
    };
    signOff?: {
      trainerName?: string;
      trainerDate?: string;
      supervisorName?: string;
      supervisorDate?: string;
    };
    traineeRoster: { name: string; departmentOrRole: string; attendance: "Yes" | "No" | "" }[];
  };
  supervisorOnlyFeedback?: {
    traineeName: string;
    employeeId: string;
    departmentRole: string;
    feedbackDate: string;
    averageScore: number;
    comment: string;
    statementRatings?: (number | null)[];
  }[];
  supervisorReview?: {
    decision: "Approve" | "Needs Changes";
    comments: string;
    actionItems: string[];
    dueDate?: string;
    sectionFeedback: { section: string; verdict: "OK" | "Revise"; comment: string }[];
    stage: "draft" | "submitted" | "final_approved";
    submittedAt?: string;
    submittedBy?: string;
    updatedAt: string;
  };
  supervisorReviewHistory?: {
    decision: "Approve" | "Needs Changes";
    comments: string;
    actionItems: string[];
    dueDate?: string;
    sectionFeedback: { section: string; verdict: "OK" | "Revise"; comment: string }[];
    stage: "draft" | "submitted" | "final_approved";
    submittedAt?: string;
    submittedBy?: string;
    updatedAt: string;
  }[];
  trainerFeedbackReadAt?: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
};

