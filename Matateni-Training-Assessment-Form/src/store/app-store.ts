// App state store for auth + assessment workflow.
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { loginUser, registerUser, submitFeedback } from "../lib/api";
import type { NotificationItem, Role, TrainingForm, User } from "../types";

const users: User[] = [];

const forms: TrainingForm[] = [];

const notifications: NotificationItem[] = [];

type AppState = {
  users: User[];
  forms: TrainingForm[];
  notifications: NotificationItem[];
  currentUser: User | null;
  selectedReviewFormId: string | null;
  loading: boolean;
  addUser: (payload: {
    name: string;
    email: string;
    password: string;
    role: Role;
    department: string;
    supervisorId?: string;
  }) => Promise<boolean>;
  updateUser: (id: string, patch: Partial<Pick<User, "name" | "email" | "role" | "department" | "supervisorId" | "isActive">>) => boolean;
  login: (email: string, password: string) => Promise<boolean>;
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
  }) => Promise<boolean>;
  saveSupervisorReviewDraft: (payload: {
    formId: string;
    decision: "Approve" | "Needs Changes";
    comments: string;
    actionItems: string[];
    dueDate?: string;
    sectionFeedback: { section: string; verdict: "OK" | "Revise"; comment: string }[];
    reviewerName: string;
  }) => boolean;
  submitSupervisorReview: (payload: {
    formId: string;
    decision: "Approve" | "Needs Changes";
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
      addUser: async (payload) => {
        const email = payload.email.trim().toLowerCase();
        if (!email) return false;
        if (get().users.some((u) => u.email.toLowerCase() === email)) return false;
        let newUser: User;
        try {
          const response = await registerUser({
            FullName: payload.name.trim() || email,
            Email: email,
            Password: payload.password,
            Role: roleToApiRole(payload.role),
            DepartmentId: null
          });
          newUser = {
            id: response.userId,
            name: response.fullName,
            email: response.email,
            password: "",
            role: apiRoleToRole(response.role),
            department: payload.department.trim(),
            supervisorId: payload.role === "trainer" ? payload.supervisorId : undefined,
            isActive: true
          };
        } catch {
          return false;
        }

        set({
          users: [newUser, ...get().users],
          notifications: [
            {
              id: `n-${Date.now()}`,
              title: "User added",
              body: `${newUser.email} created as ${newUser.role}.`,
              time: new Date().toISOString(),
              read: false
            },
            ...get().notifications
          ]
        });
        return true;
      },
      updateUser: (id, patch) => {
        const existing = get().users.find((u) => u.id === id);
        if (!existing) return false;
        set({
          users: get().users.map((u) => {
            if (u.id !== id) return u;
            const nextRole = patch.role ?? u.role;
            return {
              ...u,
              ...patch,
              supervisorId: nextRole === "trainer" ? (patch.supervisorId ?? u.supervisorId) : undefined
            };
          })
        });
        return true;
      },
      login: async (email, password) => {
        try {
          const response = await loginUser({ Email: email, Password: password });
          const role = apiRoleToRole(response.role);
          const existing = get().users.find((u) => u.email.toLowerCase() === response.email.toLowerCase());
          const user: User = {
            id: response.userId,
            name: response.fullName,
            email: response.email,
            password: "",
            role,
            department: existing?.department ?? "",
            supervisorId: existing?.supervisorId,
            isActive: true
          };

          set({
            currentUser: user,
            users: [user, ...get().users.filter((u) => u.email.toLowerCase() !== user.email.toLowerCase())]
          });
          return true;
        } catch {
          return false;
        }
      },
      logout: () => set({ currentUser: null }),
      setSelectedReviewFormId: (id) => set({ selectedReviewFormId: id }),
      updateFormStatus: (id, status) => set({ forms: get().forms.map((f) => (f.id === id ? { ...f, status } : f)) }),
      addForm: (form) =>
        set({
          forms: [form, ...get().forms.filter((existingForm) => existingForm.id !== form.id)]
        }),
      submitTraineeFeedback: async (payload) => {
        const target = get().forms.find((form) => form.id === payload.formId);
        if (!target) return false;

        const trainingSessionId = Number(payload.formId.replace(/^F-/, ""));
        if (Number.isFinite(trainingSessionId) && trainingSessionId > 0) {
          const answers = payload.statementRatings.map((rating, index) => ({
            Question: [
              "The training objectives were clear.",
              "The content was relevant to my role.",
              "The trainer was knowledgeable and organised.",
              "The pace and duration of training were appropriate.",
              "Practical exercises / workplace examples were useful.",
              "The training will help me perform my job more effectively."
            ][index],
            Answer: "",
            Rating: rating ?? null
          }));

          if (payload.comment.trim()) {
            answers.push({ Question: "Additional comments", Answer: payload.comment.trim(), Rating: null });
          }

          try {
            await submitFeedback({
              TrainingSessionId: trainingSessionId,
              TraineeName: payload.traineeName,
              Answers: answers
            });
          } catch {
            return false;
          }
        }

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
              // Keep drafts as drafts until trainer explicitly submits the full form.
              status: form.status === "Draft" ? "Draft" : form.status,
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
        if (payload.decision === "Needs Changes" && !payload.comments.trim()) return false;
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
        if (payload.decision === "Needs Changes" && !payload.comments.trim()) return false;
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
        const nextStatus = payload.decision === "Approve" ? "Approved" : "Needs Correction";
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
          ),
          notifications: [
            {
              id: `n-${Date.now()}`,
              title: "Supervisor review submitted",
              body: `${target.title} was marked ${nextStatus}.`,
              time: now,
              read: false
            },
            ...get().notifications
          ]
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
      name: "matateni-app-store-v6",
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<AppState>;
        return {
          ...currentState,
          ...persisted,
          forms: Array.isArray(persisted.forms) ? persisted.forms : currentState.forms,
          users: sanitizePersistedUsers(persisted.users),
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

function roleToApiRole(role: Role) {
  if (role === "trainer") return 0;
  if (role === "supervisor") return 1;
  return 2;
}

function apiRoleToRole(role: number | string): Role {
  if (role === 0 || String(role).toLowerCase() === "trainer") return "trainer";
  if (role === 1 || String(role).toLowerCase() === "supervisor") return "supervisor";
  return "admin";
}

function sanitizePersistedUsers(persistedUsers: AppState["users"] | undefined) {
  if (!Array.isArray(persistedUsers)) return users;

  const oldDemoEmails = new Set(["trainer@matateni.com", "supervisor@matateni.com", "admin@matateni.com"]);

  return persistedUsers
    .filter((user) => !(oldDemoEmails.has(user.email.toLowerCase()) && user.password === "demo123"))
    .map((user) => ({ ...user, password: "" }));
}





