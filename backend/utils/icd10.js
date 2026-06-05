const path = require('path');
const fs = require('fs');

let mapping = null;

function loadMapping() {
  if (mapping) return mapping;
  const filePath = path.join(__dirname, '..', 'data', 'icd10_mapping.json');
  mapping = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return mapping;
}

function lookupIcd10(diseaseName) {
  const map = loadMapping();
  const trimmed = (diseaseName || '').trim();
  const entry = map[trimmed] || map[trimmed.replace(/\s+$/, '')];
  if (!entry) {
    return { code: '', display: trimmed };
  }
  return entry;
}

module.exports = { lookupIcd10, loadMapping };
