import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Download,
  Eye,
  FileText,
  MoreHorizontal,
  Search,
  Star,
  Users,
  X
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { StatusBadge } from "../../components/ui/status-badge";
import { useAppStore } from "../../store/app-store";
import { exportSignedFormPdf } from "../../lib/export";
import { isInStatuses, REVIEW_QUEUE_STATUSES } from "../../lib/form-status";

type MenuState = { id: string; x: number; y: number } | null;

export function SupervisorDashboardPage() {
  const navigate = useNavigate();
  const forms = useAppStore((s) => s.forms);
  const users = useAppStore((s) => s.users);
  const currentUser = useAppStore((s) => s.currentUser);
  const setSelectedReviewFormId = useAppStore((s) => s.setSelectedReviewFormId);

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<MenuState>(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const openMenuAt = (id: string, rect: DOMRect) => {
    const menuWidth = 220;
    const menuHeight = 240;
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

  const incomingForms = useMemo(
    () =>
      forms.filter(
        (f) =>
          f.assignedSupervisorId === currentUser?.id &&
          isInStatuses(f.status, REVIEW_QUEUE_STATUSES)
      ),
    [forms, currentUser?.id]
  );

  const filteredForms = useMemo(() => {
    const q = query.trim().toLowerCase();
    return incomingForms
      .filter((f) => {
        const trainerName = users.find((u) => u.id === f.trainerId)?.name ?? "";
        const matchesQuery =
          q.length === 0 ||
          f.title.toLowerCase().includes(q) ||
          trainerName.toLowerCase().includes(q) ||
          f.department.toLowerCase().includes(q);
        return matchesQuery;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [incomingForms, query, users]);

  const selectedForm = useMemo(() => {
    if (filteredForms.length === 0) return null;
    if (!selectedId) return filteredForms[0];
    return filteredForms.find((f) => f.id === selectedId) ?? filteredForms[0];
  }, [filteredForms, selectedId]);

  const assignedForms = useMemo(
    () => forms.filter((f) => f.assignedSupervisorId === currentUser?.id),
    [forms, currentUser?.id]
  );
  const reviewedCount = assignedForms.filter((f) => f.status === "Approved").length;
  const totalResponses = incomingForms.reduce((sum, f) => sum + f.feedbackResponses, 0);
  const responseCapacity = incomingForms.reduce((sum, f) => sum + f.trainees, 0);
  const averageRating =
    incomingForms.length > 0
      ? (incomingForms.reduce((sum, f) => sum + f.averageScore, 0) / incomingForms.length).toFixed(1)
      : "0.0";

  return (
    <div className="space-y-3">
      <header className="space-y-0.5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Incoming Forms</h1>
        <p className="text-xs text-slate-500">View assessment forms and feedback submitted by trainers.</p>
      </header>

      <section className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-200 bg-gradient-to-b from-white to-slate-50/50 shadow-sm">
          <CardContent className="space-y-2.5 p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Pending Review</p>
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600 ring-1 ring-blue-100">
                <FileText className="size-4" />
              </div>
            </div>
            <div className="space-y-0.5">
              <p className="text-2xl font-semibold leading-none text-slate-900">{incomingForms.length}</p>
              <p className="text-[12px] text-slate-500">Forms awaiting your review</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-gradient-to-b from-white to-slate-50/50 shadow-sm">
          <CardContent className="space-y-2.5 p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Reviewed</p>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 ring-1 ring-emerald-100">
                <CheckCircle2 className="size-4" />
              </div>
            </div>
            <div className="space-y-0.5">
              <p className="text-2xl font-semibold leading-none text-slate-900">{reviewedCount}</p>
              <p className="text-[12px] text-slate-500">Completed by supervisor</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-gradient-to-b from-white to-slate-50/50 shadow-sm">
          <CardContent className="space-y-2.5 p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Trainee Responses</p>
              <div className="rounded-lg bg-violet-50 p-2 text-violet-600 ring-1 ring-violet-100">
                <Users className="size-4" />
              </div>
            </div>
            <div className="space-y-0.5">
              <p className="text-2xl font-semibold leading-none text-slate-900">{totalResponses}</p>
              <p className="text-[12px] text-slate-500">
                {responseCapacity > 0 ? `${Math.round((totalResponses / responseCapacity) * 100)}% response rate` : "No responses yet"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-gradient-to-b from-white to-slate-50/50 shadow-sm">
          <CardContent className="space-y-2.5 p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Average Rating</p>
              <div className="rounded-lg bg-amber-50 p-2 text-amber-600 ring-1 ring-amber-100">
                <Star className="size-4" />
              </div>
            </div>
            <div className="space-y-0.5">
              <p className="text-2xl font-semibold leading-none text-slate-900">{averageRating} / 5</p>
              <p className="text-[12px] text-slate-500">Across incoming forms</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3">
        <Card className="border-slate-200">
          <CardContent className="p-0">
            <div className="border-b border-slate-200 p-3">
              <h2 className="text-lg font-semibold text-slate-900">Forms & Feedback Awaiting Review</h2>
            </div>

            <div className="border-b border-slate-100 p-3">
              <label className="relative block">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  type="text"
                  placeholder="Search training or trainer..."
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-3 pr-9 text-sm outline-none focus:border-slate-900"
                />
                <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              </label>
            </div>

            <div className="relative overflow-x-auto overflow-y-visible">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Training Title</th>
                    <th className="px-4 py-3 font-semibold">Trainer</th>
                    <th className="px-4 py-3 font-semibold">Date Conducted</th>
                    <th className="px-4 py-3 font-semibold">Responses</th>
                    <th className="px-4 py-3 font-semibold">Avg Rating</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredForms.map((f) => {
                    const trainer = users.find((u) => u.id === f.trainerId)?.name ?? "Unknown Trainer";
                    return (
                      <tr
                        key={f.id}
                        className={`border-t border-slate-100 hover:bg-slate-50 ${selectedForm?.id === f.id ? "bg-blue-50/40" : ""}`}
                      >
                        <td className="px-4 py-2.5 font-medium text-slate-800">{f.title}</td>
                        <td className="px-4 py-2.5 text-slate-700">{trainer}</td>
                        <td className="px-4 py-2.5 text-slate-700">{f.date}</td>
                        <td className="px-4 py-2.5 text-slate-700">{f.feedbackResponses} / {f.trainees}</td>
                        <td className="px-4 py-2.5 text-slate-700">
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                            <Star className="size-3.5 fill-amber-400 text-amber-400" />
                            {f.averageScore.toFixed(1)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={f.status} />
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedId(f.id);
                                if (openMenu?.id === f.id) {
                                  closeMenu();
                                  return;
                                }
                                openMenuAt(f.id, e.currentTarget.getBoundingClientRect());
                              }}
                              className={`inline-flex size-8 items-center justify-center rounded-lg border text-slate-600 transition ${
                                openMenu?.id === f.id
                                  ? "border-slate-300 bg-slate-100"
                                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                              }`}
                              title="More actions"
                              aria-haspopup="menu"
                              aria-expanded={openMenu?.id === f.id}
                            >
                              <MoreHorizontal className="size-4" />
                            </button>

                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredForms.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                        No forms found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
              Showing 1 to {filteredForms.length} of {filteredForms.length} entries
            </div>
          </CardContent>
        </Card>
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
          {(() => {
            const target = filteredForms.find((x) => x.id === openMenu.id);
            if (!target) return null;
            return (
              <>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  onClick={() => {
                    setSelectedId(target.id);
                    setDrawerOpen(true);
                    closeMenu();
                  }}
                >
                  <Eye className="size-4 text-slate-500" />
                  View Details
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  onClick={() => {
                    setSelectedReviewFormId(target.id);
                    navigate(`/supervisor/review?formId=${encodeURIComponent(target.id)}`);
                    closeMenu();
                  }}
                >
                  <Eye className="size-4 text-slate-500" />
                  Review
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  onClick={() => {
                    exportSignedFormPdf(target, { includeTraineeComments: true });
                    closeMenu();
                  }}
                >
                  <Download className="size-4 text-slate-500" />
                  Download PDF
                </button>
              </>
            );
          })()}
        </div>
      ) : null}

      <div
        className={`fixed inset-0 z-[75] bg-slate-900/25 transition-opacity duration-200 ${
          drawerOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setDrawerOpen(false)}
      />
      <aside
        className={`fixed right-0 top-0 z-[76] h-screen w-full max-w-md border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!drawerOpen}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="text-base font-semibold text-slate-900">Form Details</h3>
          <button
            type="button"
            className="inline-flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
            onClick={() => setDrawerOpen(false)}
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="space-y-3 overflow-y-auto p-4">
          {selectedForm ? (
            <>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div><p className="text-slate-500">Training</p><p className="font-semibold text-slate-900">{selectedForm.submittedData?.trainingTitle || selectedForm.title}</p></div>
                <div><p className="text-slate-500">Trainer</p><p className="font-semibold text-slate-900">{users.find((u) => u.id === selectedForm.trainerId)?.name ?? "Unknown Trainer"}</p></div>
                <div><p className="text-slate-500">Date Conducted</p><p className="font-semibold text-slate-900">{selectedForm.submittedData?.trainingDate || selectedForm.date}</p></div>
                <div><p className="text-slate-500">Department</p><p className="font-semibold text-slate-900">{selectedForm.department}</p></div>
                <div><p className="text-slate-500">Responses</p><p className="font-semibold text-slate-900">{selectedForm.feedbackResponses} / {selectedForm.trainees}</p></div>
                <div><p className="text-slate-500">Average Rating</p><p className="font-semibold text-slate-900">{selectedForm.averageScore.toFixed(1)} / 5</p></div>
                <div><p className="text-slate-500">Duration</p><p className="font-semibold text-slate-900">{selectedForm.submittedData?.durationDays || selectedForm.submittedData?.durationHours ? `${selectedForm.submittedData?.durationDays || "0"} day(s), ${selectedForm.submittedData?.durationHours || "0"} hour(s)` : "Not specified"}</p></div>
                <div><p className="text-slate-500">Submitted On</p><p className="font-semibold text-slate-900">{selectedForm.createdAt}</p></div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="mb-1 text-sm font-semibold text-slate-800">Trainer Recommendation</p>
                <p className="text-sm text-slate-700">{selectedForm.recommendation || "No recommendation submitted."}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="mb-1 text-sm font-semibold text-slate-800">Training Objectives</p>
                <ul className="list-disc space-y-0.5 pl-4 text-sm text-slate-700">
                  {(selectedForm.submittedData?.objectives || []).slice(0, 6).map((objective, idx) => (
                    <li key={`${selectedForm.id}-detail-objective-${idx}`}>{objective}</li>
                  ))}
                  {(selectedForm.submittedData?.objectives || []).length === 0 ? <li className="list-none pl-0">No objectives submitted.</li> : null}
                </ul>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">No form selected.</p>
          )}
        </div>
      </aside>
    </div>
  );
}


