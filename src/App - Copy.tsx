import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type YesNo = "Yes" | "No" | "";
type Role = "trainer" | "trainee" | "supervisor";
type Section = "A" | "B" | "C" | "D" | "E" | "F" | "G";
type Status = "draft" | "submitted_to_supervisor" | "approved_by_supervisor";

const sections: Section[] = ["A", "B", "C", "D", "E", "F", "G"];
const sectionLabels: Record<Section, string> = {
  A: "Training Info", B: "Objectives", C: "Feedback", D: "Skills Check", E: "Follow-up", F: "Reflection", G: "Sign-off"
};

const feedbackStatements = [
  "The training objectives were clear.",
  "The content was relevant to my role.",
  "The trainer was knowledgeable and organised.",
  "The pace and duration were appropriate.",
  "Practical exercises/workplace examples were useful.",
  "The training will help me perform my job more effectively."
];

const tableCell = "border border-brand-line px-3 py-2";

function Card({ section, title, owner, disabled = false, children }: { section: string; title: string; owner: string; disabled?: boolean; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-brand-line bg-white shadow-panel">
      <div className="flex items-center justify-between gap-3 border-b border-brand-line px-5 py-4">
        <div className="flex items-center gap-3"><span className="inline-flex size-7 items-center justify-center rounded-full bg-brand-ruby text-xs font-bold text-white">{section}</span><h2 className="text-lg font-semibold text-brand-ink">{title}</h2></div>
        <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{owner}</span>
      </div>
      <div className="p-5"><fieldset disabled={disabled} className="disabled:opacity-80">{children}</fieldset></div>
    </section>
  );
}

function TextInput({ label, value, onChange, type = "text", readOnly = false, placeholder = "" }: { label: string; value?: string; onChange?: (v: string) => void; type?: string; readOnly?: boolean; placeholder?: string }) {
  return <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">{label}<input type={type} value={value} readOnly={readOnly} placeholder={placeholder} onChange={(e) => onChange?.(e.target.value)} className="rounded-lg border border-brand-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-ruby" /></label>;
}

function SignaturePad({ label, disabled = false, onSignedChange }: { label: string; disabled?: boolean; onSignedChange?: (v: boolean) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const holderRef = useRef<HTMLDivElement | null>(null);
  const drawing = useRef(false);
  const pointerId = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current; const holder = holderRef.current; if (!canvas || !holder) return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = holder.clientWidth, h = 64;
      const snap = document.createElement("canvas"); snap.width = canvas.width; snap.height = canvas.height;
      snap.getContext("2d")?.drawImage(canvas, 0, 0);
      canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr); canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d"); if (!ctx) return; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#1c1b34";
      if (snap.width) ctx.drawImage(snap, 0, 0, w, h);
    };
    resize(); window.addEventListener("resize", resize); return () => window.removeEventListener("resize", resize);
  }, []);

  const p = (e: React.PointerEvent<HTMLCanvasElement>) => { const r = canvasRef.current!.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return; const c = canvasRef.current; const ctx = c?.getContext("2d"); if (!c || !ctx) return;
    c.setPointerCapture(e.pointerId); pointerId.current = e.pointerId; const pt = p(e); ctx.beginPath(); ctx.moveTo(pt.x, pt.y); drawing.current = true; onSignedChange?.(true);
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => { if (disabled || !drawing.current || e.pointerId !== pointerId.current) return; const ctx = canvasRef.current?.getContext("2d"); if (!ctx) return; const pt = p(e); ctx.lineTo(pt.x, pt.y); ctx.stroke(); };
  const up = (e: React.PointerEvent<HTMLCanvasElement>) => { if (disabled || e.pointerId !== pointerId.current) return; drawing.current = false; pointerId.current = null; };
  const clear = () => { if (disabled) return; const c = canvasRef.current; const ctx = c?.getContext("2d"); if (!c || !ctx) return; ctx.clearRect(0, 0, c.width, c.height); onSignedChange?.(false); };

  return <div className="space-y-1"><p className="text-xs text-slate-500">{label}</p><div ref={holderRef} className="rounded-lg border border-brand-line bg-white"><canvas ref={canvasRef} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} onPointerCancel={up} className={`h-16 w-full touch-none rounded-lg ${disabled ? "opacity-70" : ""}`} /></div><button type="button" disabled={disabled} onClick={clear} className="text-[11px] text-slate-500 disabled:opacity-40">Clear</button></div>;
}

