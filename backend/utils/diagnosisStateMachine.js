

const STATES = {
  SUBMITTED: 'SUBMITTED',
  AI_PROCESSED: 'AI_PROCESSED',
  PENDING_DOCTOR_REVIEW: 'PENDING_DOCTOR_REVIEW',
  IN_REVIEW: 'IN_REVIEW',
  NEEDS_MORE_INFO: 'NEEDS_MORE_INFO',
  REVIEWED: 'REVIEWED',
  SOFT_DELETED: 'SOFT_DELETED'
};


const LEGACY_MAP = {
  pending: STATES.PENDING_DOCTOR_REVIEW,
  reviewed: STATES.REVIEWED,
  closed: STATES.SOFT_DELETED
};

const TRANSITIONS = {
  [STATES.SUBMITTED]: [STATES.AI_PROCESSED, STATES.SOFT_DELETED],
  [STATES.AI_PROCESSED]: [STATES.PENDING_DOCTOR_REVIEW, STATES.SOFT_DELETED],
  [STATES.PENDING_DOCTOR_REVIEW]: [STATES.IN_REVIEW, STATES.SOFT_DELETED],
  [STATES.IN_REVIEW]: [STATES.NEEDS_MORE_INFO, STATES.REVIEWED, STATES.PENDING_DOCTOR_REVIEW, STATES.SOFT_DELETED],
  [STATES.NEEDS_MORE_INFO]: [STATES.PENDING_DOCTOR_REVIEW, STATES.IN_REVIEW, STATES.SOFT_DELETED],
  [STATES.REVIEWED]: [STATES.SOFT_DELETED],
  [STATES.SOFT_DELETED]: []
};

function normalizeStatus(status) {
  if (!status) return STATES.SUBMITTED;
  if (LEGACY_MAP[status]) return LEGACY_MAP[status];
  if (Object.values(STATES).includes(status)) return status;
  return status;
}

function canTransition(fromStatus, toStatus) {
  const from = normalizeStatus(fromStatus);
  const to = normalizeStatus(toStatus);
  const allowed = TRANSITIONS[from] || [];
  return allowed.includes(to);
}

function assertTransition(fromStatus, toStatus) {
  const from = normalizeStatus(fromStatus);
  const to = normalizeStatus(toStatus);
  if (!canTransition(from, to)) {
    return {
      ok: false,
      code: 400,
      message: `Invalid state transition: ${from} → ${to}`
    };
  }
  return { ok: true, from, to };
}


function isDoctorQueueStatus(status) {
  const s = normalizeStatus(status);
  return [
    STATES.PENDING_DOCTOR_REVIEW,
    STATES.IN_REVIEW,
    STATES.NEEDS_MORE_INFO
  ].includes(s);
}

function isTerminalForPatient(status) {
  const s = normalizeStatus(status);
  return [STATES.REVIEWED, STATES.SOFT_DELETED].includes(s);
}

const LOCK_DURATION_MS = 24 * 60 * 60 * 1000;

module.exports = {
  STATES,
  LEGACY_MAP,
  LOCK_DURATION_MS,
  normalizeStatus,
  canTransition,
  assertTransition,
  isDoctorQueueStatus,
  isTerminalForPatient
};
