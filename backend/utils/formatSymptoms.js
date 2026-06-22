const fs = require('fs');
const path = require('path');

let labelById = null;

function loadLabelMap() {
  if (labelById) return labelById;
  labelById = {};
  try {
    const vocabPath = path.join(__dirname, '..', 'symptom_vocabulary.json');
    const vocab = JSON.parse(fs.readFileSync(vocabPath, 'utf-8'));
    for (const s of vocab.symptoms || []) {
      if (s.id) labelById[s.id.toLowerCase()] = s.label;
      if (s.raw) labelById[s.raw.toLowerCase()] = s.label;
    }
  } catch (err) {
    console.warn('Could not load symptom vocabulary for formatting:', err.message);
  }
  return labelById;
}

function titleCase(str) {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatSymptomToken(token) {
  const trimmed = (token || '').trim();
  if (!trimmed) return '';

  const map = loadLabelMap();
  const key = trimmed.toLowerCase();
  if (map[key]) return map[key];

  if (trimmed.includes('_')) {
    return titleCase(trimmed.replace(/_/g, ' '));
  }

  return trimmed;
}

/**
 * Format symptoms for human-readable notifications and emails.
 * Uses vocabulary labels when available; otherwise replaces underscores with spaces.
 */
function formatSymptomsForDisplay(symptomText, selectedSymptoms) {
  if (Array.isArray(selectedSymptoms) && selectedSymptoms.length > 0) {
    return selectedSymptoms.map(formatSymptomToken).join(', ');
  }
  if (!symptomText) return '';
  return symptomText
    .split(',')
    .map((part) => formatSymptomToken(part))
    .filter(Boolean)
    .join(', ');
}

module.exports = { formatSymptomsForDisplay, formatSymptomToken };
