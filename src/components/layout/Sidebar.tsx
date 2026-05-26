import { LayoutDashboard, ClipboardList, MessageSquare, ShieldCheck, Users, BarChart3, FileCheck2 } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "../../lib/utils";
import type { Role } from "../../types";

const navByRole: Record<Role, { to: string; label: string; icon: React.ComponentType<{ className?: string }> }[]> = {
  trainer: [
    { to: "/trainer", label: "Dashboard", icon: LayoutDashboard },
    { to: "/trainer/create", label: "Training Assessment Form", icon: ClipboardList },
    { to: "/trainee-feedback", label: "Trainee Feedback", icon: MessageSquare }
  ],
  supervisor: [
    { to: "/supervisor", label: "Dashboard", icon: LayoutDashboard },
    { to: "/supervisor/review", label: "Review & Sign-Off", icon: FileCheck2 }
  ],
  admin: [
    { to: "/admin", label: "Dashboard", icon: Users },
    { to: "/reports", label: "Reports & Analytics", icon: BarChart3 },
    { to: "/supervisor", label: "Review Queue", icon: ShieldCheck }
  ]
};

export function Sidebar({ role }: { role: Role }) {
  return (
    <aside className="h-screen w-72 shrink-0 border-r border-slate-200 bg-white p-4">
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
    </aside>
  );
}

