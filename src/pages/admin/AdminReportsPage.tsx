import { useMemo, useState } from "react";
import { Download, Search, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { useAppStore } from "../../store/app-store";
import { exportCsvRows } from "../../lib/export";
import type { Status } from "../../types";

const reportStatuses: ("All" | Status)[] = [
  "All",
  "Draft",
  "Submitted",
  "Under Review",
  "Approved",
  "Needs Correction",
  "Rejected"
];

function pct(value: number, total: number) {
  return Math.round((value / Math.max(1, total)) * 100);
}

export function AdminReportsPage() {
  const forms = useAppStore((s) => s.forms);
  const users = useAppStore((s) => s.users);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"All" | Status>("All");

  const trainersById = useMemo(() => Object.fromEntries(users.map((u) => [u.id, u])), [users]);

  const filteredForms = useMemo(() => {
    const q = query.trim().toLowerCase();
    return forms.filter((f) => {
      const trainerName = trainersById[f.trainerId]?.name || trainersById[f.trainerId]?.email || "";
      const supervisorName =
        trainersById[f.assignedSupervisorId ?? ""]?.name ||
        trainersById[f.assignedSupervisorId ?? ""]?.email ||
        "";
      const matchesQuery =
        q.length === 0 ||
        f.title.toLowerCase().includes(q) ||
        f.id.toLowerCase().includes(q) ||
        trainerName.toLowerCase().includes(q) ||
        supervisorName.toLowerCase().includes(q) ||
        f.department.toLowerCase().includes(q);
      const matchesStatus = status === "All" || f.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [forms, trainersById, query, status]);

  const metrics = useMemo(() => {
    const total = filteredForms.length;
    const approved = filteredForms.filter((f) => f.status === "Approved").length;
    const pending = filteredForms.filter((f) => ["Submitted", "Under Review", "Needs Correction"].includes(f.status)).length;
    const totalResponses = filteredForms.reduce((sum, f) => sum + f.feedbackResponses, 0);
    const totalInvited = filteredForms.reduce((sum, f) => sum + f.trainees, 0);
    const responseRate = pct(totalResponses, totalInvited);
    const averageRating =
      total > 0 ? (filteredForms.reduce((sum, f) => sum + f.averageScore, 0) / Math.max(1, total)).toFixed(1) : "0.0";

    return { total, approved, pending, totalResponses, totalInvited, responseRate, averageRating };
  }, [filteredForms]);

  const exportReportCsv = () => {
    exportCsvRows(
      "admin-reports",
      [
        "Form ID",
        "Title",
        "Trainer",
        "Supervisor",
        "Department",
        "Date",
        "Responses",
        "Invited",
        "Response Rate",
        "Average Rating",
        "Status"
      ],
      filteredForms.map((f) => {
        const trainer = trainersById[f.trainerId]?.name || trainersById[f.trainerId]?.email || "-";
        const supervisor =
          trainersById[f.assignedSupervisorId ?? ""]?.name ||
          trainersById[f.assignedSupervisorId ?? ""]?.email ||
          "Not assigned";
        return [
          f.id,
          f.title,
          trainer,
          supervisor,
          f.department,
          f.date,
          f.feedbackResponses,
          f.trainees,
          `${pct(f.feedbackResponses, f.trainees)}%`,
          f.averageScore.toFixed(1),
          f.status
        ];
      })
    );
  };

  return (
    <div className="space-y-4">
      <header className="space-y-0.5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reports</h1>
        <p className="text-sm text-slate-500">Track platform performance, training outcomes, and supervisor workflow health.</p>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-200 p-4">
          <p className="text-xs text-slate-500">Total Forms</p>
          <p className="text-3xl font-bold text-slate-900">{metrics.total}</p>
        </Card>
        <Card className="border-slate-200 p-4">
          <p className="text-xs text-slate-500">Approved</p>
          <p className="text-3xl font-bold text-slate-900">{metrics.approved}</p>
        </Card>
        <Card className="border-slate-200 p-4">
          <p className="text-xs text-slate-500">Pending Review</p>
          <p className="text-3xl font-bold text-slate-900">{metrics.pending}</p>
        </Card>
        <Card className="border-slate-200 p-4">
          <p className="text-xs text-slate-500">Avg Rating</p>
          <p className="text-3xl font-bold text-slate-900">{metrics.averageRating} / 5</p>
        </Card>
      </section>

      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle>Report Explorer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-[1fr_200px_auto]">
            <label className="relative block">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by form, trainer, supervisor, or department..."
                className="pr-9"
              />
              <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            </label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as "All" | Status)}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
            >
              {reportStatuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <Button type="button" variant="outline" onClick={exportReportCsv} className="gap-2">
              <Download className="size-4" />
              Export CSV
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-2">Form</th>
                  <th className="pb-2">Trainer</th>
                  <th className="pb-2">Supervisor</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Responses</th>
                  <th className="pb-2">Response Rate</th>
                  <th className="pb-2">Avg Rating</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredForms.map((f) => {
                  const trainer = trainersById[f.trainerId]?.name || trainersById[f.trainerId]?.email || "-";
                  const supervisor =
                    trainersById[f.assignedSupervisorId ?? ""]?.name ||
                    trainersById[f.assignedSupervisorId ?? ""]?.email ||
                    "Not assigned";
                  const rate = pct(f.feedbackResponses, f.trainees);

                  return (
                    <tr key={f.id} className="border-b border-slate-100">
                      <td className="py-3">
                        <p className="font-medium text-slate-900">{f.title}</p>
                        <p className="text-xs text-slate-500">{f.id}</p>
                      </td>
                      <td className="text-slate-700">{trainer}</td>
                      <td className="text-slate-700">{supervisor}</td>
                      <td className="text-slate-700">{f.date}</td>
                      <td className="text-slate-700">{f.feedbackResponses} / {f.trainees}</td>
                      <td className="text-slate-700">{rate}%</td>
                      <td className="text-slate-700">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                          <Star className="size-3.5 fill-amber-400 text-amber-400" />
                          {f.averageScore.toFixed(1)}
                        </span>
                      </td>
                      <td className="text-slate-700">{f.status}</td>
                    </tr>
                  );
                })}
                {filteredForms.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-sm text-slate-500">
                      No report rows found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
