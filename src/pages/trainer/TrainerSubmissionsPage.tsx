import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Eye, MoreHorizontal, PencilLine, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { StatusBadge } from "../../components/ui/status-badge";
import { useAppStore } from "../../store/app-store";
import { exportSignedFormPdf } from "../../lib/export";
import { isInStatuses, TRAINER_SUBMISSION_STATUSES } from "../../lib/form-status";
import type { TrainingForm } from "../../types";

type MenuState = { id: string; x: number; y: number } | null;

export function TrainerSubmissionsPage() {
  const navigate = useNavigate();
  const forms = useAppStore((s) => s.forms);
  const users = useAppStore((s) => s.users);
  const currentUser = useAppStore((s) => s.currentUser);
  const removeForm = useAppStore((s) => s.removeForm);
  const [openMenu, setOpenMenu] = useState<MenuState>(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const mySubmissions = useMemo(
    () =>
      forms
        .filter(
          (f) =>
            f.trainerId === currentUser?.id &&
            isInStatuses(f.status, TRAINER_SUBMISSION_STATUSES)
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [forms, currentUser?.id]
  );

  const supervisorName = (supervisorId?: string) =>
    users.find((u) => u.id === supervisorId)?.name ||
    users.find((u) => u.id === supervisorId)?.email ||
    "Not assigned";

  const openMenuAt = (id: string, rect: DOMRect) => {
    const menuWidth = 220;
    const menuHeight = 220;
    const pad = 8;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    let x = rect.right - menuWidth;
    let y = rect.bottom + 8;
    if (x < pad) x = pad;
    if (x + menuWidth > viewportW - pad) x = viewportW - menuWidth - pad;
    if (y + menuHeight > viewportH - pad) y = rect.top - menuHeight - 8;
    if (y < pad) y = pad;
    setOpenMenu({ id, x, y });
    requestAnimationFrame(() => setIsMenuVisible(true));
  };

  const closeMenu = () => {
    setIsMenuVisible(false);
    setTimeout(() => setOpenMenu(null), 120);
  };

  useEffect(() => {
    if (!openMenu) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) closeMenu();
    };
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    const onViewportChange = () => closeMenu();
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onEsc);
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onEsc);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, [openMenu]);

  const openSubmission = (form: TrainingForm) => {
    navigate(`/trainer/submissions/view?formId=${encodeURIComponent(form.id)}`);
  };

  const menuActionsFor = (form: TrainingForm) => {
    // Keep the action list tied to status so trainers only see options that make sense for each state.
    const viewAction = {
      label: "View Submission",
      icon: Eye,
      onClick: () => openSubmission(form)
    };
    const downloadAction = {
      label: "Download PDF",
      icon: Download,
      onClick: () => exportSignedFormPdf(form, { includeTraineeComments: false })
    };

    if (form.status === "Draft") {
      return [
        {
          label: "Continue Draft",
          icon: PencilLine,
          onClick: () => openSubmission(form)
        },
        downloadAction,
        {
          label: "Delete Draft",
          icon: Trash2,
          destructive: true,
          onClick: () => removeForm(form.id)
        }
      ];
    }

    if (form.status === "Needs Correction") {
      return [
        {
          label: "Resume Corrections",
          icon: PencilLine,
          onClick: () => openSubmission(form)
        },
        downloadAction
      ];
    }

    return [viewAction, downloadAction];
  };

  return (
    <div className="mx-auto max-w-[980px] space-y-3">
      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-slate-900">My Submissions</CardTitle>
          <p className="text-xs text-slate-500">Drafts and submitted training assessments.</p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Form ID</th>
                  <th className="px-4 py-3 font-semibold">Training</th>
                  <th className="px-4 py-3 font-semibold">Submitted</th>
                  <th className="px-4 py-3 font-semibold">Supervisor</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mySubmissions.map((form) => (
                  <tr key={form.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-700">{form.id}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-800">{form.title}</td>
                    <td className="px-4 py-2.5 text-slate-700">{form.submittedAt || form.createdAt}</td>
                    <td className="px-4 py-2.5 text-slate-700">{supervisorName(form.assignedSupervisorId)}</td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={form.status} />
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (openMenu?.id === form.id) {
                            closeMenu();
                            return;
                          }
                          openMenuAt(form.id, e.currentTarget.getBoundingClientRect());
                        }}
                        className={`inline-flex size-8 items-center justify-center rounded-lg border text-slate-600 transition ${
                          openMenu?.id === form.id
                            ? "border-slate-300 bg-slate-100"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        }`}
                        title="More actions"
                        aria-haspopup="menu"
                        aria-expanded={openMenu?.id === form.id}
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {mySubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                      No submissions yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {openMenu ? (
        <div
          ref={menuRef}
          role="menu"
          className={`fixed z-[80] w-[220px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_16px_40px_rgba(15,23,42,0.18)] ring-1 ring-slate-100 transition-all duration-150 ease-out ${
            isMenuVisible ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
          }`}
          style={{ left: `${openMenu.x}px`, top: `${openMenu.y}px` }}
        >
          {(() => {
            const target = mySubmissions.find((form) => form.id === openMenu.id);
            if (!target) return null;

            return menuActionsFor(target).map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  type="button"
                  role="menuitem"
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition hover:bg-slate-50 ${
                    action.destructive ? "text-rose-700" : "text-slate-700"
                  }`}
                  onClick={() => {
                    action.onClick();
                    closeMenu();
                  }}
                >
                  <Icon className={`size-4 ${action.destructive ? "text-rose-500" : "text-slate-500"}`} />
                  {action.label}
                </button>
              );
            });
          })()}
        </div>
      ) : null}
    </div>
  );
}
