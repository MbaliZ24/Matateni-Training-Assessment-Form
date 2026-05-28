// App state store for auth + assessment workflow.
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { NotificationItem, Role, TrainingForm, User } from "../types";

const users: User[] = [
  { id: "u1", name: "", email: "trainer@matateni.com", password: "demo123", role: "trainer", department: "Operations", supervisorId: "u2" },
  { id: "u2", name: "", email: "supervisor@matateni.com", password: "demo123", role: "supervisor", department: "Operations" },
  { id: "u3", name: "", email: "admin@matateni.com", password: "demo123", role: "admin", department: "People Ops" }
];

const forms: TrainingForm[] = [
  {
    id: "F-DEMO-001",
    title: "Warehouse Safety Induction",
    trainerId: "u1",
    assignedSupervisorId: "u2",
    department: "Operations",
    date: "2026-05-28",
    trainees: 8,
    feedbackResponses: 5,
    averageScore: 4.3,
    status: "Approved",
    recommendation: "Proceed as is",
    createdAt: "2026-05-28",
    submittedData: {
      trainerName: "Demo Trainer",
      trainerDepartment: "Operations",
      trainingTitle: "Warehouse Safety Induction",
      trainingDate: "2026-05-28",
      durationDays: "1",
      durationHours: "4",
      numberOfTrainees: "8",
      objectives: [
        "Explain PPE requirements for each warehouse zone",
        "Apply emergency response protocol in incident simulations",
        "Demonstrate safe handling of loading-bay equipment"
      ],
      passRate: "6 / 8 trainees",
      averageScoreDisplay: "4.3 / 5",
      observedImprovement: "Yes",
      trainingFormats: ["Classroom", "Workplace-based"],
      targetUserGroup: "Warehouse operators",
      applicationExtent: "Largely",
      observedImprovementDetails: "Most trainees applied PPE and checklist steps correctly in practical drills.",
      supportNeeded: "Minimal",
      barriersComment: "Minor delays during shift handover reduced practice time for two trainees.",
      workedWellComment: "Scenario-based drills improved confidence and retention.",
      effectivenessRating: "Very Good",
      recommendationChoice: "Proceed as is",
      trainerFutureSessionComment: "Add a 10-minute recap quiz at end of session.",
      supervisorFutureSessionComment: "Include one extra forklift spot-check scenario next month.",
      trainees: [
        { name: "Lebo Mokoena", understanding: "Yes", independent: "Yes" },
        { name: "Anele Dube", understanding: "Yes", independent: "Yes" },
        { name: "Kamo Ndlovu", understanding: "Yes", independent: "No" },
        { name: "Palesa Ncube", understanding: "Yes", independent: "Yes" },
        { name: "Sizwe Khumalo", understanding: "No", independent: "No" },
        { name: "Nomsa Dlamini", understanding: "Yes", independent: "Yes" },
        { name: "Bongani Mthembu", understanding: "Yes", independent: "Yes" },
        { name: "Thandi Zulu", understanding: "Yes", independent: "No" }
      ],
      signatures: { trainer: true, supervisor: true },
      signOff: {
        trainerName: "Demo Trainer",
        trainerDate: "2026-05-28",
        supervisorName: "Demo Supervisor",
        supervisorDate: "2026-05-28"
      },
      traineeRoster: [
        { name: "Lebo Mokoena", departmentOrRole: "Warehouse Operator", attendance: "Yes" },
        { name: "Anele Dube", departmentOrRole: "Warehouse Operator", attendance: "Yes" },
        { name: "Kamo Ndlovu", departmentOrRole: "Warehouse Operator", attendance: "Yes" },
        { name: "Palesa Ncube", departmentOrRole: "Warehouse Operator", attendance: "Yes" },
        { name: "Sizwe Khumalo", departmentOrRole: "Warehouse Operator", attendance: "Yes" },
        { name: "Nomsa Dlamini", departmentOrRole: "Warehouse Operator", attendance: "Yes" },
        { name: "Bongani Mthembu", departmentOrRole: "Warehouse Operator", attendance: "Yes" },
        { name: "Thandi Zulu", departmentOrRole: "Warehouse Operator", attendance: "Yes" }
      ]
    },
    supervisorOnlyFeedback: [
      {
        traineeName: "Lebo Mokoena",
        employeeId: "EMP-101",
        departmentRole: "Warehouse Operator",
        feedbackDate: "2026-05-28",
        averageScore: 4.7,
        comment: "Very practical and easy to follow.",
        statementRatings: [5, 5, 5, 4, 4, 5]
      },
      {
        traineeName: "Anele Dube",
        employeeId: "EMP-102",
        departmentRole: "Warehouse Operator",
        feedbackDate: "2026-05-28",
        averageScore: 4.4,
        comment: "Good trainer and relevant examples.",
        statementRatings: [4, 4, 5, 4, 4, 5]
      }
    ],
    supervisorReview: {
      decision: "Approve",
      comments: "Well-structured session with clear outcomes. Minor timing adjustment noted.",
      actionItems: ["Add one extra practical station for slow learners."],
      dueDate: "2026-06-10",
      sectionFeedback: [
        { section: "A", verdict: "OK", comment: "Complete and clear." },
        { section: "C", verdict: "OK", comment: "Feedback response rate is acceptable." },
        { section: "D", verdict: "Revise", comment: "Track two at-risk trainees in follow-up." }
      ],
      stage: "submitted",
      submittedAt: "2026-05-28T09:30:00.000Z",
      submittedBy: "Demo Supervisor",
      updatedAt: "2026-05-28T09:30:00.000Z"
    },
    supervisorReviewHistory: [
      {
        decision: "Approve",
        comments: "Well-structured session with clear outcomes. Minor timing adjustment noted.",
        actionItems: ["Add one extra practical station for slow learners."],
        dueDate: "2026-06-10",
        sectionFeedback: [
          { section: "A", verdict: "OK", comment: "Complete and clear." },
          { section: "C", verdict: "OK", comment: "Feedback response rate is acceptable." },
          { section: "D", verdict: "Revise", comment: "Track two at-risk trainees in follow-up." }
        ],
        stage: "submitted",
        submittedAt: "2026-05-28T09:30:00.000Z",
        submittedBy: "Demo Supervisor",
        updatedAt: "2026-05-28T09:30:00.000Z"
      }
    ],
    trainerFeedbackReadAt: undefined
  },
  {
    id: "F-DEMO-002",
    title: "Cybersecurity Awareness",
    trainerId: "u1",
    assignedSupervisorId: "u2",
    department: "Operations",
    date: "2026-05-24",
    trainees: 10,
    feedbackResponses: 7,
    averageScore: 4.1,
    status: "Needs Correction",
    recommendation: "Minor adjustments needed",
    createdAt: "2026-05-24",
    submittedData: {
      trainerName: "Demo Trainer",
      trainerDepartment: "Operations",
      trainingTitle: "Cybersecurity Awareness",
      trainingDate: "2026-05-24",
      durationDays: "1",
      durationHours: "3",
      numberOfTrainees: "10",
      objectives: ["Identify phishing", "Use secure passwords", "Report suspicious activity"],
      passRate: "7 / 10 trainees",
      averageScoreDisplay: "4.1 / 5",
      observedImprovement: "Yes",
      trainingFormats: ["Classroom"],
      targetUserGroup: "Operations staff",
      applicationExtent: "Moderately",
      observedImprovementDetails: "Awareness improved but password hygiene still weak.",
      supportNeeded: "Minimal",
      barriersComment: "Limited time for exercises.",
      workedWellComment: "Attack simulation was effective.",
      effectivenessRating: "Good",
      recommendationChoice: "Minor adjustments needed",
      trainerFutureSessionComment: "Add longer practical simulation.",
      supervisorFutureSessionComment: "Add policy recap slides.",
      trainees: [
        { name: "Trainee 1", understanding: "Yes", independent: "Yes" },
        { name: "Trainee 2", understanding: "Yes", independent: "No" }
      ],
      signatures: { trainer: true, supervisor: true },
      signOff: {
        trainerName: "Demo Trainer",
        trainerDate: "2026-05-24",
        supervisorName: "Demo Supervisor",
        supervisorDate: "2026-05-25"
      },
      traineeRoster: [
        { name: "Trainee 1", departmentOrRole: "Operations", attendance: "Yes" },
        { name: "Trainee 2", departmentOrRole: "Operations", attendance: "Yes" }
      ]
    },
    supervisorOnlyFeedback: [
      {
        traineeName: "Trainee 1",
        employeeId: "EMP-201",
        departmentRole: "Operations",
        feedbackDate: "2026-05-24",
        averageScore: 4.2,
        comment: "Useful and practical.",
        statementRatings: [4, 4, 4, 4, 5, 4]
      }
    ],
    supervisorReview: {
      decision: "Needs Changes",
      comments: "Good foundation. Improve practical segment timing and include policy handout.",
      actionItems: ["Increase practical time by 20 minutes", "Add one-page policy summary"],
      dueDate: "2026-06-05",
      sectionFeedback: [
        { section: "C", verdict: "OK", comment: "Response quality acceptable." },
        { section: "D", verdict: "Revise", comment: "Follow-up detail too light." }
      ],
      stage: "submitted",
      submittedAt: "2026-05-25T10:00:00.000Z",
      submittedBy: "Demo Supervisor",
      updatedAt: "2026-05-25T10:00:00.000Z"
    }
  },
  {
    id: "F-DEMO-003",
    title: "Project Handover Protocol",
    trainerId: "u1",
    assignedSupervisorId: "u2",
    department: "Operations",
    date: "2026-05-20",
    trainees: 12,
    feedbackResponses: 9,
    averageScore: 3.8,
    status: "Submitted",
    recommendation: "Awaiting review",
    createdAt: "2026-05-20",
    submittedData: {
      trainerName: "Demo Trainer",
      trainerDepartment: "Operations",
      trainingTitle: "Project Handover Protocol",
      trainingDate: "2026-05-20",
      durationDays: "1",
      durationHours: "2",
      numberOfTrainees: "12",
      objectives: ["Use handover checklist", "Capture unresolved risks", "Escalate blockers correctly"],
      passRate: "8 / 12 trainees",
      averageScoreDisplay: "3.8 / 5",
      observedImprovement: "Yes",
      trainingFormats: ["Virtual"],
      targetUserGroup: "Project teams",
      applicationExtent: "Moderately",
      supportNeeded: "Significant",
      workedWellComment: "Checklist walkthrough was clear.",
      effectivenessRating: "Good",
      recommendationChoice: "Minor adjustments needed",
      trainerFutureSessionComment: "Add role-play handover scenarios.",
      trainees: [{ name: "Trainee 1", understanding: "Yes", independent: "No" }],
      signatures: { trainer: true, supervisor: false },
      signOff: {
        trainerName: "Demo Trainer",
        trainerDate: "2026-05-20",
        supervisorName: "",
        supervisorDate: ""
      },
      traineeRoster: [{ name: "Trainee 1", departmentOrRole: "Project Lead", attendance: "Yes" }]
    }
  },
  {
    id: "F-DEMO-004",
    title: "Incident Reporting Basics",
    trainerId: "u1",
    assignedSupervisorId: "u2",
    department: "Operations",
    date: "2026-05-16",
    trainees: 9,
    feedbackResponses: 9,
    averageScore: 4.6,
    status: "Approved",
    recommendation: "Scale",
    createdAt: "2026-05-16",
    submittedData: {
      trainerName: "Demo Trainer",
      trainerDepartment: "Operations",
      trainingTitle: "Incident Reporting Basics",
      trainingDate: "2026-05-16",
      durationDays: "1",
      durationHours: "3",
      numberOfTrainees: "9",
      objectives: ["Log incidents correctly", "Classify severity", "Escalate within SLA"],
      passRate: "9 / 9 trainees",
      averageScoreDisplay: "4.6 / 5",
      observedImprovement: "Yes",
      trainingFormats: ["Classroom", "Workplace-based"],
      targetUserGroup: "Shift leads",
      applicationExtent: "Largely",
      supportNeeded: "None",
      workedWellComment: "Live demo of report form helped a lot.",
      effectivenessRating: "Excellent",
      recommendationChoice: "Proceed as is",
      trainerFutureSessionComment: "Keep same format.",
      supervisorFutureSessionComment: "Excellent, can be reused.",
      trainees: [{ name: "Trainee 1", understanding: "Yes", independent: "Yes" }],
      signatures: { trainer: true, supervisor: true },
      signOff: {
        trainerName: "Demo Trainer",
        trainerDate: "2026-05-16",
        supervisorName: "Demo Supervisor",
        supervisorDate: "2026-05-17"
      },
      traineeRoster: [{ name: "Trainee 1", departmentOrRole: "Shift Lead", attendance: "Yes" }]
    },
    supervisorReview: {
      decision: "Approve",
      comments: "Strong delivery and high adoption.",
      actionItems: [],
      dueDate: "2026-05-25",
      sectionFeedback: [{ section: "A", verdict: "OK", comment: "Complete." }],
      stage: "submitted",
      submittedAt: "2026-05-17T08:20:00.000Z",
      submittedBy: "Demo Supervisor",
      updatedAt: "2026-05-17T08:20:00.000Z"
    }
  },
  {
    id: "F-DEMO-005",
    title: "Inventory Reconciliation",
    trainerId: "u1",
    assignedSupervisorId: "u2",
    department: "Operations",
    date: "2026-05-12",
    trainees: 11,
    feedbackResponses: 6,
    averageScore: 3.6,
    status: "Under Review",
    recommendation: "Supervisor draft review in progress",
    createdAt: "2026-05-12",
    submittedData: {
      trainerName: "Demo Trainer",
      trainerDepartment: "Operations",
      trainingTitle: "Inventory Reconciliation",
      trainingDate: "2026-05-12",
      durationDays: "1",
      durationHours: "4",
      numberOfTrainees: "11",
      objectives: ["Run reconciliation process", "Resolve variances", "Close monthly cycle"],
      passRate: "6 / 11 trainees",
      averageScoreDisplay: "3.6 / 5",
      trainingFormats: ["Virtual"],
      targetUserGroup: "Inventory clerks",
      supportNeeded: "Significant",
      workedWellComment: "Process mapping section helped.",
      effectivenessRating: "Fair",
      recommendationChoice: "Major revision required",
      trainerFutureSessionComment: "Split into two sessions.",
      trainees: [{ name: "Trainee 1", understanding: "Yes", independent: "No" }],
      signatures: { trainer: true, supervisor: false },
      signOff: {
        trainerName: "Demo Trainer",
        trainerDate: "2026-05-12",
        supervisorName: "",
        supervisorDate: ""
      },
      traineeRoster: [{ name: "Trainee 1", departmentOrRole: "Inventory Clerk", attendance: "Yes" }]
    }
  },
  {
    id: "F-DEMO-006",
    title: "Customer Service Essentials",
    trainerId: "u1",
    assignedSupervisorId: "u2",
    department: "Operations",
    date: "2026-05-08",
    trainees: 14,
    feedbackResponses: 10,
    averageScore: 3.2,
    status: "Rejected",
    recommendation: "Rework required",
    createdAt: "2026-05-08",
    submittedData: {
      trainerName: "Demo Trainer",
      trainerDepartment: "Operations",
      trainingTitle: "Customer Service Essentials",
      trainingDate: "2026-05-08",
      durationDays: "1",
      durationHours: "2",
      numberOfTrainees: "14",
      objectives: ["Handle complaints", "Escalation etiquette", "Response consistency"],
      passRate: "5 / 14 trainees",
      averageScoreDisplay: "3.2 / 5",
      trainingFormats: ["Classroom"],
      targetUserGroup: "Frontline support",
      supportNeeded: "Full retraining required",
      barriersComment: "Examples not aligned to real support tickets.",
      workedWellComment: "Role-play attempt was useful.",
      effectivenessRating: "Fair",
      recommendationChoice: "Major revision required",
      trainerFutureSessionComment: "Need real-world ticket examples.",
      trainees: [{ name: "Trainee 1", understanding: "No", independent: "No" }],
      signatures: { trainer: true, supervisor: true },
      signOff: {
        trainerName: "Demo Trainer",
        trainerDate: "2026-05-08",
        supervisorName: "Demo Supervisor",
        supervisorDate: "2026-05-09"
      },
      traineeRoster: [{ name: "Trainee 1", departmentOrRole: "Support Agent", attendance: "Yes" }]
    },
    supervisorReview: {
      decision: "Reject",
      comments: "Material must be reworked before rerun. Not enough practical relevance.",
      actionItems: ["Rewrite examples with real ticket data", "Increase practical simulation time"],
      dueDate: "2026-06-01",
      sectionFeedback: [{ section: "F", verdict: "Revise", comment: "Reflection acknowledges major gaps." }],
      stage: "submitted",
      submittedAt: "2026-05-09T12:00:00.000Z",
      submittedBy: "Demo Supervisor",
      updatedAt: "2026-05-09T12:00:00.000Z"
    }
  }
];

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
  }) => boolean;
  updateUser: (id: string, patch: Partial<Pick<User, "name" | "email" | "role" | "department" | "supervisorId" | "isActive">>) => boolean;
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
      addUser: (payload) => {
        const email = payload.email.trim().toLowerCase();
        if (!email) return false;
        if (get().users.some((u) => u.email.toLowerCase() === email)) return false;
        const nextId = `u${Date.now()}`;
        const newUser: User = {
          id: nextId,
          name: payload.name.trim(),
          email,
          password: payload.password,
          role: payload.role,
          department: payload.department.trim(),
          supervisorId: payload.role === "trainer" ? payload.supervisorId : undefined,
          isActive: true
        };
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
      name: "matateni-app-store-v5",
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<AppState>;
        const persistedForms =
          Array.isArray(persisted.forms) && persisted.forms.length > 0
            ? persisted.forms
            : currentState.forms;
        const mergedById = new Map<string, TrainingForm>();
        // Keep user changes first.
        persistedForms.forEach((form) => {
          mergedById.set(form.id, form);
        });
        // Ensure seed/demo forms are always available for testing.
        currentState.forms.forEach((seedForm) => {
          if (!mergedById.has(seedForm.id)) {
            mergedById.set(seedForm.id, seedForm);
          }
        });
        const mergedForms = Array.from(mergedById.values());
        const migratedForms = mergedForms.map((form) => {
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




