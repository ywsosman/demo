#!/usr/bin/env python3
"""
Disease Prediction Script with SHAP + LIME Explanations.

Called by the Node.js backend (models/aiModel.js) as a subprocess.
Accepts either:
  - structured symptoms  (comma-separated snake_case ids from the dropdown)
  - free-text description (natural language)
and normalises the input before inference.

Input  (argv):   python predict_disease.py '<json>'
  where <json> = {"text": "...", "selectedSymptoms": ["itching","skin_rash"]}

Output (stdout):  single JSON object with prediction + explanations.
"""

import csv
import json
import os
import re
import sys
from difflib import SequenceMatcher
from pathlib import Path

try:
    import torch
    # Python 3.14+ does not support torch.compile; patch it to a no-op
    # decorator so that lazy imports inside transformers don't crash.
    if sys.version_info >= (3, 14) and not getattr(torch, '_compile_patched', False):
        _orig_compile = torch.compile
        def _noop_compile(fn=None, **kwargs):
            if fn is not None:
                return fn
            return lambda f: f
        torch.compile = _noop_compile
        torch._compile_patched = True

    from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline
    import shap
    import numpy as np
    from lime.lime_text import LimeTextExplainer
except ImportError as e:
    print(json.dumps({
        'error': f'Missing required Python package: {str(e)}',
        'message': 'Please install required packages: pip install transformers shap torch lime'
    }))
    sys.exit(1)

import warnings
warnings.filterwarnings('ignore')

SCRIPT_DIR = Path(__file__).resolve().parent

# ---------------------------------------------------------------------------
# Symptom preprocessor
# ---------------------------------------------------------------------------

class SymptomPreprocessor:
    """Normalise user input so the model receives text that resembles training data."""

    def __init__(self, vocab_path: Path):
        with open(vocab_path, encoding="utf-8") as f:
            vocab = json.load(f)

        self.symptom_ids: list[str] = [s["id"] for s in vocab["symptoms"]]
        self.symptom_labels: dict[str, str] = {s["id"]: s["label"] for s in vocab["symptoms"]}
        self.keyword_index: dict[str, list[str]] = vocab.get("keyword_index", {})

        # Build a flat set of all keywords for quick lookup
        self._label_words: dict[str, set[str]] = {}
        for sid in self.symptom_ids:
            self._label_words[sid] = set(sid.replace("_", " ").lower().split())

    # -- public API ----------------------------------------------------------

    def preprocess(self, text: str | None, selected_symptoms: list[str] | None) -> str:
        """Return a normalised symptom string ready for the model.

        If *selected_symptoms* is supplied (from the dropdown), we use those
        directly in snake_case format which matches training data exactly.
        Otherwise we fuzzy-match the free-text against our vocabulary.
        """
        if selected_symptoms:
            valid = [s for s in selected_symptoms if s in set(self.symptom_ids)]
            if valid:
                return ", ".join(valid)

        if not text:
            return ""

        matched = self._match_free_text(text)
        if matched:
            return ", ".join(matched)

        # Fallback: return cleaned text so the model at least sees something
        return text.strip().lower()

    def get_matched_symptoms(self, text: str | None, selected_symptoms: list[str] | None) -> list[dict]:
        """Return list of matched symptom objects with id + label for the frontend."""
        if selected_symptoms:
            valid = [s for s in selected_symptoms if s in set(self.symptom_ids)]
            return [{"id": s, "label": self.symptom_labels[s]} for s in valid]

        if not text:
            return []

        matched = self._match_free_text(text)
        return [{"id": s, "label": self.symptom_labels[s]} for s in matched]

    # -- private -------------------------------------------------------------

    def _match_free_text(self, text: str) -> list[str]:
        """Fuzzy-match free text against the symptom vocabulary."""
        text_lower = text.lower()
        text_words = set(re.findall(r"[a-z]+", text_lower))

        scored: list[tuple[str, float]] = []
        for sid in self.symptom_ids:
            label_words = self._label_words[sid]
            overlap = text_words & label_words
            if not overlap:
                continue
            # Score = fraction of label words found in input text
            score = len(overlap) / len(label_words)
            # Boost for exact substring match
            readable = sid.replace("_", " ")
            if readable in text_lower:
                score = 1.0
            if score >= 0.5:
                scored.append((sid, score))

        # Also try keyword index for single-word hits
        for word in text_words:
            if word in self.keyword_index:
                for sid in self.keyword_index[word]:
                    if not any(s[0] == sid for s in scored):
                        scored.append((sid, 0.5))

        # Deduplicate and sort by score descending
        seen = set()
        unique: list[tuple[str, float]] = []
        for sid, score in sorted(scored, key=lambda x: -x[1]):
            if sid not in seen:
                seen.add(sid)
                unique.append((sid, score))

        return [sid for sid, _ in unique]


# ---------------------------------------------------------------------------
# Precaution loader
# ---------------------------------------------------------------------------

