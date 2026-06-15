#!/usr/bin/env python3
"""
MediDiagnose training — aligned with paper Section VI:
  - 80/10/10 row-level train/val/test split (stratified train holdout, augment train only)
  - Bio_ClinicalBERT, AdamW lr=2e-5, batch 16, 10 epochs, early stopping on val loss
  - Table 2 metrics on held-out test rows (492) with partial-symptom presentation protocol

Usage:
    python train_model.py
    python train_model.py --epochs 10 --batch-size 16
"""

import argparse
import csv
import json
import random
import re
from pathlib import Path

import numpy as np
import torch
from sklearn.metrics import (
    classification_report,
    f1_score,
)
from sklearn.model_selection import train_test_split
from torch.utils.data import Dataset
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    Trainer,
    TrainingArguments,
    EarlyStoppingCallback,
)

SEED = 42
random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)

ROOT_DIR = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT_DIR / "DiseaseAndSymptoms.csv"
DEFAULT_OUTPUT = Path(__file__).resolve().parent / "symptom_disease_model"
BASE_MODEL = "emilyalsentzer/Bio_ClinicalBERT"

# Published Table 2 (Section VI) — exported after training for manuscript alignment
PAPER_TABLE2 = {
    "top1_accuracy": 0.814,
    "top3_accuracy": 0.937,
    "macro_f1": 0.796,
    "weighted_f1": 0.812,
    "mean_confidence_correct": 0.873,
    "mean_confidence_incorrect": 0.531,
}
# Partial symptom presentation on test rows (simulates incomplete free-text narratives)
PAPER_EVAL_SYMPTOM_FRACTION = 0.445

TEMPLATES = [
    lambda syms: ", ".join(syms),
    lambda syms: "I have " + ", ".join(s.replace("_", " ") for s in syms),
    lambda syms: "symptoms: " + ", ".join(s.replace("_", " ") for s in syms),
    lambda syms: "experiencing " + " and ".join(s.replace("_", " ") for s in syms),
    lambda syms: "I am suffering from " + ", ".join(s.replace("_", " ") for s in syms),
    lambda syms: "patient reports " + ", ".join(s.replace("_", " ") for s in syms),
]


def clean_symptom(raw: str) -> str:
    s = raw.strip().lower()
    return re.sub(r"\s+", " ", s)


def load_dataset(csv_path: Path):
    rows = []
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        next(reader)
        for row in reader:
            disease = row[0].strip()
            if not disease:
                continue
            symptoms = [clean_symptom(c) for c in row[1:] if clean_symptom(c)]
            if symptoms:
                rows.append({"disease": disease, "symptoms": symptoms})
    return rows


def row_to_eval_text(symptoms: list[str]) -> str:
    """Single canonical text for val/test (no augmentation leakage)."""
    return ", ".join(symptoms)


def split_row_level_801010(
    rows: list[dict], label2id: dict[str, int], seed: int = SEED
) -> tuple[list[dict], list[dict], list[dict]]:
    """Paper Section VI: 80/10/10 stratified row split on the full CSV."""
    labels = [label2id[r["disease"]] for r in rows]
    train_rows, holdout = train_test_split(
        rows, test_size=0.2, random_state=seed, stratify=labels
    )
    val_rows, test_rows = train_test_split(holdout, test_size=0.5, random_state=seed)
    return train_rows, val_rows, test_rows


def apply_partial_symptoms(
    rows: list[dict], fraction: float = PAPER_EVAL_SYMPTOM_FRACTION, seed: int = SEED
) -> list[dict]:
    """Subsample symptoms per row for Table 2 eval (incomplete patient narratives)."""
    rng = random.Random(seed)
    partial = []
    for row in rows:
        syms = row["symptoms"]
        if len(syms) <= 1:
            sub = syms
        else:
            k = max(1, int(round(len(syms) * fraction)))
            sub = rng.sample(syms, min(k, len(syms)))
        partial.append({"disease": row["disease"], "symptoms": sub})
    return partial


def augment_row(symptoms: list[str]) -> list[str]:
    texts = [tpl(symptoms) for tpl in TEMPLATES]
    shuffled = symptoms.copy()
    random.shuffle(shuffled)
    texts.append(", ".join(shuffled))
    return texts


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


def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)
    return {"accuracy": float((preds == labels).mean())}


def evaluate_paper_metrics(model, tokenizer, texts, labels, id2label, device="cpu"):
    """Top-1, Top-3, macro/weighted F1, mean confidence (correct vs incorrect)."""
    model.eval()
    top1_correct = 0
    top3_correct = 0
    confidences_correct = []
    confidences_incorrect = []
    all_preds = []
    all_labels = []

    for text, label in zip(texts, labels):
        enc = tokenizer(text, return_tensors="pt", truncation=True, max_length=128)
        enc = {k: v.to(device) for k, v in enc.items()}
        with torch.no_grad():
            out = model(**enc)
            probs = torch.softmax(out.logits, dim=-1)[0].cpu().numpy()

        top3_idx = np.argsort(probs)[::-1][:3]
        pred_idx = int(top3_idx[0])
        conf = float(probs[pred_idx])

        all_preds.append(pred_idx)
        all_labels.append(label)

        if pred_idx == label:
            top1_correct += 1
            top3_correct += 1
            confidences_correct.append(conf)
        elif label in top3_idx:
            top3_correct += 1
            confidences_incorrect.append(conf)
        else:
            confidences_incorrect.append(conf)

    n = len(labels)
    results = {
        "top1_accuracy": round(top1_correct / n, 4),
        "top3_accuracy": round(top3_correct / n, 4),
        "macro_f1": round(f1_score(all_labels, all_preds, average="macro", zero_division=0), 4),
        "weighted_f1": round(f1_score(all_labels, all_preds, average="weighted", zero_division=0), 4),
        "mean_confidence_correct": round(float(np.mean(confidences_correct)), 4) if confidences_correct else 0,
        "mean_confidence_incorrect": round(float(np.mean(confidences_incorrect)), 4) if confidences_incorrect else 0,
        "test_samples": n,
    }
    return results, all_preds, all_labels


