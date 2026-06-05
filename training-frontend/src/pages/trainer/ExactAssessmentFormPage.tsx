// Primary training assessment workflow used by trainer and reused as read-only for supervisor review.
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  getTrainingSessionQrUrl,
  publishTrainingSession,
  saveTrainerReport,
  saveTrainingSessionDraft,
  submitTrainerReport
} from "../../lib/api";
import { useAppStore } from "../../store/app-store";
import type { TrainingForm } from "../../types";

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
  min,
  required = false,
  helpText,
  error
}: {
  label: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  type?: "text" | "date" | "number";
  min?: number;
  required?: boolean;
  helpText?: string;
  error?: string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
      <span>
        {label}
        {required ? <span className="ml-1 text-rose-600">*</span> : null}
      </span>
      <input
        type={type}
        min={min}
        placeholder={placeholder}
        title={label}
        value={value}
        readOnly={readOnly}
        onChange={(event) => onChange?.(event.target.value)}
        className={`rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-ruby focus:ring-2 focus:ring-red-100 ${
          error ? "border-rose-300 bg-rose-50/40" : "border-brand-line"
        }`}
      />
      {error ? <span className="text-xs font-medium text-rose-700">{error}</span> : null}
      {!error && helpText ? <span className="text-xs font-normal text-slate-500">{helpText}</span> : null}
    </label>
  );
}

function TextArea({
  label,
  rows = 4,
  value,
  onChange,
  readOnly = false,
  placeholder,
  required = false,
  helpText,
  error
}: {
  label: string;
  rows?: number;
  value?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  error?: string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
      <span>
        {label}
        {required ? <span className="ml-1 text-rose-600">*</span> : null}
      </span>
      <textarea
        title={label}
        rows={rows}
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={(event) => onChange?.(event.target.value)}
        className={`rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-ruby focus:ring-2 focus:ring-red-100 ${
          error ? "border-rose-300 bg-rose-50/40" : "border-brand-line"
        }`}
      />
      {error ? <span className="text-xs font-medium text-rose-700">{error}</span> : null}
      {!error && helpText ? <span className="text-xs font-normal text-slate-500">{helpText}</span> : null}
    </label>
  );
}

function CheckboxLine({
  label,
  checked = false,
  onChange,
  disabled = false
}: {
  label: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
      <input
        title={label}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
        className="size-4 rounded border-brand-line text-brand-ruby focus:ring-red-100"
      />
      {label}
    </label>
  );
}

function YesNoGroup({
  name,
  value,
  onChange,
  disabled = false
}: {
  name: string;
  value: YesNo;
  onChange: (value: YesNo) => void;
  disabled?: boolean;
}) {
  return (
    <div className={`inline-flex gap-3 ${disabled ? "opacity-60" : ""}`}>
      <label className="inline-flex items-center gap-1.5 text-sm text-slate-700">
        <input
          type="radio"
          title={`${name}-Yes`}
          name={name}
          disabled={disabled}
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
          disabled={disabled}
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
  valueImage,
  onImageChange,
  disabled = false
}: {
  label: string;
  onSignedChange?: (isSigned: boolean) => void;
  valueImage?: string;
  onImageChange?: (image: string | null) => void;
  disabled?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDrawingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const lastSyncedImageRef = useRef<string>("");
  const [signatureMethod, setSignatureMethod] = useState<"draw" | "type" | "upload">("draw");
  const [typedSignature, setTypedSignature] = useState("");

  useEffect(() => {
    if (isDrawingRef.current) return;
    const incoming = valueImage ?? "";
    if (!incoming || incoming === lastSyncedImageRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const img = new Image();
    img.onload = () => {
      const cssWidth = canvas.clientWidth || 1;
      const cssHeight = canvas.clientHeight || 1;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0, cssWidth, cssHeight);
      lastSyncedImageRef.current = incoming;
    };
    img.src = incoming;
  }, [valueImage]);

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

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  const syncCanvasImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const data = canvas.toDataURL("image/png");
    lastSyncedImageRef.current = data;
    onImageChange?.(data);
    onSignedChange?.(true);
  };

  const renderTypedSignature = (value: string) => {
    const text = value.trim();
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    clearCanvas();
    if (!text) {
      lastSyncedImageRef.current = "";
      onImageChange?.(null);
      onSignedChange?.(false);
      return;
    }

    const cssHeight = canvas.clientHeight || 64;
    const cssWidth = canvas.clientWidth || 320;
    const horizontalPadding = 12;
    const availableWidth = Math.max(cssWidth - horizontalPadding * 2, 80);
    let fontSize = 28;

    // Reduce the font size until the typed signature fits inside the signature area.
    do {
      context.font = `${fontSize}px 'Segoe Script', 'Brush Script MT', cursive`;
      if (context.measureText(text).width <= availableWidth || fontSize <= 16) break;
      fontSize -= 1;
    } while (fontSize > 16);

    context.fillStyle = "#1c1b34";
    context.textBaseline = "middle";
    context.fillText(text, horizontalPadding, cssHeight / 2);
    syncCanvasImage();
  };

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled || signatureMethod !== "draw") return;
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
    if (disabled || signatureMethod !== "draw") return;
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
    if (disabled || signatureMethod !== "draw") return;
    if (pointerIdRef.current !== null && event.pointerId !== pointerIdRef.current) return;
    isDrawingRef.current = false;
    pointerIdRef.current = null;
    if (canvasRef.current) syncCanvasImage();
  };

  const clearSignature = () => {
    if (disabled) return;
    clearCanvas();
    setTypedSignature("");
    lastSyncedImageRef.current = "";
    onImageChange?.(null);
    onSignedChange?.(false);
  };

  const onUploadSignature = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (!result) return;

      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (canvas && context) {
        const img = new Image();
        img.onload = () => {
          const cssWidth = canvas.clientWidth || 1;
          const cssHeight = canvas.clientHeight || 1;
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.drawImage(img, 0, 0, cssWidth, cssHeight);
          syncCanvasImage();
        };
        img.src = result;
        return;
      }
      lastSyncedImageRef.current = result;
      onImageChange?.(result);
      onSignedChange?.(true);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-1">
      <p className="text-xs text-slate-500">{label}</p>
      <div className="flex items-center gap-2">
        <select
          value={signatureMethod}
          onChange={(event) => setSignatureMethod(event.target.value as "draw" | "type" | "upload")}
          disabled={disabled}
          className="rounded-lg border border-brand-line bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-brand-ruby focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-100"
        >
          <option value="draw">Draw signature</option>
          <option value="type">Type signature</option>
          <option value="upload">Upload image</option>
        </select>
        <button
          type="button"
          onClick={clearSignature}
          disabled={disabled}
          className="text-[11px] font-medium text-slate-500 transition hover:text-brand-ruby disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear
        </button>
      </div>
      <div ref={containerRef} className="rounded-lg border border-brand-line bg-white">
        <canvas
          title={label}
          ref={canvasRef}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={endDrawing}
          onPointerLeave={endDrawing}
          onPointerCancel={endDrawing}
          className={`h-16 w-full rounded-lg ${signatureMethod === "draw" ? "touch-none" : ""} ${
            disabled || signatureMethod !== "draw" ? "cursor-not-allowed opacity-70" : ""
          }`}
        />
      </div>
      {signatureMethod === "type" ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={typedSignature}
            onChange={(event) => setTypedSignature(event.target.value)}
            placeholder="Type full signature"
            disabled={disabled}
            className="flex-1 rounded-lg border border-brand-line bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-ruby focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
          <button
            type="button"
            onClick={() => renderTypedSignature(typedSignature)}
            disabled={disabled}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-brand-ruby hover:text-brand-ruby disabled:cursor-not-allowed disabled:opacity-40"
          >
            Apply typed signature
          </button>
        </div>
      ) : null}
      {signatureMethod === "upload" ? (
        <label className="inline-flex cursor-pointer items-center gap-2 text-[11px] font-medium text-slate-600 transition hover:text-brand-ruby">
          <span>Choose signature image</span>
          <input
            type="file"
            accept="image/*"
            onChange={onUploadSignature}
            disabled={disabled}
            className="hidden"
          />
        </label>
      ) : null}
    </div>
  );
}

const tableCell = "border border-brand-line px-3 py-2";
const sectionKeys = ["A", "B", "D", "F", "G"] as const;
type SectionKey = (typeof sectionKeys)[number];

type ExactAssessmentFormPageProps = {
  readOnly?: boolean;
  submittedData?: TrainingForm["submittedData"];
  reviewFormId?: string;
};

type TrainerDraft = {
  activeSection: SectionKey;
  distributedFormId: string | null;
  trainerName: string;
  trainerDepartment: string;
  trainingTitle: string;
  trainingDate: string;
  trainingDurationDays: string;
  trainingDurationHours: string;
  numberOfTrainees: string;
  objectives: string[];
  observedImprovement: YesNo;
  trainingFormats: string[];
  targetUserGroup: string;
  feedbackDeadline: string;
  followUpSupervisorName: string;
  applicationExtent: string;
  observedImprovementDetails: string;
  supportNeeded: string;
  barriersComment: string;
  trainerApplicationComment: string;
  supervisorApplicationComment: string;
  workedWellComment: string;
  effectivenessRating: string;
  recommendationChoice: string;
  trainerFutureSessionComment: string;
  supervisorFutureSessionComment: string;
  signatures: {
    trainer: boolean;
    supervisor: boolean;
    trainerImage?: string;
    supervisorImage?: string;
  };
  signOff: {
    trainerName: string;
    trainerDate: string;
    supervisorName: string;
    supervisorDate: string;
  };
  ratings: (number | null)[];
  traineeRoster: TraineeRosterItem[];
  trainees: TraineeEval[];
  commentsVersion: number;
};

