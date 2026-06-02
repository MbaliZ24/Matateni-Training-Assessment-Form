import type { Status } from "../types";

// Keep workflow status groups in one place so filters stay consistent across pages.
export const REVIEW_QUEUE_STATUSES: Status[] = ["Submitted", "Under Review", "Needs Correction"];
export const TRAINER_SUBMISSION_STATUSES: Status[] = ["Draft", "Submitted", "Under Review", "Approved", "Completed"];
export const SUPERVISOR_ARCHIVE_STATUSES: Status[] = ["Approved", "Needs Correction"];

export function isInStatuses(status: Status, statuses: readonly Status[]) {
  return statuses.includes(status);
}
