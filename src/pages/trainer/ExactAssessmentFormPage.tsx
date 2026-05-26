// Primary training assessment workflow used by trainer and reused as read-only for supervisor review.
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAppStore } from "../../store/app-store";
import type { TrainingForm } from "../../types";

const ratingScale = [1, 2, 3, 4, 5] as const;

type YesNo = "Yes" | "No" | "";

type TraineeEval = {
  name: string;
  understanding: YesNo;
  independent: YesNo;
};

type TraineeRosterItem = {
  name: string;
  departmentOrRole: string;
  attendance: YesNo;
};

const feedbackStatements = [
  "The training objectives were clear.",
  "The content was relevant to my role.",
  "The trainer was knowledgeable and organised.",
  "The pace and duration of training were appropriate.",
  "Practical exercises / workplace examples were useful.",
  "The training will help me perform my job more effectively."
];

function createEmptyTrainee(): TraineeEval {
  return {
    name: "",
    understanding: "",
    independent: ""
  };
}

function createEmptyRosterItem(): TraineeRosterItem {
  return {
    name: "",
    departmentOrRole: "",
    attendance: ""
  };
}

function Card({
  section,
  title,
  owner,
  disabled = false,
  children
}: {
  section: string;
  title: string;
  owner: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  const ownerStyles =
    owner === "Trainee"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : owner.includes("Trainee")
        ? "border-violet-200 bg-violet-50 text-violet-700"
        : "border-slate-300 bg-slate-100 text-slate-700";

  return (
    <section className="rounded-2xl border border-brand-line bg-white shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-line px-5 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-7 items-center justify-center rounded-full bg-brand-ruby text-xs font-bold text-white">
            {section}
          </span>
          <h2 className="text-base font-semibold text-brand-ink md:text-lg">{title}</h2>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${ownerStyles}`}>
          {owner}
        </span>
      </div>
      <div className="p-5 md:p-6">
        <fieldset disabled={disabled} className="disabled:opacity-80">
          {children}
        </fieldset>
      </div>
    </section>
  );
}

function TextInput({
  label,
  placeholder,
  value,
  onChange,
  readOnly,
  type = "text",
  min
}: {
  label: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  type?: "text" | "date" | "number";
  min?: number;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
      {label}
      <input
        type={type}
        min={min}
        placeholder={placeholder}
        title={label}
        value={value}
        readOnly={readOnly}
        onChange={(event) => onChange?.(event.target.value)}
        className="rounded-lg border border-brand-line bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-ruby focus:ring-2 focus:ring-red-100"
      />
    </label>
  );
}

function TextArea({ label, rows = 4 }: { label: string; rows?: number }) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
      {label}
      <textarea
        title={label}
        rows={rows}
        className="rounded-lg border border-brand-line bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-ruby focus:ring-2 focus:ring-red-100"
      />
    </label>
  );
}

function CheckboxLine({ label }: { label: string }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
      <input title={label} type="checkbox" className="size-4 rounded border-brand-line text-brand-ruby focus:ring-red-100" />
      {label}
    </label>
  );
}

function YesNoGroup({
  name,
  value,
  onChange
}: {
  name: string;
  value: YesNo;
  onChange: (value: YesNo) => void;
}) {
  return (
    <div className="inline-flex gap-3">
      <label className="inline-flex items-center gap-1.5 text-sm text-slate-700">
        <input
          type="radio"
          title={`${name}-Yes`}
          name={name}
          checked={value === "Yes"}
          onChange={() => onChange("Yes")}
          className="accent-brand-ruby"
        />
        Yes
      </label>
      <label className="inline-flex items-center gap-1.5 text-sm text-slate-700">
        <input
          type="radio"
          title={`${name}-No`}
          name={name}
          checked={value === "No"}
          onChange={() => onChange("No")}
          className="accent-brand-ruby"
        />
        No
      </label>
    </div>
  );
}

function SignaturePad({
  label,
  onSignedChange,
  disabled = false
}: {
  label: string;
  onSignedChange?: (isSigned: boolean) => void;
  disabled?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDrawingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const width = container.clientWidth;
      const height = 64;
      const dpr = window.devicePixelRatio || 1;

      // Preserve existing strokes when the viewport changes.
      const snapshot = document.createElement("canvas");
      snapshot.width = canvas.width;
      snapshot.height = canvas.height;
      const snapshotContext = snapshot.getContext("2d");
      if (snapshotContext) {
        snapshotContext.drawImage(canvas, 0, 0);
      }

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.lineWidth = 2;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.strokeStyle = "#1c1b34";

      if (snapshot.width > 0 && snapshot.height > 0) {
        context.drawImage(snapshot, 0, 0, width, height);
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    pointerIdRef.current = event.pointerId;

    const point = getPoint(event);
    context.beginPath();
    context.moveTo(point.x, point.y);
    isDrawingRef.current = true;
    onSignedChange?.(true);
  };

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    if (!isDrawingRef.current) return;
    if (pointerIdRef.current !== null && event.pointerId !== pointerIdRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    event.preventDefault();
    const point = getPoint(event);
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const endDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    if (pointerIdRef.current !== null && event.pointerId !== pointerIdRef.current) return;
    isDrawingRef.current = false;
    pointerIdRef.current = null;
  };

  const clearSignature = () => {
    if (disabled) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    onSignedChange?.(false);
  };

  return (
    <div className="space-y-1">
      <p className="text-xs text-slate-500">{label}</p>
      <div ref={containerRef} className="rounded-lg border border-brand-line bg-white">
        <canvas
          title={label}
          ref={canvasRef}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={endDrawing}
          onPointerLeave={endDrawing}
          onPointerCancel={endDrawing}
          className={`h-16 w-full touch-none rounded-lg ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
        />
      </div>
      <button
        type="button"
        onClick={clearSignature}
        disabled={disabled}
        className="text-[11px] font-medium text-slate-500 transition hover:text-brand-ruby disabled:cursor-not-allowed disabled:opacity-40"
      >
        Clear
      </button>
    </div>
  );
}

const tableCell = "border border-brand-line px-3 py-2";

type ExactAssessmentFormPageProps = {
  readOnly?: boolean;
  submittedData?: TrainingForm["submittedData"];
};

export function ExactAssessmentFormPage({ readOnly = false, submittedData }: ExactAssessmentFormPageProps) {
  const addForm = useAppStore((s) => s.addForm);
  const currentUser = useAppStore((s) => s.currentUser);
  const sections = ["A", "B", "C", "D", "E", "F", "G"] as const;
  type SectionKey = (typeof sections)[number];
  type UserRole = "trainer" | "trainee" | "supervisor";
  type WorkflowStatus = "draft" | "submitted_to_supervisor" | "approved_by_supervisor";
  const [activeSection, setActiveSection] = useState<SectionKey>("A");
  const [userRole] = useState<UserRole>(readOnly ? "supervisor" : "trainer");
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>("draft");
  const formRef = useRef<HTMLDivElement | null>(null);

  const [trainerName, setTrainerName] = useState(submittedData?.trainerName ?? currentUser?.name ?? "");
  const [trainerDepartment, setTrainerDepartment] = useState(currentUser?.department ?? "");
  const [trainingTitle, setTrainingTitle] = useState(submittedData?.trainingTitle ?? "");
  const [trainingDate, setTrainingDate] = useState(submittedData?.trainingDate ?? "");
  const [trainingDurationDays, setTrainingDurationDays] = useState(submittedData?.durationDays ?? "");
  const [trainingDurationHours, setTrainingDurationHours] = useState(submittedData?.durationHours ?? "");
  const [numberOfTrainees, setNumberOfTrainees] = useState(submittedData?.numberOfTrainees ?? "");
  const [objectives, setObjectives] = useState<string[]>(submittedData?.objectives?.length ? submittedData.objectives : [""]);
  const [observedImprovement, setObservedImprovement] = useState<YesNo>("");
  const [signatures, setSignatures] = useState({
    trainer: false,
    supervisor: false
  });
  const [submitModal, setSubmitModal] = useState<{
    open: boolean;
    kind: "success" | "error";
    title: string;
    message: string;
  }>({
    open: false,
    kind: "success",
    title: "",
    message: ""
  });

  const [ratings, setRatings] = useState<(number | null)[]>(Array(feedbackStatements.length).fill(null));
  const [traineeRoster, setTraineeRoster] = useState<TraineeRosterItem[]>(
    submittedData?.traineeRoster?.length ? submittedData.traineeRoster : [createEmptyRosterItem()]
  );

  const [trainees, setTrainees] = useState<TraineeEval[]>([createEmptyTrainee()]);

  const autoAverageScore = useMemo(() => {
    const selected = ratings.filter((score): score is number => score !== null);
    if (selected.length === 0) return "";
    const avg = selected.reduce((sum, score) => sum + score, 0) / selected.length;
    return `${avg.toFixed(1)} / 5`;
  }, [ratings]);

  const autoPassRate = useMemo(() => {
    const evaluated = trainees.filter((t) => t.understanding !== "" && t.independent !== "");
    if (evaluated.length === 0) return "";
    const passed = evaluated.filter((t) => t.understanding === "Yes" && t.independent === "Yes").length;
    return `${passed} / ${evaluated.length} trainees`;
  }, [trainees]);

  useEffect(() => {
    if (!numberOfTrainees) return;

    const desired = Number(numberOfTrainees);
    if (!Number.isFinite(desired) || desired <= 0) return;

    setTrainees((prev) => {
      if (prev.length === desired) return prev;
      if (prev.length < desired) {
        return [...prev, ...Array.from({ length: desired - prev.length }, () => createEmptyTrainee())];
      }
      return prev.slice(0, desired);
    });
  }, [numberOfTrainees]);

  const updateObjective = (index: number, value: string) => {
    setObjectives((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const sectionOwnership: Record<SectionKey, "Trainer" | "Trainee" | "Trainer + Trainee"> = {
    A: "Trainer",
    B: "Trainer",
    C: "Trainee",
    D: "Trainer",
    E: "Trainer",
    F: "Trainer",
    G: "Trainer"
  };

  const visibleSections = sections.filter((section) => {
    if (section === "B") return false;
    const owner = sectionOwnership[section];
    if (userRole === "trainer") return section === "C" || owner === "Trainer" || owner === "Trainer + Trainee";
    if (userRole === "trainee") return owner === "Trainee" || owner === "Trainer + Trainee";
    return section === "C" || owner === "Trainer" || owner === "Trainer + Trainee";
  });
  const isSupervisorReviewMode = readOnly || userRole === "supervisor";

  const visibleSectionIndex = visibleSections.indexOf(activeSection);
  const isFirstSection = visibleSectionIndex === 0;
  const isLastSection = visibleSectionIndex === visibleSections.length - 1;

  useEffect(() => {
    if (!visibleSections.includes(activeSection)) {
      setActiveSection(visibleSections[0]);
    }
  }, [activeSection, visibleSections]);

  const goToPreviousSection = () => {
    if (isFirstSection) return;
    setActiveSection(visibleSections[visibleSectionIndex - 1]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToNextSection = () => {
    if (isLastSection) return;
    setActiveSection(visibleSections[visibleSectionIndex + 1]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hasAnyFormInput = () => {
    const root = formRef.current;
    if (!root) return false;

    const fields = Array.from(root.querySelectorAll("input, textarea, select"));
    const hasFieldValue = fields.some((field) => {
      if (field instanceof HTMLInputElement) {
        if (["button", "submit", "reset", "hidden"].includes(field.type)) return false;
        if (field.type === "checkbox" || field.type === "radio") return field.checked;
        return field.value.trim() !== "";
      }
      if (field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) {
        return field.value.trim() !== "";
      }
      return false;
    });

    return hasFieldValue || signatures.trainer || signatures.supervisor;
  };

  const handleSubmit = () => {
    if (readOnly) return;

    if (!hasAnyFormInput()) {
      setSubmitModal({
        open: true,
        kind: "error",
        title: "Form Is Empty",
        message: "Please fill in at least one section before submitting."
      });
      return;
    }

    if (userRole === "trainer") {
      const newFormId = `F-${Date.now()}`;
      addForm({
        id: newFormId,
        title: trainingTitle || "Training Assessment",
        trainerId: currentUser?.id ?? "u1",
        department: trainerDepartment || currentUser?.department || "Operations",
        date: trainingDate || new Date().toISOString().slice(0, 10),
        trainees: Number(numberOfTrainees) || traineeRoster.length || 0,
        feedbackResponses: 0,
        averageScore: Number(
          (
            ratings.filter((score): score is number => score !== null).reduce((sum, score) => sum + score, 0) /
            Math.max(
              1,
              ratings.filter((score): score is number => score !== null).length
            )
          ).toFixed(1)
        ),
        status: "Waiting for Feedback",
        recommendation: "Pending supervisor review",
        createdAt: new Date().toISOString().slice(0, 10),
        submittedData: {
          trainerName,
          trainingTitle,
          trainingDate,
          durationDays: trainingDurationDays,
          durationHours: trainingDurationHours,
          numberOfTrainees,
          objectives,
          passRate: autoPassRate || "-",
          averageScoreDisplay: autoAverageScore || "-",
          traineeRoster
        }
      });
      setWorkflowStatus("submitted_to_supervisor");
      setSubmitModal({
        open: true,
        kind: "success",
        title: "Submitted To Supervisor",
        message: `Trainer response submitted. Share this trainee link: /trainee-feedback?formId=${newFormId}`
      });
      return;
    }

    if (userRole === "supervisor") {
      if (workflowStatus !== "submitted_to_supervisor") {
        setSubmitModal({
          open: true,
          kind: "error",
          title: "No Trainer Submission Yet",
          message: "Please wait for the trainer to submit before supervisor approval."
        });
        return;
      }
      setWorkflowStatus("approved_by_supervisor");
      setSubmitModal({
        open: true,
        kind: "success",
        title: "Approved By Supervisor",
        message: "This assessment has been reviewed and approved by supervisor/line manager."
      });
      return;
    }

    setSubmitModal({
      open: true,
      kind: "success",
      title: "Feedback Submitted",
      message: "Trainee feedback has been submitted successfully."
    });
  };

  return (
    <main ref={formRef} className="min-h-screen bg-brand-mist py-8 md:py-10">
      <div className="mx-auto w-full max-w-6xl px-4">
        <header className="mb-8 overflow-hidden rounded-2xl border border-brand-line bg-white shadow-panel">
          <div className="h-1.5 bg-brand-ruby" />
          <div className="p-5 md:p-7">
            <div className="space-y-5 text-center">
              <div className="inline-flex rounded-xl border border-brand-line bg-white p-2.5 shadow-sm">
                {/* Keep the official lockup untouched, but give it a compact executive frame. */}
                <img
                  src="/matateni-logo.png"
                  alt="Matateni Technologies logo"
                  className="h-auto w-full max-w-[300px] md:max-w-[360px]"
                />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-ruby">Training Assessment</p>
                <h1 className="mt-2 text-2xl font-bold leading-tight text-brand-navy md:text-3xl">
                  Training Effectiveness Assessment Form
                </h1>
                <p className="mt-2 text-sm text-slate-600">Matateni Projects (Pty) Ltd</p>
              </div>
            </div>
          </div>
        </header>

        {isSupervisorReviewMode ? (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-panel">
            Supervisor review mode: trainer-submitted sections are shown for assessment and approval.
          </div>
        ) : null}

        <div className="sticky top-0 z-20 mb-5 rounded-2xl border border-brand-line bg-white/95 px-4 py-4 shadow-sm backdrop-blur md:px-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Section Progress</p>
              <p className="text-sm font-semibold text-brand-ink">
                Step {visibleSectionIndex + 1} of {visibleSections.length}
              </p>
            </div>
          </div>

          <div className="relative pt-1">
            <div className="absolute left-0 right-0 top-4 h-[3px] rounded-full bg-slate-200" />
            <div
              className="absolute left-0 top-4 h-[3px] rounded-full bg-slate-700 transition-all duration-300"
              style={{
                width: `${visibleSections.length > 1 ? (visibleSectionIndex / (visibleSections.length - 1)) * 100 : 100}%`
              }}
            />
            <div className={`grid gap-1 md:gap-2`} style={{ gridTemplateColumns: `repeat(${visibleSections.length}, minmax(0, 1fr))` }} data-grid-cols={visibleSections.length}>
            {visibleSections.map((section, index) => {
              const isActive = section === activeSection;
              const isCompleted = index < visibleSectionIndex;
              const isDone = isActive || isCompleted;
              const sectionLabels: Record<SectionKey, string> = {
                A: "Training Info",
                B: "Objectives",
                C: "Feedback",
                D: "Skills Check",
                E: "Follow-up",
                F: "Reflection",
                G: "Sign-off"
              };

              return (
                <button
                  key={section}
                  type="button"
                  onClick={() => setActiveSection(section)}
                  className="group relative px-1 py-1.5 text-center transition"
                >
                  <span
                    className={`mx-auto mb-2 flex size-8 items-center justify-center rounded-full border text-sm font-bold transition md:size-9 ${
                      isDone
                        ? "border-slate-700 bg-slate-700 text-white"
                        : "border-slate-300 bg-white text-slate-400"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span
                    className={`block text-center text-[11px] font-medium transition md:text-xs ${
                      isDone ? "text-slate-700" : "text-slate-500"
                    }`}
                  >
                    {sectionLabels[section]}
                  </span>
                </button>
              );
            })}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {activeSection === "A" && visibleSections.includes("A") ? (
          <Card section="A" title="Training Information" owner="Trainer" disabled={isSupervisorReviewMode}>
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput label="Trainer’s Name" value={trainerName} onChange={setTrainerName} readOnly={isSupervisorReviewMode} />
              <TextInput label="Trainer’s Department/Role" value={trainerDepartment} onChange={setTrainerDepartment} readOnly={isSupervisorReviewMode} />
              <TextInput label="Training Title / Topic" value={trainingTitle} onChange={setTrainingTitle} readOnly={isSupervisorReviewMode} />
              <TextInput label="Training Date" type="date" value={trainingDate} onChange={setTrainingDate} />
              <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
                <div className="grid gap-3 md:grid-cols-2">
                  <TextInput
                    label="Training Duration (Days)"
                    type="number"
                    min={0}
                    placeholder="e.g. 2"
                    value={trainingDurationDays}
                    onChange={setTrainingDurationDays}
                  />
                  <TextInput
                    label="Training Duration (Hours)"
                    type="number"
                    min={0}
                    placeholder="e.g. 4"
                    value={trainingDurationHours}
                    onChange={setTrainingDurationHours}
                  />
                </div>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Number of Trainees
                  <select
                    value={numberOfTrainees}
                    onChange={(event) => setNumberOfTrainees(event.target.value)}
                    disabled={isSupervisorReviewMode}
                    className="rounded-lg border border-brand-line bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-ruby focus:ring-2 focus:ring-red-100"
                  >
                    <option value="">Select number</option>
                    {Array.from({ length: 100 }, (_, i) => i + 1).map((count) => (
                      <option key={count} value={String(count)}>
                        {count}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="md:col-span-2">
                <p className="mb-2 text-sm font-medium text-slate-700">Training Format</p>
                <div className="flex flex-wrap gap-4">
                  {["Classroom", "Virtual", "Workplace-based", "Mobile", "Blended/Hybrid"].map((item) => (
                    <CheckboxLine key={item} label={item} />
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <TextInput label="Target User Group (e.g., system users, operators, managers)" />
              </div>
            </div>
          </Card>
          ) : null}

          {activeSection === "A" && visibleSections.includes("A") ? (
          <Card section="B" title="Training Objectives" owner="Trainer" disabled={isSupervisorReviewMode}>
            <p className="mb-3 text-sm text-slate-600">Please list the key learning objectives for this training session.</p>
            <div className="space-y-3">
              {objectives.map((objective, index) => {
                const trimmed = objective.trim();
                const showHint = trimmed.length > 0 && trimmed.length < 18;

                return (
                  <div key={`objective-${index}`} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-slate-700">Objective {index + 1}</p>
                      {objectives.length > 1 ? (
                        <button
                          type="button"
                          onClick={() =>
                            setObjectives((prev) => prev.filter((_, objectiveIndex) => objectiveIndex !== index))
                          }
                          className="text-xs font-medium text-slate-500 transition hover:text-brand-ruby"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                    <textarea
                      rows={3}
                      value={objective}
                      onChange={(event) => updateObjective(index, event.target.value)}
                      placeholder="e.g. Use the HR system to submit leave requests"
                      className="w-full rounded-lg border border-brand-line bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-ruby focus:ring-2 focus:ring-red-100"
                    />
                    {showHint ? (
                      <span className="text-xs font-normal text-slate-500">
                        Try describing the expected skill/outcome.
                      </span>
                    ) : null}
                  </div>
                );
              })}

              <div>
                <button
                  type="button"
                  onClick={() => setObjectives((prev) => [...prev, ""])}
                  className="rounded-lg border border-brand-line bg-white px-3 py-2 text-sm font-medium text-brand-ink transition hover:border-brand-ruby hover:text-brand-ruby"
                >
                  + Add Objective
                </button>
              </div>
            </div>
          </Card>
          ) : null}

          {activeSection === "C" && visibleSections.includes("C") ? (
          <Card
            section="C"
            title={userRole === "trainee" ? "Trainee Self-Feedback" : "Trainee Feedback (Aggregate Summary)"}
            owner={userRole === "trainee" ? "Trainee" : "Trainer"}
            disabled={isSupervisorReviewMode}
          >
            {userRole === "trainer" ? (
              <div className="mb-4 rounded-xl border border-brand-line bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-brand-ink">Trainee Roster (entered by trainer)</p>
                    <p className="text-xs text-slate-500">Track who attended before recording aggregate feedback scores.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTraineeRoster((prev) => [...prev, createEmptyRosterItem()])}
                    className="rounded-lg border border-brand-line bg-white px-3 py-1.5 text-xs font-semibold text-brand-ink transition hover:border-brand-ruby hover:text-brand-ruby"
                  >
                    + Add Trainee
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse rounded-lg border border-brand-line text-sm">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className={`${tableCell} text-left`}>Trainee Name</th>
                        <th className={`${tableCell} text-left`}>Department / Role</th>
                        <th className={`${tableCell} text-center`}>Attendance</th>
                        <th className={`${tableCell} text-center`}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {traineeRoster.map((item, index) => (
                        <tr key={`roster-${index}`} className="odd:bg-white even:bg-slate-50">
                          <td className={tableCell}>
                            <input
                              type="text"
                              value={item.name}
                              placeholder={`Trainee ${index + 1}`}
                              onChange={(event) => {
                                const value = event.target.value;
                                setTraineeRoster((prev) => {
                                  const next = [...prev];
                                  next[index] = { ...next[index], name: value };
                                  return next;
                                });
                              }}
                              className="w-full rounded-lg border border-brand-line px-2 py-1.5 text-sm"
                            />
                          </td>
                          <td className={tableCell}>
                            <input
                              type="text"
                              value={item.departmentOrRole}
                              placeholder="e.g. Operations"
                              onChange={(event) => {
                                const value = event.target.value;
                                setTraineeRoster((prev) => {
                                  const next = [...prev];
                                  next[index] = { ...next[index], departmentOrRole: value };
                                  return next;
                                });
                              }}
                              className="w-full rounded-lg border border-brand-line px-2 py-1.5 text-sm"
                            />
                          </td>
                          <td className={`${tableCell} text-center`}>
                            <YesNoGroup
                              name={`attendance-${index}`}
                              value={item.attendance}
                              onChange={(value) => {
                                setTraineeRoster((prev) => {
                                  const next = [...prev];
                                  next[index] = { ...next[index], attendance: value };
                                  return next;
                                });
                              }}
                            />
                          </td>
                          <td className={`${tableCell} text-center`}>
                            <button
                              type="button"
                              disabled={traineeRoster.length === 1}
                              onClick={() =>
                                setTraineeRoster((prev) => prev.filter((_, rowIndex) => rowIndex !== index))
                              }
                              className="text-xs font-medium text-slate-500 transition hover:text-brand-ruby disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse overflow-hidden rounded-lg border border-brand-line text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className={`${tableCell} text-left`}>Statement</th>
                    {ratingScale.map((score) => (
                      <th key={score} className={`${tableCell} text-center`}>{score}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {feedbackStatements.map((statement, rowIndex) => (
                    <tr key={statement} className="odd:bg-white even:bg-slate-50">
                      <td className={tableCell}>{statement}</td>
                      {ratingScale.map((score) => (
                        <td key={score} className={`${tableCell} text-center`}>
                          <input
                            type="radio"
                            name={`feedback-${rowIndex}`}
                            checked={ratings[rowIndex] === score}
                            onChange={() => {
                              setRatings((prev) => {
                                const next = [...prev];
                                next[rowIndex] = score;
                                return next;
                              });
                            }}
                            className="accent-brand-ruby"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 max-w-md">
              <TextInput label="Average Score (auto-calculated)" value={autoAverageScore || "-"} readOnly />
            </div>
          </Card>
          ) : null}

          {activeSection === "D" && visibleSections.includes("D") ? (
          <Card section="D" title="Knowledge / Skills Check (Trainer Assessment)" owner="Trainer" disabled={isSupervisorReviewMode}>
            <p className="mb-3 text-sm text-slate-600">Complete after training, based on observation, Q&A, or practical test.</p>

            <div className="mb-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTrainees((prev) => [...prev, createEmptyTrainee()])}
                className="rounded-lg border border-brand-line bg-white px-3 py-2 text-sm font-medium text-brand-ink transition hover:border-brand-ruby hover:text-brand-ruby"
              >
                + Add Trainee
              </button>
            </div>

            {/* Desktop table view */}
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full border-collapse rounded-lg border border-brand-line text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className={`${tableCell} sticky top-0 z-10 bg-slate-100 text-left`}>Trainee Name (optional)</th>
                    <th className={`${tableCell} sticky top-0 z-10 bg-slate-100 text-center`}>Demonstrated understanding</th>
                    <th className={`${tableCell} sticky top-0 z-10 bg-slate-100 text-center`}>Able to perform task without support</th>
                    <th className={`${tableCell} sticky top-0 z-10 bg-slate-100 text-center`}>Status</th>
                    <th className={`${tableCell} sticky top-0 z-10 bg-slate-100 text-center`}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {trainees.map((trainee, index) => {
                    const isEvaluated = trainee.understanding !== "" && trainee.independent !== "";
                    const isPass = trainee.understanding === "Yes" && trainee.independent === "Yes";

                    return (
                      <tr key={`trainee-${index}`} className="odd:bg-white even:bg-slate-50">
                        <td className={tableCell}>
                          <input
                            type="text"
                            value={trainee.name}
                            placeholder={`Trainee ${index + 1}`}
                            onChange={(event) => {
                              const value = event.target.value;
                              setTrainees((prev) => {
                                const next = [...prev];
                                next[index] = { ...next[index], name: value };
                                return next;
                              });
                            }}
                            className="w-full rounded-lg border border-brand-line px-2 py-1.5 text-sm"
                          />
                        </td>
                        <td className={`${tableCell} text-center`}>
                          <YesNoGroup
                            name={`understanding-${index}`}
                            value={trainee.understanding}
                            onChange={(value) => {
                              setTrainees((prev) => {
                                const next = [...prev];
                                next[index] = { ...next[index], understanding: value };
                                return next;
                              });
                            }}
                          />
                        </td>
                        <td className={`${tableCell} text-center`}>
                          <YesNoGroup
                            name={`independent-${index}`}
                            value={trainee.independent}
                            onChange={(value) => {
                              setTrainees((prev) => {
                                const next = [...prev];
                                next[index] = { ...next[index], independent: value };
                                return next;
                              });
                            }}
                          />
                        </td>
                        <td className={`${tableCell} text-center`}>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              !isEvaluated
                                ? "bg-slate-100 text-slate-500"
                                : isPass
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {!isEvaluated ? "Pending" : isPass ? "Pass" : "Needs support"}
                          </span>
                        </td>
                        <td className={`${tableCell} text-center`}>
                          <button
                            type="button"
                            disabled={trainees.length === 1}
                            onClick={() =>
                              setTrainees((prev) => prev.filter((_, traineeIndex) => traineeIndex !== index))
                            }
                            className="text-xs font-medium text-slate-500 transition hover:text-brand-ruby disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile card view */}
            <div className="space-y-3 md:hidden">
              {trainees.map((trainee, index) => {
                const isEvaluated = trainee.understanding !== "" && trainee.independent !== "";
                const isPass = trainee.understanding === "Yes" && trainee.independent === "Yes";

                return (
                  <div key={`trainee-mobile-${index}`} className="rounded-lg border border-brand-line bg-white p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold text-brand-ink">Trainee {index + 1}</p>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          !isEvaluated
                            ? "bg-slate-100 text-slate-500"
                            : isPass
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {!isEvaluated ? "Pending" : isPass ? "Pass" : "Needs support"}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={trainee.name}
                        placeholder={`Trainee ${index + 1}`}
                        onChange={(event) => {
                          const value = event.target.value;
                          setTrainees((prev) => {
                            const next = [...prev];
                            next[index] = { ...next[index], name: value };
                            return next;
                          });
                        }}
                        className="w-full rounded-lg border border-brand-line px-2 py-1.5 text-sm"
                      />
                      <div>
                        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Understanding</p>
                        <YesNoGroup
                          name={`understanding-mobile-${index}`}
                          value={trainee.understanding}
                          onChange={(value) => {
                            setTrainees((prev) => {
                              const next = [...prev];
                              next[index] = { ...next[index], understanding: value };
                              return next;
                            });
                          }}
                        />
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Independent Performance</p>
                        <YesNoGroup
                          name={`independent-mobile-${index}`}
                          value={trainee.independent}
                          onChange={(value) => {
                            setTrainees((prev) => {
                              const next = [...prev];
                              next[index] = { ...next[index], independent: value };
                              return next;
                            });
                          }}
                        />
                      </div>
                      {trainees.length > 1 ? (
                        <button
                          type="button"
                          onClick={() =>
                            setTrainees((prev) => prev.filter((_, traineeIndex) => traineeIndex !== index))
                          }
                          className="text-xs font-medium text-slate-500 transition hover:text-brand-ruby"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 max-w-md">
              <TextInput label="Overall pass rate (auto-calculated)" value={autoPassRate || "-"} readOnly />
            </div>
          </Card>
          ) : null}

          {activeSection === "E" && visibleSections.includes("E") ? (
          <Card section="E" title="Workplace Application & Follow-up" owner="Trainer / Supervisor / Line Manager" disabled={false}>
            <p className="mb-3 text-sm font-semibold text-brand-ruby">To be completed by trainer with input from supervisor/line manager, 2-4 weeks post-training.</p>
            <div className="space-y-5">
              <div className="rounded-xl border border-brand-line bg-slate-50 p-4">
                <p className="mb-3 text-sm font-semibold text-brand-ink">Follow-up Participants</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <TextInput label="Supervisor / Line Manager Name" />
                  <TextInput label="Supervisor Role / Department" />
                  <TextInput label="Follow-up Date" type="date" />
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">To what extent have trainees applied the skills in the workplace?</p>
                <div className="flex flex-wrap gap-4">
                  {["Not at all", "Minimally", "Moderately", "Largely", "Fully"].map((item) => (
                    <CheckboxLine key={item} label={item} />
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Observed improvement in performance or system use?</p>
                <div className="mb-3 flex gap-4">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={observedImprovement === "Yes"}
                      onChange={() =>
                        setObservedImprovement((prev) => (prev === "Yes" ? "" : "Yes"))
                      }
                      className="size-4 rounded border-brand-line text-brand-ruby focus:ring-red-100"
                    />
                    Yes
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={observedImprovement === "No"}
                      onChange={() =>
                        setObservedImprovement((prev) => (prev === "No" ? "" : "No"))
                      }
                      className="size-4 rounded border-brand-line text-brand-ruby focus:ring-red-100"
                    />
                    No
                  </label>
                </div>
                {observedImprovement === "Yes" ? (
                  <TextArea label="If yes, please describe briefly" rows={3} />
                ) : null}
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Additional support or refresher training needed?</p>
                <div className="flex flex-wrap gap-4">
                  {["None", "Minimal", "Significant", "Full retraining required"].map((item) => (
                    <CheckboxLine key={item} label={item} />
                  ))}
                </div>
              </div>

              <TextArea label="Comments / barriers to application (e.g., time, resources, supervision)" rows={4} />
            </div>
          </Card>
          ) : null}

          {activeSection === "F" && visibleSections.includes("F") ? (
          <Card section="F" title="Overall Trainer Reflection & Improvement" owner="Trainer" disabled={isSupervisorReviewMode}>
            <div className="space-y-4">
              <TextArea label="What worked well in this training?" rows={3} />
              <TextArea label="What would you change for future sessions?" rows={3} />
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Training effectiveness rating (overall)</p>
                <div className="flex flex-wrap gap-4">
                  {["Poor", "Fair", "Good", "Very Good", "Excellent"].map((item) => (
                    <CheckboxLine key={item} label={item} />
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Recommendation</p>
                <div className="flex flex-wrap gap-4">
                  {["Proceed as is", "Minor adjustments needed", "Major revision required"].map((item) => (
                    <CheckboxLine key={item} label={item} />
                  ))}
                </div>
              </div>
            </div>
          </Card>
          ) : null}

          {activeSection === "G" && visibleSections.includes("G") ? (
          <Card section="G" title="Sign-off" owner="Trainer" disabled={false}>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse rounded-lg border border-brand-line text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className={`${tableCell} text-left`}>Role</th>
                    <th className={`${tableCell} text-left`}>Name</th>
                    <th className={`${tableCell} text-left`}>Signature</th>
                    <th className={`${tableCell} text-left`}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { role: "Trainer", key: "trainer" as const },
                    { role: "Supervisor / Training Coordinator", key: "supervisor" as const }
                  ].map(({ role, key }) => {
                    const rowReadOnly =
                      (userRole === "supervisor" && key === "trainer") ||
                      (userRole === "trainer" && key === "supervisor");
                    return (
                    <tr key={role} className="odd:bg-white even:bg-slate-50">
                      <td className={tableCell}>{role}</td>
                      <td className={tableCell}>
                        <input
                          type="text"
                          readOnly={rowReadOnly}
                          className="w-full rounded-lg border border-brand-line px-2 py-1.5 read-only:bg-slate-100"
                        />
                      </td>
                      <td className={tableCell}>
                        <SignaturePad
                          label={`${role} signature`}
                          disabled={rowReadOnly}
                          onSignedChange={(isSigned) =>
                            setSignatures((prev) => ({ ...prev, [key]: isSigned }))
                          }
                        />
                      </td>
                      <td className={tableCell}>
                        <input
                          type="date"
                          readOnly={rowReadOnly}
                          className="w-full rounded-lg border border-brand-line px-2 py-1.5 read-only:bg-slate-100"
                        />
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
          ) : null}

          <div className="flex items-center justify-between rounded-xl border border-brand-line bg-white p-4 shadow-panel">
            <button
              type="button"
              onClick={goToPreviousSection}
              disabled={isFirstSection}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-ruby hover:text-brand-ruby disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300 disabled:opacity-100"
            >
              ? Back
            </button>
            <p className="text-sm font-medium text-slate-500">
              Section {activeSection}
            </p>
            <div className="flex items-center gap-2">
              {isLastSection ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="rounded-lg border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-black focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  {userRole === "trainer"
                    ? "Submit To Supervisor"
                    : userRole === "supervisor"
                      ? "Approve Submission"
                      : "Submit Feedback"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goToNextSection}
                  className="rounded-lg border border-slate-700 bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Next ?
                </button>
              )}
            </div>
          </div>
        </div>

        <footer className="mt-6 rounded-xl border border-brand-line bg-white px-5 py-4 text-sm text-slate-600 shadow-panel">
          Thank you for contributing to skills development at Matateni Projects (Pty) Ltd. This form is company property - retain for audit and continuous improvement purposes.
        </footer>
      </div>

      {submitModal.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <span
                className={`inline-flex size-10 items-center justify-center rounded-full text-xl font-bold ${
                  submitModal.kind === "success"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {submitModal.kind === "success" ? "?" : "!"}
              </span>
              <h3 className="text-lg font-semibold text-brand-ink">{submitModal.title}</h3>
            </div>
            <p className="text-sm text-slate-600">{submitModal.message}</p>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSubmitModal((prev) => ({ ...prev, open: false }))}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-ruby hover:text-brand-ruby"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}