export default function App() {
  const formRef = useRef<HTMLDivElement | null>(null);
  const [role, setRole] = useState<Role>("trainer");
  const [active, setActive] = useState<Section>("A");
  const [status, setStatus] = useState<Status>("draft");
  const [modal, setModal] = useState<{ open: boolean; title: string; msg: string; ok: boolean }>({ open: false, title: "", msg: "", ok: true });

  const [ratings, setRatings] = useState<(number | null)[]>(Array(feedbackStatements.length).fill(null));
  const [sigs, setSigs] = useState({ trainer: false, supervisor: false });

  const visible = useMemo(() => {
    if (role === "trainer") return sections;
    if (role === "trainee") return ["C"] as Section[];
    return ["A", "B", "C", "D", "E", "F", "G"] as Section[];
  }, [role]);

  useEffect(() => { if (!visible.includes(active)) setActive(visible[0]); }, [visible, active]);

  const i = visible.indexOf(active);
  const isFirst = i === 0;
  const isLast = i === visible.length - 1;
  const avg = useMemo(() => {
    const s = ratings.filter((x): x is number => x !== null);
    if (!s.length) return "-";
    return `${(s.reduce((a, b) => a + b, 0) / s.length).toFixed(1)} / 5`;
  }, [ratings]);

  const hasAnyInput = () => {
    const root = formRef.current; if (!root) return false;
    const fields = Array.from(root.querySelectorAll("input, textarea, select"));
    return fields.some((f) => {
      if (f instanceof HTMLInputElement) {
        if (["hidden", "button", "submit", "reset"].includes(f.type)) return false;
        if (f.type === "checkbox" || f.type === "radio") return f.checked;
        return f.value.trim() !== "";
      }
      if (f instanceof HTMLTextAreaElement || f instanceof HTMLSelectElement) return f.value.trim() !== "";
      return false;
    }) || sigs.trainer || sigs.supervisor;
  };

  const submit = () => {
    if (!hasAnyInput()) return setModal({ open: true, title: "Form Is Empty", msg: "Please complete at least one field before submitting.", ok: false });
    if (role === "trainer") { setStatus("submitted_to_supervisor"); return setModal({ open: true, title: "Submitted To Supervisor", msg: "Trainer response sent for supervisor review.", ok: true }); }
    if (role === "supervisor") {
      if (status !== "submitted_to_supervisor") return setModal({ open: true, title: "No Trainer Submission Yet", msg: "Wait for trainer submission before approval.", ok: false });
      setStatus("approved_by_supervisor"); return setModal({ open: true, title: "Approved", msg: "Submission approved by supervisor.", ok: true });
    }
    return setModal({ open: true, title: "Feedback Submitted", msg: "Trainee feedback submitted successfully.", ok: true });
  };

  const readOnlyAll = role === "supervisor";

  return (
    <main ref={formRef} className="min-h-screen bg-brand-mist py-8">
      <div className="mx-auto w-full max-w-6xl px-4">
        <header className="mb-6 rounded-2xl border border-brand-line bg-white p-6 shadow-panel text-center">
          <img src="/matateni-logo.png" alt="Matateni" className="mx-auto w-full max-w-[340px]" />
          <h1 className="mt-3 text-3xl font-bold text-brand-navy">Training Effectiveness Assessment Form</h1>
        </header>

        <div className="mb-5 rounded-xl border border-brand-line bg-white p-4 shadow-panel">
          <p className="mb-2 text-sm font-semibold">I am filling this form as:</p>
          <div className="flex flex-wrap gap-2">
            {[
              ["trainer", "Trainer"],
              ["trainee", "Trainee"],
              ["supervisor", "Supervisor Review & Sign-off"]
            ].map(([k, l]) => (
              <button key={k} type="button" onClick={() => setRole(k as Role)} className={`rounded-lg border px-4 py-2 text-sm font-semibold ${role === k ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700"}`}>{l}</button>
            ))}
          </div>
        </div>

        {role === "supervisor" ? <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Supervisor review mode: trainer sections are read-only. You may complete Section E and your row in Sign-off.</div> : null}

        <div className="sticky top-0 z-20 mb-5 rounded-2xl border border-brand-line bg-white/95 px-4 py-4 shadow-sm">
          <p className="mb-2 text-sm font-semibold">Step {i + 1} of {visible.length}</p>
          <div className="relative pt-1">
            <div className="absolute left-0 right-0 top-4 h-[3px] bg-slate-200" />
            <div className="absolute left-0 top-4 h-[3px] bg-slate-700" style={{ width: `${visible.length > 1 ? (i / (visible.length - 1)) * 100 : 100}%` }} />
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${visible.length}, minmax(0, 1fr))` }}>
              {visible.map((s, idx) => <button key={s} type="button" onClick={() => setActive(s)} className="text-center"><span className={`mx-auto mb-2 flex size-8 items-center justify-center rounded-full border text-sm font-bold ${idx <= i ? "border-slate-700 bg-slate-700 text-white" : "border-slate-300 bg-white text-slate-400"}`}>{idx + 1}</span><span className={`text-xs ${idx <= i ? "text-slate-700" : "text-slate-500"}`}>{sectionLabels[s]}</span></button>)}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {active === "A" ? <Card section="A" title="Training Information" owner="Trainer" disabled={readOnlyAll}><div className="grid gap-4 md:grid-cols-2"><TextInput label="Trainer’s Name" /><TextInput label="Trainer’s Department/Role" /><TextInput label="Training Title / Topic" /><TextInput label="Training Date" type="date" /></div></Card> : null}
          {active === "B" ? <Card section="B" title="Training Objectives" owner="Trainer" disabled={readOnlyAll}><TextInput label="Objective 1" /><TextInput label="Objective 2" /><TextInput label="Objective 3" /></Card> : null}
          {active === "C" ? <Card section="C" title={role === "trainee" ? "Trainee Self-Feedback" : "Trainee Feedback (Aggregate Summary)"} owner={role === "trainee" ? "Trainee" : "Trainer"} disabled={readOnlyAll}>
            {role !== "trainee" ? <div className="mb-4 rounded-xl border border-brand-line bg-slate-50 p-4"><p className="text-sm font-semibold">Trainee Roster (entered by trainer)</p><TextInput label="Trainee Name" /></div> : null}
            <div className="overflow-x-auto"><table className="min-w-full border-collapse rounded-lg border border-brand-line text-sm"><thead className="bg-slate-100"><tr><th className={`${tableCell} text-left`}>Statement</th>{[1,2,3,4,5].map((n)=><th key={n} className={`${tableCell} text-center`}>{n}</th>)}</tr></thead><tbody>{feedbackStatements.map((st, r)=><tr key={st} className="odd:bg-white even:bg-slate-50"><td className={tableCell}>{st}</td>{[1,2,3,4,5].map((n)=><td key={n} className={`${tableCell} text-center`}><input type="radio" name={`r-${r}`} checked={ratings[r]===n} onChange={()=>setRatings((p)=>{const x=[...p];x[r]=n;return x;})} /></td>)}</tr>)}</tbody></table></div>
            <div className="mt-4 max-w-sm"><TextInput label="Average Score (auto-calculated)" value={avg} readOnly /></div>
          </Card> : null}
          {active === "D" ? <Card section="D" title="Knowledge / Skills Check" owner="Trainer" disabled={readOnlyAll}><TextInput label="Trainee Name" /></Card> : null}
          {active === "E" ? <Card section="E" title="Workplace Application & Follow-up" owner="Trainer / Supervisor / Line Manager" disabled={false}><p className="mb-3 text-sm font-semibold text-brand-ruby">To be completed by trainer with input from supervisor/line manager, 2-4 weeks post-training.</p><div className="grid gap-3 md:grid-cols-2"><TextInput label="Supervisor / Line Manager Name" /><TextInput label="Supervisor Role / Department" /><TextInput label="Follow-up Date" type="date" /></div></Card> : null}
          {active === "F" ? <Card section="F" title="Overall Trainer Reflection & Improvement" owner="Trainer" disabled={readOnlyAll}><TextInput label="What worked well?" /><TextInput label="What would you change?" /></Card> : null}
          {active === "G" ? <Card section="G" title="Sign-off" owner="Trainer" disabled={false}><div className="overflow-x-auto"><table className="min-w-full border-collapse rounded-lg border border-brand-line text-sm"><thead className="bg-slate-100"><tr><th className={`${tableCell} text-left`}>Role</th><th className={`${tableCell} text-left`}>Name</th><th className={`${tableCell} text-left`}>Signature</th><th className={`${tableCell} text-left`}>Date</th></tr></thead><tbody>{[{role:"Trainer",key:"trainer" as const},{role:"Supervisor / Training Coordinator",key:"supervisor" as const}].map(({role:keyLabel,key})=>{const rowReadOnly=(role==="supervisor"&&key==="trainer")||(role==="trainer"&&key==="supervisor");return <tr key={keyLabel} className="odd:bg-white even:bg-slate-50"><td className={tableCell}>{keyLabel}</td><td className={tableCell}><input readOnly={rowReadOnly} className="w-full rounded-lg border border-brand-line px-2 py-1.5 read-only:bg-slate-100" /></td><td className={tableCell}><SignaturePad label={`${keyLabel} signature`} disabled={rowReadOnly} onSignedChange={(v)=>setSigs((p)=>({...p,[key]:v}))} /></td><td className={tableCell}><input type="date" readOnly={rowReadOnly} className="w-full rounded-lg border border-brand-line px-2 py-1.5 read-only:bg-slate-100" /></td></tr>;})}</tbody></table></div></Card> : null}

          <div className="flex items-center justify-between rounded-xl border border-brand-line bg-white p-4 shadow-panel">
            <button type="button" onClick={() => !isFirst && setActive(visible[i - 1])} disabled={isFirst} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-40">← Back</button>
            <p className="text-sm text-slate-500">Section {active}</p>
            {isLast ? (
              <button type="button" onClick={submit} className="rounded-lg border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white">{role === "trainer" ? "Submit To Supervisor" : role === "supervisor" ? "Approve Submission" : "Submit Feedback"}</button>
            ) : (
              <button type="button" onClick={() => setActive(visible[i + 1])} className="rounded-lg border border-slate-700 bg-slate-700 px-4 py-2 text-sm font-semibold text-white">Next →</button>
            )}
          </div>
        </div>

        {modal.open ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"><div className="mb-3 flex items-center gap-3"><span className={`inline-flex size-10 items-center justify-center rounded-full text-xl font-bold ${modal.ok ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{modal.ok ? "✓" : "!"}</span><h3 className="text-lg font-semibold">{modal.title}</h3></div><p className="text-sm text-slate-600">{modal.msg}</p><div className="mt-4 flex justify-end"><button type="button" onClick={() => setModal((m) => ({ ...m, open: false }))} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">Close</button></div></div></div> : null}
      </div>
    </main>
  );
}