class PrecautionLoader:
    """Load disease precautions from the CSV so we can return real advice."""

    def __init__(self, csv_path: Path):
        self.precautions: dict[str, list[str]] = {}
        if not csv_path.exists():
            return
        with open(csv_path, newline="", encoding="utf-8") as f:
            reader = csv.reader(f)
            next(reader)  # skip header
            for row in reader:
                disease = row[0].strip()
                precs = [c.strip() for c in row[1:] if c.strip()]
                if disease and precs:
                    self.precautions[disease] = precs

    def get(self, disease_name: str) -> list[str]:
        if disease_name in self.precautions:
            return self.precautions[disease_name]
        # Try case-insensitive lookup
        for key, val in self.precautions.items():
            if key.lower() == disease_name.lower():
                return val
        return []


# ---------------------------------------------------------------------------
# Predictor
# ---------------------------------------------------------------------------

class DiseasePredictor:
    def __init__(self, model_path: str, vocab_path: Path, precaution_csv: Path):
        self.model_path = model_path
        self.device_id = 0 if torch.cuda.is_available() else -1
        self.preprocessor = SymptomPreprocessor(vocab_path)
        self.precaution_loader = PrecautionLoader(precaution_csv)

        try:
            print("Loading tokenizer...", file=sys.stderr)
            self.tokenizer = AutoTokenizer.from_pretrained(model_path, local_files_only=True)

            print("Loading model...", file=sys.stderr)
            self.model = AutoModelForSequenceClassification.from_pretrained(
                model_path, local_files_only=True, trust_remote_code=False
            )

            print("Creating pipeline...", file=sys.stderr)
            self.clf_pipeline = pipeline(
                "text-classification",
                model=self.model,
                tokenizer=self.tokenizer,
                device=self.device_id,
                top_k=None,
            )

            print("Creating SHAP explainer...", file=sys.stderr)
            masker = shap.maskers.Text(self.tokenizer)
            self.shap_explainer = shap.Explainer(self.clf_pipeline, masker)

            print("Creating LIME explainer...", file=sys.stderr)
            class_names = [
                self.model.config.id2label[i]
                for i in range(self.model.config.num_labels)
            ]
            self.lime_explainer = LimeTextExplainer(class_names=class_names)

            print("Model loaded successfully!", file=sys.stderr)

        except Exception as e:
            import traceback
            print(traceback.format_exc(), file=sys.stderr)
            raise Exception(f"Failed to load model from {model_path}: {e}")

    # -- LIME helper ---------------------------------------------------------

    def _lime_predict_proba(self, texts: list[str]) -> np.ndarray:
        """Adapter: LIME needs a function that returns (n_samples, n_classes)."""
        results = self.clf_pipeline(list(texts))
        proba = []
        for res in results:
            if not isinstance(res, list):
                res = [res]
            scores = [d["score"] for d in sorted(res, key=lambda d: d["label"])]
            proba.append(scores)
        return np.array(proba)

    # -- predict -------------------------------------------------------------

    def predict(self, raw_text: str | None, selected_symptoms: list[str] | None):
        try:
            # --- Preprocessing ---
            normalised = self.preprocessor.preprocess(raw_text, selected_symptoms)
            matched = self.preprocessor.get_matched_symptoms(raw_text, selected_symptoms)

            if not normalised:
                return {
                    'success': False,
                    'error': 'No symptoms detected in input',
                    'message': 'Please provide symptoms using the dropdown or describe them in more detail.',
                }

            print(f"Normalised input: {normalised}", file=sys.stderr)

            # --- Model inference ---
            predictions = self.clf_pipeline(normalised)
            if isinstance(predictions, list) and len(predictions) > 0:
                if isinstance(predictions[0], list):
                    predictions = predictions[0]

            best = max(predictions, key=lambda x: x['score'])
            predicted_disease = best['label']
            confidence = float(best['score'])

            top_predictions = sorted(predictions, key=lambda x: x['score'], reverse=True)[:3]

            # --- Explainability (SHAP + LIME merged into unified scores) ---
            shap_result = self._compute_shap(normalised, predicted_disease)
            lime_result = self._compute_lime(normalised, predicted_disease)
            unified = self._merge_explanations(shap_result['word_importance'], lime_result)

            # --- Precautions ---
            precautions = self.precaution_loader.get(predicted_disease)

            return {
                'success': True,
                'predicted_disease': predicted_disease,
                'confidence': confidence,
                'normalised_input': normalised,
                'matched_symptoms': matched,
                'top_predictions': [
                    {'disease': p['label'], 'confidence': float(p['score'])}
                    for p in top_predictions
                ],
                'explanation': shap_result['data'],
                'word_importance': unified,
                'precautions': precautions,
                'device': 'cuda' if self.device_id == 0 else 'cpu',
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to generate prediction',
            }

    # -- explainability helpers ----------------------------------------------

    def _compute_shap(self, text: str, predicted_disease: str) -> dict:
        shap_values = self.shap_explainer([text])

        predicted_class_index = list(shap_values.output_names).index(predicted_disease)
        words = shap_values.data[0]
        scores = shap_values.values[0][:, predicted_class_index]

        word_importance = []
        for word, val in zip(words, scores):
            w = str(word).strip()
            if w and w not in ['[CLS]', '[SEP]', '[PAD]']:
                word_importance.append({
                    'word': w,
                    'importance': float(val),
                    'impact': 'positive' if val > 0 else 'negative',
                })
        word_importance.sort(key=lambda x: abs(x['importance']), reverse=True)

        return {
            'data': {
                'words': [str(w) for w in words],
                'shap_values': [float(v) for v in scores],
            },
            'word_importance': word_importance[:10],
        }

    def _compute_lime(self, text: str, predicted_disease: str) -> dict:
        try:
            class_index = list(self.model.config.id2label.values()).index(predicted_disease)
            explanation = self.lime_explainer.explain_instance(
                text,
                self._lime_predict_proba,
                num_features=10,
                labels=[class_index],
                num_samples=100,
            )
            feature_weights = explanation.as_list(label=class_index)
            return {
                'features': [
                    {'word': w, 'weight': float(s), 'impact': 'positive' if s > 0 else 'negative'}
                    for w, s in feature_weights
                ],
                'score': float(explanation.score) if hasattr(explanation, 'score') else None,
            }
        except Exception as e:
            print(f"LIME explanation failed: {e}", file=sys.stderr)
            return {'features': [], 'score': None}

    def _merge_explanations(self, shap_items: list[dict], lime_result: dict) -> list[dict]:
        """Combine SHAP and LIME into a single unified importance score per word.

        Strategy: normalise both sets of scores to [0, 1] range by absolute max,
        then average them.  If only one method produced a score for a word, use
        that score alone.  The user sees one coherent ranking without needing to
        know which method contributed what.
        """
        # Build word -> raw scores lookup
        shap_map: dict[str, float] = {}
        for item in shap_items:
            w = item['word'].lower().strip()
            if w:
                shap_map[w] = item['importance']

        lime_map: dict[str, float] = {}
        for feat in (lime_result.get('features') or []):
            w = feat['word'].lower().strip()
            if w:
                lime_map[w] = feat['weight']

        all_words = set(shap_map.keys()) | set(lime_map.keys())
        if not all_words:
            return shap_items  # fallback

        # Normalise each set independently by its absolute max
        shap_abs_max = max((abs(v) for v in shap_map.values()), default=1.0) or 1.0
        lime_abs_max = max((abs(v) for v in lime_map.values()), default=1.0) or 1.0

        merged: list[dict] = []
        for word in all_words:
            shap_norm = shap_map.get(word)
            lime_norm = lime_map.get(word)

            if shap_norm is not None:
                shap_norm = shap_norm / shap_abs_max
            if lime_norm is not None:
                lime_norm = lime_norm / lime_abs_max

            if shap_norm is not None and lime_norm is not None:
                score = (shap_norm + lime_norm) / 2.0
            elif shap_norm is not None:
                score = shap_norm
            else:
                score = lime_norm

            merged.append({
                'word': word,
                'importance': float(score),
                'impact': 'positive' if score > 0 else 'negative',
            })

        merged.sort(key=lambda x: abs(x['importance']), reverse=True)
        return merged[:10]


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main():
    if len(sys.argv) < 2:
        print(json.dumps({
            'error': 'No input provided',
            'usage': 'python predict_disease.py \'{"text":"...","selectedSymptoms":[...]}\''
        }))
        sys.exit(1)

    # Parse input — accept either plain text (backward compat) or JSON object
    raw_arg = sys.argv[1]
    text = None
    selected_symptoms = None

    try:
        parsed = json.loads(raw_arg)
        if isinstance(parsed, dict):
            text = parsed.get('text')
            selected_symptoms = parsed.get('selectedSymptoms')
        else:
            text = raw_arg
    except json.JSONDecodeError:
        text = raw_arg

    script_dir = Path(__file__).resolve().parent
    model_path = os.environ.get('MODEL_PATH', str(script_dir / 'symptom_disease_model'))
    vocab_path = script_dir / 'symptom_vocabulary.json'
    precaution_csv = script_dir.parent / 'Disease precaution.csv'

    if not Path(model_path).exists():
        print(json.dumps({
            'error': f'Model not found at {model_path}',
            'message': 'Please ensure the model is saved in the correct location',
        }))
        sys.exit(1)

    if not vocab_path.exists():
        print(json.dumps({
            'error': f'Symptom vocabulary not found at {vocab_path}',
            'message': 'Run scripts/extract_symptoms.py first to generate the vocabulary.',
        }))
        sys.exit(1)

    try:
        predictor = DiseasePredictor(model_path, vocab_path, precaution_csv)
        result = predictor.predict(text, selected_symptoms)
        print(json.dumps(result))
        sys.exit(0 if result.get('success', False) else 1)
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': str(e),
            'message': 'Unexpected error during prediction',
        }))
        sys.exit(1)


if __name__ == '__main__':
    main()
