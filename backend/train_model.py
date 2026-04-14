#!/usr/bin/env python3
"""
Reproducible training script for the disease-symptom classifier.

Base model:   Bio_ClinicalBERT  (BioBERT + clinical pre-training on MIMIC-III)
              HuggingFace hub:  emilyalsentzer/Bio_ClinicalBERT

Data source:  DiseaseAndSymptoms.csv  (Kaggle "Disease Symptom Prediction")
              ~4920 rows, 41 diseases, up to 17 symptom columns per row.

The script:
  1. Loads and cleans the CSV.
  2. Constructs training text by joining symptoms with commas.
  3. Applies data augmentation (natural-language paraphrases) so the model
     generalises to both structured dropdown input AND free-text input.
  4. Stratified train / val split (80/20).
  5. Fine-tunes Bio_ClinicalBERT for 41-class classification.
  6. Saves model + tokenizer to backend/symptom_disease_model/.
  7. Prints per-class precision / recall / F1.

Why Bio_ClinicalBERT?
  - BioBERT (dmis-lab/biobert-base-cased-v1.2) is pre-trained on PubMed
    abstracts + PMC full-text articles, giving it strong biomedical vocab.
  - ClinicalBERT further trains BioBERT on ~2M clinical notes from MIMIC-III,
    adding understanding of real patient-facing symptom descriptions.
  - Together they outperform generic BERT on medical NLP tasks.

Usage:
    python train_model.py                       # default 6 epochs
    python train_model.py --epochs 10           # override epochs
    python train_model.py --output ./my_model   # custom output dir
"""

import argparse
import csv
import json
import os
import random
import re
from pathlib import Path

import numpy as np
import torch
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from torch.utils.data import Dataset
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    Trainer,
    TrainingArguments,
)

SEED = 42
random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)

ROOT_DIR = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT_DIR / "DiseaseAndSymptoms.csv"
DEFAULT_OUTPUT = Path(__file__).resolve().parent / "symptom_disease_model"
# Bio_ClinicalBERT: BioBERT (PubMed + PMC) further pre-trained on MIMIC-III clinical notes
BASE_MODEL = "emilyalsentzer/Bio_ClinicalBERT"

# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------

def clean_symptom(raw: str) -> str:
    s = raw.strip().lower()
    s = re.sub(r"\s+", " ", s)
    return s


def load_dataset(csv_path: Path):
    """Return list[dict] with keys 'disease' and 'symptoms' (list[str])."""
    rows = []
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        next(reader)  # skip header
        for row in reader:
            disease = row[0].strip()
            if not disease:
                continue
            symptoms = [clean_symptom(c) for c in row[1:] if clean_symptom(c)]
            if symptoms:
                rows.append({"disease": disease, "symptoms": symptoms})
    return rows


# ---------------------------------------------------------------------------
# Data augmentation
# ---------------------------------------------------------------------------

TEMPLATES = [
    # Structured (matches dropdown output exactly)
    lambda syms: ", ".join(syms),
    # Natural-language variants
    lambda syms: "I have " + ", ".join(s.replace("_", " ") for s in syms),
    lambda syms: "symptoms: " + ", ".join(s.replace("_", " ") for s in syms),
    lambda syms: "experiencing " + " and ".join(s.replace("_", " ") for s in syms),
    lambda syms: "I am suffering from " + ", ".join(s.replace("_", " ") for s in syms),
    lambda syms: "patient reports " + ", ".join(s.replace("_", " ") for s in syms),
    lambda syms: "diagnosed with " + " and ".join(s.replace("_", " ") for s in syms[:3])
    + (", " + ", ".join(s.replace("_", " ") for s in syms[3:]) if len(syms) > 3 else ""),
]


def augment_row(symptoms: list[str]) -> list[str]:
    """Return multiple textual representations for one symptom set."""
    texts = []
    for tpl in TEMPLATES:
        texts.append(tpl(symptoms))
    # Also add a version with shuffled symptom order for robustness
    shuffled = symptoms.copy()
    random.shuffle(shuffled)
    texts.append(", ".join(shuffled))
    return texts


