import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState } from "react";
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-100">
      <div className="hidden lg:block">
        <Sidebar role={role} onLogout={onLogout} />
      </div>

      <div className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700"
          aria-label="Open navigation"
        >
          <Menu className="size-4" />
        </button>
        <img src="/matateni-logo.png" alt="Matateni" className="h-8 w-auto object-contain" />
        <div className="size-9" />
      </div>

      <div
        className={`fixed inset-0 z-50 bg-slate-900/35 transition-opacity lg:hidden ${
          mobileNavOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMobileNavOpen(false)}
      >
        <aside
          className={`h-full w-[84%] max-w-[320px] bg-white transition-transform ${
            mobileNavOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4">
            <p className="text-sm font-semibold text-slate-900">Menu</p>
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              className="inline-flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-600"
              aria-label="Close navigation"
            >
              <X className="size-4" />
            </button>
          </div>
          <Sidebar role={role} onLogout={onLogout} mobile />
        </aside>
      </div>

      <div className="min-w-0 flex-1">
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="p-4 pt-16 md:p-6 md:pt-6 lg:pt-4"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}
