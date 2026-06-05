#!/usr/bin/env python3
"""
Extract unique symptoms from DiseaseAndSymptoms.csv and build a structured
symptom vocabulary JSON used by the prediction pipeline and frontend dropdown.
"""

import csv
import json
import re
from pathlib import Path
from collections import defaultdict

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
CSV_PATH = ROOT_DIR / "DiseaseAndSymptoms.csv"
OUTPUT_PATH = Path(__file__).resolve().parent.parent / "symptom_vocabulary.json"


def clean_symptom(raw: str) -> str:
    """Normalise a raw symptom token from the CSV (strip, lowercase, collapse spaces)."""
    s = raw.strip().lower()
    s = re.sub(r"\s+", " ", s)
    return s


def symptom_to_label(sym_id: str) -> str:
    """Convert a snake_case symptom id to a human-readable label.
    e.g.  'nodal_skin_eruptions' -> 'Nodal Skin Eruptions'
    """
    return sym_id.replace("_", " ").strip().title()


def main():
    symptom_set: set[str] = set()
    disease_set: set[str] = set()
    symptom_to_diseases: dict[str, set[str]] = defaultdict(set)
    disease_to_symptoms: dict[str, set[str]] = defaultdict(set)

    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        header = next(reader)

        for row in reader:
            disease = row[0].strip()
            if not disease:
                continue
            disease_set.add(disease)

            for cell in row[1:]:
                sym = clean_symptom(cell)
                if sym:
                    symptom_set.add(sym)
                    symptom_to_diseases[sym].add(disease)
                    disease_to_symptoms[disease].add(sym)

    symptoms_sorted = sorted(symptom_set)
    diseases_sorted = sorted(disease_set)

    symptoms_list = []
    for sym in symptoms_sorted:
        symptoms_list.append({
            "id": sym,
            "label": symptom_to_label(sym),
            "raw": sym,
        })

    # Build keyword index: individual words -> symptom ids (for fuzzy matching)
    keyword_index: dict[str, list[str]] = defaultdict(list)
    for sym in symptoms_sorted:
        words = sym.replace("_", " ").split()
        for w in words:
            w = w.strip().lower()
            if len(w) > 2 and sym not in keyword_index[w]:
                keyword_index[w].append(sym)

    vocab = {
        "symptoms": symptoms_list,
        "diseases": diseases_sorted,
        "symptom_to_diseases": {k: sorted(v) for k, v in symptom_to_diseases.items()},
        "disease_to_symptoms": {k: sorted(v) for k, v in disease_to_symptoms.items()},
        "keyword_index": dict(keyword_index),
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(vocab, f, indent=2, ensure_ascii=False)

    print(f"Extracted {len(symptoms_list)} symptoms across {len(diseases_sorted)} diseases")
    print(f"Saved to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
