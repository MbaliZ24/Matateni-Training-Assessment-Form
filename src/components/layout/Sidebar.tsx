// Left navigation tuned per role so each user only sees relevant actions.
import {
  ClipboardList,
  ShieldCheck,
  Users,
  BarChart3,
  FileCheck2,
  MessageSquare,
  FileText,
  ListChecks,
  Activity,
  Settings
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "../../lib/utils";
import type { Role } from "../../types";

const navByRole: Record<Role, { to: string; label: string; icon: React.ComponentType<{ className?: string }> }[]> = {
  trainer: [
    { to: "/trainer/create", label: "Assessments", icon: ClipboardList },
    { to: "/trainer/feedback", label: "Feedback", icon: MessageSquare },
    { to: "/trainer/submissions", label: "My Submissions", icon: FileText }
  ],
  supervisor: [
    { to: "/supervisor", label: "Dashboard", icon: ShieldCheck },
    { to: "/supervisor/review", label: "Review & Sign-Off", icon: FileCheck2 },
    { to: "/supervisor/archive", label: "Signed Forms", icon: ClipboardList },
    { to: "/supervisor/reports", label: "Reports", icon: BarChart3 }
  ],
  admin: [
    { to: "/admin", label: "Dashboard", icon: Users },
    { to: "/admin/assessments", label: "Assessments", icon: ClipboardList },
    { to: "/admin/supervisor-reviews", label: "Supervisor Reviews", icon: ListChecks },
    { to: "/admin/feedback", label: "Feedback", icon: MessageSquare },
    { to: "/admin/reports", label: "Reports", icon: BarChart3 },
    { to: "/admin/audit-log", label: "Audit Log", icon: Activity },
    { to: "/admin/settings", label: "Settings", icon: Settings }
  ]
};

export function Sidebar({ role, onLogout }: { role: Role; onLogout?: () => void }) {
  return (
    <aside className="sticky top-0 h-screen w-72 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-4">
      <div className="mb-7 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <img src="/matateni-logo.png" alt="Matateni" className="h-12 w-full object-contain object-left" />
      </div>
      <nav className="space-y-1">
        {navByRole[role].map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                  isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                )
              }
            >
              <Icon className="size-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      {onLogout ? (
        <div className="mt-6 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onLogout}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-ruby hover:text-brand-ruby"
          >
            Logout
          </button>
        </div>
      ) : null}
    </aside>
  );
}

