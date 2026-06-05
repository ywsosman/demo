"""Patch train_on_colab.ipynb to match paper training protocol."""
import json
from pathlib import Path

nb_path = Path(__file__).resolve().parents[1] / "notebooks" / "train_on_colab.ipynb"
nb = json.loads(nb_path.read_text(encoding="utf-8"))

SPLIT_CELL = """# Step 5: 80/10/10 split on UNIQUE symptom patterns (paper Section VI), augment TRAIN only

TEMPLATES = [
    lambda syms: ', '.join(syms),
    lambda syms: 'I have ' + ', '.join(s.replace('_', ' ') for s in syms),
    lambda syms: 'symptoms: ' + ', '.join(s.replace('_', ' ') for s in syms),
    lambda syms: 'experiencing ' + ' and '.join(s.replace('_', ' ') for s in syms),
    lambda syms: 'I am suffering from ' + ', '.join(s.replace('_', ' ') for s in syms),
    lambda syms: 'patient reports ' + ', '.join(s.replace('_', ' ') for s in syms),
]

def augment_row(symptoms):
    texts = [tpl(symptoms) for tpl in TEMPLATES]
    shuffled = symptoms.copy()
    random.shuffle(shuffled)
    texts.append(', '.join(shuffled))
    return texts

def split_train_val_test(rows, train_frac=0.8, val_frac=0.1, test_frac=0.1, seed=SEED):
    rng = random.Random(seed)
    by_disease = defaultdict(list)
    for row in rows:
        by_disease[row['disease']].append(row)
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
        val_rows.extend(group[n_train:n_train + n_val])
        test_rows.extend(group[n_train + n_val:])
    return train_rows, val_rows, test_rows

train_rows, val_rows, test_rows = split_train_val_test(raw_rows)

train_texts, train_labels, val_texts, val_labels, test_texts, test_labels = [], [], [], [], [], []

for row in train_rows:
    lid = label2id[row['disease']]
    for txt in augment_row(row['symptoms']):
        train_texts.append(txt)
        train_labels.append(lid)

for row in val_rows:
    val_texts.append(row_to_eval_text(row['symptoms']))
    val_labels.append(label2id[row['disease']])

for row in test_rows:
    test_texts.append(row_to_eval_text(row['symptoms']))
    test_labels.append(label2id[row['disease']])

print(f'Train (aug): {len(train_texts):,}  Val: {len(val_texts):,}  Test: {len(test_texts):,}')"""

TRAIN_CELL = """# Step 7: Train (paper: batch 16, 10 epochs, early stopping on eval_loss)

from transformers import EarlyStoppingCallback

def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)
    return {'accuracy': float((preds == labels).mean())}

training_args = TrainingArguments(
    output_dir=str(OUTPUT_DIR / 'checkpoints'),
    num_train_epochs=10,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=32,
    learning_rate=2e-5,
    weight_decay=0.01,
    warmup_ratio=0.1,
    eval_strategy='epoch',
    save_strategy='epoch',
    load_best_model_at_end=True,
    metric_for_best_model='eval_loss',
    greater_is_better=False,
    logging_steps=25,
    seed=SEED,
    fp16=torch.cuda.is_available(),
    report_to='none',
)

train_ds = SymptomDataset(train_texts, train_labels, tokenizer)
val_ds = SymptomDataset(val_texts, val_labels, tokenizer)
test_ds = SymptomDataset(test_texts, test_labels, tokenizer)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_ds,
    eval_dataset=val_ds,
    compute_metrics=compute_metrics,
    callbacks=[EarlyStoppingCallback(early_stopping_patience=2)],
)

print('Starting training...')
trainer.train()"""

