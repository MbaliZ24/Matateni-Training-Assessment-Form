// Central route map: keeps role-based navigation predictable in one place.
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { LoginPage } from "./pages/auth/LoginPage";
import { ExactAssessmentFormPage } from "./pages/trainer/ExactAssessmentFormPage";
import { TraineeFeedbackPage } from "./pages/trainee/TraineeFeedbackPage";
import { SupervisorDashboardPage } from "./pages/supervisor/SupervisorDashboardPage";
import { ReviewSignOffPage } from "./pages/supervisor/ReviewSignOffPage";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { ReportsAnalyticsPage } from "./pages/reports/ReportsAnalyticsPage";
import { useAppStore, dashboardRouteByRole } from "./store/app-store";
import type { Role } from "./types";

function Protected({ role, title }: { role: Role; title: string }) {
  const user = useAppStore((s) => s.currentUser);
  const notifications = useAppStore((s) => s.notifications);
  const logout = useAppStore((s) => s.logout);

  if (!user) return <Navigate to="/login" replace />;
  if (role !== user.role && user.role !== "admin") return <Navigate to={dashboardRouteByRole(user.role)} replace />;

  return <AppShell role={user.role} title={title} notifications={notifications} onLogout={logout} />;
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

      <Route element={<Protected role="trainer" title="Trainer Workspace" />}>
        <Route path="/trainer" element={<Navigate to="/trainer/create" replace />} />
        <Route path="/trainer/create" element={<ExactAssessmentFormPage />} />
      </Route>

      <Route element={<Protected role="supervisor" title="Supervisor Workspace" />}>
        <Route path="/supervisor" element={<SupervisorDashboardPage />} />
        <Route path="/supervisor/review" element={<ReviewSignOffPage />} />
      </Route>

      <Route element={<Protected role="admin" title="Admin Workspace" />}>
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/reports" element={<ReportsAnalyticsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

