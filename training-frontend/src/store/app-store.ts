// App state store for auth + assessment workflow.
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  buildTraineeFeedbackAnswers,
  getAllTrainingSessions,
  getSessionFeedbackEntries,
  getSupervisorSessions,
  getTrainerSessions,
  getUsers,
  loginUser,
  registerUser,
  setAuthToken,
  submitFeedback,
  submitSupervisorSignoff,
  updateUserApi
} from "../lib/api";
import { feedbackEntriesToSupervisorOnly, sessionSummaryToForm } from "../lib/session-mapper";
import type { NotificationItem, Role, TrainingForm, User } from "../types";

const users: User[] = [];

const forms: TrainingForm[] = [];

const notifications: NotificationItem[] = [];

type AppState = {
  users: User[];
  forms: TrainingForm[];
  notifications: NotificationItem[];
  currentUser: User | null;
  authToken: string | null;
  selectedReviewFormId: string | null;
  loading: boolean;
  loadUsers: () => Promise<void>;
  loadForms: () => Promise<void>;
  addUser: (payload: {
    name: string;
    email: string;
    password: string;
    role: Role;
    department: string;
    supervisorId?: string;
  }) => Promise<boolean>;
  updateUser: (
    id: string,
    patch: Partial<Pick<User, "name" | "email" | "role" | "department" | "supervisorId" | "isActive">>
  ) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setSelectedReviewFormId: (id: string | null) => void;
  updateFormStatus: (id: string, status: TrainingForm["status"]) => void;
  addForm: (form: TrainingForm) => void;
  removeForm: (id: string) => void;
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
    supervisorSignature?: string;
    formSnapshot?: string;
  }) => Promise<boolean>;
  markTrainerFeedbackRead: (formId: string) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      users,
      forms,
      notifications,
      currentUser: null,
      authToken: null,
      selectedReviewFormId: null,
      loading: false,
      loadUsers: async () => {
        const response = await getUsers();
        const backendUsers = response.map(apiUserToUser);
        const currentUser = get().currentUser;

        set({
          users: backendUsers,
          currentUser: currentUser
            ? backendUsers.find((user) => user.id === currentUser.id) ?? currentUser
            : null
        });
      },
      loadForms: async () => {
        const currentUser = get().currentUser;
        if (!currentUser) return;

        try {
          const sessions =
            currentUser.role === "admin"
              ? await getAllTrainingSessions()
              : currentUser.role === "supervisor"
                ? await getSupervisorSessions(currentUser.id)
                : await getTrainerSessions(currentUser.id);

          const localForms = get().forms;
          const apiForms = await Promise.all(
            sessions.map(async (session) => {
              const form = sessionSummaryToForm(session);
              if (!form.backendSessionId || form.feedbackResponses === 0) return form;

              try {
                const entries = await getSessionFeedbackEntries(form.backendSessionId);
                return {
                  ...form,
                  supervisorOnlyFeedback: feedbackEntriesToSupervisorOnly(entries)
                };
              } catch {
                return form;
              }
            })
          );

          const merged = apiForms.map((apiForm) => {
            const local = localForms.find((form) => form.id === apiForm.id);
            if (!local) return apiForm;

            return {
              ...apiForm,
              status: apiForm.supervisorReview ? apiForm.status : local.status === "COMPLETED" ? local.status : apiForm.status,
              supervisorReview: apiForm.supervisorReview ?? local.supervisorReview,
              supervisorReviewHistory: apiForm.supervisorReviewHistory ?? local.supervisorReviewHistory,
              trainerFeedbackReadAt: local.trainerFeedbackReadAt ?? apiForm.trainerFeedbackReadAt,
              submittedData: local.submittedData ?? apiForm.submittedData,
              supervisorOnlyFeedback:
                apiForm.supervisorOnlyFeedback && apiForm.supervisorOnlyFeedback.length > 0
                  ? apiForm.supervisorOnlyFeedback
                  : local.supervisorOnlyFeedback
            };
          });

          set({ forms: merged });
        } catch {
          // Keep existing local forms when the API is unavailable.
        }
      },
      addUser: async (payload) => {
        const email = payload.email.trim().toLowerCase();
        if (!email) return false;
        let newUser: User;
        try {
          const response = await registerUser({
            FullName: payload.name.trim() || email,
            Email: email,
            Password: payload.password,
            Role: roleToApiRole(payload.role),
            DepartmentId: payload.department.trim() || null,
            SupervisorId: payload.role === "trainer" ? payload.supervisorId ?? null : null
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
          await get().loadUsers();
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
      updateUser: async (id, patch) => {
        const existing = get().users.find((u) => u.id === id);
        if (!existing) return false;

        const nextRole = patch.role ?? existing.role;
        const nextSupervisorId = nextRole === "trainer" ? (patch.supervisorId ?? existing.supervisorId) : undefined;

        try {
          await updateUserApi(id, {
            Role: patch.role ? roleToApiRole(patch.role) : undefined,
            DepartmentId: patch.department !== undefined ? patch.department || null : undefined,
            SupervisorId: patch.supervisorId !== undefined ? patch.supervisorId || null : undefined
          });
        } catch {
          return false;
        }

        const currentUser = get().currentUser;
        set({
          users: get().users.map((u) => {
            if (u.id !== id) return u;
            return {
              ...u,
              ...patch,
              supervisorId: nextSupervisorId
            };
          }),
          currentUser:
            currentUser?.id === id
              ? {
                  ...currentUser,
                  ...patch,
                  supervisorId: nextSupervisorId
                }
              : currentUser
        });
        return true;
      },
      login: async (email, password) => {
        try {
          const response = await loginUser({ Email: email, Password: password });
          setAuthToken(response.token);

          const role = apiRoleToRole(response.role);
          let backendUsers: User[] = [];

          try {
            backendUsers = (await getUsers()).map(apiUserToUser);
          } catch {
            // Login still succeeds if the user list cannot be loaded.
          }

          const existing = backendUsers.find((u) => u.email.toLowerCase() === response.email.toLowerCase());
          const user: User = {
            id: response.userId,
            name: response.fullName,
            email: response.email,
            password: "",
            role,
            department: existing?.department ?? "",
            supervisorId: response.supervisorId ?? existing?.supervisorId,
            isActive: true
          };

          set({
            currentUser: user,
            authToken: response.token,
            users: backendUsers.some((u) => u.id === user.id) ? backendUsers : [user, ...backendUsers]
          });
          await get().loadForms();
          return true;
        } catch {
          setAuthToken(null);
          return false;
        }
      },
      logout: () => {
        setAuthToken(null);
        set({ currentUser: null, authToken: null });
      },
      setSelectedReviewFormId: (id) => set({ selectedReviewFormId: id }),
      updateFormStatus: (id, status) => set({ forms: get().forms.map((f) => (f.id === id ? { ...f, status } : f)) }),
      addForm: (form) =>
        set({
          forms: [form, ...get().forms.filter((existingForm) => existingForm.id !== form.id)]
        }),
      removeForm: (id) =>
        set({
          forms: get().forms.filter((form) => form.id !== id)
        }),
      submitTraineeFeedback: async (payload) => {
        const target = get().forms.find((form) => form.id === payload.formId);
        const sessionIdFromFormId = Number(payload.formId.replace(/^F-/, ""));
        const backendSessionId = target?.backendSessionId ?? (Number.isFinite(sessionIdFromFormId) ? sessionIdFromFormId : undefined);

        if (backendSessionId) {
          try {
            await submitFeedback({
              TrainingSessionId: backendSessionId,
              TraineeName: payload.traineeName,
              Answers: buildTraineeFeedbackAnswers(payload.statementRatings, payload.comment)
            });
          } catch {
            return false;
          }
        }

        if (!target) return true;

        set({
          forms: get().forms.map((form) => {
            if (form.id !== payload.formId) return form;

            const nextCount = form.feedbackResponses + 1;
            const nextAverage =
              (form.averageScore * form.feedbackResponses + payload.averageScore) / Math.max(1, nextCount);
            const responseLimitReached = form.trainees > 0 && nextCount >= form.trainees;

            return {
              ...form,
              feedbackResponses: nextCount,
              averageScore: Number(nextAverage.toFixed(1)),
              status: responseLimitReached ? "TRAINERASSESSMENTPENDING" : form.status,
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
                  status: "TRAINERASSESSMENTPENDING",
                  supervisorReview: review,
                  supervisorReviewHistory: [...(form.supervisorReviewHistory ?? []), review]
                }
              : form
          )
        });
        return true;
      },
      submitSupervisorReview: async (payload) => {
        const now = new Date().toISOString();
        const target = get().forms.find((form) => form.id === payload.formId);
        if (!target) return false;
        if (payload.decision === "Needs Changes" && !payload.comments.trim()) return false;

        const sessionId =
          target.backendSessionId ?? Number(payload.formId.replace(/^F-/, ""));
        if (Number.isFinite(sessionId) && sessionId > 0) {
          try {
            await submitSupervisorSignoff(sessionId, {
              Decision: payload.decision,
              Comments: payload.comments,
              SupervisorName: payload.reviewerName,
              SupervisorSignature:
                payload.supervisorSignature ??
                (payload.decision === "Approve" ? "Signed" : ""),
              FormSnapshot: payload.formSnapshot ?? null
            });
          } catch {
            return false;
          }
        }

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
        const nextStatus = payload.decision === "Approve" ? "COMPLETED" : "FOLLOWUPPENDING";
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
      name: "matateni-app-store-v10",
      partialize: (state) => ({
        currentUser: state.currentUser,
        authToken: state.authToken,
        selectedReviewFormId: state.selectedReviewFormId,
        forms: state.forms
      }),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<AppState>;
        const authToken = persisted.authToken ?? currentState.authToken;
        setAuthToken(authToken);
        const merged = {
          ...currentState,
          selectedReviewFormId: persisted.selectedReviewFormId ?? currentState.selectedReviewFormId,
          currentUser: persisted.currentUser ?? currentState.currentUser,
          authToken,
          forms: persisted.forms ?? currentState.forms
        };
        if (merged.currentUser && merged.authToken) {
          queueMicrotask(() => {
            const state = useAppStore.getState();
            void state.loadForms();
            void state.loadUsers();
          });
        }
        return merged;
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

function apiUserToUser(response: {
  userId: string;
  fullName: string;
  email: string;
  role: number | string;
  department?: string | null;
  supervisorId?: string | null;
}): User {
  return {
    id: response.userId,
    name: response.fullName,
    email: response.email,
    password: "",
    role: apiRoleToRole(response.role),
    department: response.department ?? "",
    supervisorId: response.supervisorId ?? undefined,
    isActive: true
  };
}