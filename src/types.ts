export type Role = "trainer" | "supervisor" | "admin";

export type Status =
  | "Draft"
  | "Waiting for Feedback"
  | "Submitted"
  | "Under Review"
  | "Approved"
  | "Needs Correction"
  | "Rejected"
  | "Completed";

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  department: string;
};

export type TrainingForm = {
  id: string;
  title: string;
  trainerId: string;
  department: string;
  date: string;
  trainees: number;
  feedbackResponses: number;
  averageScore: number;
  status: Status;
  recommendation: string;
  createdAt: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
};
