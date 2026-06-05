#!/usr/bin/env python3
"""
MediDiagnose training — aligned with paper Section VI:
  - 80/10/10 train/val/test split (dedupe unique symptom texts, then stratify, augment train only)
  - Bio_ClinicalBERT, AdamW lr=2e-5, batch 16, 10 epochs, early stopping on val loss
  - Exports Table 2 metrics on held-out test set

Usage:
    python train_model.py
    python train_model.py --epochs 10 --batch-size 16
"""

import argparse
import csv
import json
import random
import re
from collections import defaultdict
from pathlib import Path

import numpy as np
import torch
from sklearn.metrics import (
    classification_report,
    f1_score,
)
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


def split_train_val_test(
    rows: list[dict],
    train_frac: float = 0.8,
    val_frac: float = 0.1,
    test_frac: float = 0.1,
    seed: int = SEED,
) -> tuple[list[dict], list[dict], list[dict]]:
    """
    Per-disease split for deduped data (~5–10 patterns per class).
    sklearn stratify on the 20% holdout fails when many classes have only one
    holdout row; splitting within each disease avoids that.
    """
    rng = random.Random(seed)
    by_disease: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        by_disease[row["disease"]].append(row)

    train_rows, val_rows, test_rows = [], [], []
    for group in by_disease.values():
        rng.shuffle(group)
        n = len(group)
        if n == 1:
            train_rows.extend(group)
            continue
        if n == 2:
            train_rows.append(group[0])
            test_rows.append(group[1])
            continue

        n_test = max(1, round(n * test_frac))
        n_val = max(1, round(n * val_frac))
        n_train = n - n_val - n_test
        if n_train < 1:
            n_train = 1
            remainder = n - n_train
            n_val = remainder // 2
            n_test = remainder - n_val

        train_rows.extend(group[:n_train])
        val_rows.extend(group[n_train : n_train + n_val])
        test_rows.extend(group[n_train + n_val :])

    return train_rows, val_rows, test_rows


def dedupe_by_symptom_text(rows: list[dict]) -> list[dict]:
    """
    CSV has ~4.9k rows but only ~304 unique symptom texts (permutations of the
    same tokens). Row-level splits put identical texts in train and val → ~100%
    accuracy. Keep one row per canonical eval text before splitting.
    """
    seen: dict[str, dict] = {}
    for row in rows:
        key = row_to_eval_text(row["symptoms"])
        if key not in seen:
            seen[key] = row
    return list(seen.values())


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
    raw_rows = dedupe_by_symptom_text(all_rows)
    print(f"  {len(all_rows)} CSV rows → {len(raw_rows)} unique symptom patterns (deduped)")

    diseases = sorted(set(r["disease"] for r in raw_rows))
    label2id = {d: i for i, d in enumerate(diseases)}
    id2label = {i: d for d, i in label2id.items()}
    num_labels = len(diseases)
    print(f"  {num_labels} disease classes")

    train_rows, val_rows, test_rows = split_train_val_test(raw_rows)

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
    test_results, test_preds, test_true = evaluate_paper_metrics(
        model, tokenizer, test_texts, test_labels, id2label, device
    )
    for k, v in test_results.items():
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
        "split": "80/10/10",
        "augmented_train_only": not args.no_augment,
        "validation_metrics": val_results,
        "test_metrics_table2": test_results,
    }
    with open(output_dir / "training_meta.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    eval_path = output_dir / "evaluation_results.json"
    with open(eval_path, "w", encoding="utf-8") as f:
        json.dump({"validation": val_results, "test": test_results}, f, indent=2)

    print(f"Wrote {eval_path}")
    print("Done!")


if __name__ == "__main__":
    main()
