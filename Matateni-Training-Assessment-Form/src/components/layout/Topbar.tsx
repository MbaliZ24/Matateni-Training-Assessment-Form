// Admin-focused top utilities (search + notifications + logout).
import { Search, Bell } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import type { NotificationItem } from "../../types";
import { useState } from "react";

export function Topbar({
  title,
  notifications,
  onLogout
}: {
  title: string;
  notifications: NotificationItem[];
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between gap-3 p-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        </div>
        <div className="hidden w-72 md:block">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-400" />
            <Input className="pl-9" placeholder="Search forms, users, departments..." />
          </div>
        </div>
        <div className="relative flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
            <Bell className="mr-1 size-4" /> {unread}
          </Button>
          <Button variant="ghost" size="sm" onClick={onLogout}>Logout</Button>
          {open ? (
            <Card className="absolute right-0 top-11 w-80 p-3">
              <p className="mb-2 text-sm font-semibold">Notifications</p>
              <div className="space-y-2">
                {notifications.slice(0, 4).map((n) => (
                  <div key={n.id} className="rounded-lg border border-slate-100 p-2">
                    <p className="text-sm font-medium text-slate-800">{n.title}</p>
                    <p className="text-xs text-slate-500">{n.body}</p>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </header>
  );
}

