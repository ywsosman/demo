function titleCase(str) {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatSymptomToken(token) {
  const trimmed = (token || '').trim();
  if (!trimmed) return '';
  if (trimmed.includes('_')) {
    return titleCase(trimmed.replace(/_/g, ' '));
  }
  return trimmed;
}

/**
 * Format symptom lists inside notification messages (handles legacy DB records).
 */
export function formatNotificationMessage(message) {
  if (!message) return message;

  const symptomsPrefix = 'Symptoms: ';
  const idx = message.indexOf(symptomsPrefix);
  if (idx === -1) return message;

  const before = message.slice(0, idx + symptomsPrefix.length);
  let symptomsPart = message.slice(idx + symptomsPrefix.length);
  if (symptomsPart.endsWith('.')) {
    symptomsPart = symptomsPart.slice(0, -1);
  }

  const formatted = symptomsPart
    .split(',')
    .map((part) => formatSymptomToken(part))
    .filter(Boolean)
    .join(', ');

  return `${before}${formatted}.`;
}
