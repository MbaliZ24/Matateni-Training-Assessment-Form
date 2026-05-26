import { create } from "zustand";
import type { NotificationItem, Role, TrainingForm, User } from "../types";

const users: User[] = [
  { id: "u1", name: "Nandi Dlamini", email: "trainer@matateni.com", password: "demo123", role: "trainer", department: "Operations" },
  { id: "u2", name: "Sipho Mokoena", email: "supervisor@matateni.com", password: "demo123", role: "supervisor", department: "Operations" },
  { id: "u3", name: "Thabo Nkosi", email: "admin@matateni.com", password: "demo123", role: "admin", department: "People Ops" }
];

const forms: TrainingForm[] = [
  { id: "F-1021", title: "SAP Inventory Basics", trainerId: "u1", department: "Operations", date: "2026-05-20", trainees: 18, feedbackResponses: 14, averageScore: 4.2, status: "Waiting for Feedback", recommendation: "Proceed", createdAt: "2026-05-20" },
  { id: "F-1022", title: "Safety Incident Reporting", trainerId: "u1", department: "Safety", date: "2026-05-18", trainees: 12, feedbackResponses: 12, averageScore: 4.6, status: "Submitted", recommendation: "Proceed", createdAt: "2026-05-18" },
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
  loading: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  updateFormStatus: (id: string, status: TrainingForm["status"]) => void;
  addForm: (form: TrainingForm) => void;
};

export const useAppStore = create<AppState>((set, get) => ({
  users,
  forms,
  notifications,
  currentUser: null,
  loading: false,
  login: (email, password) => {
    const user = get().users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) return false;
    set({ currentUser: user });
    return true;
  },
  logout: () => set({ currentUser: null }),
  updateFormStatus: (id, status) => set({ forms: get().forms.map((f) => (f.id === id ? { ...f, status } : f)) }),
  addForm: (form) => set({ forms: [form, ...get().forms] })
}));

export function dashboardRouteByRole(role: Role) {
  if (role === "trainer") return "/trainer";
  if (role === "supervisor") return "/supervisor";
  return "/admin";
}
