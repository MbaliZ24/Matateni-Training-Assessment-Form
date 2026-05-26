import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useState } from "react";

export function TraineeFeedbackPage() {
  const [ratings, setRatings] = useState(Array(5).fill(0));
  const [comments, setComments] = useState("");

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <CardHeader><CardTitle>Trainee Feedback</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {["Objectives clarity", "Content relevance", "Trainer effectiveness", "Pace and duration", "Practical value"].map((item, idx) => (
            <div key={item} className="rounded-xl border border-slate-200 p-4">
              <p className="mb-2 text-sm font-medium text-slate-800">{item}</p>
              <div className="flex gap-2">{[1,2,3,4,5].map((n) => <button key={n} onClick={() => setRatings((prev) => prev.map((v, i) => i===idx ? n : v))} className={`size-10 rounded-full border text-sm font-semibold ${ratings[idx]===n ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700"}`}>{n}</button>)}</div>
            </div>
          ))}
          <textarea className="h-28 w-full rounded-lg border border-slate-300 p-3" placeholder="Add comments" value={comments} onChange={(e) => setComments(e.target.value)} />
          <Button className="w-full">Submit Feedback</Button>
          <p className="text-center text-xs text-slate-500">QR-friendly lightweight screen for mobile completion.</p>
        </CardContent>
      </Card>
    </div>
  );
}
