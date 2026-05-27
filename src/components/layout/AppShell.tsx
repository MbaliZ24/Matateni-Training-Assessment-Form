// Shared app chrome: sidebar always, topbar only where the role actually needs it.
import { motion } from "framer-motion";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import type { Role } from "../../types";

export function AppShell({
  role,
  onLogout
}: {
  role: Role;
  onLogout: () => void;
}) {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <div className="hidden lg:block">
        <Sidebar role={role} onLogout={onLogout} />
      </div>
      <div className="min-w-0 flex-1">
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

