import type { Status } from "../types";

// Keep workflow status groups in one place so filters stay consistent across pages.
export const REVIEW_QUEUE_STATUSES: Status[] = ["Submitted", "Under Review", "Needs Correction"];
export const TRAINER_DRAFT_STATUSES: Status[] = ["Draft"];
export const TRAINER_SUBMISSION_STATUSES: Status[] = ["Submitted", "Under Review", "Approved", "Completed"];
export const TRAINER_PUBLISHED_STATUSES: Status[] = [
  "Waiting for Feedback",
  "Feedback Closed",
  "Trainer Assessment Pending",
  "Follow-up Pending",
  ...TRAINER_SUBMISSION_STATUSES
];

/** Trainer can continue sections D–G after trainee feedback. */
export const TRAINER_CONTINUE_ASSESSMENT_STATUSES: Status[] = [
  "Waiting for Feedback",
  "Feedback Closed",
  "Trainer Assessment Pending"
];
/** Published and in-progress assessments (excludes drafts). */
export const TRAINER_MY_ASSESSMENTS_STATUSES: Status[] = TRAINER_PUBLISHED_STATUSES;
export const SUPERVISOR_ARCHIVE_STATUSES: Status[] = ["Approved", "Needs Correction"];

export function isInStatuses(status: Status, statuses: readonly Status[]) {
  return statuses.includes(status);
}