EVAL_CELL = """# Step 8: Table 2 metrics on held-out TEST set

from sklearn.metrics import f1_score

def evaluate_paper_metrics(texts, labels):
    model.eval()
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    model.to(device)
    top1 = top3 = 0
    conf_ok, conf_bad = [], []
    preds_all, labels_all = [], []
    for text, label in zip(texts, labels):
        enc = tokenizer(text, return_tensors='pt', truncation=True, max_length=128)
        enc = {k: v.to(device) for k, v in enc.items()}
        with torch.no_grad():
            probs = torch.softmax(model(**enc).logits, dim=-1)[0].cpu().numpy()
        top3_idx = np.argsort(probs)[::-1][:3]
        pred = int(top3_idx[0])
        conf = float(probs[pred])
        preds_all.append(pred)
        labels_all.append(label)
        if pred == label:
            top1 += 1
            top3 += 1
            conf_ok.append(conf)
        elif label in top3_idx:
            top3 += 1
            conf_bad.append(conf)
        else:
            conf_bad.append(conf)
    n = len(labels)
    return {
        'top1_accuracy': round(top1 / n, 4),
        'top3_accuracy': round(top3 / n, 4),
        'macro_f1': round(f1_score(labels_all, preds_all, average='macro', zero_division=0), 4),
        'weighted_f1': round(f1_score(labels_all, preds_all, average='weighted', zero_division=0), 4),
        'mean_confidence_correct': round(float(np.mean(conf_ok)), 4) if conf_ok else 0,
        'mean_confidence_incorrect': round(float(np.mean(conf_bad)), 4) if conf_bad else 0,
        'test_samples': n,
    }

print('=' * 60)
print('VALIDATION (classification report)')
print('=' * 60)
val_out = trainer.predict(val_ds)
val_preds = np.argmax(val_out.predictions, axis=-1)
print(classification_report(val_labels, val_preds, target_names=[id2label[i] for i in range(num_labels)], zero_division=0))

print('\\n' + '=' * 60)
print('TEST SET — Table 2 metrics (paper)')
print('=' * 60)
test_metrics = evaluate_paper_metrics(test_texts, test_labels)
for k, v in test_metrics.items():
    print(f'  {k}: {v}')"""

SAVE_CELL = """# Step 9: Save model + evaluation_results.json

print(f'Saving model to {OUTPUT_DIR}/...')
trainer.save_model(str(OUTPUT_DIR))
tokenizer.save_pretrained(str(OUTPUT_DIR))

meta = {
    'base_model': BASE_MODEL,
    'csv_source': CSV_PATH.name,
    'csv_rows': len(all_rows),
    'unique_symptom_patterns': len(raw_rows),
    'num_labels': num_labels,
    'label2id': label2id,
    'id2label': {str(k): v for k, v in id2label.items()},
    'epochs': 10,
    'batch_size': 16,
    'split': '80/10/10 (deduped by symptom text before split)',
    'augmented_train_only': True,
    'test_metrics_table2': test_metrics,
    'integrates_with': 'backend/predict_disease.py',
}
with open(OUTPUT_DIR / 'training_meta.json', 'w', encoding='utf-8') as f:
    json.dump(meta, f, indent=2)
with open(OUTPUT_DIR / 'evaluation_results.json', 'w', encoding='utf-8') as f:
    json.dump({'test': test_metrics}, f, indent=2)
print('Saved training_meta.json and evaluation_results.json')"""

for cell in nb["cells"]:
    src = "".join(cell.get("source", []))
    if "train_texts, val_texts, train_labels, val_labels = train_test_split" in src:
        cell["source"] = [SPLIT_CELL + "\n"]
    elif "num_train_epochs=6" in src or "num_train_epochs=10" in src and "Step 7" in src:
        pass
    if "# Step 7: Train" in src and "num_train_epochs" in src:
        cell["source"] = [TRAIN_CELL + "\n"]
    if "# Step 8: Evaluate" in src or "VALIDATION RESULTS" in src:
        cell["source"] = [EVAL_CELL + "\n"]
    if "# Step 9: Save model" in src and "training_meta" in src:
        cell["source"] = [SAVE_CELL + "\n"]

# Fix step 6 - remove duplicate train_ds creation if needed
for i, cell in enumerate(nb["cells"]):
    src = "".join(cell.get("source", []))
    if "# Step 6: Tokenize" in src:
        cell["source"] = ["""# Step 6: Load model & tokenizer

class SymptomDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_length=128):
        self.encodings = tokenizer(texts, truncation=True, padding='max_length', max_length=max_length)
        self.labels = labels
    def __len__(self):
        return len(self.labels)
    def __getitem__(self, idx):
        item = {k: torch.tensor(v[idx]) for k, v in self.encodings.items()}
        item['labels'] = torch.tensor(self.labels[idx], dtype=torch.long)
        return item

print(f'Loading {BASE_MODEL}...')
tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
model = AutoModelForSequenceClassification.from_pretrained(
    BASE_MODEL, num_labels=num_labels, id2label=id2label, label2id=label2id
)
print('Ready for training (datasets built in Step 7)')
"""]

nb_path.write_text(json.dumps(nb, indent=1), encoding="utf-8")
print("Patched", nb_path)
