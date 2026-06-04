// Primary training assessment workflow used by trainer and reused as read-only for supervisor review.
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  getSessionFeedbackEntries,
  getTrainingSession,
  publishTrainingSession,
  saveTrainerReport,
  saveTrainingSessionDraft,
  submitTrainerReport
} from "../../lib/api";
import { isInStatuses, TRAINER_CONTINUE_ASSESSMENT_STATUSES } from "../../lib/form-status";
import { mapApiFeedbackEntries, toUiStatus } from "../../lib/session-forms";
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

function normalizeTraineeKey(value: string) {
  return value.trim().toLowerCase();
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

function TextArea({
  label,
  rows = 4,
  value,
  onChange,
  readOnly = false,
  placeholder
}: {
  label: string;
  rows?: number;
  value?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
      {label}
      <textarea
        title={label}
        rows={rows}
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={(event) => onChange?.(event.target.value)}
        className="rounded-lg border border-brand-line bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-ruby focus:ring-2 focus:ring-red-100"
      />
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
    const canvas = canvasRef.current;
    if (canvas) {
      const data = canvas.toDataURL("image/png");
      lastSyncedImageRef.current = data;
      onImageChange?.(data);
    }
  };

  const clearSignature = () => {
    if (disabled) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
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
          const imageFromCanvas = canvas.toDataURL("image/png");
          lastSyncedImageRef.current = imageFromCanvas;
          onImageChange?.(imageFromCanvas);
          onSignedChange?.(true);
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
      <div className="flex items-center gap-3">
        <label className="cursor-pointer text-[11px] font-medium text-slate-600 transition hover:text-brand-ruby">
          Upload image
          <input
            type="file"
            accept="image/*"
            onChange={onUploadSignature}
            disabled={disabled}
            className="hidden"
          />
        </label>
        <button
          type="button"
          onClick={clearSignature}
          disabled={disabled}
          className="text-[11px] font-medium text-slate-500 transition hover:text-brand-ruby disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

const tableCell = "border border-brand-line px-3 py-2";
const sectionKeys = ["A", "B", "C", "D", "F", "G"] as const;
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
  feedbackOpenHours: string;
  objectives: string[];
  observedImprovement: YesNo;
  trainingFormats: string[];
  targetUserGroup: string;
  followUpSupervisorName: string;
  applicationExtent: string;
  observedImprovementDetails: string;
  supportNeeded: string;
  barriersComment: string;
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
  const [searchParams] = useSearchParams();
  const urlFormId = searchParams.get("formId");
  const urlSection = searchParams.get("section");
  const addForm = useAppStore((s) => s.addForm);
  const submitSupervisorReview = useAppStore((s) => s.submitSupervisorReview);
  const forms = useAppStore((s) => s.forms);
  const users = useAppStore((s) => s.users);
  const currentUser = useAppStore((s) => s.currentUser);
  const sections = sectionKeys;
  type UserRole = "trainer" | "trainee" | "supervisor";
  const [activeSection, setActiveSection] = useState<SectionKey>("A");
  const [userRole] = useState<UserRole>(readOnly ? "supervisor" : "trainer");
  const formRef = useRef<HTMLDivElement | null>(null);
  const distributedFormIdRef = useRef<string | null>(null);
  const autosaveBootstrapped = useRef(false);
  const [distributedFormId, setDistributedFormId] = useState<string | null>(null);

  const [trainerName, setTrainerName] = useState(submittedData?.trainerName ?? currentUser?.name ?? "");
  const [trainerDepartment, setTrainerDepartment] = useState(submittedData?.trainerDepartment ?? currentUser?.department ?? "");
  const [trainingTitle, setTrainingTitle] = useState(submittedData?.trainingTitle ?? "");
  const [trainingDate, setTrainingDate] = useState(submittedData?.trainingDate ?? "");
  const [trainingDurationDays, setTrainingDurationDays] = useState(submittedData?.durationDays ?? "");
  const [trainingDurationHours, setTrainingDurationHours] = useState(submittedData?.durationHours ?? "");
  const [numberOfTrainees, setNumberOfTrainees] = useState(submittedData?.numberOfTrainees ?? "");
  const [feedbackOpenHours, setFeedbackOpenHours] = useState(submittedData?.feedbackOpenHours ?? "24");
  const [objectives, setObjectives] = useState<string[]>(submittedData?.objectives?.length ? submittedData.objectives : [""]);
  const [observedImprovement, setObservedImprovement] = useState<YesNo>(submittedData?.observedImprovement ?? "");
  const [trainingFormats, setTrainingFormats] = useState<string[]>(submittedData?.trainingFormats ?? []);
  const [targetUserGroup, setTargetUserGroup] = useState(submittedData?.targetUserGroup ?? "");
  const [followUpSupervisorName, setFollowUpSupervisorName] = useState(
    submittedData?.followUpSupervisorName ?? submittedData?.signOff?.supervisorName ?? ""
  );
  const [applicationExtent, setApplicationExtent] = useState(submittedData?.applicationExtent ?? "");
  const [observedImprovementDetails, setObservedImprovementDetails] = useState(submittedData?.observedImprovementDetails ?? "");
  const [supportNeeded, setSupportNeeded] = useState(submittedData?.supportNeeded ?? "");
  const [barriersComment, setBarriersComment] = useState(submittedData?.barriersComment ?? "");
  const [workedWellComment, setWorkedWellComment] = useState(submittedData?.workedWellComment ?? "");
  const [effectivenessRating, setEffectivenessRating] = useState(submittedData?.effectivenessRating ?? "");
  const [recommendationChoice, setRecommendationChoice] = useState(submittedData?.recommendationChoice ?? "");
  const [trainerFutureSessionComment, setTrainerFutureSessionComment] = useState(submittedData?.trainerFutureSessionComment ?? "");
  const [supervisorFutureSessionComment, setSupervisorFutureSessionComment] = useState(submittedData?.supervisorFutureSessionComment ?? "");
  const [signOff, setSignOff] = useState({
    trainerName: submittedData?.signOff?.trainerName ?? currentUser?.name ?? "",
    trainerDate: submittedData?.signOff?.trainerDate ?? "",
    supervisorName: submittedData?.signOff?.supervisorName ?? "",
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
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<string | null>(null);
  const [loadedRemoteDraft, setLoadedRemoteDraft] = useState(false);

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


  const integrityLinkedFeedbackCount = useMemo(() => {
    const targetId = distributedFormId ?? reviewFormId ?? null;
    if (!targetId) return 0;
    const form = forms.find((entry) => entry.id === targetId);
    return form?.supervisorOnlyFeedback?.length ?? 0;
  }, [forms, distributedFormId, reviewFormId]);

  const submissionIntegrity = useMemo(() => {
    const checks = [
      {
        key: "A",
        label: "Section A · Training Information",
        ok:
          trainerName.trim().length > 0 &&
          trainerDepartment.trim().length > 0 &&
          trainingTitle.trim().length > 0 &&
          trainingDate.trim().length > 0
      },
      {
        key: "C",
        label: "Trainee feedback received",
        ok: integrityLinkedFeedbackCount > 0
      },
      {
        key: "D",
        label: "Section D · Skills & Follow-up",
        ok:
          trainees.some((t) => t.understanding !== "" || t.independent !== "") ||
          applicationExtent.trim().length > 0 ||
          supportNeeded.trim().length > 0 ||
          barriersComment.trim().length > 0
      },
      {
        key: "F",
        label: "Section F · Reflection",
        ok:
          workedWellComment.trim().length > 0 ||
          trainerFutureSessionComment.trim().length > 0 ||
          supervisorFutureSessionComment.trim().length > 0
      },
      {
        key: "G",
        label: "Section G · Sign-off",
        ok: signatures.trainer || signatures.supervisor
      }
    ] as const;

    const missing = checks.filter((c) => !c.ok).map((c) => c.label);
    return {
      complete: missing.length === 0,
      missing
    };
  }, [
    trainerName,
    trainerDepartment,
    trainingTitle,
    trainingDate,
    integrityLinkedFeedbackCount,
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

  const effectiveDistributedFormId = useMemo(() => {
    if (distributedFormId) return distributedFormId;
    if (reviewFormId) return reviewFormId;
    return null;
  }, [distributedFormId, reviewFormId]);

  const linkedForm = useMemo(
    () =>
      effectiveDistributedFormId
        ? forms.find((form) => form.id === effectiveDistributedFormId)
        : undefined,
    [forms, effectiveDistributedFormId]
  );

  const isDraftForm = linkedForm?.status === "Draft";
  const isPublishedForFeedback =
    linkedForm?.status != null && isInStatuses(linkedForm.status, TRAINER_CONTINUE_ASSESSMENT_STATUSES);
  const isTraineeFeedbackComplete =
    linkedForm?.status === "Feedback Closed" || linkedForm?.status === "Trainer Assessment Pending";

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

  const statementAveragesForDisplay = useMemo(() => {
    const fromSubmitted = submittedData?.perStatementAverages ?? [];
    if (fromSubmitted.length === feedbackStatements.length) return fromSubmitted;
    if (statementAveragesFromFeedback.length === feedbackStatements.length) return statementAveragesFromFeedback;
    return [] as number[];
  }, [submittedData?.perStatementAverages, statementAveragesFromFeedback]);

  const submittedTraineeNameSet = useMemo(() => {
    const names = (linkedForm?.supervisorOnlyFeedback ?? [])
      .map((entry) => normalizeTraineeKey(entry.traineeName || ""))
      .filter((name) => name.length > 0);
    return new Set(names);
  }, [linkedForm]);

  const assignedSupervisor = useMemo(() => {
    const assignedId = currentUser?.supervisorId;
    if (!assignedId) return undefined;
    return users.find((u) => u.id === assignedId && u.role === "supervisor");
  }, [currentUser?.supervisorId, users]);

  useEffect(() => {
    distributedFormIdRef.current = distributedFormId;
  }, [distributedFormId]);

  useEffect(() => {
    if (!distributedFormId && effectiveDistributedFormId) {
      setDistributedFormId(effectiveDistributedFormId);
    }
  }, [distributedFormId, effectiveDistributedFormId]);

  useEffect(() => {
    if (!urlSection) return;
    if (sections.includes(urlSection as SectionKey)) {
      setActiveSection(urlSection as SectionKey);
    }
  }, [urlSection, sections]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      autosaveBootstrapped.current = true;
    }, 800);
    return () => window.clearTimeout(timer);
  }, []);

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
      setFeedbackOpenHours(parsed.feedbackOpenHours ?? "24");
      setObjectives(parsed.objectives?.length ? parsed.objectives : [""]);
      setObservedImprovement(parsed.observedImprovement ?? "");
      setTrainingFormats(parsed.trainingFormats ?? []);
      setTargetUserGroup(parsed.targetUserGroup ?? "");
      setFollowUpSupervisorName(parsed.followUpSupervisorName ?? "");
      setApplicationExtent(parsed.applicationExtent ?? "");
      setObservedImprovementDetails(parsed.observedImprovementDetails ?? "");
      setSupportNeeded(parsed.supportNeeded ?? "");
      setBarriersComment(parsed.barriersComment ?? "");
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
          trainerName: currentUser?.name ?? "",
          trainerDate: "",
          supervisorName: "",
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
    setFeedbackOpenHours(saved.feedbackOpenHours ?? "24");
    setObjectives(saved.objectives?.length ? saved.objectives : [""]);
    setObservedImprovement(saved.observedImprovement ?? "");
    setTrainingFormats(saved.trainingFormats ?? []);
    setTargetUserGroup(saved.targetUserGroup ?? "");
    setFollowUpSupervisorName(saved.followUpSupervisorName ?? saved.signOff?.supervisorName ?? "");
    setApplicationExtent(saved.applicationExtent ?? "");
    setObservedImprovementDetails(saved.observedImprovementDetails ?? "");
    setSupportNeeded(saved.supportNeeded ?? "");
    setBarriersComment(saved.barriersComment ?? "");
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
      trainerName: saved.signOff?.trainerName ?? currentUser?.name ?? "",
      trainerDate: saved.signOff?.trainerDate ?? "",
      supervisorName: saved.signOff?.supervisorName ?? "",
      supervisorDate: saved.signOff?.supervisorDate ?? ""
    });
    setTraineeRoster(saved.traineeRoster?.length ? saved.traineeRoster : [createEmptyRosterItem()]);
    setRehydratedFromLinkedForm(true);
  }, [userRole, rehydratedFromLinkedForm, draftRestored, linkedForm, currentUser?.name]);

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
      feedbackOpenHours,
      objectives,
      observedImprovement,
      trainingFormats,
      targetUserGroup,
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
      feedbackOpenHours.trim().length > 0 ||
      objectives.some((objective) => objective.trim().length > 0) ||
      observedImprovement !== "" ||
      trainingFormats.length > 0 ||
      targetUserGroup.trim().length > 0 ||
      followUpSupervisorName.trim().length > 0 ||
      applicationExtent.trim().length > 0 ||
      observedImprovementDetails.trim().length > 0 ||
      supportNeeded.trim().length > 0 ||
      barriersComment.trim().length > 0 ||
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
    feedbackOpenHours,
    objectives,
    observedImprovement,
    trainingFormats,
    targetUserGroup,
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
      const namesFromFeedback = submittedFeedback
        .map((entry) => entry.traineeName?.trim() ?? "")
        .filter((name) => name.length > 0);
      if (!namesFromFeedback.length) return prev;

      return namesFromFeedback.map((name) => {
        const existing =
          prev.find((row) => normalizeTraineeKey(row.name) === normalizeTraineeKey(name)) ??
          createEmptyTrainee();
        return { ...existing, name };
      });
    });
  }, [userRole, linkedForm, numberOfTrainees]);

  const updateObjective = (index: number, value: string) => {
    setObjectives((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const toggleTrainingFormat = (value: string, checked: boolean) => {
    setTrainingFormats((prev) => {
      if (checked) return Array.from(new Set([...prev, value]));
      return prev.filter((item) => item !== value);
    });
  };

  const sectionOwnership: Record<SectionKey, "Trainer" | "Trainee" | "Trainer + Trainee"> = {
    A: "Trainer",
    B: "Trainer",
    C: "Trainee",
    D: "Trainer",
    F: "Trainer",
    G: "Trainer"
  };

  const visibleSections = sections.filter((section) => {
    if (section === "B") return false;
    const owner = sectionOwnership[section];
    if (userRole === "trainer") return owner === "Trainer" || owner === "Trainer + Trainee";
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

  const buildTrainerDraft = (): TrainerDraft => ({
    activeSection,
    distributedFormId,
    trainerName,
    trainerDepartment,
    trainingTitle,
    trainingDate,
    trainingDurationDays,
    trainingDurationHours,
    numberOfTrainees,
    feedbackOpenHours,
    objectives,
    observedImprovement,
    trainingFormats,
    targetUserGroup,
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
    trainees,
    commentsVersion: 0
  });

  const buildSubmittedDataSnapshot = (): NonNullable<TrainingForm["submittedData"]> => ({
    trainerName,
    trainerDepartment,
    trainingTitle,
    trainingDate,
    durationDays: trainingDurationDays,
    durationHours: trainingDurationHours,
    numberOfTrainees,
    feedbackOpenHours,
    objectives,
    passRate: autoPassRate || "-",
    averageScoreDisplay: autoAverageScore || "-",
    observedImprovement,
    trainingFormats,
    targetUserGroup,
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
    trainees,
    signatures,
    signOff,
    traineeRoster
  });

  const applyTrainerDraft = (parsed: TrainerDraft) => {
    setDistributedFormId(parsed.distributedFormId ?? null);
    setTrainerName(parsed.trainerName ?? "");
    setTrainerDepartment(parsed.trainerDepartment ?? "");
    setTrainingTitle(parsed.trainingTitle ?? "");
    setTrainingDate(parsed.trainingDate ?? "");
    setTrainingDurationDays(parsed.trainingDurationDays ?? "");
    setTrainingDurationHours(parsed.trainingDurationHours ?? "");
    setNumberOfTrainees(parsed.numberOfTrainees ?? "");
    setFeedbackOpenHours(parsed.feedbackOpenHours ?? "24");
    setObjectives(parsed.objectives?.length ? parsed.objectives : [""]);
    setObservedImprovement(parsed.observedImprovement ?? "");
    setTrainingFormats(parsed.trainingFormats ?? []);
    setTargetUserGroup(parsed.targetUserGroup ?? "");
    setFollowUpSupervisorName(parsed.followUpSupervisorName ?? "");
    setApplicationExtent(parsed.applicationExtent ?? "");
    setObservedImprovementDetails(parsed.observedImprovementDetails ?? "");
    setSupportNeeded(parsed.supportNeeded ?? "");
    setBarriersComment(parsed.barriersComment ?? "");
    setWorkedWellComment(parsed.workedWellComment ?? "");
    setEffectivenessRating(parsed.effectivenessRating ?? "");
    setRecommendationChoice(parsed.recommendationChoice ?? "");
    setTrainerFutureSessionComment(parsed.trainerFutureSessionComment ?? "");
    setSupervisorFutureSessionComment(parsed.supervisorFutureSessionComment ?? "");
    const sig = parsed.signatures;
    setSignatures({
      trainer: sig?.trainer ?? false,
      supervisor: sig?.supervisor ?? false,
      trainerImage: sig?.trainerImage ?? "",
      supervisorImage: sig?.supervisorImage ?? ""
    });
    setSignOff(
      parsed.signOff ?? {
        trainerName: currentUser?.name ?? "",
        trainerDate: "",
        supervisorName: "",
        supervisorDate: ""
      }
    );
    setRatings(parsed.ratings ?? Array(feedbackStatements.length).fill(null));
    setTraineeRoster(parsed.traineeRoster?.length ? parsed.traineeRoster : [createEmptyRosterItem()]);
    setTrainees(parsed.trainees?.length ? parsed.trainees : [createEmptyTrainee()]);
    if (sections.includes(parsed.activeSection)) {
      setActiveSection(parsed.activeSection);
    }
  };

  useEffect(() => {
    if (readOnly || userRole !== "trainer" || loadedRemoteDraft) return;
    const targetId = urlFormId ?? reviewFormId;
    if (!targetId) return;

    const sessionId = Number(targetId.replace(/^F-/, ""));
    if (!Number.isFinite(sessionId) || sessionId <= 0) return;

    let cancelled = false;

    Promise.all([
      getTrainingSession(sessionId),
      getSessionFeedbackEntries(sessionId).catch(() => [] as unknown[])
    ])
      .then(([session, feedbackRaw]) => {
        if (cancelled) return;
        const formId = `F-${session.id}`;
        setDistributedFormId(formId);

        const payload = session.draftPayload ?? (session as { DraftPayload?: string }).DraftPayload;
        if (payload) {
          try {
            applyTrainerDraft(JSON.parse(payload) as TrainerDraft);
          } catch {
            /* fall through to session fields */
          }
        }

        if (!payload) {
          setTrainingTitle(session.title ?? "");
          setTrainerDepartment(session.department ?? "");
          if (session.trainingDate) setTrainingDate(session.trainingDate.slice(0, 10));
          if (session.durationDays != null) setTrainingDurationDays(String(session.durationDays));
          if (session.durationHours != null) setTrainingDurationHours(String(session.durationHours));
          if (session.numberOfTrainees != null) setNumberOfTrainees(String(session.numberOfTrainees));
          const formats = session.trainingFormat ?? (session as { TrainingFormat?: string[] }).TrainingFormat;
          if (formats?.length) setTrainingFormats(formats);
          const audience = session.targetAudience ?? (session as { TargetAudience?: string }).TargetAudience;
          if (audience) setTargetUserGroup(audience);
          const objs = session.objectives ?? (session as { Objectives?: string[] }).Objectives;
          if (objs?.length) setObjectives(objs);
        }

        const statusRaw = session.status ?? (session as { Status?: string }).Status ?? "Draft";
        const uiStatus = toUiStatus(statusRaw);
        const loadedFeedback = mapApiFeedbackEntries(feedbackRaw);
        const existingForm = useAppStore.getState().forms.find((form) => form.id === formId);
        const supervisorOnlyFeedback =
          loadedFeedback.length > 0
            ? loadedFeedback
            : existingForm?.supervisorOnlyFeedback;
        const feedbackResponses = Math.max(
          existingForm?.feedbackResponses ?? 0,
          loadedFeedback.length
        );
        const averageScore =
          loadedFeedback.length > 0
            ? Number(
                (
                  loadedFeedback.reduce((sum, entry) => sum + entry.averageScore, 0) /
                  loadedFeedback.length
                ).toFixed(1)
              )
            : (existingForm?.averageScore ?? 0);

        addForm({
          ...(existingForm ?? {}),
          id: formId,
          title: session.title || existingForm?.title || "Untitled draft",
          trainerId: session.trainerId,
          backendSessionId: session.id,
          assignedSupervisorId:
            session.assignedSupervisorId ?? existingForm?.assignedSupervisorId ?? currentUser?.supervisorId,
          department: session.department || existingForm?.department || currentUser?.department || "",
          date: session.trainingDate?.slice(0, 10) || existingForm?.date || session.createdAt.slice(0, 10),
          trainees: session.numberOfTrainees ?? existingForm?.trainees ?? 0,
          feedbackResponses,
          averageScore,
          status: uiStatus,
          recommendation:
            uiStatus === "Draft"
              ? "Draft — not yet published"
              : uiStatus === "Trainer Assessment Pending" || uiStatus === "Feedback Closed"
                ? "Trainee feedback complete — continue trainer assessment"
                : "Open for trainee feedback",
          createdAt: existingForm?.createdAt ?? session.createdAt.slice(0, 10),
          feedbackClosesAt: session.feedbackClosesAt ?? existingForm?.feedbackClosesAt,
          supervisorOnlyFeedback
        });

        setLoadedRemoteDraft(true);
        setRehydratedFromLinkedForm(true);
        setDraftRestored(true);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [
    addForm,
    currentUser?.department,
    currentUser?.id,
    currentUser?.name,
    currentUser?.supervisorId,
    loadedRemoteDraft,
    readOnly,
    reviewFormId,
    urlFormId,
    userRole
  ]);

  const autosaveSnapshot = useMemo(
    () => JSON.stringify(buildTrainerDraft()),
    [
      activeSection,
      distributedFormId,
      trainerName,
      trainerDepartment,
      trainingTitle,
      trainingDate,
      trainingDurationDays,
      trainingDurationHours,
      numberOfTrainees,
      feedbackOpenHours,
      objectives,
      observedImprovement,
      trainingFormats,
      targetUserGroup,
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
    ]
  );

  const lockedForSupervisorSubmit = useMemo(
    () =>
      linkedForm?.status === "Submitted" ||
      linkedForm?.status === "Under Review" ||
      linkedForm?.status === "Approved" ||
      linkedForm?.status === "Completed",
    [linkedForm?.status]
  );

  const saveDraftToServer = async (silent: boolean): Promise<boolean> => {
    if (readOnly || userRole !== "trainer" || !currentUser?.id) return false;
    if (!hasAnyFormInput()) return false;
    if (lockedForSupervisorSubmit) return false;

    const formIdRef = distributedFormIdRef.current ?? distributedFormId;
    const existingSessionId = formIdRef ? Number(formIdRef.replace(/^F-/, "")) : NaN;
    setIsSavingDraft(true);

    const nextStatus: TrainingForm["status"] =
      linkedForm?.status && linkedForm.status !== "Draft" ? linkedForm.status : "Draft";

    try {
      const result = await saveTrainingSessionDraft({
        SessionId: Number.isFinite(existingSessionId) && existingSessionId > 0 ? existingSessionId : null,
        TrainerId: currentUser.id,
        Title: trainingTitle || "Untitled draft",
        Department: trainerDepartment,
        TrainingDate: trainingDate || undefined,
        DurationDays: Number(trainingDurationDays) || undefined,
        DurationHours: Number(trainingDurationHours) || undefined,
        NumberOfTrainees: Number(numberOfTrainees) || undefined,
        TrainingFormat: trainingFormats,
        TargetAudience: targetUserGroup,
        Objectives: objectives.filter((item) => item.trim().length > 0),
        DraftPayload: autosaveSnapshot
      });

      const formId = `F-${result.sessionId}`;
      setDistributedFormId(formId);
      distributedFormIdRef.current = formId;
      setLastAutoSavedAt(new Date().toLocaleTimeString());

      addForm({
        id: formId,
        title: trainingTitle || "Untitled draft",
        trainerId: currentUser.id,
        backendSessionId: result.sessionId,
        assignedSupervisorId: currentUser.supervisorId,
        department: trainerDepartment || currentUser.department || "",
        date: trainingDate || new Date().toISOString().slice(0, 10),
        trainees: Number(numberOfTrainees) || traineeRoster.length || 0,
        feedbackResponses: linkedForm?.feedbackResponses ?? 0,
        averageScore: linkedForm?.averageScore ?? 0,
        status: nextStatus,
        recommendation:
          nextStatus === "Draft"
            ? "Draft — not yet published"
            : linkedForm?.recommendation ?? "Open for trainee feedback",
        createdAt: linkedForm?.createdAt ?? new Date().toISOString().slice(0, 10),
        feedbackClosesAt: linkedForm?.feedbackClosesAt,
        submittedData: buildSubmittedDataSnapshot()
      });

      if (!silent) {
        setSubmitModal({
          open: true,
          kind: "success",
          title: "Draft Saved",
          message: `Draft saved (${formId}). You can continue editing or publish when ready from My Drafts.`
        });
      }
      return true;
    } catch {
      if (!silent) {
        setSubmitModal({
          open: true,
          kind: "error",
          title: "Save Failed",
          message: "Could not save draft to the server. Check your connection and try again."
        });
      }
      return false;
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!currentUser?.id) {
      setSubmitModal({
        open: true,
        kind: "error",
        title: "Login Required",
        message: "Please sign in again before saving a draft."
      });
      return;
    }

    if (!hasAnyFormInput()) {
      setSubmitModal({
        open: true,
        kind: "error",
        title: "Nothing To Save",
        message: "Add at least one field before saving a draft."
      });
      return;
    }

    await saveDraftToServer(false);
  };

  useEffect(() => {
    if (readOnly || userRole !== "trainer" || lockedForSupervisorSubmit) return;
    if (!autosaveBootstrapped.current) return;

    const timer = window.setTimeout(() => {
      if (isSavingDraft) return;
      void saveDraftToServer(true);
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [autosaveSnapshot, readOnly, userRole, lockedForSupervisorSubmit, isSavingDraft, currentUser?.id]);

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

    const openHours = Number(feedbackOpenHours);
    if (!Number.isFinite(openHours) || openHours <= 0) {
      setSubmitModal({
        open: true,
        kind: "error",
        title: "Set Feedback Time",
        message: "Please set how many hours the assessment should stay open for trainee feedback."
      });
      return;
    }

    if (!currentUser?.id) {
      setSubmitModal({
        open: true,
        kind: "error",
        title: "Login Required",
        message: "Please sign in again before publishing."
      });
      return;
    }

    let formId = distributedFormId ?? "";
    let sessionId = formId ? Number(formId.replace(/^F-/, "")) : NaN;

    try {
      if (!Number.isFinite(sessionId) || sessionId <= 0) {
        const saved = await saveTrainingSessionDraft({
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
          DraftPayload: JSON.stringify(buildTrainerDraft())
        });
        sessionId = saved.sessionId;
        formId = `F-${sessionId}`;
        setDistributedFormId(formId);
      } else {
        await saveTrainingSessionDraft({
          SessionId: sessionId,
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
          DraftPayload: JSON.stringify(buildTrainerDraft())
        });
      }

      await publishTrainingSession(sessionId, {
        TrainerId: currentUser.id,
        FeedbackOpenHours: openHours
      });
    } catch {
      setSubmitModal({
        open: true,
        kind: "error",
        title: "Publish Failed",
        message: "Could not publish this assessment. Save a draft first, complete Section A and objectives, then try again."
      });
      return;
    }

    const feedbackClosesAt = new Date(Date.now() + openHours * 60 * 60 * 1000).toISOString();

    addForm({
      id: formId,
      title: trainingTitle || "Training Assessment",
      trainerId: currentUser.id,
      backendSessionId: sessionId,
      assignedSupervisorId: currentUser?.supervisorId,
      department: trainerDepartment || currentUser?.department || "",
      date: trainingDate || new Date().toISOString().slice(0, 10),
      trainees: Number(numberOfTrainees) || traineeRoster.length || 0,
      feedbackResponses: 0,
      averageScore: 0,
      status: "Waiting for Feedback",
      recommendation: "Open for trainee feedback",
      createdAt: new Date().toISOString().slice(0, 10),
      feedbackClosesAt,
      submittedData: {
        ...buildSubmittedDataSnapshot(),
        feedbackClosesAt
      }
    });

    await saveTrainingSessionDraft({
      SessionId: sessionId,
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
      DraftPayload: JSON.stringify(buildTrainerDraft())
    });

    navigate(`/trainer/create?formId=${encodeURIComponent(formId)}&section=D`);
  };

  const handleSubmit = async () => {
    if (readOnly && userRole !== "supervisor") return;

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
      if (!currentUser?.supervisorId) {
        setSubmitModal({
          open: true,
          kind: "error",
          title: "Supervisor Not Assigned",
          message: "Your profile has no assigned supervisor. Please contact admin before submitting."
        });
        return;
      }

      if (isDraftForm) {
        setSubmitModal({
          open: true,
          kind: "error",
          title: "Publish First",
          message: "Publish this assessment and collect trainee feedback before submitting to your supervisor."
        });
        return;
      }

      let trainingSessionId: number | null = null;
      let trainerReportId: number | null = null;
      const formSnapshot = JSON.stringify(buildTrainerDraft());

      try {
        const existingSessionId = distributedFormId ? Number(distributedFormId.replace(/^F-/, "")) : NaN;
        if (!Number.isFinite(existingSessionId) || existingSessionId <= 0) {
          throw new Error("Missing session");
        }
        trainingSessionId = existingSessionId;

        const report = await saveTrainerReport({
          TrainingSessionId: trainingSessionId,
          FormSnapshot: formSnapshot,
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
          Comments: barriersComment || null,
          WhatWorkedWell: workedWellComment,
          Improvements: trainerFutureSessionComment,
          TrainerComment: trainerFutureSessionComment,
          SupervisorComment: supervisorFutureSessionComment || null,
          EffectivenessRating: effectivenessRating,
          Recommendation: recommendationChoice,
          TrainerName: trainerName || currentUser?.name || currentUser?.email || "Trainer",
          TrainerSignature: signatures.trainerImage || (signatures.trainer ? "Signed" : "")
        });
        trainerReportId = report.id;
        await submitTrainerReport(trainerReportId, formSnapshot);
      } catch (error) {
        setSubmitModal({
          open: true,
          kind: "error",
          title: "Submission Failed",
          message: "Unable to save the training session to the backend. Please check your connection and try again."
        });
        return;
      }

      const newFormId = distributedFormId ?? (trainingSessionId ? `F-${trainingSessionId}` : `F-${Date.now()}`);
      const existingForm = forms.find((form) => form.id === newFormId);
      const feedbackClosesAt =
        existingForm?.feedbackClosesAt ??
        (Number(feedbackOpenHours) > 0
          ? new Date(Date.now() + Number(feedbackOpenHours) * 60 * 60 * 1000).toISOString()
          : undefined);
      const computedAverageScore = Number(
        (
          ratings.filter((score): score is number => score !== null).reduce((sum, score) => sum + score, 0) /
          Math.max(
            1,
            ratings.filter((score): score is number => score !== null).length
          )
        ).toFixed(1)
      );

      addForm({
        id: newFormId,
        title: trainingTitle || "Training Assessment",
        trainerId: currentUser.id,
        backendSessionId: existingForm?.backendSessionId ?? trainingSessionId ?? undefined,
        assignedSupervisorId: existingForm?.assignedSupervisorId ?? currentUser.supervisorId,
        department: trainerDepartment || currentUser?.department || "",
        date: trainingDate || new Date().toISOString().slice(0, 10),
        trainees: Number(numberOfTrainees) || traineeRoster.length || 0,
        feedbackResponses: existingForm?.feedbackResponses ?? 0,
        averageScore:
          existingForm && existingForm.feedbackResponses > 0
            ? existingForm.averageScore
            : computedAverageScore,
        // Once trainer submits, it becomes an actual submission.
        status: "Submitted",
        recommendation: "Pending supervisor review",
        createdAt: existingForm?.createdAt ?? new Date().toISOString().slice(0, 10),
        feedbackClosesAt,
        submittedAt: new Date().toISOString().slice(0, 10),
        submittedData: {
          trainerName,
          trainerDepartment,
          trainingTitle,
          trainingDate,
          durationDays: trainingDurationDays,
          durationHours: trainingDurationHours,
          numberOfTrainees,
          feedbackOpenHours,
          feedbackClosesAt,
          objectives,
          passRate: autoPassRate || "-",
          averageScoreDisplay: autoAverageScore || "-",
          observedImprovement,
          trainingFormats,
          targetUserGroup,
          followUpSupervisorName,
          perStatementAverages:
            (existingForm?.supervisorOnlyFeedback?.length ?? 0) > 0
              ? statementAveragesFromFeedback
              : ratings.map((score) => (typeof score === "number" ? Number(score.toFixed(2)) : 0)),
          applicationExtent,
          observedImprovementDetails,
          supportNeeded,
          barriersComment,
          workedWellComment,
          effectivenessRating,
          recommendationChoice,
          trainerFutureSessionComment,
          supervisorFutureSessionComment,
          trainees,
          signatures,
          signOff,
          traineeRoster
        },
        supervisorOnlyFeedback: existingForm?.supervisorOnlyFeedback
      });
      setDistributedFormId(newFormId);
      setSubmitModal({
        open: true,
        kind: "success",
        title: "Submitted To Supervisor",
        message: `Submitted successfully. This form was sent to ${assignedSupervisor?.name || assignedSupervisor?.email || "your assigned supervisor"}. Trainee link: /trainee-feedback?formId=${newFormId}`
      });

      setActiveSection("A");
      setDistributedFormId(null);
      setTrainerName(currentUser?.name ?? "");
      setTrainerDepartment(currentUser?.department ?? "");
      setTrainingTitle("");
      setTrainingDate("");
      setTrainingDurationDays("");
      setTrainingDurationHours("");
      setNumberOfTrainees("");
      setFeedbackOpenHours("24");
      setObjectives([""]);
      setObservedImprovement("");
      setTrainingFormats([]);
      setTargetUserGroup("");
      setFollowUpSupervisorName("");
      setApplicationExtent("");
      setObservedImprovementDetails("");
      setSupportNeeded("");
      setBarriersComment("");
      setWorkedWellComment("");
      setEffectivenessRating("");
      setRecommendationChoice("");
      setTrainerFutureSessionComment("");
      setSupervisorFutureSessionComment("");
      setRatings(Array(feedbackStatements.length).fill(null));
      setTraineeRoster([createEmptyRosterItem()]);
      setTrainees([createEmptyTrainee()]);
      setSignatures({ trainer: false, supervisor: false, trainerImage: "", supervisorImage: "" });
      setSignOff({
        trainerName: currentUser?.name ?? "",
        trainerDate: "",
        supervisorName: "",
        supervisorDate: ""
      });
      setDraftRestored(false);
      setShowDraftToast(false);
      setRehydratedFromLinkedForm(false);

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
      const reviewerName = currentUser?.name || currentUser?.email || "Supervisor";
      submitSupervisorReview({
        formId: linkedForm.id,
        decision: "Approve",
        comments: supervisorFutureSessionComment.trim() || "Approved by supervisor.",
        actionItems: [],
        sectionFeedback: [],
        reviewerName
      });
      addForm({
        ...linkedForm,
        status: "Approved",
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
          followUpSupervisorName,
          perStatementAverages:
            (linkedForm?.supervisorOnlyFeedback?.length ?? 0) > 0
              ? statementAveragesFromFeedback
              : ratings.map((score) => (typeof score === "number" ? Number(score.toFixed(2)) : 0)),
          applicationExtent,
          observedImprovementDetails,
          supportNeeded,
          barriersComment,
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

  const handleReturnForChanges = () => {
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
    const reviewerName = currentUser?.name || currentUser?.email || "Supervisor";
    const ok = submitSupervisorReview({
      formId: linkedForm.id,
      decision: "Needs Changes",
      comments: reason,
      actionItems: [],
      sectionFeedback: [],
      reviewerName
    });
    if (!ok) {
      setSupervisorActionError("Unable to return form. Please add a clear reason and try again.");
      return;
    }
    addForm({
      ...linkedForm,
      status: "Needs Correction",
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
        followUpSupervisorName,
        perStatementAverages:
          (linkedForm?.supervisorOnlyFeedback?.length ?? 0) > 0
            ? statementAveragesFromFeedback
            : ratings.map((score) => (typeof score === "number" ? Number(score.toFixed(2)) : 0)),
        applicationExtent,
        observedImprovementDetails,
        supportNeeded,
        barriersComment,
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
              <div className="absolute right-5 top-5 flex flex-col items-end gap-2">
                {isDraftForm ? (
                  <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
                    Draft — not published
                  </span>
                ) : isTraineeFeedbackComplete ? (
                  <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-900">
                    Trainer Assessment Pending
                  </span>
                ) : isPublishedForFeedback ? (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-800">
                    Published — feedback open
                  </span>
                ) : null}
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

            {!isSupervisorReviewMode && lastAutoSavedAt ? (
              <p className="mt-3 text-center text-xs text-slate-500">
                {isSavingDraft ? "Saving…" : `Auto-saved ${lastAutoSavedAt}`}
              </p>
            ) : null}
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

        {isSupervisorReviewMode ? (
          <div className="mb-5 space-y-3">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-panel">
              Supervisor review mode: trainer-submitted sections are shown for assessment and approval.
            </div>
            <div
              className={`rounded-xl border px-4 py-3 text-sm shadow-panel ${
                submissionIntegrity.complete
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-rose-200 bg-rose-50 text-rose-800"
              }`}
            >
              <p className="font-semibold">
                Submission Integrity Check: {submissionIntegrity.complete ? "Complete" : "Incomplete"}
              </p>
              {submissionIntegrity.complete ? (
                <p className="mt-1 text-xs">All required sections (A, trainee feedback, D, F, G) have captured data.</p>
              ) : (
                <div className="mt-1">
                  <p className="text-xs">Missing or empty sections:</p>
                  <ul className="mt-1 list-disc pl-4 text-xs">
                    {submissionIntegrity.missing.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {userRole === "trainer" && isTraineeFeedbackComplete && !isSupervisorReviewMode ? (
          <div className="mb-5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 shadow-panel">
            Trainee feedback is complete. Continue the trainer assessment (sections D, F, and G), then submit to your
            supervisor.
          </div>
        ) : null}

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
                    <CheckboxLine
                      key={item}
                      label={item}
                      checked={trainingFormats.includes(item)}
                      disabled={isSupervisorReviewMode}
                      onChange={(checked) => toggleTrainingFormat(item, checked)}
                    />
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <TextInput
                  label="Target User Group (e.g., system users, operators, managers)"
                  value={targetUserGroup}
                  onChange={setTargetUserGroup}
                  readOnly={isSupervisorReviewMode}
                />
              </div>

              {!isSupervisorReviewMode ? (
                <div className="md:col-span-2 rounded-xl border border-brand-line bg-slate-50 p-4">
                  {isPublishedForFeedback && effectiveDistributedFormId ? (
                    <>
                      <p className="text-sm font-semibold text-brand-ink">Trainee feedback is open</p>
                      <p className="mt-1 text-xs text-slate-600">
                        Get the QR code and link from <strong>My Assessments</strong>, then continue from Section D
                        below.
                      </p>
                      <Link
                        to="/trainer/submissions"
                        className="mt-3 inline-flex rounded-lg border border-brand-ruby bg-white px-4 py-2 text-sm font-semibold text-brand-ruby transition hover:bg-red-50"
                      >
                        My Assessments — QR &amp; link
                      </Link>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-brand-ink">Before publishing</p>
                      <p className="mt-1 text-xs text-slate-600">
                        Set how long trainees can submit feedback. After publishing you will continue at Section D; share
                        the QR from My Assessments.
                      </p>
                      <div className="mt-3 grid gap-3 md:max-w-xs">
                        <TextInput
                          label="Open for feedback (hours)"
                          type="number"
                          min={1}
                          placeholder="e.g. 24"
                          value={feedbackOpenHours}
                          onChange={setFeedbackOpenHours}
                        />
                      </div>
                      <p className="mt-2 text-xs font-medium text-slate-500">
                        {isSectionABComplete
                          ? "Use Publish & open feedback (bottom of Section A) when ready."
                          : "Complete required Section A + objectives before publishing."}
                      </p>
                    </>
                  )}
                </div>
              ) : null}
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
                    <p className="mt-1 text-[11px] text-slate-500">Rows marked as submitted are locked and cannot be removed.</p>
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
                      {traineeRoster.map((item, index) => {
                        const rowSubmitted = submittedTraineeNameSet.has(normalizeTraineeKey(item.name));
                        return (
                        <tr key={`roster-${index}`} className="odd:bg-white even:bg-slate-50">
                          <td className={tableCell}>
                            <input
                              type="text"
                              value={item.name}
                              readOnly={rowSubmitted}
                              placeholder={`Trainee ${index + 1}`}
                              onChange={(event) => {
                                const value = event.target.value;
                                setTraineeRoster((prev) => {
                                  const next = [...prev];
                                  next[index] = { ...next[index], name: value };
                                  return next;
                                });
                              }}
                              className={`w-full rounded-lg border border-brand-line px-2 py-1.5 text-sm ${rowSubmitted ? "bg-slate-100 text-slate-500" : ""}`}
                            />
                          </td>
                          <td className={tableCell}>
                            <input
                              type="text"
                              value={item.departmentOrRole}
                              readOnly={rowSubmitted}
                              placeholder="e.g. Operations"
                              onChange={(event) => {
                                const value = event.target.value;
                                setTraineeRoster((prev) => {
                                  const next = [...prev];
                                  next[index] = { ...next[index], departmentOrRole: value };
                                  return next;
                                });
                              }}
                              className={`w-full rounded-lg border border-brand-line px-2 py-1.5 text-sm ${rowSubmitted ? "bg-slate-100 text-slate-500" : ""}`}
                            />
                          </td>
                          <td className={`${tableCell} text-center`}>
                            <YesNoGroup
                              name={`attendance-${index}`}
                              value={item.attendance}
                              disabled={rowSubmitted}
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
                            {rowSubmitted ? (
                              <span className="mr-2 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                Submitted
                              </span>
                            ) : null}
                            <button
                              type="button"
                              disabled={traineeRoster.length === 1 || rowSubmitted}
                              onClick={() =>
                                setTraineeRoster((prev) => prev.filter((_, rowIndex) => rowIndex !== index))
                              }
                              className="text-xs font-medium text-slate-500 transition hover:text-brand-ruby disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      )})}
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
            {statementAveragesForDisplay.length === feedbackStatements.length ? (
              <div className="mt-4 rounded-xl border border-brand-line bg-slate-50 p-4">
                <p className="mb-2 text-sm font-semibold text-brand-ink">Per-statement Aggregate (out of 5)</p>
                <div className="space-y-1.5">
                  {feedbackStatements.map((statement, index) => (
                    <div key={`agg-${index}`} className="flex items-start justify-between gap-3">
                      <p className="text-xs text-slate-700">{statement}</p>
                      <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-800">
                        {statementAveragesForDisplay[index].toFixed(2)} / 5
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {isSupervisorReviewMode ? (
              <div className="mt-5 rounded-xl border border-brand-line bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-brand-ink">Trainee Comments (Supervisor View)</h3>
                  <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                    {linkedForm?.supervisorOnlyFeedback?.length ?? 0}
                  </span>
                </div>
                {(linkedForm?.supervisorOnlyFeedback?.length ?? 0) === 0 ? (
                  <p className="text-sm text-slate-600">No trainee comments submitted yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {linkedForm?.supervisorOnlyFeedback?.map((entry, index) => (
                      <article
                        key={`${entry.traineeName || "trainee"}-${entry.employeeId || "no-id"}-${index}`}
                        className="rounded-lg border border-slate-200 bg-white p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">
                            {entry.traineeName?.trim() ? entry.traineeName.trim() : "Anonymous trainee"}
                          </p>
                          <p className="text-xs text-slate-500">{entry.feedbackDate || "No date"}</p>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {entry.employeeId?.trim() ? entry.employeeId.trim() : "No employee ID"} • {entry.departmentRole?.trim() ? entry.departmentRole.trim() : "No department/role"}
                        </p>
                        <p className="mt-2 text-sm text-slate-700">
                          {entry.comment?.trim().length ? entry.comment.trim() : "No comment provided."}
                        </p>
                        <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-2.5">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                            Full Statement Ratings
                          </p>
                          <div className="space-y-1.5">
                            {feedbackStatements.map((statement, statementIndex) => {
                              const ratingValue = entry.statementRatings?.[statementIndex];
                              return (
                                <div
                                  key={`${entry.traineeName || "trainee"}-${statementIndex}`}
                                  className="flex items-start justify-between gap-3"
                                >
                                  <p className="text-xs text-slate-700">{statement}</p>
                                  <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-800">
                                    {typeof ratingValue === "number" ? `${ratingValue}/5` : "N/A"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <p className="mt-2 text-xs font-semibold text-slate-600">
                          Score: {entry.averageScore?.toFixed?.(1) ?? entry.averageScore ?? 0} / 5
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </Card>
          ) : null}

          {activeSection === "D" && visibleSections.includes("D") ? (
          <Card section="D" title="Knowledge / Skills Check + Workplace Follow-up" owner="Trainer" disabled={isSupervisorReviewMode}>
            <p className="mb-3 text-sm text-slate-600">
              Complete after training, based on observation, Q&A, or practical test. Trainee names are filled in from
              Section C feedback.
            </p>

            {/* Desktop table view */}
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full border-collapse rounded-lg border border-brand-line text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className={`${tableCell} sticky top-0 z-10 bg-slate-100 text-left`}>Trainee Name</th>
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
                    const nameFromFeedback = submittedTraineeNameSet.has(normalizeTraineeKey(trainee.name));

                    return (
                      <tr key={`trainee-${index}`} className="odd:bg-white even:bg-slate-50">
                        <td className={tableCell}>
                          <input
                            type="text"
                            value={trainee.name}
                            readOnly={nameFromFeedback}
                            placeholder={`Trainee ${index + 1}`}
                            onChange={(event) => {
                              const value = event.target.value;
                              setTrainees((prev) => {
                                const next = [...prev];
                                next[index] = { ...next[index], name: value };
                                return next;
                              });
                            }}
                            className={`w-full rounded-lg border border-brand-line px-2 py-1.5 text-sm ${nameFromFeedback ? "bg-slate-100 text-slate-700" : ""}`}
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
                          {!nameFromFeedback && trainees.length > 1 ? (
                            <button
                              type="button"
                              onClick={() =>
                                setTrainees((prev) => prev.filter((_, traineeIndex) => traineeIndex !== index))
                              }
                              className="text-xs font-medium text-slate-500 transition hover:text-brand-ruby"
                            >
                              Remove
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
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
                const nameFromFeedback = submittedTraineeNameSet.has(normalizeTraineeKey(trainee.name));

                return (
                  <div key={`trainee-mobile-${index}`} className="rounded-lg border border-brand-line bg-white p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold text-brand-ink">
                        {trainee.name.trim() || `Trainee ${index + 1}`}
                      </p>
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
                        readOnly={nameFromFeedback}
                        placeholder={`Trainee ${index + 1}`}
                        onChange={(event) => {
                          const value = event.target.value;
                          setTrainees((prev) => {
                            const next = [...prev];
                            next[index] = { ...next[index], name: value };
                            return next;
                          });
                        }}
                        className={`w-full rounded-lg border border-brand-line px-2 py-1.5 text-sm ${nameFromFeedback ? "bg-slate-100 text-slate-700" : ""}`}
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
                      {!nameFromFeedback && trainees.length > 1 ? (
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

            <div className="my-6 h-px bg-slate-200" />
            <p className="mb-3 text-sm font-semibold text-brand-ruby">
              Workplace Application & Follow-up
            </p>
            <p className="mb-3 text-sm text-slate-600">
              To be completed by trainer with input from supervisor/line manager, 2-4 weeks post-training.
            </p>
            <div className="space-y-5">
              <TextInput
                label="Supervisor Name"
                value={followUpSupervisorName}
                onChange={setFollowUpSupervisorName}
                readOnly={isSupervisorReviewMode}
              />
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">To what extent have trainees applied the skills in the workplace?</p>
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
                <p className="mb-2 text-sm font-medium text-slate-700">Additional support or refresher training needed?</p>
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

              <TextArea
                label="Comments / barriers to application (e.g., time, resources, supervision)"
                rows={4}
                value={barriersComment}
                onChange={setBarriersComment}
                readOnly={isSupervisorReviewMode}
              />
            </div>
          </Card>
          ) : null}

          {activeSection === "F" && visibleSections.includes("F") ? (
          <Card section="F" title="Overall Trainer Reflection & Improvement" owner="Trainer" disabled={false}>
            <div className="space-y-4">
              <TextArea
                label="What worked well in this training?"
                rows={3}
                value={workedWellComment}
                onChange={setWorkedWellComment}
                readOnly={isSupervisorReviewMode}
              />
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-700">What would you change for future sessions?</p>
                <label className="block text-sm font-medium text-slate-700">
                  Trainer comment
                  <textarea
                    rows={3}
                    value={trainerFutureSessionComment}
                    onChange={(event) => setTrainerFutureSessionComment(event.target.value)}
                    readOnly={userRole === "supervisor"}
                    placeholder="Trainer input for future sessions"
                    className={`mt-2 w-full rounded-lg border border-brand-line px-3 py-2.5 text-sm outline-none transition focus:border-brand-ruby focus:ring-2 focus:ring-red-100 ${
                      userRole === "supervisor" ? "bg-slate-100 text-slate-500" : "bg-white"
                    }`}
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Supervisor comment
                  <textarea
                    rows={3}
                    value={supervisorFutureSessionComment}
                    onChange={(event) => setSupervisorFutureSessionComment(event.target.value)}
                    readOnly={userRole === "trainer"}
                    placeholder={userRole === "trainer" ? "Supervisor will complete this field" : "Supervisor input for future sessions"}
                    className={`mt-2 w-full rounded-lg border border-brand-line px-3 py-2.5 text-sm outline-none transition focus:border-brand-ruby focus:ring-2 focus:ring-red-100 ${
                      userRole === "trainer" ? "bg-slate-100 text-slate-500" : "bg-white"
                    }`}
                  />
                </label>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Training effectiveness rating (overall)</p>
                <div className="flex flex-wrap gap-4">
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
                <p className="mb-2 text-sm font-medium text-slate-700">Recommendation</p>
                <div className="flex flex-wrap gap-4">
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
                          onChange={(event) =>
                            setSignOff((prev) => ({
                              ...prev,
                              [key === "trainer" ? "trainerName" : "supervisorName"]: event.target.value
                            }))
                          }
                          readOnly={rowReadOnly}
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
              {!isSupervisorReviewMode && !assignedSupervisor ? (
                <p className="text-xs font-medium text-rose-700">
                  No supervisor assigned. Contact admin before submitting.
                </p>
              ) : null}
              <div className="flex flex-wrap items-center justify-end gap-2">
              {userRole === "trainer" && !readOnly ? (
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-ruby hover:text-brand-ruby disabled:opacity-60"
                >
                  {isSavingDraft ? "Saving…" : "Save draft"}
                </button>
              ) : null}
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
                    ? "Submit To Supervisor"
                    : userRole === "supervisor"
                      ? "Approve Submission"
                      : "Submit Feedback"}
                </button>
              ) : userRole === "trainer" && activeSection === "A" && (!distributedFormId || isDraftForm) && !isPublishedForFeedback ? (
                <button
                  type="button"
                  onClick={handleDistributeTraineeQr}
                  disabled={!isSectionABComplete}
                  className="rounded-lg border border-slate-700 bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-300"
                >
                  Publish &amp; open feedback
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goToNextSection}
                  className="rounded-lg border border-slate-700 bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Next
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







