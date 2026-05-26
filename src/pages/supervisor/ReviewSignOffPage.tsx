import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useAppStore } from "../../store/app-store";
import { useState } from "react";

export function ReviewSignOffPage() {
  const forms = useAppStore((s) => s.forms);
  const update = useAppStore((s) => s.updateFormStatus);
  const target = forms.find((f) => f.status === "Submitted") || forms[0];
  const [comment, setComment] = useState("");

  if (!target) return <p>No form selected.</p>;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader><CardTitle>Review & Sign-Off</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-slate-50 p-4 text-sm"><p className="font-semibold">{target.title}</p><p>Department: {target.department}</p><p>Trainees: {target.trainees}</p><p>Average Score: {target.averageScore.toFixed(1)}</p></div>
          <textarea className="h-28 w-full rounded-lg border border-slate-300 p-3" placeholder="Supervisor comments" value={comment} onChange={(e) => setComment(e.target.value)} />
          <Input placeholder="Digital sign-off name" defaultValue="Supervisor Signature" />
          <div className="flex flex-wrap gap-2"><Button onClick={() => update(target.id, "Approved")}>Approve</Button><Button variant="destructive" onClick={() => update(target.id, "Rejected")}>Reject</Button><Button variant="secondary" onClick={() => update(target.id, "Needs Correction")}>Request Correction</Button></div>
        </CardContent>
      </Card>
    </div>
  );
}
