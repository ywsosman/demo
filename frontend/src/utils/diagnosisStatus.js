/** MediDiagnose FSM labels (paper Section V-A) */
export const SESSION_STATUS = {
  SUBMITTED: 'SUBMITTED',
  AI_PROCESSED: 'AI_PROCESSED',
  PENDING_DOCTOR_REVIEW: 'PENDING_DOCTOR_REVIEW',
  IN_REVIEW: 'IN_REVIEW',
  NEEDS_MORE_INFO: 'NEEDS_MORE_INFO',
  REVIEWED: 'REVIEWED',
  SOFT_DELETED: 'SOFT_DELETED'
};

const LEGACY = {
  pending: SESSION_STATUS.PENDING_DOCTOR_REVIEW,
  reviewed: SESSION_STATUS.REVIEWED,
  closed: SESSION_STATUS.SOFT_DELETED
};

export function normalizeStatus(status) {
  if (!status) return SESSION_STATUS.SUBMITTED;
  return LEGACY[status] || status;
}

export function statusLabel(status) {
  const s = normalizeStatus(status);
  const labels = {
    [SESSION_STATUS.SUBMITTED]: 'Submitted',
    [SESSION_STATUS.AI_PROCESSED]: 'AI processed',
    [SESSION_STATUS.PENDING_DOCTOR_REVIEW]: 'Pending review',
    [SESSION_STATUS.IN_REVIEW]: 'In review',
    [SESSION_STATUS.NEEDS_MORE_INFO]: 'Needs more info',
    [SESSION_STATUS.REVIEWED]: 'Reviewed',
    [SESSION_STATUS.SOFT_DELETED]: 'Archived'
  };
  return labels[s] || s;
}

export function statusColorClass(status) {
  const s = normalizeStatus(status);
  switch (s) {
    case SESSION_STATUS.SUBMITTED:
    case SESSION_STATUS.PENDING_DOCTOR_REVIEW:
    case SESSION_STATUS.AI_PROCESSED:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
    case SESSION_STATUS.IN_REVIEW:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
    case SESSION_STATUS.NEEDS_MORE_INFO:
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200';
    case SESSION_STATUS.REVIEWED:
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
    case SESSION_STATUS.SOFT_DELETED:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function isPendingForPatient(status) {
  const s = normalizeStatus(status);
  return [
    SESSION_STATUS.SUBMITTED,
    SESSION_STATUS.AI_PROCESSED,
    SESSION_STATUS.PENDING_DOCTOR_REVIEW,
    SESSION_STATUS.IN_REVIEW,
    SESSION_STATUS.NEEDS_MORE_INFO
  ].includes(s);
}

export function isAwaitingDoctor(status) {
  const s = normalizeStatus(status);
  return [
    SESSION_STATUS.PENDING_DOCTOR_REVIEW,
    SESSION_STATUS.NEEDS_MORE_INFO
  ].includes(s);
}

export function isReviewed(status) {
  return normalizeStatus(status) === SESSION_STATUS.REVIEWED;
}
