import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useAppStore } from "../../store/app-store";

export function AdminAuditLogPage() {
  const forms = useAppStore((s) => s.forms);

  const events = useMemo(() => {
    const rows: { id: string; when: string; actor: string; action: string; target: string }[] = [];
    forms.forEach((form) => {
      rows.push({
        id: `${form.id}-created`,
        when: form.createdAt,
        actor: form.submittedData?.trainerName || "Trainer",
        action: "Created form",
        target: form.title
      });
      if (form.supervisorReview?.updatedAt) {
        rows.push({
          id: `${form.id}-reviewed`,
          when: form.supervisorReview.updatedAt,
          actor: form.supervisorReview.submittedBy || "Supervisor",
          action: `Review: ${form.supervisorReview.decision}`,
          target: form.title
        });
      }
    });
    return rows.sort((a, b) => b.when.localeCompare(a.when));
  }, [forms]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-slate-500">No audit events yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-500">
                    <th className="pb-2">Time</th>
                    <th className="pb-2">Actor</th>
                    <th className="pb-2">Action</th>
                    <th className="pb-2">Target</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id} className="border-b border-slate-100">
                      <td className="py-3 text-slate-700">{event.when}</td>
                      <td className="text-slate-700">{event.actor}</td>
                      <td className="text-slate-700">{event.action}</td>
                      <td className="text-slate-900 font-medium">{event.target}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

