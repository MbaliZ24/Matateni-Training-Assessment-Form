import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useAppStore } from "../../store/app-store";

export function AdminSupervisorReviewsPage() {
  const forms = useAppStore((s) => s.forms);
  const users = useAppStore((s) => s.users);

  const supervisorById = useMemo(
    () => Object.fromEntries(users.filter((u) => u.role === "supervisor").map((u) => [u.id, u])),
    [users]
  );

  const reviewQueue = useMemo(
    () => forms.filter((f) => ["Submitted", "Under Review", "Needs Correction"].includes(f.status)),
    [forms]
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Supervisor Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="pb-2">Form</th>
                  <th className="pb-2">Assigned Supervisor</th>
                  <th className="pb-2">Current Status</th>
                  <th className="pb-2">Decision</th>
                  <th className="pb-2">Updated</th>
                </tr>
              </thead>
              <tbody>
                {reviewQueue.map((form) => (
                  <tr key={form.id} className="border-b border-slate-100">
                    <td className="py-3">
                      <p className="font-medium text-slate-900">{form.title}</p>
                      <p className="text-xs text-slate-500">{form.id}</p>
                    </td>
                    <td className="text-slate-700">
                      {supervisorById[form.assignedSupervisorId ?? ""]?.name ||
                        supervisorById[form.assignedSupervisorId ?? ""]?.email ||
                        "Not assigned"}
                    </td>
                    <td className="text-slate-700">{form.status}</td>
                    <td className="text-slate-700">{form.supervisorReview?.decision ?? "Pending"}</td>
                    <td className="text-slate-700">{(form.supervisorReview?.updatedAt ?? form.createdAt).slice(0, 10)}</td>
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