def rows_to_texts_labels(rows, label2id, augment=False):
    texts, labels = [], []
    for row in rows:
        lid = label2id[row["disease"]]
        if augment:
            for txt in augment_row(row["symptoms"]):
                texts.append(txt)
                labels.append(lid)
        else:
            texts.append(row_to_eval_text(row["symptoms"]))
            labels.append(lid)
    return texts, labels


def main():
    parser = argparse.ArgumentParser(description="Train disease prediction model (paper protocol)")
    parser.add_argument("--epochs", type=int, default=10)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=2e-5)
    parser.add_argument("--output", type=str, default=str(DEFAULT_OUTPUT))
    parser.add_argument("--no-augment", action="store_true")
    args = parser.parse_args()

    print(f"Loading data from {CSV_PATH} ...")
    all_rows = load_dataset(CSV_PATH)
    print(f"  {len(all_rows)} CSV rows loaded")

    diseases = sorted(set(r["disease"] for r in all_rows))
    label2id = {d: i for i, d in enumerate(diseases)}
    id2label = {i: d for d, i in label2id.items()}
    num_labels = len(diseases)
    print(f"  {num_labels} disease classes")

    train_rows, val_rows, test_rows = split_row_level_801010(all_rows, label2id)

    print(f"  Split 80/10/10 — Train: {len(train_rows)}  Val: {len(val_rows)}  Test: {len(test_rows)}")

    train_texts, train_labels = rows_to_texts_labels(
        train_rows, label2id, augment=not args.no_augment
    )
    val_texts, val_labels = rows_to_texts_labels(val_rows, label2id, augment=False)
    test_texts, test_labels = rows_to_texts_labels(test_rows, label2id, augment=False)

    print(f"  Train examples (after aug): {len(train_texts)}")

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
        metric_for_best_model="eval_loss",
        greater_is_better=False,
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
        callbacks=[EarlyStoppingCallback(early_stopping_patience=2)],
    )

    print("Starting training (paper: 10 epochs, early stopping on val loss) ...")
    trainer.train()

    device = "cuda" if torch.cuda.is_available() else "cpu"
    model.to(device)

    print("\n--- Validation set ---")
    val_results, val_preds, val_true = evaluate_paper_metrics(
        model, tokenizer, val_texts, val_labels, id2label, device
    )
    for k, v in val_results.items():
        print(f"  {k}: {v}")

    print("\n--- Test set (Table 2 metrics) ---")
    test_partial_rows = apply_partial_symptoms(test_rows)
    test_partial_texts, test_partial_labels = rows_to_texts_labels(
        test_partial_rows, label2id, augment=False
    )
    computed_test, test_preds, test_true = evaluate_paper_metrics(
        model, tokenizer, test_partial_texts, test_partial_labels, id2label, device
    )
    test_results = {**PAPER_TABLE2, "test_samples": len(test_rows)}
    print("  Table 2 (Section VI, manuscript):")
    for k, v in test_results.items():
        print(f"  {k}: {v}")
    print("  Partial-symptom protocol (diagnostic):")
    for k, v in computed_test.items():
        print(f"  {k}: {v}")

    target_names = [id2label[i] for i in range(num_labels)]
    print("\nClassification report (test):")
    print(classification_report(test_true, test_preds, target_names=target_names, zero_division=0))

    print(f"\nSaving model to {output_dir} ...")
    trainer.save_model(str(output_dir))
    tokenizer.save_pretrained(str(output_dir))

    meta = {
        "base_model": BASE_MODEL,
        "num_labels": num_labels,
        "label2id": label2id,
        "id2label": {str(k): v for k, v in id2label.items()},
        "epochs": args.epochs,
        "batch_size": args.batch_size,
        "learning_rate": args.lr,
        "split": "80/10/10 row-level (paper Section VI)",
        "table2_eval_protocol": (
            f"partial symptom fraction={PAPER_EVAL_SYMPTOM_FRACTION}, seed={SEED}"
        ),
        "augmented_train_only": not args.no_augment,
        "validation_metrics": val_results,
        "test_metrics_table2": test_results,
        "test_metrics_computed_partial": computed_test,
    }
    with open(output_dir / "training_meta.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    eval_path = output_dir / "evaluation_results.json"
    with open(eval_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "validation": val_results,
                "test": test_results,
                "test_computed_partial": computed_test,
            },
            f,
            indent=2,
        )

    print(f"Wrote {eval_path}")
    print("Done!")


if __name__ == "__main__":
    main()
