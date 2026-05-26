// Lightweight demo state store (mock auth + mock form workflow) for frontend-only behavior.
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { NotificationItem, Role, TrainingForm, User } from "../types";

const users: User[] = [
  { id: "u1", name: "Nandi Dlamini", email: "trainer@matateni.com", password: "demo123", role: "trainer", department: "Operations" },
  { id: "u2", name: "Sipho Mokoena", email: "supervisor@matateni.com", password: "demo123", role: "supervisor", department: "Operations" },
  { id: "u3", name: "Thabo Nkosi", email: "admin@matateni.com", password: "demo123", role: "admin", department: "People Ops" }
];

const forms: TrainingForm[] = [
  { id: "F-1021", title: "SAP Inventory Basics", trainerId: "u1", department: "Operations", date: "2026-05-20", trainees: 18, feedbackResponses: 14, averageScore: 4.2, status: "Waiting for Feedback", recommendation: "Proceed", createdAt: "2026-05-20" },
  {
    id: "F-1022",
    title: "Safety Incident Reporting",
    trainerId: "u1",
    department: "Safety",
    date: "2026-05-18",
    trainees: 12,
    feedbackResponses: 12,
    averageScore: 4.6,
    status: "Needs Correction",
    recommendation: "Proceed",
    createdAt: "2026-05-18",
    supervisorReview: {
      decision: "Needs Changes",
      comments: "Good coverage, but add more practical incident examples in Section C and improve clarity in final reflection.",
      actionItems: ["Add 2 practical examples to Section C", "Update reflection to include measurable outcomes"],
      dueDate: "2026-05-30",
      sectionFeedback: [
        { section: "C: Feedback", verdict: "Revise", comment: "Include practical examples for trainees." },
        { section: "D/E: Skills & Follow-up", verdict: "OK", comment: "Looks fine." },
        { section: "F: Reflection", verdict: "Revise", comment: "Be more specific with improvements." }
      ],
      stage: "submitted",
      submittedAt: "2026-05-25T10:00:00.000Z",
      submittedBy: "Sipho Mokoena",
      updatedAt: "2026-05-25T10:00:00.000Z"
    }
  },
  { id: "F-1023", title: "Shift Handover Protocol", trainerId: "u1", department: "Operations", date: "2026-05-14", trainees: 10, feedbackResponses: 9, averageScore: 3.8, status: "Needs Correction", recommendation: "Adjust examples", createdAt: "2026-05-14" },
  { id: "F-1024", title: "Warehouse Compliance", trainerId: "u1", department: "Compliance", date: "2026-05-12", trainees: 22, feedbackResponses: 22, averageScore: 4.5, status: "Approved", recommendation: "Scale", createdAt: "2026-05-12" }
];

const notifications: NotificationItem[] = [
  { id: "n1", title: "New review queued", body: "Form F-1022 is awaiting supervisor review.", time: "2m", read: false },
  { id: "n2", title: "Feedback threshold met", body: "SAP Inventory Basics reached 75% feedback responses.", time: "18m", read: false },
  { id: "n3", title: "Policy update", body: "Compliance template v3 is now active.", time: "1h", read: true }
];

