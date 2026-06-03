import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Download, Eye, MoreHorizontal, PencilLine, Search } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { useAppStore } from "../../store/app-store";
import { exportSignedFormPdf } from "../../lib/export";
import { ExactAssessmentFormPage } from "../trainer/ExactAssessmentFormPage";

const supervisorStatuses = [
  "TRAINERASSESSMENTPENDING",
  "FOLLOWUPPENDING",
  "COMPLETED"
] as const;

type MenuState = { id: string; x: number; y: number } | null;

export function ReviewSignOffPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const forms = useAppStore((s) => s.forms);
  const users = useAppStore((s) => s.users);
  const currentUser = useAppStore((s) => s.currentUser);
  const setSelectedReviewFormId = useAppStore((s) => s.setSelectedReviewFormId);
  const [query, setQuery] = useState("");
  const [openMenu, setOpenMenu] = useState<MenuState>(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const formIdFromQuery = searchParams.get("formId");

  const assignedForms = useMemo(
    () =>
      // Keep supervisor work focused on reviewable records only; trainer-only lifecycle states stay off this page.
      forms.filter(
        (form) =>
          form.assignedSupervisorId === currentUser?.id &&
          supervisorStatuses.includes(form.status as (typeof supervisorStatuses)[number])
      ),
    [forms, currentUser?.id]
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assignedForms
      .filter((form) => {
        if (!q) return true;
        const trainer = users.find((user) => user.id === form.trainerId)?.name ?? "";
        return (
          form.title.toLowerCase().includes(q) ||
          form.department.toLowerCase().includes(q) ||
          trainer.toLowerCase().includes(q) ||
          form.id.toLowerCase().includes(q)
        );
      })
      .sort((a, b) =>
        (b.updatedAt ?? b.submittedAt ?? b.createdAt).localeCompare(
          a.updatedAt ?? a.submittedAt ?? a.createdAt
        )
      );
  }, [assignedForms, query, users]);

  const selectedForm = useMemo(() => {
    if (rows.length === 0 || !formIdFromQuery) return null;
    return rows.find((form) => form.id === formIdFromQuery) ?? rows[0];
  }, [formIdFromQuery, rows]);

  const openForm = (formId: string) => {
    setSelectedReviewFormId(formId);
    setSearchParams({ formId });
  };

  const openMenuAt = (id: string, rect: DOMRect) => {
    const menuWidth = 220;
    const menuHeight = 160;
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

  const menuActionsFor = (formId: string) => {
    const form = rows.find((item) => item.id === formId);
    if (!form) return [];

    // The action label mirrors the supervisor's role in the current state without changing the underlying backend status.
    const openLabel =
      form.status === "TRAINERASSESSMENTPENDING"
        ? "Open Review"
        : form.status === "FOLLOWUPPENDING"
          ? "View Returned Form"
          : "View Signed Form";

    return [
      {
        label: openLabel,
        icon: form.status === "TRAINERASSESSMENTPENDING" ? PencilLine : Eye,
        onClick: () => openForm(form.id)
      },
      {
        label: "Download PDF",
        icon: Download,
        onClick: () => exportSignedFormPdf(form, { includeTraineeComments: true })
      }
    ];
  };

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Review & Sign-Off</h1>
        <p className="text-sm text-slate-500">
          Review incoming forms, track returned items, and access approved records from one working page.
        </p>
      </header>

      <section className="grid gap-4 xl:grid-cols-[540px_1fr]">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Assigned Forms</h2>
                <p className="text-xs text-slate-500">
                  This list only shows forms that are relevant to supervisor review and sign-off.
                </p>
              </div>
            </div>

            <label className="relative block">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="text"
                placeholder="Search training, trainer, department..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-3 pr-9 text-sm outline-none focus:border-slate-900"
              />
              <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            </label>

            <div className="overflow-x-auto rounded-xl border border-slate-100">
              {rows.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-500">
                  No assigned forms found.
                </div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Form ID</th>
                      <th className="px-4 py-3 font-semibold">Training</th>
                      <th className="px-4 py-3 font-semibold">Trainer</th>
                      <th className="px-4 py-3 font-semibold">Responses</th>
                      <th className="px-4 py-3 font-semibold">Last Updated</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((form) => {
                      const trainer =
                        users.find((user) => user.id === form.trainerId)?.name ?? "Unknown trainer";
                      const isSelected = selectedForm?.id === form.id;
                      return (
                        <tr
                          key={form.id}
                          className={`border-t border-slate-100 transition ${
                            isSelected ? "bg-slate-50" : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="px-4 py-2.5 font-mono text-xs text-slate-700">{form.id}</td>
                          <td className="px-4 py-2.5">
                            <button type="button" onClick={() => openForm(form.id)} className="text-left">
                              <p className="font-medium text-slate-800">{form.title}</p>
                              <p className="mt-0.5 text-xs text-slate-500">{form.department}</p>
                            </button>
                          </td>
                          <td className="px-4 py-2.5 text-slate-700">{trainer}</td>
                          <td className="px-4 py-2.5 text-slate-700">
                            {form.feedbackResponses} / {form.trainees}
                          </td>
                          <td className="px-4 py-2.5 text-slate-700">
                            {(form.updatedAt ?? form.submittedAt ?? form.createdAt).slice(0, 10)}
                          </td>
                          <td className="px-4 py-2.5">
                            <SupervisorStatusBadge status={form.status} />
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
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {selectedForm ? (
            <>
              <ExactAssessmentFormPage readOnly submittedData={selectedForm.submittedData} reviewFormId={selectedForm.id} />
            </>
          ) : null}
        </div>
      </section>

      {openMenu ? (
        <div
          ref={menuRef}
          role="menu"
          className={`fixed z-[80] w-[220px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_16px_40px_rgba(15,23,42,0.18)] ring-1 ring-slate-100 transition-all duration-150 ease-out ${
            isMenuVisible ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
          }`}
          style={{ left: `${openMenu.x}px`, top: `${openMenu.y}px` }}
        >
          {menuActionsFor(openMenu.id).map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                onClick={() => {
                  action.onClick();
                  closeMenu();
                }}
              >
                <Icon className="size-4 text-slate-500" />
                {action.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function supervisorStatusLabel(status: string) {
  if (status === "TRAINERASSESSMENTPENDING") return "Pending Review";
  if (status === "FOLLOWUPPENDING") return "Returned";
  return "Signed Off";
}

function SupervisorStatusBadge({ status }: { status: string }) {
  const label = supervisorStatusLabel(status);
  const classes =
    status === "TRAINERASSESSMENTPENDING"
      ? "bg-amber-100 text-amber-700"
      : status === "FOLLOWUPPENDING"
        ? "bg-rose-100 text-rose-700"
        : "bg-emerald-100 text-emerald-700";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${classes}`}>
      {label}
    </span>
  );
}