# ---------------------------------------------------------------------------
# Torch dataset
# ---------------------------------------------------------------------------

class SymptomDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_length=128):
        self.encodings = tokenizer(
            texts, truncation=True, padding="max_length", max_length=max_length
        )
        self.labels = labels

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        item = {k: torch.tensor(v[idx]) for k, v in self.encodings.items()}
        item["labels"] = torch.tensor(self.labels[idx], dtype=torch.long)
        return item


# ---------------------------------------------------------------------------
# Metrics
# ---------------------------------------------------------------------------

def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)
    acc = (preds == labels).mean()
    return {"accuracy": float(acc)}


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Train disease prediction model")
    parser.add_argument("--epochs", type=int, default=6)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=2e-5)
    parser.add_argument("--output", type=str, default=str(DEFAULT_OUTPUT))
    parser.add_argument("--no-augment", action="store_true", help="Skip data augmentation")
    args = parser.parse_args()

    print(f"Loading data from {CSV_PATH} ...")
    raw_rows = load_dataset(CSV_PATH)
    print(f"  {len(raw_rows)} raw rows loaded")

    # Build label mapping (sorted for reproducibility)
    diseases = sorted(set(r["disease"] for r in raw_rows))
    label2id = {d: i for i, d in enumerate(diseases)}
    id2label = {i: d for d, i in label2id.items()}
    num_labels = len(diseases)
    print(f"  {num_labels} disease classes")

    # Build training pairs: (text, label_id)
    texts, labels = [], []
    for row in raw_rows:
        lid = label2id[row["disease"]]
        if args.no_augment:
            texts.append(", ".join(row["symptoms"]))
            labels.append(lid)
        else:
            for txt in augment_row(row["symptoms"]):
                texts.append(txt)
                labels.append(lid)

    print(f"  {len(texts)} training examples after augmentation")

    # Stratified split
    train_texts, val_texts, train_labels, val_labels = train_test_split(
        texts, labels, test_size=0.2, random_state=SEED, stratify=labels
    )
    print(f"  Train: {len(train_texts)}  Val: {len(val_texts)}")

    # Tokenizer + model
    print(f"Loading base model: {BASE_MODEL} ...")
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
    model = AutoModelForSequenceClassification.from_pretrained(
        BASE_MODEL, num_labels=num_labels, id2label=id2label, label2id=label2id
    )

    train_ds = SymptomDataset(train_texts, train_labels, tokenizer)
    val_ds = SymptomDataset(val_texts, val_labels, tokenizer)

    output_dir = Path(args.output)
    training_args = TrainingArguments(
        output_dir=str(output_dir / "checkpoints"),
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=args.batch_size * 2,
        learning_rate=args.lr,
        weight_decay=0.01,
        warmup_ratio=0.1,
        eval_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="accuracy",
        logging_steps=50,
        seed=SEED,
        fp16=torch.cuda.is_available(),
        report_to="none",
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_ds,
        eval_dataset=val_ds,
        compute_metrics=compute_metrics,
    )

    print("Starting training ...")
    trainer.train()

    # Evaluate
    print("\n--- Validation results ---")
    preds_output = trainer.predict(val_ds)
    preds = np.argmax(preds_output.predictions, axis=-1)
    target_names = [id2label[i] for i in range(num_labels)]
    report = classification_report(val_labels, preds, target_names=target_names, zero_division=0)
    print(report)

    # Save
    print(f"Saving model to {output_dir} ...")
    trainer.save_model(str(output_dir))
    tokenizer.save_pretrained(str(output_dir))

    # Also save label mappings alongside the model
    with open(output_dir / "training_meta.json", "w") as f:
        json.dump({
            "base_model": BASE_MODEL,
            "num_labels": num_labels,
            "label2id": label2id,
            "id2label": id2label,
            "epochs": args.epochs,
            "augmented": not args.no_augment,
            "total_train_examples": len(train_texts),
            "total_val_examples": len(val_texts),
        }, f, indent=2)

    print("Done!")


if __name__ == "__main__":
    main()