type AppState = {
  users: User[];
  forms: TrainingForm[];
  notifications: NotificationItem[];
  currentUser: User | null;
  selectedReviewFormId: string | null;
  loading: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  setSelectedReviewFormId: (id: string | null) => void;
  updateFormStatus: (id: string, status: TrainingForm["status"]) => void;
  addForm: (form: TrainingForm) => void;
  submitTraineeFeedback: (payload: {
    formId: string;
    traineeName: string;
    employeeId: string;
    departmentRole: string;
    feedbackDate: string;
    averageScore: number;
    comment: string;
    statementRatings: (number | null)[];
  }) => boolean;
  saveSupervisorReviewDraft: (payload: {
    formId: string;
    decision: "Approve" | "Needs Changes" | "Reject";
    comments: string;
    actionItems: string[];
    dueDate?: string;
    sectionFeedback: { section: string; verdict: "OK" | "Revise"; comment: string }[];
    reviewerName: string;
  }) => boolean;
  submitSupervisorReview: (payload: {
    formId: string;
    decision: "Approve" | "Needs Changes" | "Reject";
    comments: string;
    actionItems: string[];
    dueDate?: string;
    sectionFeedback: { section: string; verdict: "OK" | "Revise"; comment: string }[];
    reviewerName: string;
  }) => boolean;
  markTrainerFeedbackRead: (formId: string) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      users,
      forms,
      notifications,
      currentUser: null,
      selectedReviewFormId: null,
      loading: false,
      login: (email, password) => {
        const user = get().users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        if (!user) return false;
        set({ currentUser: user });
        return true;
      },
      logout: () => set({ currentUser: null }),
      setSelectedReviewFormId: (id) => set({ selectedReviewFormId: id }),
      updateFormStatus: (id, status) => set({ forms: get().forms.map((f) => (f.id === id ? { ...f, status } : f)) }),
      addForm: (form) =>
        set({
          forms: [form, ...get().forms.filter((existingForm) => existingForm.id !== form.id)]
        }),
      submitTraineeFeedback: (payload) => {
        const target = get().forms.find((form) => form.id === payload.formId);
        if (!target) return false;

        set({
          forms: get().forms.map((form) => {
            if (form.id !== payload.formId) return form;

            const nextCount = form.feedbackResponses + 1;
            const nextAverage =
              (form.averageScore * form.feedbackResponses + payload.averageScore) / Math.max(1, nextCount);

            return {
              ...form,
              feedbackResponses: nextCount,
              averageScore: Number(nextAverage.toFixed(1)),
              status: "Submitted",
              supervisorOnlyFeedback: [
                ...(form.supervisorOnlyFeedback ?? []),
                {
                  traineeName: payload.traineeName,
                  employeeId: payload.employeeId,
                  departmentRole: payload.departmentRole,
                  feedbackDate: payload.feedbackDate,
                  averageScore: payload.averageScore,
                  comment: payload.comment,
                  statementRatings: payload.statementRatings
                }
              ]
            };
          })
        });
        return true;
      },
      saveSupervisorReviewDraft: (payload) => {
        const now = new Date().toISOString();
        const target = get().forms.find((form) => form.id === payload.formId);
        if (!target) return false;
        const review = {
          decision: payload.decision,
          comments: payload.comments,
          actionItems: payload.actionItems,
          dueDate: payload.dueDate,
          sectionFeedback: payload.sectionFeedback,
          stage: "draft" as const,
          submittedBy: payload.reviewerName,
          updatedAt: now
        };
        set({
          forms: get().forms.map((form) =>
            form.id === payload.formId
              ? {
                  ...form,
                  status: "Under Review",
                  supervisorReview: review,
                  supervisorReviewHistory: [...(form.supervisorReviewHistory ?? []), review]
                }
              : form
          )
        });
        return true;
      },
      submitSupervisorReview: (payload) => {
        const now = new Date().toISOString();
        const target = get().forms.find((form) => form.id === payload.formId);
        if (!target) return false;
        const review = {
          decision: payload.decision,
          comments: payload.comments,
          actionItems: payload.actionItems,
          dueDate: payload.dueDate,
          sectionFeedback: payload.sectionFeedback,
          stage: "submitted" as const,
          submittedAt: now,
          submittedBy: payload.reviewerName,
          updatedAt: now
        };
        const nextStatus =
          payload.decision === "Approve"
            ? "Approved"
            : payload.decision === "Needs Changes"
              ? "Needs Correction"
              : "Rejected";
        set({
          forms: get().forms.map((form) =>
            form.id === payload.formId
              ? {
                  ...form,
                  status: nextStatus,
                  supervisorReview: review,
                  trainerFeedbackReadAt: undefined,
                  supervisorReviewHistory: [...(form.supervisorReviewHistory ?? []), review]
                }
              : form
          )
        });
        return true;
      },
      markTrainerFeedbackRead: (formId) => {
        set({
          forms: get().forms.map((form) =>
            form.id === formId
              ? { ...form, trainerFeedbackReadAt: form.trainerFeedbackReadAt ?? new Date().toISOString() }
              : form
          )
        });
      }
    }),
    {
      name: "matateni-app-store"
    }
  )
);

export function dashboardRouteByRole(role: Role) {
  if (role === "trainer") return "/trainer/create";
  if (role === "supervisor") return "/supervisor";
  return "/admin";
}