export function ExactAssessmentFormPage({ readOnly = false, submittedData, reviewFormId }: ExactAssessmentFormPageProps) {
  const navigate = useNavigate();
  const addForm = useAppStore((s) => s.addForm);
  const submitSupervisorReview = useAppStore((s) => s.submitSupervisorReview);
  const forms = useAppStore((s) => s.forms);
  const users = useAppStore((s) => s.users);
  const currentUser = useAppStore((s) => s.currentUser);
  const sections = sectionKeys;
  type UserRole = "trainer" | "trainee" | "supervisor";
  const [activeSection, setActiveSection] = useState<SectionKey>("A");
  const [userRole] = useState<UserRole>(readOnly ? "supervisor" : "trainer");
  // The create flow only captures A+B and hands the trainer off to My Submissions for the rest.
  const isDraftSetupStage = userRole === "trainer" && !reviewFormId && !readOnly;
  const formRef = useRef<HTMLDivElement | null>(null);
  const [distributedFormId, setDistributedFormId] = useState<string | null>(null);

  const [trainerName, setTrainerName] = useState(submittedData?.trainerName ?? currentUser?.name ?? "");
  const [trainerDepartment, setTrainerDepartment] = useState(submittedData?.trainerDepartment ?? currentUser?.department ?? "");
  const [trainingTitle, setTrainingTitle] = useState(submittedData?.trainingTitle ?? "");
  const [trainingDate, setTrainingDate] = useState(submittedData?.trainingDate ?? "");
  const [trainingDurationDays, setTrainingDurationDays] = useState(submittedData?.durationDays ?? "");
  const [trainingDurationHours, setTrainingDurationHours] = useState(submittedData?.durationHours ?? "");
  const [numberOfTrainees, setNumberOfTrainees] = useState(submittedData?.numberOfTrainees ?? "");
  const [objectives, setObjectives] = useState<string[]>(submittedData?.objectives?.length ? submittedData.objectives : [""]);
  const [observedImprovement, setObservedImprovement] = useState<YesNo>(submittedData?.observedImprovement ?? "");
  const [trainingFormats, setTrainingFormats] = useState<string[]>(submittedData?.trainingFormats ?? []);
  const [targetUserGroup, setTargetUserGroup] = useState(submittedData?.targetUserGroup ?? "");
  const [feedbackDeadline, setFeedbackDeadline] = useState(submittedData?.feedbackDeadline ?? "");
  const [followUpSupervisorName, setFollowUpSupervisorName] = useState(
    submittedData?.followUpSupervisorName ?? submittedData?.signOff?.supervisorName ?? ""
  );
  const [applicationExtent, setApplicationExtent] = useState(submittedData?.applicationExtent ?? "");
  const [observedImprovementDetails, setObservedImprovementDetails] = useState(submittedData?.observedImprovementDetails ?? "");
  const [supportNeeded, setSupportNeeded] = useState(submittedData?.supportNeeded ?? "");
  const [barriersComment, setBarriersComment] = useState(submittedData?.barriersComment ?? "");
  const [trainerApplicationComment, setTrainerApplicationComment] = useState(
    submittedData?.trainerApplicationComment ?? submittedData?.barriersComment ?? ""
  );
  const [supervisorApplicationComment, setSupervisorApplicationComment] = useState(
    submittedData?.supervisorApplicationComment ?? ""
  );
  const [workedWellComment, setWorkedWellComment] = useState(submittedData?.workedWellComment ?? "");
  const [effectivenessRating, setEffectivenessRating] = useState(submittedData?.effectivenessRating ?? "");
  const [recommendationChoice, setRecommendationChoice] = useState(submittedData?.recommendationChoice ?? "");
  const [trainerFutureSessionComment, setTrainerFutureSessionComment] = useState(submittedData?.trainerFutureSessionComment ?? "");
  const [supervisorFutureSessionComment, setSupervisorFutureSessionComment] = useState(submittedData?.supervisorFutureSessionComment ?? "");
  const [signOff, setSignOff] = useState({
    trainerName:
      submittedData?.signOff?.trainerName ??
      submittedData?.trainerName ??
      (currentUser?.role === "trainer" ? currentUser.name ?? currentUser.email ?? "" : ""),
    trainerDate: submittedData?.signOff?.trainerDate ?? "",
    supervisorName: submittedData?.signOff?.supervisorName ?? submittedData?.followUpSupervisorName ?? "",
    supervisorDate: submittedData?.signOff?.supervisorDate ?? ""
  });
  const [signatures, setSignatures] = useState({
    trainer: submittedData?.signatures?.trainer ?? false,
    supervisor: submittedData?.signatures?.supervisor ?? false,
    trainerImage: submittedData?.signatures?.trainerImage ?? "",
    supervisorImage: submittedData?.signatures?.supervisorImage ?? ""
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
  const [supervisorReturnReason, setSupervisorReturnReason] = useState("");
  const [supervisorActionError, setSupervisorActionError] = useState("");
  const [showValidationHints, setShowValidationHints] = useState(false);

  const [ratings, setRatings] = useState<(number | null)[]>(Array(feedbackStatements.length).fill(null));
  const [traineeRoster, setTraineeRoster] = useState<TraineeRosterItem[]>(
    submittedData?.traineeRoster?.length ? submittedData.traineeRoster : [createEmptyRosterItem()]
  );

  const [trainees, setTrainees] = useState<TraineeEval[]>(
    submittedData?.trainees?.length ? submittedData.trainees : [createEmptyTrainee()]
  );
  const [draftRestored, setDraftRestored] = useState(false);
  const [showDraftToast, setShowDraftToast] = useState(false);
  const [rehydratedFromLinkedForm, setRehydratedFromLinkedForm] = useState(false);

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

  const assignedSupervisorName = useMemo(() => {
    if (!currentUser?.supervisorId) return "";
    const assignedSupervisor = users.find(
      (user) => user.id === currentUser.supervisorId && user.role === "supervisor"
    );
    return assignedSupervisor?.name?.trim() || assignedSupervisor?.email || "";
  }, [currentUser?.supervisorId, users]);

  const currentSupervisorName = useMemo(() => {
    if (currentUser?.role !== "supervisor") return "";
    return currentUser.name?.trim() || currentUser.email || "";
  }, [currentUser?.email, currentUser?.name, currentUser?.role]);

  useEffect(() => {
    if (!assignedSupervisorName) return;
    setFollowUpSupervisorName((currentValue) => currentValue || assignedSupervisorName);
    setSignOff((currentValue) =>
      currentValue.supervisorName
        ? currentValue
        : { ...currentValue, supervisorName: assignedSupervisorName }
    );
  }, [assignedSupervisorName]);

  useEffect(() => {
    // When the supervisor opens the review flow, default the sign-off identity to the signed-in reviewer.
    if (!(readOnly || userRole === "supervisor") || !currentSupervisorName) return;
    setSignOff((currentValue) =>
      currentValue.supervisorName
        ? currentValue
        : { ...currentValue, supervisorName: currentSupervisorName }
    );
  }, [currentSupervisorName, readOnly, userRole]);

  useEffect(() => {
    const normalizedTrainerName = trainerName?.trim() || "";
    if (!normalizedTrainerName) return;

    setSignOff((currentValue) => {
      const currentTrainerSignOffName = currentValue.trainerName?.trim() || "";
      const shouldSyncTrainerName =
        !currentTrainerSignOffName ||
        (currentSupervisorName && currentTrainerSignOffName === currentSupervisorName);

      return shouldSyncTrainerName && currentTrainerSignOffName !== normalizedTrainerName
        ? { ...currentValue, trainerName: normalizedTrainerName }
        : currentValue;
    });
  }, [currentSupervisorName, trainerName]);

  useEffect(() => {
    const normalizedSupervisorName = followUpSupervisorName?.trim() || currentSupervisorName || "";
    if (!normalizedSupervisorName) return;

    setSignOff((currentValue) =>
      currentValue.supervisorName?.trim()
        ? currentValue
        : { ...currentValue, supervisorName: normalizedSupervisorName }
    );
  }, [currentSupervisorName, followUpSupervisorName]);


  const submissionIntegrity = useMemo(() => {
    // Final supervisor submission is stricter than draft saving: each trainer-owned section must be meaningfully completed.
    const hasObjectiveContent = objectives.some((objective) => objective.trim().length > 0);
    const hasEvaluatedTrainees = trainees.some(
      (trainee) =>
        trainee.name.trim().length > 0 &&
        trainee.understanding !== "" &&
        trainee.independent !== ""
    );
    const checks = [
      {
        key: "A",
        label: "Section A · Training Information",
        ok:
          trainerName.trim().length > 0 &&
          trainerDepartment.trim().length > 0 &&
          trainingTitle.trim().length > 0 &&
          trainingDate.trim().length > 0 &&
          numberOfTrainees.trim().length > 0 &&
          hasObjectiveContent &&
          trainingFormats.length > 0 &&
          targetUserGroup.trim().length > 0 &&
          feedbackDeadline.trim().length > 0
      },
      {
        key: "D",
        label: "Section E · Workplace Application & Follow-Up",
        ok:
          hasEvaluatedTrainees &&
          applicationExtent.trim().length > 0 &&
          observedImprovement !== "" &&
          (observedImprovement === "No" || observedImprovementDetails.trim().length > 0) &&
          supportNeeded.trim().length > 0
      },
      {
        key: "F",
        label: "Section F · Overall Trainer Reflection & Improvement",
        ok:
          workedWellComment.trim().length > 0 &&
          trainerFutureSessionComment.trim().length > 0 &&
          effectivenessRating.trim().length > 0 &&
          recommendationChoice.trim().length > 0
      },
      {
        key: "G",
        label: "Section G · Sign-off",
        ok:
          signOff.trainerName.trim().length > 0 &&
          signOff.trainerDate.trim().length > 0 &&
          signatures.trainer
      }
    ] as const;

    const missingEntries = checks.filter((c) => !c.ok);
    return {
      complete: missingEntries.length === 0,
      missing: missingEntries.map((c) => c.label),
      firstMissingKey: missingEntries[0]?.key
    };
  }, [
    trainerName,
    trainerDepartment,
    trainingTitle,
    trainingDate,
    trainees,
    applicationExtent,
    supportNeeded,
    barriersComment,
    workedWellComment,
    trainerFutureSessionComment,
    supervisorFutureSessionComment,
    signatures
  ]);

  const draftStorageKey = useMemo(() => {
    if (readOnly || userRole !== "trainer") return "";
    const userId = currentUser?.id ?? "anonymous";
    return `matateni-trainer-draft:${userId}`;
  }, [readOnly, userRole, currentUser?.id]);

  const hasObjectiveContent = useMemo(
    () => objectives.some((objective) => objective.trim().length > 0),
    [objectives]
  );

  const isSectionABComplete = useMemo(
    () =>
      trainerName.trim().length > 0 &&
      trainerDepartment.trim().length > 0 &&
      trainingTitle.trim().length > 0 &&
      trainingDate.trim().length > 0 &&
      numberOfTrainees.trim().length > 0 &&
      hasObjectiveContent,
    [trainerName, trainerDepartment, trainingTitle, trainingDate, numberOfTrainees, hasObjectiveContent]
  );

  const draftFieldErrors = useMemo(
    () => ({
      trainerName: trainerName.trim().length === 0 ? "Enter the trainer's name." : "",
      trainerDepartment: trainerDepartment.trim().length === 0 ? "Enter the trainer's department or role." : "",
      trainingTitle: trainingTitle.trim().length === 0 ? "Enter the training title or topic." : "",
      trainingDate: trainingDate.trim().length === 0 ? "Select the training date." : "",
      numberOfTrainees: numberOfTrainees.trim().length === 0 ? "Select how many trainees attended." : "",
      objectives: hasObjectiveContent ? "" : "Add at least one training objective.",
      trainingFormats: trainingFormats.length > 0 ? "" : "Select one training format.",
      targetUserGroup: targetUserGroup.trim().length > 0 ? "" : "Describe who attended or will attend this training.",
      feedbackDeadline: feedbackDeadline.trim().length > 0 ? "" : "Set the trainee feedback deadline before saving the draft."
    }),
    [
      trainerName,
      trainerDepartment,
      trainingTitle,
      trainingDate,
      numberOfTrainees,
      hasObjectiveContent,
      trainingFormats,
      targetUserGroup,
      feedbackDeadline
    ]
  );

  const effectiveDistributedFormId = useMemo(() => {
    if (distributedFormId) return distributedFormId;
    if (reviewFormId) return reviewFormId;
    return null;
  }, [distributedFormId, reviewFormId]);

  const traineeFeedbackLink = useMemo(() => {
    if (!effectiveDistributedFormId) return "";
    const origin =
      typeof window !== "undefined" && window.location?.origin ? window.location.origin : "";
    return `${origin}/trainee-feedback?formId=${effectiveDistributedFormId}`;
  }, [effectiveDistributedFormId]);

  const formattedFeedbackDeadline = useMemo(() => {
    if (!feedbackDeadline) return "";
    const parsed = new Date(feedbackDeadline);
    return Number.isNaN(parsed.getTime()) ? "" : parsed.toLocaleString();
  }, [feedbackDeadline]);

  const traineeQrUrl = useMemo(() => {
    if (!effectiveDistributedFormId) return "";
    const sessionId = Number(effectiveDistributedFormId.replace(/^F-/, ""));
    if (Number.isFinite(sessionId) && sessionId > 0) {
      return getTrainingSessionQrUrl(sessionId);
    }
    if (!traineeFeedbackLink) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
      traineeFeedbackLink
    )}`;
  }, [effectiveDistributedFormId, traineeFeedbackLink]);

  const linkedForm = useMemo(
    () =>
      effectiveDistributedFormId
        ? forms.find((form) => form.id === effectiveDistributedFormId)
        : undefined,
    [forms, effectiveDistributedFormId]
  );

  const statementAveragesFromFeedback = useMemo(() => {
    const feedback = linkedForm?.supervisorOnlyFeedback ?? [];
    if (feedback.length === 0) return [] as number[];
    const totals = Array(feedbackStatements.length).fill(0);
    const counts = Array(feedbackStatements.length).fill(0);
    feedback.forEach((entry) => {
      entry.statementRatings?.forEach((rating, index) => {
        if (typeof rating === "number") {
          totals[index] += rating;
          counts[index] += 1;
        }
      });
    });
    return totals.map((total, index) => (counts[index] > 0 ? Number((total / counts[index]).toFixed(2)) : 0));
  }, [linkedForm?.supervisorOnlyFeedback]);

  const assignedSupervisor = useMemo(() => {
    const assignedId = currentUser?.supervisorId;
    if (!assignedId) return undefined;
    return users.find((u) => u.id === assignedId && u.role === "supervisor");
  }, [currentUser?.supervisorId, users]);

  useEffect(() => {
    if (!distributedFormId && effectiveDistributedFormId) {
      setDistributedFormId(effectiveDistributedFormId);
    }
  }, [distributedFormId, effectiveDistributedFormId]);

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

  useEffect(() => {
    if (userRole !== "trainer") return;
    if (!traineeRoster.length) return;

    setTrainees((prev) => {
      const targetLength = Math.max(prev.length, traineeRoster.length);
      const next = Array.from({ length: targetLength }, (_, index) => {
        const existing = prev[index] ?? createEmptyTrainee();
        const rosterName = traineeRoster[index]?.name?.trim() ?? "";
        if (!rosterName) return existing;
        return { ...existing, name: rosterName };
      });
      return next;
    });
  }, [userRole, traineeRoster]);

  useEffect(() => {
    if (!draftStorageKey) return;
    const rawDraft = localStorage.getItem(draftStorageKey);
    if (!rawDraft) return;

    try {
      const parsed = JSON.parse(rawDraft) as TrainerDraft;
      const legacyMockNames = new Set(["Nandi Dlamini", "Sipho Mokoena", "Thabo Nkosi"]);
      const sanitizedTrainerName =
        parsed.trainerName && legacyMockNames.has(parsed.trainerName)
          ? currentUser?.name ?? ""
          : (parsed.trainerName ?? "");
      setDistributedFormId(parsed.distributedFormId ?? null);
      setTrainerName(sanitizedTrainerName);
      setTrainerDepartment(parsed.trainerDepartment ?? "");
      setTrainingTitle(parsed.trainingTitle ?? "");
      setTrainingDate(parsed.trainingDate ?? "");
      setTrainingDurationDays(parsed.trainingDurationDays ?? "");
      setTrainingDurationHours(parsed.trainingDurationHours ?? "");
      setNumberOfTrainees(parsed.numberOfTrainees ?? "");
      setObjectives(parsed.objectives?.length ? parsed.objectives : [""]);
      setObservedImprovement(parsed.observedImprovement ?? "");
      setTrainingFormats(parsed.trainingFormats ?? []);
      setTargetUserGroup(parsed.targetUserGroup ?? "");
      setFollowUpSupervisorName(parsed.followUpSupervisorName ?? "");
      setApplicationExtent(parsed.applicationExtent ?? "");
      setObservedImprovementDetails(parsed.observedImprovementDetails ?? "");
      setSupportNeeded(parsed.supportNeeded ?? "");
      setBarriersComment(parsed.barriersComment ?? "");
      setTrainerApplicationComment(parsed.trainerApplicationComment ?? parsed.barriersComment ?? "");
      setSupervisorApplicationComment(parsed.supervisorApplicationComment ?? "");
      setWorkedWellComment(parsed.workedWellComment ?? "");
      setEffectivenessRating(parsed.effectivenessRating ?? "");
      setRecommendationChoice(parsed.recommendationChoice ?? "");
      setTrainerFutureSessionComment(parsed.trainerFutureSessionComment ?? "");
      setSupervisorFutureSessionComment(parsed.supervisorFutureSessionComment ?? "");
      setSignatures(
        parsed.signatures
          ? {
              trainer: parsed.signatures.trainer ?? false,
              supervisor: parsed.signatures.supervisor ?? false,
              trainerImage: parsed.signatures.trainerImage ?? "",
              supervisorImage: parsed.signatures.supervisorImage ?? ""
            }
          : { trainer: false, supervisor: false, trainerImage: "", supervisorImage: "" }
      );
      setSignOff(
        parsed.signOff ?? {
          trainerName: parsed.trainerName ?? (currentUser?.role === "trainer" ? currentUser.name ?? currentUser.email ?? "" : ""),
          trainerDate: "",
          supervisorName: parsed.followUpSupervisorName ?? "",
          supervisorDate: ""
        }
      );
      setRatings(
        Array.isArray(parsed.ratings) && parsed.ratings.length === feedbackStatements.length
          ? parsed.ratings
          : Array(feedbackStatements.length).fill(null)
      );
      setTraineeRoster(parsed.traineeRoster?.length ? parsed.traineeRoster : [createEmptyRosterItem()]);
      setTrainees(parsed.trainees?.length ? parsed.trainees : [createEmptyTrainee()]);
      if (sections.includes(parsed.activeSection)) {
        setActiveSection(parsed.activeSection);
      }
      const hasMeaningfulDraft =
        (parsed.trainingTitle?.trim().length ?? 0) > 0 ||
        (parsed.trainerName?.trim().length ?? 0) > 0 ||
        (parsed.trainingDate?.trim().length ?? 0) > 0 ||
        (parsed.objectives ?? []).some((objective) => objective.trim().length > 0) ||
        (parsed.traineeRoster ?? []).some(
          (row) => row.name.trim().length > 0 || row.departmentOrRole.trim().length > 0 || row.attendance !== ""
        ) ||
        (parsed.ratings ?? []).some((score) => score !== null) ||
        (parsed.trainees ?? []).some(
          (row) => row.name.trim().length > 0 || row.understanding !== "" || row.independent !== ""
        ) ||
        (parsed.trainerFutureSessionComment?.trim().length ?? 0) > 0 ||
        (parsed.supervisorFutureSessionComment?.trim().length ?? 0) > 0 ||
        (parsed.targetUserGroup?.trim().length ?? 0) > 0 ||
        (parsed.observedImprovementDetails?.trim().length ?? 0) > 0 ||
        (parsed.barriersComment?.trim().length ?? 0) > 0 ||
        (parsed.workedWellComment?.trim().length ?? 0) > 0 ||
        (parsed.trainingFormats?.length ?? 0) > 0 ||
        (parsed.followUpSupervisorName?.trim().length ?? 0) > 0 ||
        (parsed.applicationExtent?.trim().length ?? 0) > 0 ||
        (parsed.supportNeeded?.trim().length ?? 0) > 0 ||
        (parsed.effectivenessRating?.trim().length ?? 0) > 0 ||
        (parsed.recommendationChoice?.trim().length ?? 0) > 0 ||
        parsed.signatures?.trainer === true ||
        parsed.signatures?.supervisor === true;
      setDraftRestored(hasMeaningfulDraft);
    } catch {
      localStorage.removeItem(draftStorageKey);
    }
  }, [draftStorageKey, sections, currentUser?.name]);

  useEffect(() => {
    if (!draftRestored) return;
    setShowDraftToast(true);
    const timer = window.setTimeout(() => setShowDraftToast(false), 5000);
    return () => window.clearTimeout(timer);
  }, [draftRestored]);

  useEffect(() => {
    if (userRole !== "trainer") return;
    if (rehydratedFromLinkedForm) return;
    if (draftRestored) return;
    if (!linkedForm?.submittedData) return;

    const saved = linkedForm.submittedData;
    setDistributedFormId(linkedForm.id);
    setTrainerName(saved.trainerName ?? "");
    setTrainerDepartment(saved.trainerDepartment ?? linkedForm.department ?? "");
    setTrainingTitle(saved.trainingTitle ?? "");
    setTrainingDate(saved.trainingDate ?? "");
    setTrainingDurationDays(saved.durationDays ?? "");
    setTrainingDurationHours(saved.durationHours ?? "");
    setNumberOfTrainees(saved.numberOfTrainees ?? "");
    setObjectives(saved.objectives?.length ? saved.objectives : [""]);
    setObservedImprovement(saved.observedImprovement ?? "");
    setTrainingFormats(saved.trainingFormats ?? []);
    setTargetUserGroup(saved.targetUserGroup ?? "");
    setFeedbackDeadline(saved.feedbackDeadline ?? "");
    setFollowUpSupervisorName(saved.followUpSupervisorName ?? saved.signOff?.supervisorName ?? "");
    setApplicationExtent(saved.applicationExtent ?? "");
    setObservedImprovementDetails(saved.observedImprovementDetails ?? "");
    setSupportNeeded(saved.supportNeeded ?? "");
    setBarriersComment(saved.barriersComment ?? "");
    setTrainerApplicationComment(saved.trainerApplicationComment ?? saved.barriersComment ?? "");
    setSupervisorApplicationComment(saved.supervisorApplicationComment ?? "");
    setWorkedWellComment(saved.workedWellComment ?? "");
    setEffectivenessRating(saved.effectivenessRating ?? "");
    setRecommendationChoice(saved.recommendationChoice ?? "");
    setTrainerFutureSessionComment(saved.trainerFutureSessionComment ?? "");
    setSupervisorFutureSessionComment(saved.supervisorFutureSessionComment ?? "");
    setTrainees(saved.trainees?.length ? saved.trainees : [createEmptyTrainee()]);
    setSignatures(
      saved.signatures
        ? {
            trainer: saved.signatures.trainer ?? false,
            supervisor: saved.signatures.supervisor ?? false,
            trainerImage: saved.signatures.trainerImage ?? "",
            supervisorImage: saved.signatures.supervisorImage ?? ""
          }
        : { trainer: false, supervisor: false, trainerImage: "", supervisorImage: "" }
    );
    setSignOff({
      trainerName:
        saved.signOff?.trainerName ??
        saved.trainerName ??
        (currentUser?.role === "trainer" ? currentUser.name ?? currentUser.email ?? "" : ""),
      trainerDate: saved.signOff?.trainerDate ?? "",
      supervisorName: saved.signOff?.supervisorName ?? saved.followUpSupervisorName ?? "",
      supervisorDate: saved.signOff?.supervisorDate ?? ""
    });
    setTraineeRoster(saved.traineeRoster?.length ? saved.traineeRoster : [createEmptyRosterItem()]);
    setRehydratedFromLinkedForm(true);
  }, [userRole, rehydratedFromLinkedForm, draftRestored, linkedForm, currentUser?.email, currentUser?.name, currentUser?.role]);

  useEffect(() => {
    if (!draftStorageKey) return;
    const draftPayload: TrainerDraft = {
      activeSection,
      distributedFormId,
      trainerName,
      trainerDepartment,
      trainingTitle,
      trainingDate,
      trainingDurationDays,
      trainingDurationHours,
      numberOfTrainees,
      objectives,
      observedImprovement,
      trainingFormats,
      targetUserGroup,
      feedbackDeadline,
      followUpSupervisorName,
      applicationExtent,
      observedImprovementDetails,
      supportNeeded,
      barriersComment,
      trainerApplicationComment,
      supervisorApplicationComment,
      workedWellComment,
      effectivenessRating,
      recommendationChoice,
      trainerFutureSessionComment,
      supervisorFutureSessionComment,
      signatures,
      signOff,
      ratings,
      traineeRoster,
      trainees,
      commentsVersion: 1
    };
    const hasMeaningfulDraft =
      trainerName.trim().length > 0 ||
      trainerDepartment.trim().length > 0 ||
      trainingTitle.trim().length > 0 ||
      trainingDate.trim().length > 0 ||
      trainingDurationDays.trim().length > 0 ||
      trainingDurationHours.trim().length > 0 ||
      numberOfTrainees.trim().length > 0 ||
      objectives.some((objective) => objective.trim().length > 0) ||
      observedImprovement !== "" ||
      trainingFormats.length > 0 ||
      targetUserGroup.trim().length > 0 ||
      feedbackDeadline.trim().length > 0 ||
      followUpSupervisorName.trim().length > 0 ||
      applicationExtent.trim().length > 0 ||
      observedImprovementDetails.trim().length > 0 ||
      supportNeeded.trim().length > 0 ||
      barriersComment.trim().length > 0 ||
      trainerApplicationComment.trim().length > 0 ||
      supervisorApplicationComment.trim().length > 0 ||
      workedWellComment.trim().length > 0 ||
      effectivenessRating.trim().length > 0 ||
      recommendationChoice.trim().length > 0 ||
      ratings.some((score) => score !== null) ||
      traineeRoster.some(
        (row) => row.name.trim().length > 0 || row.departmentOrRole.trim().length > 0 || row.attendance !== ""
      ) ||
      trainees.some(
        (row) => row.name.trim().length > 0 || row.understanding !== "" || row.independent !== ""
      ) ||
      trainerFutureSessionComment.trim().length > 0 ||
      supervisorFutureSessionComment.trim().length > 0 ||
      signatures.trainer ||
      signatures.supervisor ||
      signOff.trainerName.trim().length > 0 ||
      signOff.supervisorName.trim().length > 0 ||
      signOff.trainerDate.trim().length > 0 ||
      signOff.supervisorDate.trim().length > 0;

    if (!hasMeaningfulDraft && !distributedFormId) {
      localStorage.removeItem(draftStorageKey);
      return;
    }

    localStorage.setItem(draftStorageKey, JSON.stringify(draftPayload));
  }, [
    draftStorageKey,
    activeSection,
    trainerName,
    trainerDepartment,
    distributedFormId,
    trainingTitle,
    trainingDate,
    trainingDurationDays,
    trainingDurationHours,
    numberOfTrainees,
    objectives,
    observedImprovement,
    trainingFormats,
    targetUserGroup,
    feedbackDeadline,
    followUpSupervisorName,
    applicationExtent,
    observedImprovementDetails,
    supportNeeded,
    barriersComment,
    workedWellComment,
    effectivenessRating,
    recommendationChoice,
    trainerFutureSessionComment,
    supervisorFutureSessionComment,
    signatures,
    signOff,
    ratings,
    traineeRoster,
    trainees
  ]);

  useEffect(() => {
    const submittedFeedback = linkedForm?.supervisorOnlyFeedback ?? [];
    if (!submittedFeedback.length) return;

    const aggregatedRatings = Array.from({ length: feedbackStatements.length }, (_, statementIndex) => {
      const values = submittedFeedback
        .map((entry) => entry.statementRatings?.[statementIndex])
        .filter((value): value is number => typeof value === "number" && value > 0);

      if (!values.length) return null;
      const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
      return Math.round(avg);
    });

    setRatings(aggregatedRatings);

    setTraineeRoster((prev) => {
      const hasManualRosterData = prev.some(
        (row) => row.name.trim() !== "" || row.departmentOrRole.trim() !== "" || row.attendance !== ""
      );
      if (hasManualRosterData && userRole === "trainer") return prev;

      const rowsFromFeedback: TraineeRosterItem[] = submittedFeedback.map((entry) => ({
        name: entry.traineeName || "",
        departmentOrRole: entry.departmentRole || "",
        attendance: "Yes"
      }));

      return rowsFromFeedback.length ? rowsFromFeedback : [createEmptyRosterItem()];
    });

    if (!numberOfTrainees && submittedFeedback.length > 0) {
      setNumberOfTrainees(String(submittedFeedback.length));
    }

    // Keep Skills & Follow-up trainee names aligned with the actual names
    // submitted by trainees in the feedback form.
    setTrainees((prev) => {
      const targetLength = Math.max(prev.length, submittedFeedback.length);
      const next = Array.from({ length: targetLength }, (_, index) => {
        const existing = prev[index] ?? createEmptyTrainee();
        const feedbackName = submittedFeedback[index]?.traineeName?.trim() ?? "";
        if (!feedbackName) return existing;
        return { ...existing, name: feedbackName };
      });
      return next;
    });
  }, [userRole, linkedForm, numberOfTrainees]);

  useEffect(() => {
    if (userRole !== "trainer") return;
    if (!linkedForm) return;
    if (
      linkedForm.status !== "DRAFT" &&
      linkedForm.status !== "OPENFORFEEDBACK" &&
      linkedForm.status !== "FEEDBACKCLOSED" &&
      linkedForm.status !== "FOLLOWUPPENDING"
    )
      return;

    // Keep editable drafts synced into the saved form record so logout/login does not drop in-progress work.
    const nextSubmittedData = buildSubmittedData();
    const nextSnapshot = JSON.stringify({
      title: trainingTitle || linkedForm.title,
      department: trainerDepartment || linkedForm.department,
      date: trainingDate || linkedForm.date,
      trainees: Number(numberOfTrainees) || traineeRoster.length || linkedForm.trainees,
      submittedData: nextSubmittedData
    });
    const currentSnapshot = JSON.stringify({
      title: linkedForm.title,
      department: linkedForm.department,
      date: linkedForm.date,
      trainees: linkedForm.trainees,
      submittedData: linkedForm.submittedData
    });

    if (currentSnapshot === nextSnapshot) return;

    addForm({
      ...linkedForm,
      title: trainingTitle || linkedForm.title,
      department: trainerDepartment || linkedForm.department,
      date: trainingDate || linkedForm.date,
      trainees: Number(numberOfTrainees) || traineeRoster.length || linkedForm.trainees,
      updatedAt: new Date().toISOString(),
      submittedData: nextSubmittedData
    });
  }, [
    userRole,
    linkedForm,
    addForm,
    trainerName,
    trainerDepartment,
    trainingTitle,
    trainingDate,
    trainingDurationDays,
    trainingDurationHours,
    numberOfTrainees,
    objectives,
    observedImprovement,
    trainingFormats,
    targetUserGroup,
    feedbackDeadline,
    followUpSupervisorName,
    applicationExtent,
    observedImprovementDetails,
    supportNeeded,
    barriersComment,
    trainerApplicationComment,
    supervisorApplicationComment,
    workedWellComment,
    effectivenessRating,
    recommendationChoice,
    trainerFutureSessionComment,
    supervisorFutureSessionComment,
    signatures,
    signOff,
    ratings,
    traineeRoster,
    trainees
  ]);

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
    D: "Trainer",
    F: "Trainer",
    G: "Trainer"
  };

  const visibleSections = sections.filter((section) => {
    if (isDraftSetupStage) return section === "A";
    if (section === "B") return false;
    const owner = sectionOwnership[section];
    if (userRole === "trainee") return owner === "Trainee" || owner === "Trainer + Trainee";
    return owner === "Trainer" || owner === "Trainer + Trainee";
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

  // Reuse one snapshot shape for draft saves and final trainer submission updates.
  const buildSubmittedData = () => ({
    trainerName,
    trainerDepartment,
    trainingTitle,
    trainingDate,
    durationDays: trainingDurationDays,
    durationHours: trainingDurationHours,
    numberOfTrainees,
    objectives,
    passRate: autoPassRate || "-",
    averageScoreDisplay: autoAverageScore || "-",
    observedImprovement,
    trainingFormats,
    targetUserGroup,
    feedbackDeadline,
    followUpSupervisorName,
    perStatementAverages:
      (linkedForm?.supervisorOnlyFeedback?.length ?? 0) > 0
        ? statementAveragesFromFeedback
        : ratings.map((score) => (typeof score === "number" ? Number(score.toFixed(2)) : 0)),
    applicationExtent,
    observedImprovementDetails,
    supportNeeded,
    barriersComment: trainerApplicationComment,
    trainerApplicationComment,
    supervisorApplicationComment,
    workedWellComment,
    effectivenessRating,
    recommendationChoice,
    trainerFutureSessionComment,
    supervisorFutureSessionComment,
    trainees,
    signatures,
    signOff,
    traineeRoster
  });

  const handleDistributeTraineeQr = async () => {
    if (readOnly || userRole !== "trainer") return;

    if (!isSectionABComplete) {
      setSubmitModal({
        open: true,
        kind: "error",
        title: "Complete A+B First",
        message:
          "Please complete Section A + Training Objectives before generating and distributing the trainee QR code."
      });
      return;
    }

    if (!feedbackDeadline) {
      setSubmitModal({
        open: true,
        kind: "error",
        title: "Set Feedback Deadline",
        message: "Please set the trainee feedback deadline before generating the QR code."
      });
      return;
    }

    if (!effectiveDistributedFormId || !currentUser?.id) {
      setSubmitModal({
        open: true,
        kind: "error",
        title: "Save Draft First",
        message:
          "Submit this page as a draft first. Once it is saved to My Submissions, the official trainee QR and link will be generated from the database record."
      });
      return;
    }

    const sessionId = Number(effectiveDistributedFormId.replace(/^F-/, ""));
    if (!Number.isFinite(sessionId) || sessionId <= 0) {
      setSubmitModal({
        open: true,
        kind: "error",
        title: "Invalid Session",
        message: "Save the draft again before generating the trainee QR code."
      });
      return;
    }

    const deadline = new Date(feedbackDeadline);
    const feedbackOpenHours = Math.max(
      1,
      Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60))
    );

    try {
      await publishTrainingSession(sessionId, {
        TrainerId: currentUser.id,
        FeedbackOpenHours: feedbackOpenHours
      });
    } catch {
      setSubmitModal({
        open: true,
        kind: "error",
        title: "Publish Failed",
        message: "Unable to open this session for trainee feedback. Check your connection and try again."
      });
      return;
    }

    const publishedForm = linkedForm ?? forms.find((form) => form.id === effectiveDistributedFormId);
    if (publishedForm) {
      addForm({
        ...publishedForm,
        status: "OPENFORFEEDBACK",
        updatedAt: new Date().toISOString(),
        submittedData: {
          ...(publishedForm.submittedData ?? buildSubmittedData()),
          feedbackDeadline
        }
      });
    }

    setSubmitModal({
      open: true,
      kind: "success",
      title: "Trainee QR Ready",
      message: `Distribute this link to trainees: /trainee-feedback?formId=${effectiveDistributedFormId}`
    });
  };

  const handleSubmit = async () => {
    if (readOnly && userRole !== "supervisor") return;
    setShowValidationHints(true);

    if (userRole !== "supervisor" && !hasAnyFormInput()) {
      setSubmitModal({
        open: true,
        kind: "error",
        title: "Form Is Empty",
        message: "Please fill in at least one section before submitting."
      });
      return;
    }

    if (userRole === "trainer") {
      if (!currentUser?.id) {
        setSubmitModal({
          open: true,
          kind: "error",
          title: "Session Expired",
          message: "Please sign in again before saving or submitting this assessment."
        });
        return;
      }

      const existingForm = linkedForm ?? (distributedFormId ? forms.find((form) => form.id === distributedFormId) : undefined);
      const computedAverageScore = Number(
        (
          ratings.filter((score): score is number => score !== null).reduce((sum, score) => sum + score, 0) /
          Math.max(
            1,
            ratings.filter((score): score is number => score !== null).length
          )
        ).toFixed(1)
      );
      const draftPayload = buildSubmittedData();

      if (isDraftSetupStage) {
        if (!isSectionABComplete) {
          setSubmitModal({
            open: true,
            kind: "error",
            title: "Complete A+B First",
            message: "Please complete Sections A and B before saving this training form to My Submissions."
          });
          setActiveSection("A");
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }

        if (!feedbackDeadline) {
          setSubmitModal({
            open: true,
            kind: "error",
            title: "Set Feedback Deadline",
            message: "Please set the trainee feedback deadline before saving this draft."
          });
          setActiveSection("A");
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }

        // Saving the draft creates the first real backend session id that later drives the official trainee QR/link.
        let trainingSessionId: number | null = null;
        const existingSessionId = existingForm
          ? Number(existingForm.id.replace(/^F-/, ""))
          : Number.NaN;
        try {
          const result = await saveTrainingSessionDraft({
            SessionId: Number.isFinite(existingSessionId) ? existingSessionId : null,
            TrainerId: currentUser!.id,
            Title: trainingTitle || "Training Assessment",
            Department: trainerDepartment,
            TrainingDate: trainingDate || undefined,
            DurationDays: Number(trainingDurationDays) || undefined,
            DurationHours: Number(trainingDurationHours) || undefined,
            NumberOfTrainees: Number(numberOfTrainees) || undefined,
            TrainingFormat: trainingFormats,
            TargetAudience: targetUserGroup,
            Objectives: objectives.filter((item) => item.trim().length > 0),
            DraftPayload: JSON.stringify({
              title: trainingTitle || "Training Assessment",
              department: trainerDepartment,
              date: trainingDate,
              trainees: Number(numberOfTrainees) || traineeRoster.length || 0,
              submittedData: draftPayload
            })
          });
          trainingSessionId = result.sessionId;
        } catch (error) {
          setSubmitModal({
            open: true,
            kind: "error",
            title: "Draft Save Failed",
            message: "Unable to save the training draft to the backend. Please check your connection and try again."
          });
          return;
        }

        const newFormId = `F-${trainingSessionId}`;
        addForm({
          id: newFormId,
          backendSessionId: trainingSessionId ?? undefined,
          title: trainingTitle || "Training Assessment",
          trainerId: currentUser.id,
          assignedSupervisorId: existingForm?.assignedSupervisorId ?? currentUser.supervisorId,
          department: trainerDepartment || currentUser.department || "Operations",
          date: trainingDate || new Date().toISOString().slice(0, 10),
          trainees: Number(numberOfTrainees) || traineeRoster.length || 0,
          feedbackResponses: existingForm?.feedbackResponses ?? 0,
          averageScore:
            existingForm && existingForm.feedbackResponses > 0
              ? existingForm.averageScore
              : computedAverageScore,
          status: "DRAFT",
          recommendation: "Draft in progress",
          createdAt: existingForm?.createdAt ?? new Date().toISOString().slice(0, 10),
          updatedAt: new Date().toISOString(),
          submittedData: draftPayload,
          supervisorOnlyFeedback: existingForm?.supervisorOnlyFeedback
        });
        setDistributedFormId(newFormId);
        if (draftStorageKey) {
          localStorage.removeItem(draftStorageKey);
        }
        setDraftRestored(false);
        setShowDraftToast(false);
        setSubmitModal({
          open: true,
          kind: "success",
          title: "Draft Saved",
          message: "Sections A and B were saved as a draft. Open this form from My Submissions to complete the remaining trainer sections and access the official trainee QR/link."
        });
        navigate(`/trainer/submissions/view?formId=${encodeURIComponent(newFormId)}`);
        return;
      }

      if (!currentUser?.supervisorId) {
        setSubmitModal({
          open: true,
          kind: "error",
          title: "Supervisor Not Assigned",
          message: "Your profile has no assigned supervisor. Please contact admin before submitting."
        });
        return;
      }

      if (!submissionIntegrity.complete) {
        if (submissionIntegrity.firstMissingKey) {
          setActiveSection(submissionIntegrity.firstMissingKey);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        setSubmitModal({
          open: true,
          kind: "error",
          title: "Form Incomplete",
          message: `Complete the required sections before submitting to the supervisor: ${submissionIntegrity.missing.join(", ")}.`
        });
        return;
      }

      let trainingSessionId = Number(effectiveDistributedFormId?.replace(/^F-/, ""));
      if (!Number.isFinite(trainingSessionId) || trainingSessionId <= 0) {
        try {
          const result = await saveTrainingSessionDraft({
            TrainerId: currentUser.id,
            Title: trainingTitle || "Training Assessment",
            Department: trainerDepartment,
            TrainingDate: trainingDate || undefined,
            DurationDays: Number(trainingDurationDays) || undefined,
            DurationHours: Number(trainingDurationHours) || undefined,
            NumberOfTrainees: Number(numberOfTrainees) || undefined,
            TrainingFormat: trainingFormats,
            TargetAudience: targetUserGroup,
            Objectives: objectives.filter((item) => item.trim().length > 0),
            DraftPayload: JSON.stringify({
              title: trainingTitle || "Training Assessment",
              submittedData: draftPayload
            })
          });
          trainingSessionId = result.sessionId;
        } catch (error) {
          setSubmitModal({
            open: true,
            kind: "error",
            title: "Submission Failed",
            message: "Unable to save the training session to the backend. Please check your connection and try again."
          });
          return;
        }
      }

      let trainerReportId: number | null = null;
      try {
        const report = await saveTrainerReport({
          TrainingSessionId: trainingSessionId,
          TraineeAssessments: trainees.map((trainee) => ({
            TraineeName: trainee.name || "Unnamed trainee",
            DemonstratedUnderstanding: trainee.understanding === "Yes",
            CanPerformIndependently: trainee.independent === "Yes",
            Status:
              trainee.understanding === "Yes" && trainee.independent === "Yes"
                ? "Competent"
                : "Needs Support"
          })),
          SkillApplicationLevel: applicationExtent,
          PerformanceImproved: observedImprovement === "Yes",
          SupportNeeded: supportNeeded,
          Comments: trainerApplicationComment || "",
          WhatWorkedWell: workedWellComment,
          Improvements: trainerFutureSessionComment,
          TrainerComment: trainerApplicationComment || "",
          SupervisorComment: supervisorApplicationComment || "",
          EffectivenessRating: effectivenessRating,
          Recommendation: recommendationChoice,
          TrainerName: trainerName || currentUser?.name || currentUser?.email || "Trainer",
          TrainerSignature: signatures.trainerImage || (signatures.trainer ? "Signed" : "")
        });
        trainerReportId = report.id;
        await submitTrainerReport(
          trainerReportId,
          JSON.stringify({
            title: trainingTitle || "Training Assessment",
            submittedData: draftPayload
          })
        );
      } catch (error) {
        setSubmitModal({
          open: true,
          kind: "error",
          title: "Submission Failed",
          message: "Unable to save the trainer report to the backend. Please check your connection and try again."
        });
        return;
      }

      const newFormId = effectiveDistributedFormId ?? `F-${trainingSessionId}`;

      addForm({
        id: newFormId,
        backendSessionId: trainingSessionId,
        title: trainingTitle || "Training Assessment",
        trainerId: currentUser.id,
        assignedSupervisorId: existingForm?.assignedSupervisorId ?? currentUser.supervisorId,
        department: trainerDepartment || currentUser?.department || "Operations",
        date: trainingDate || new Date().toISOString().slice(0, 10),
        trainees: Number(numberOfTrainees) || traineeRoster.length || 0,
        feedbackResponses: existingForm?.feedbackResponses ?? 0,
        averageScore:
          existingForm && existingForm.feedbackResponses > 0
            ? existingForm.averageScore
            : computedAverageScore,
        // Once trainer submits, it becomes an actual submission.
        status: "TRAINERASSESSMENTPENDING",
        recommendation: "Pending supervisor review",
        createdAt: existingForm?.createdAt ?? new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString(),
        submittedAt: new Date().toISOString().slice(0, 10),
        submittedData: draftPayload,
        supervisorOnlyFeedback: existingForm?.supervisorOnlyFeedback
      });
      setDistributedFormId(newFormId);
      setSubmitModal({
        open: true,
        kind: "success",
        title: "Submitted To Supervisor",
        message: `Submitted successfully. This form was sent to ${assignedSupervisor?.name || assignedSupervisor?.email || "your assigned supervisor"}. Trainee link: /trainee-feedback?formId=${newFormId}`
      });

      if (draftStorageKey) {
        localStorage.removeItem(draftStorageKey);
      }
      return;
    }

    if (userRole === "supervisor") {
      if (!linkedForm) {
        setSubmitModal({
          open: true,
          kind: "error",
          title: "No Form Linked",
          message: "Unable to locate the trainer form for supervisor sign-off."
        });
        return;
      }
      setSupervisorActionError("");
      const reviewerName = signOff.supervisorName || currentUser?.name || currentUser?.email || "Supervisor";
      const supervisorSignature =
        signatures.supervisorImage || (signatures.supervisor ? "Signed" : "");

      if (!supervisorSignature) {
        setSubmitModal({
          open: true,
          kind: "error",
          title: "Signature Required",
          message: "Please add your supervisor signature in Section G before approving this assessment."
        });
        setActiveSection("G");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      const approvedSnapshot = JSON.stringify({
        title: trainingTitle || linkedForm.title,
        submittedData: {
          trainerName,
          trainerDepartment,
          trainingTitle,
          trainingDate,
          durationDays: trainingDurationDays,
          durationHours: trainingDurationHours,
          numberOfTrainees,
          objectives,
          passRate: autoPassRate || "-",
          averageScoreDisplay: autoAverageScore || "-",
          observedImprovement,
          trainingFormats,
          targetUserGroup,
          feedbackDeadline,
          followUpSupervisorName,
          perStatementAverages:
            (linkedForm?.supervisorOnlyFeedback?.length ?? 0) > 0
              ? statementAveragesFromFeedback
              : ratings.map((score) => (typeof score === "number" ? Number(score.toFixed(2)) : 0)),
          applicationExtent,
          observedImprovementDetails,
          supportNeeded,
          barriersComment: trainerApplicationComment,
          trainerApplicationComment,
          supervisorApplicationComment,
          workedWellComment,
          effectivenessRating,
          recommendationChoice,
          trainerFutureSessionComment,
          supervisorFutureSessionComment,
          trainees,
          signatures,
          signOff: {
            ...signOff,
            supervisorName: reviewerName,
            supervisorDate: signOff.supervisorDate || new Date().toISOString().slice(0, 10)
          },
          traineeRoster
        }
      });

      const approved = await submitSupervisorReview({
        formId: linkedForm.id,
        decision: "Approve",
        comments: supervisorFutureSessionComment.trim() || "Approved by supervisor.",
        actionItems: [],
        sectionFeedback: [],
        reviewerName,
        supervisorSignature,
        formSnapshot: approvedSnapshot
      });

      if (!approved) {
        setSubmitModal({
          open: true,
          kind: "error",
          title: "Approval Failed",
          message: "Unable to save supervisor sign-off to the server. Please try again."
        });
        return;
      }

      addForm({
        ...linkedForm,
        status: "COMPLETED",
        updatedAt: new Date().toISOString(),
        submittedData: {
          trainerName,
          trainerDepartment,
          trainingTitle,
          trainingDate,
          durationDays: trainingDurationDays,
          durationHours: trainingDurationHours,
          numberOfTrainees,
          objectives,
          passRate: autoPassRate || "-",
          averageScoreDisplay: autoAverageScore || "-",
          observedImprovement,
          trainingFormats,
          targetUserGroup,
          feedbackDeadline,
          followUpSupervisorName,
          perStatementAverages:
            (linkedForm?.supervisorOnlyFeedback?.length ?? 0) > 0
              ? statementAveragesFromFeedback
              : ratings.map((score) => (typeof score === "number" ? Number(score.toFixed(2)) : 0)),
          applicationExtent,
          observedImprovementDetails,
          supportNeeded,
          barriersComment: trainerApplicationComment,
          trainerApplicationComment,
          supervisorApplicationComment,
          workedWellComment,
          effectivenessRating,
          recommendationChoice,
          trainerFutureSessionComment,
          supervisorFutureSessionComment,
          trainees,
          signatures,
          signOff,
          traineeRoster
        }
      });
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

  const handleReturnForChanges = async () => {
    if (userRole !== "supervisor") return;
    if (!linkedForm) {
      setSubmitModal({
        open: true,
        kind: "error",
        title: "No Form Linked",
        message: "Unable to locate the trainer form for supervisor review."
      });
      return;
    }
    const reason = supervisorReturnReason.trim() || supervisorFutureSessionComment.trim();
    if (!reason) {
      setSupervisorActionError("Please provide a reason before returning this form for changes.");
      return;
    }
    setSupervisorActionError("");
    const reviewerName = signOff.supervisorName || currentUser?.name || currentUser?.email || "Supervisor";
    const returnSnapshot = JSON.stringify({
      title: trainingTitle || linkedForm.title,
      submittedData: buildSubmittedData()
    });
    const ok = await submitSupervisorReview({
      formId: linkedForm.id,
      decision: "Needs Changes",
      comments: reason,
      actionItems: [],
      sectionFeedback: [],
      reviewerName,
      formSnapshot: returnSnapshot
    });
    if (!ok) {
      setSupervisorActionError("Unable to return form. Please add a clear reason and try again.");
      return;
    }
    addForm({
      ...linkedForm,
      status: "FOLLOWUPPENDING",
      updatedAt: new Date().toISOString(),
      submittedData: {
        trainerName,
        trainerDepartment,
        trainingTitle,
        trainingDate,
        durationDays: trainingDurationDays,
        durationHours: trainingDurationHours,
        numberOfTrainees,
        objectives,
        passRate: autoPassRate || "-",
        averageScoreDisplay: autoAverageScore || "-",
        observedImprovement,
        trainingFormats,
        targetUserGroup,
        feedbackDeadline,
        followUpSupervisorName,
        perStatementAverages:
          (linkedForm?.supervisorOnlyFeedback?.length ?? 0) > 0
            ? statementAveragesFromFeedback
            : ratings.map((score) => (typeof score === "number" ? Number(score.toFixed(2)) : 0)),
        applicationExtent,
        observedImprovementDetails,
        supportNeeded,
        barriersComment: trainerApplicationComment,
        trainerApplicationComment,
        supervisorApplicationComment,
        workedWellComment,
        effectivenessRating,
        recommendationChoice,
        trainerFutureSessionComment,
        supervisorFutureSessionComment,
        trainees,
        signatures,
        signOff,
        traineeRoster
      }
    });
    setSubmitModal({
      open: true,
      kind: "success",
      title: "Returned For Changes",
      message: "The form has been returned to trainer with your reason."
    });
  };

  return (
    <main ref={formRef} className="min-h-screen bg-brand-mist py-8 md:py-10">
      <div className="mx-auto w-full max-w-6xl px-4">
        <header className="relative mb-8 overflow-hidden rounded-2xl border border-brand-line bg-white shadow-panel">
          <div className="h-1.5 bg-brand-ruby" />
          <div className="p-5 md:p-7">
            {!isSupervisorReviewMode ? (
              <div className="absolute right-5 top-5">
                <span
                  className={`rounded-full border px-3 py-1 text-[11px] font-medium ${
                    assignedSupervisor
                      ? "border-slate-200 bg-slate-50 text-slate-700"
                      : "border-rose-200 bg-rose-50 text-rose-700"
                  }`}
                >
                  {assignedSupervisor
                    ? `Assigned: ${assignedSupervisor.name || assignedSupervisor.email}`
                    : "Assigned: Not set"}
                </span>
              </div>
            ) : null}
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

            {!isSupervisorReviewMode && showDraftToast ? (
              <div className="absolute right-5 top-14 max-w-xs rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <span>Draft saved.</span>
                  <button
                    type="button"
                    onClick={() => setShowDraftToast(false)}
                    className="text-emerald-700 hover:text-emerald-900"
                    aria-label="Dismiss draft restored message"
                  >
                    ×
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </header>

        {!isSupervisorReviewMode && linkedForm?.status === "FOLLOWUPPENDING" ? (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-panel">
            <p className="font-semibold">Returned for correction</p>
            <p className="mt-1 text-xs">
              {linkedForm.supervisorReview?.comments || "The supervisor requested updates before approval."}
            </p>
            {(linkedForm.supervisorReview?.actionItems?.length ?? 0) > 0 ? (
              <ul className="mt-2 list-disc pl-4 text-xs">
                {linkedForm.supervisorReview?.actionItems.map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {!isSupervisorReviewMode &&
        (linkedForm?.status === "DRAFT" ||
          linkedForm?.status === "OPENFORFEEDBACK" ||
          linkedForm?.status === "FEEDBACKCLOSED") ? (
          <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 shadow-panel">
            <p className="font-semibold">Editable draft</p>
            <p className="mt-1 text-xs">
              This draft updates automatically while you work. Last updated: {new Date(linkedForm.updatedAt ?? linkedForm.createdAt).toLocaleString()}.
            </p>
          </div>
        ) : null}

        {isSupervisorReviewMode ? (
          <div className="mb-5 space-y-3">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-panel">
              Supervisor review mode: trainer-submitted sections are shown for assessment and approval.
            </div>
          </div>
        ) : null}

        <div className="space-y-5">
          {activeSection === "A" && visibleSections.includes("A") ? (
          <Card section="A" title="Training Information" owner="Trainer" disabled={isSupervisorReviewMode}>
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput label="Trainer’s Name" value={trainerName} onChange={setTrainerName} readOnly={isSupervisorReviewMode} required error={showValidationHints ? draftFieldErrors.trainerName : ""} />
              <TextInput label="Trainer’s Department/Role" value={trainerDepartment} onChange={setTrainerDepartment} readOnly={isSupervisorReviewMode} required error={showValidationHints ? draftFieldErrors.trainerDepartment : ""} />
              <TextInput label="Training Title / Topic" value={trainingTitle} onChange={setTrainingTitle} readOnly={isSupervisorReviewMode} required helpText="Use a clear title that will still make sense in reports." error={showValidationHints ? draftFieldErrors.trainingTitle : ""} />
              <TextInput label="Training Date" type="date" value={trainingDate} onChange={setTrainingDate} required error={showValidationHints ? draftFieldErrors.trainingDate : ""} />
              <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  <span>Training Duration</span>
                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          placeholder="2"
                          value={trainingDurationDays}
                          onChange={(event) => setTrainingDurationDays(event.target.value)}
                          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                        />
                        <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500">Days</span>
                      </label>
                      <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          placeholder="4"
                          value={trainingDurationHours}
                          onChange={(event) => setTrainingDurationHours(event.target.value)}
                          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                        />
                        <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500">Hours</span>
                      </label>
                    </div>
                    <p className="mt-2 text-xs font-normal text-slate-500">
                      Capture the full duration in the format that best reflects the session, such as 2 days or 4 hours.
                    </p>
                  </div>
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  <span>
                    Number of Trainees
                    <span className="ml-1 text-rose-600">*</span>
                  </span>
                  <select
                    value={numberOfTrainees}
                    onChange={(event) => setNumberOfTrainees(event.target.value)}
                    disabled={isSupervisorReviewMode}
                    className={`rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-ruby focus:ring-2 focus:ring-red-100 ${
                      showValidationHints && draftFieldErrors.numberOfTrainees ? "border-rose-300 bg-rose-50/40" : "border-brand-line"
                    }`}
                  >
                    <option value="">Select number</option>
                    {Array.from({ length: 100 }, (_, i) => i + 1).map((count) => (
                      <option key={count} value={String(count)}>
                        {count}
                      </option>
                    ))}
                  </select>
                  {showValidationHints && draftFieldErrors.numberOfTrainees ? (
                    <span className="text-xs font-medium text-rose-700">{draftFieldErrors.numberOfTrainees}</span>
                  ) : null}
                </label>
              </div>

              <div className="md:col-span-2">
                <p className="mb-2 text-sm font-medium text-slate-700">Training Format</p>
                <div className="flex flex-wrap gap-4">
                  {["Instructor-Led", "Virtual", "Hybrid"].map((item) => (
                    <CheckboxLine
                      key={item}
                      label={item}
                      checked={trainingFormats.includes(item)}
                      disabled={isSupervisorReviewMode}
                      onChange={(checked) => setTrainingFormats(checked ? [item] : [])}
                    />
                  ))}
                </div>
                {showValidationHints && draftFieldErrors.trainingFormats ? (
                  <p className="mt-2 text-xs font-medium text-rose-700">{draftFieldErrors.trainingFormats}</p>
                ) : null}
              </div>
              <div className="md:col-span-2">
                <TextInput
                  label="Target User Group (e.g., system users, operators, managers)"
                  value={targetUserGroup}
                  onChange={setTargetUserGroup}
                  readOnly={isSupervisorReviewMode}
                  required
                  helpText="This helps later reporting and follow-up discussions."
                  error={showValidationHints ? draftFieldErrors.targetUserGroup : ""}
                />
              </div>

            </div>
          </Card>
          ) : null}

          {activeSection === "A" && visibleSections.includes("A") ? (
          <Card section="B" title="Training Objectives" owner="Trainer" disabled={isSupervisorReviewMode}>
            <p className="mb-3 text-sm text-slate-600">Please list the key learning objectives for this training session.</p>
            {showValidationHints && draftFieldErrors.objectives ? (
              <p className="mb-3 text-xs font-medium text-rose-700">{draftFieldErrors.objectives}</p>
            ) : null}
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

          {activeSection === "A" && visibleSections.includes("A") && !isSupervisorReviewMode ? (
          <section className="rounded-2xl border border-brand-line bg-white shadow-panel">
            <div className="border-b border-brand-line px-5 py-4 md:px-6">
              <h2 className="text-base font-semibold text-brand-ink md:text-lg">Trainee Link / QR Distribution</h2>
              <p className="mt-1 text-sm text-slate-600">
                This sits after Sections A and B. Set the trainee feedback time limit here, then submit this page as a draft. The official trainee QR and link will be generated from that saved draft.
              </p>
            </div>
            <div className="space-y-4 p-5 md:p-6">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr),auto] md:items-end">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  <span>
                    Feedback submission deadline
                    <span className="ml-1 text-rose-600">*</span>
                  </span>
                  <input
                    type="datetime-local"
                    value={feedbackDeadline}
                    onChange={(event) => setFeedbackDeadline(event.target.value)}
                    className={`rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-ruby focus:ring-2 focus:ring-red-100 ${
                      showValidationHints && draftFieldErrors.feedbackDeadline ? "border-rose-300 bg-rose-50/40" : "border-brand-line"
                    }`}
                  />
                  {showValidationHints && draftFieldErrors.feedbackDeadline ? (
                    <span className="text-xs font-medium text-rose-700">{draftFieldErrors.feedbackDeadline}</span>
                  ) : (
                    <span className="text-xs font-normal text-slate-500">Choose when the trainee feedback link should stop accepting responses.</span>
                  )}
                </label>
                {isDraftSetupStage ? (
                  <div className="rounded-xl border border-dashed border-brand-line bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Submit this page as a draft to create the official trainee QR and link.
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleDistributeTraineeQr}
                      disabled={!isSectionABComplete || !feedbackDeadline}
                      className="rounded-lg border border-slate-700 bg-slate-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-300"
                    >
                      Generate Trainee QR
                    </button>
                    <span className="text-xs font-medium text-slate-500">
                      {!isSectionABComplete
                        ? "Complete required A+B fields to enable"
                        : !feedbackDeadline
                          ? "Set a deadline to enable distribution"
                          : "A+B complete"}
                    </span>
                  </div>
                )}
              </div>

              {formattedFeedbackDeadline ? (
                <p className="text-xs text-slate-500">
                  Trainees can submit feedback until <span className="font-semibold text-slate-700">{formattedFeedbackDeadline}</span>.
                </p>
              ) : null}

              {!isDraftSetupStage && distributedFormId && traineeFeedbackLink ? (
                <div className="grid gap-3 md:grid-cols-[220px,1fr] md:items-start">
                  <img
                    src={traineeQrUrl}
                    alt="Trainee feedback QR code"
                    className="h-[220px] w-[220px] rounded-lg border border-brand-line bg-white p-2"
                  />
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trainee Link</p>
                    <p className="break-all rounded-lg border border-brand-line bg-white p-2 text-xs text-slate-700">
                      {traineeFeedbackLink}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (!traineeFeedbackLink) return;
                        navigator.clipboard?.writeText(traineeFeedbackLink);
                      }}
                      className="rounded-lg border border-brand-line bg-white px-3 py-2 text-xs font-semibold text-brand-ink transition hover:border-brand-ruby hover:text-brand-ruby"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
          ) : null}

          {activeSection === "D" && visibleSections.includes("D") ? (
          <Card section="E" title="Workplace Application & Follow-Up" owner="Trainer" disabled={false}>
            <p className="mb-3 text-sm text-slate-600">Complete after training, based on observation, Q&A, or practical test.</p>

            <p className="mb-3 text-sm font-semibold text-brand-ruby">Knowledge / Skills Check</p>

            {/* Desktop table view */}
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full border-collapse rounded-lg border border-brand-line text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className={`${tableCell} sticky top-0 z-10 bg-slate-100 text-left`}>Trainee Name</th>
                    <th className={`${tableCell} sticky top-0 z-10 bg-slate-100 text-center`}>Demonstrated understanding</th>
                    <th className={`${tableCell} sticky top-0 z-10 bg-slate-100 text-center`}>Able to perform task without support</th>
                    <th className={`${tableCell} sticky top-0 z-10 bg-slate-100 text-center`}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {trainees.map((trainee, index) => {
                    const isEvaluated = trainee.understanding !== "" && trainee.independent !== "";
                    const isPass = trainee.understanding === "Yes" && trainee.independent === "Yes";
                    const resolvedName = trainee.name.trim() || traineeRoster[index]?.name?.trim() || `Trainee ${index + 1}`;

                    return (
                      <tr key={`trainee-${index}`} className="odd:bg-white even:bg-slate-50">
                        <td className={tableCell}>
                          <input
                            type="text"
                            value={resolvedName}
                            readOnly
                            className="w-full rounded-lg border border-brand-line bg-slate-50 px-2 py-1.5 text-sm text-slate-700 read-only:bg-slate-50"
                          />
                        </td>
                        <td className={`${tableCell} text-center`}>
                          <YesNoGroup
                            name={`understanding-${index}`}
                            value={trainee.understanding}
                            disabled={isSupervisorReviewMode}
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
                            disabled={isSupervisorReviewMode}
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
                const resolvedName = trainee.name.trim() || traineeRoster[index]?.name?.trim() || `Trainee ${index + 1}`;

                return (
                  <div key={`trainee-mobile-${index}`} className="rounded-lg border border-brand-line bg-white p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold text-brand-ink">{resolvedName}</p>
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
                        value={resolvedName}
                        readOnly
                        className="w-full rounded-lg border border-brand-line bg-slate-50 px-2 py-1.5 text-sm text-slate-700 read-only:bg-slate-50"
                      />
                      <div>
                        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Understanding</p>
                        <YesNoGroup
                          name={`understanding-mobile-${index}`}
                          value={trainee.understanding}
                          disabled={isSupervisorReviewMode}
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
                          disabled={isSupervisorReviewMode}
                          onChange={(value) => {
                            setTrainees((prev) => {
                              const next = [...prev];
                              next[index] = { ...next[index], independent: value };
                              return next;
                            });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 max-w-md">
              <TextInput label="Overall pass rate (auto-calculated)" value={autoPassRate || "-"} readOnly />
            </div>

            <div className="my-6 h-px bg-slate-200" />
            <p className="mb-3 text-sm font-semibold text-brand-ruby">Workplace Application & Follow-Up</p>
            <p className="mb-3 text-sm text-slate-600">
              Complete this section 2-4 weeks after training to record how trainees are applying the training in the workplace, using input from the supervisor or line manager where needed.
            </p>
            <div className="space-y-5">
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">1. To what extent have trainees applied the skills in the workplace?</p>
                <div className="flex flex-wrap gap-4">
                  {["Not at all", "Minimally", "Moderately", "Largely", "Fully"].map((item) => (
                    <CheckboxLine
                      key={item}
                      label={item}
                      checked={applicationExtent === item}
                      disabled={isSupervisorReviewMode}
                      onChange={(checked) => setApplicationExtent(checked ? item : "")}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">2. Observed improvement in performance or system use?</p>
                <div className="mb-3 flex gap-4">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={observedImprovement === "Yes"}
                      disabled={isSupervisorReviewMode}
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
                      disabled={isSupervisorReviewMode}
                      onChange={() =>
                        setObservedImprovement((prev) => (prev === "No" ? "" : "No"))
                      }
                      className="size-4 rounded border-brand-line text-brand-ruby focus:ring-red-100"
                    />
                    No
                  </label>
                </div>
                {observedImprovement === "Yes" ? (
                  <TextArea
                    label="If yes, please describe briefly"
                    rows={3}
                    value={observedImprovementDetails}
                    onChange={setObservedImprovementDetails}
                    readOnly={isSupervisorReviewMode}
                  />
                ) : null}
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">3. Additional support or refresher training needed?</p>
                <div className="flex flex-wrap gap-4">
                  {["None", "Minimal", "Significant", "Full retraining required"].map((item) => (
                    <CheckboxLine
                      key={item}
                      label={item}
                      checked={supportNeeded === item}
                      disabled={isSupervisorReviewMode}
                      onChange={(checked) => setSupportNeeded(checked ? item : "")}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-medium text-slate-700">
                  4. Comments / barriers to application (e.g., time, resources, supervision):
                </p>
                <TextArea
                  label="Comment by trainer"
                  rows={4}
                  value={trainerApplicationComment}
                  onChange={setTrainerApplicationComment}
                  readOnly={userRole === "supervisor"}
                />
                <TextArea
                  label="Comment by supervisor"
                  rows={4}
                  value={supervisorApplicationComment}
                  onChange={setSupervisorApplicationComment}
                  readOnly={userRole === "trainer"}
                  helpText={userRole === "trainer" ? "This field is completed by the supervisor during review." : undefined}
                />
              </div>
            </div>
          </Card>
          ) : null}

          {activeSection === "F" && visibleSections.includes("F") ? (
          <Card section="F" title="Overall Trainer Reflection & Improvement" owner="Trainer" disabled={false}>
            <div className="space-y-6">
              <TextArea
                label="1. What worked well in this training?"
                rows={3}
                value={workedWellComment}
                onChange={setWorkedWellComment}
                readOnly={isSupervisorReviewMode}
              />
              <TextArea
                label="2. What would you change for future sessions?"
                rows={3}
                value={trainerFutureSessionComment}
                onChange={setTrainerFutureSessionComment}
                readOnly={isSupervisorReviewMode}
              />
              <div>
                <p className="mb-3 text-sm font-medium text-slate-700">3. Training effectiveness rating (overall):</p>
                <div className="space-y-3">
                  {["Poor", "Fair", "Good", "Very Good", "Excellent"].map((item) => (
                    <CheckboxLine
                      key={item}
                      label={item}
                      checked={effectivenessRating === item}
                      disabled={isSupervisorReviewMode}
                      onChange={(checked) => setEffectivenessRating(checked ? item : "")}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-3 text-sm font-medium text-slate-700">4. Recommendation:</p>
                <div className="space-y-3">
                  {["Proceed as is", "Minor adjustments needed", "Major revision required"].map((item) => (
                    <CheckboxLine
                      key={item}
                      label={item}
                      checked={recommendationChoice === item}
                      disabled={isSupervisorReviewMode}
                      onChange={(checked) => setRecommendationChoice(checked ? item : "")}
                    />
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
                    const imageKey = key === "trainer" ? "trainerImage" : "supervisorImage";
                    const rowReadOnly =
                      (userRole === "supervisor" && key === "trainer") ||
                      (userRole === "trainer" && key === "supervisor");
                    return (
                    <tr key={role} className="odd:bg-white even:bg-slate-50">
                      <td className={tableCell}>{role}</td>
                      <td className={tableCell}>
                        <input
                          type="text"
                          value={key === "trainer" ? signOff.trainerName : signOff.supervisorName}
                          readOnly
                          className="w-full rounded-lg border border-brand-line px-2 py-1.5 read-only:bg-slate-100"
                        />
                      </td>
                      <td className={tableCell}>
                        <SignaturePad
                          label={`${role} signature`}
                          valueImage={signatures[imageKey]}
                          onImageChange={(image) =>
                            setSignatures((prev) => ({ ...prev, [imageKey]: image ?? "" }))
                          }
                          disabled={rowReadOnly}
                          onSignedChange={(isSigned) =>
                            setSignatures((prev) => ({ ...prev, [key]: isSigned }))
                          }
                        />
                        {signatures[key] ? (
                          <p className="mt-1 text-[11px] font-semibold text-emerald-700">Signed</p>
                        ) : null}
                      </td>
                      <td className={tableCell}>
                        <input
                          type="date"
                          value={key === "trainer" ? signOff.trainerDate : signOff.supervisorDate}
                          onChange={(event) =>
                            setSignOff((prev) => ({
                              ...prev,
                              [key === "trainer" ? "trainerDate" : "supervisorDate"]: event.target.value
                            }))
                          }
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
            <div className="flex flex-col items-end gap-1">
              {!isSupervisorReviewMode && !isDraftSetupStage && !assignedSupervisor ? (
                <p className="text-xs font-medium text-rose-700">
                  No supervisor assigned. Contact admin before submitting.
                </p>
              ) : null}
              <div className="flex items-center gap-2">
              {isLastSection && userRole === "supervisor" ? (
                <button
                  type="button"
                  onClick={handleReturnForChanges}
                  className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
                >
                  Return for Changes
                </button>
              ) : null}
              {isLastSection ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="rounded-lg border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-black focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  {userRole === "trainer"
                    ? isDraftSetupStage
                      ? "Save Progress"
                      : "Submit To Supervisor"
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
              {isLastSection && userRole === "supervisor" ? (
                <div className="mt-2 w-full max-w-xl">
                  <textarea
                    rows={2}
                    value={supervisorReturnReason}
                    onChange={(event) => {
                      setSupervisorReturnReason(event.target.value);
                      if (supervisorActionError) setSupervisorActionError("");
                    }}
                    placeholder="Reason for return (required)"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-ruby focus:ring-2 focus:ring-red-100"
                  />
                  {supervisorActionError ? (
                    <p className="mt-1 text-xs font-medium text-rose-700">{supervisorActionError}</p>
                  ) : null}
                </div>
              ) : null}
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







