import type { Status } from "../types";

// Keep backend-aligned workflow statuses in one place so filtering and labels stay consistent.
export const REVIEW_QUEUE_STATUSES: Status[] = ["TRAINERASSESSMENTPENDING"];
export const TRAINER_SUBMISSION_STATUSES: Status[] = [
  "DRAFT",
  "OPENFORFEEDBACK",
  "FEEDBACKCLOSED",
  "FOLLOWUPPENDING",
  "TRAINERASSESSMENTPENDING",
  "COMPLETED"
];
export const SUPERVISOR_ARCHIVE_STATUSES: Status[] = ["COMPLETED", "FOLLOWUPPENDING"];

export function isInStatuses(status: Status, statuses: readonly Status[]) {
  return statuses.includes(status);
}

export function statusLabel(status: Status) {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "OPENFORFEEDBACK":
      return "Open for Feedback";
    case "FEEDBACKCLOSED":
      return "Feedback Closed";
    case "TRAINERASSESSMENTPENDING":
      return "Pending Supervisor Review";
    case "FOLLOWUPPENDING":
      return "Returned for Follow-Up";
    case "COMPLETED":
      return "Completed";
    default:
      return status;
  }
}

export function normalizeStatus(status: string | undefined): Status {
  switch (status) {
    case "Draft":
    case "DRAFT":
      return "DRAFT";
    case "Waiting for Feedback":
    case "OPENFORFEEDBACK":
      return "OPENFORFEEDBACK";
    case "FEEDBACKCLOSED":
      return "FEEDBACKCLOSED";
    case "Submitted":
    case "Under Review":
    case "TRAINERASSESSMENTPENDING":
      return "TRAINERASSESSMENTPENDING";
    case "Needs Correction":
    case "FOLLOWUPPENDING":
      return "FOLLOWUPPENDING";
    case "Approved":
    case "Completed":
    case "COMPLETED":
      return "COMPLETED";
    default:
      return "DRAFT";
  }
}
