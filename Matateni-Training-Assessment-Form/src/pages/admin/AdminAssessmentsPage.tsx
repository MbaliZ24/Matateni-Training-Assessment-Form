import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { useAppStore } from "../../store/app-store";

export function AdminAssessmentsPage() {
  const forms = useAppStore((s) => s.forms);
  const users = useAppStore((s) => s.users);
  const [search, setSearch] = useState("");

  const trainersById = useMemo(() => Object.fromEntries(users.map((u) => [u.id, u])), [users]);

  const filteredForms = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return forms;
    return forms.filter((f) => {
      const trainerName = trainersById[f.trainerId]?.name || trainersById[f.trainerId]?.email || "";
      return (
        f.title.toLowerCase().includes(q) ||
        f.id.toLowerCase().includes(q) ||
        f.status.toLowerCase().includes(q) ||
        trainerName.toLowerCase().includes(q)
      );
    });
  }, [forms, trainersById, search]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Assessments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 max-w-md">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title, trainer, status, or ID..."
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="pb-2">Form</th>
                  <th className="pb-2">Trainer</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Responses</th>
                  <th className="pb-2">Avg Rating</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredForms.map((form) => (
                  <tr key={form.id} className="border-b border-slate-100">
                    <td className="py-3">
                      <p className="font-medium text-slate-900">{form.title}</p>
                      <p className="text-xs text-slate-500">{form.id}</p>
                    </td>
                    <td className="text-slate-700">{trainersById[form.trainerId]?.name || trainersById[form.trainerId]?.email || "-"}</td>
                    <td className="text-slate-700">{form.date}</td>
                    <td className="text-slate-700">{form.feedbackResponses} / {form.trainees}</td>
                    <td className="text-slate-700">{form.averageScore.toFixed(1)}</td>
                    <td className="text-slate-700">{form.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

