// Central route map: keeps role-based navigation predictable in one place.
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { LoginPage } from "./pages/auth/LoginPage";
import { ExactAssessmentFormPage } from "./pages/trainer/ExactAssessmentFormPage";
import { TrainerFeedbackPage } from "./pages/trainer/TrainerFeedbackPage";
import { TrainerSubmissionsPage } from "./pages/trainer/TrainerSubmissionsPage";
import { TrainerSubmissionViewPage } from "./pages/trainer/TrainerSubmissionViewPage";
import { TraineeFeedbackPage } from "./pages/trainee/TraineeFeedbackPage";
import { SupervisorDashboardPage } from "./pages/supervisor/SupervisorDashboardPage";
import { SupervisorReportsPage } from "./pages/supervisor/SupervisorReportsPage";
import { SupervisorArchivePage } from "./pages/supervisor/SupervisorArchivePage";
import { ReviewSignOffPage } from "./pages/supervisor/ReviewSignOffPage";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AdminUsersRolesPage } from "./pages/admin/AdminUsersRolesPage";
import { AdminAssessmentsPage } from "./pages/admin/AdminAssessmentsPage";
import { AdminSupervisorReviewsPage } from "./pages/admin/AdminSupervisorReviewsPage";
import { AdminFeedbackPage } from "./pages/admin/AdminFeedbackPage";
import { AdminReportsPage } from "./pages/admin/AdminReportsPage";
import { AdminAuditLogPage } from "./pages/admin/AdminAuditLogPage";
import { AdminSettingsPage } from "./pages/admin/AdminSettingsPage";
import { ReportsAnalyticsPage } from "./pages/reports/ReportsAnalyticsPage";
import { useAppStore, dashboardRouteByRole } from "./store/app-store";
import type { Role } from "./types";

function Protected({ role }: { role: Role }) {
  const user = useAppStore((s) => s.currentUser);
  const logout = useAppStore((s) => s.logout);

  if (!user) return <Navigate to="/login" replace />;
  if (role !== user.role && user.role !== "admin") return <Navigate to={dashboardRouteByRole(user.role)} replace />;

  return <AppShell role={user.role} onLogout={logout} />;
}

function HomeRedirect() {
  const user = useAppStore((s) => s.currentUser);
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={dashboardRouteByRole(user.role)} replace />;
}

export default function App() {
  const user = useAppStore((s) => s.currentUser);

  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={user ? <Navigate to={dashboardRouteByRole(user.role)} replace /> : <LoginPage />} />
      <Route path="/trainee-feedback" element={<TraineeFeedbackPage />} />

      <Route element={<Protected role="trainer" />}>
        <Route path="/trainer" element={<Navigate to="/trainer/create" replace />} />
        <Route path="/trainer/create" element={<ExactAssessmentFormPage />} />
        <Route path="/trainer/feedback" element={<TrainerFeedbackPage />} />
        <Route path="/trainer/submissions" element={<TrainerSubmissionsPage />} />
        <Route path="/trainer/submissions/view" element={<TrainerSubmissionViewPage />} />
      </Route>

      <Route element={<Protected role="supervisor" />}>
        <Route path="/supervisor" element={<SupervisorDashboardPage />} />
        <Route path="/supervisor/review" element={<ReviewSignOffPage />} />
        <Route path="/supervisor/archive" element={<SupervisorArchivePage />} />
        <Route path="/supervisor/reports" element={<SupervisorReportsPage />} />
      </Route>

      <Route element={<Protected role="admin" />}>
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/users-roles" element={<AdminUsersRolesPage />} />
        <Route path="/admin/assessments" element={<AdminAssessmentsPage />} />
        <Route path="/admin/supervisor-reviews" element={<AdminSupervisorReviewsPage />} />
        <Route path="/admin/feedback" element={<AdminFeedbackPage />} />
        <Route path="/admin/reports" element={<AdminReportsPage />} />
        <Route path="/admin/audit-log" element={<AdminAuditLogPage />} />
        <Route path="/admin/settings" element={<AdminSettingsPage />} />
        <Route path="/reports" element={<ReportsAnalyticsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

