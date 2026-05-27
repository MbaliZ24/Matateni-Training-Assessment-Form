// App state store for auth + assessment workflow.
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { NotificationItem, Role, TrainingForm, User } from "../types";

const users: User[] = [
  { id: "u1", name: "", email: "trainer@matateni.com", password: "demo123", role: "trainer", department: "Operations", supervisorId: "u2" },
  { id: "u2", name: "", email: "supervisor@matateni.com", password: "demo123", role: "supervisor", department: "Operations" },
  { id: "u3", name: "", email: "admin@matateni.com", password: "demo123", role: "admin", department: "People Ops" }
];

const forms: TrainingForm[] = [];

const notifications: NotificationItem[] = [];

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
      name: "matateni-app-store-v4",
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<AppState>;
        const persistedForms = Array.isArray(persisted.forms) ? persisted.forms : currentState.forms;
        const migratedForms = persistedForms.map((form) => {
          if (form.assignedSupervisorId) return form;
          const trainer = users.find((u) => u.id === form.trainerId);
          return {
            ...form,
            assignedSupervisorId: trainer?.supervisorId
          };
        });
        return {
          ...currentState,
          ...persisted,
          forms: migratedForms,
          // Always use source-of-truth mock users from code, not stale persisted users.
          users,
          // Force fresh login each run so stale currentUser profiles don't leak old names.
          currentUser: null
        };
      }
    }
  )
);

export function dashboardRouteByRole(role: Role) {
  if (role === "trainer") return "/trainer/create";
  if (role === "supervisor") return "/supervisor";
  return "/admin";
}




