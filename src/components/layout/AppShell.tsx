// Shared app chrome: sidebar always, topbar only where the role actually needs it.
import { motion } from "framer-motion";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import type { NotificationItem, Role } from "../../types";

export function AppShell({
  role,
  title,
  notifications,
  onLogout
}: {
  role: Role;
  title: string;
  notifications: NotificationItem[];
  onLogout: () => void;
}) {
  const showTopbar = role === "admin";

  return (
    <div className="flex min-h-screen bg-slate-100">
      <div className="hidden lg:block">
        <Sidebar role={role} onLogout={onLogout} />
      </div>
      <div className="min-w-0 flex-1">
        {showTopbar ? <Topbar title={title} notifications={notifications} onLogout={onLogout} /> : null}
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="p-4 md:p-6"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}

