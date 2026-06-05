# MediDiagnose — Paper & Thesis Alignment

This document summarizes how the codebase maps to the IEEE draft paper and thesis SRS.

## Training (Section VI)

| Paper | Implementation |
|-------|----------------|
| 80/10/10 split | `backend/train_model.py`, `notebooks/train_on_colab.ipynb` |
| AdamW, lr 2e-5, batch 16, 10 epochs | Defaults in both scripts |
| Early stopping on val loss | `EarlyStoppingCallback` in `train_model.py` |
| Top-1, Top-3, macro/weighted F1, confidence gap | `evaluate_paper_metrics()` → `evaluation_results.json` |

**Note:** Reported metrics (81.4% / 93.7%) in the paper must come from **your** test run after training—not hard-coded.

## Clinical workflow (Section V)

| Feature | Location |
|---------|----------|
| FSM states | `backend/utils/diagnosisStateMachine.js` |
| 24h pessimistic lock | `POST /api/diagnosis/:id/lock` (409 if held by another doctor) |
| Append-only revisions | `backend/models/DiagnosisRevision.js` |
| Doctor review record | `backend/models/DoctorReview.js` |
| Prescription PDF | `backend/utils/prescriptionPdf.js` |
| Patient gate (no AI until reviewed) | `deliveredToPatient` + history masking |
| ICD-10 labels | `backend/data/icd10_mapping.json` |
| Notifications (in-app + email/SMS stubs) | `backend/services/notificationService.js` |
| bcrypt cost 12 | `auth.js`, `admin.js`, `db.js` |

## XAI (Section IV)

- SHAP + LIME at inference: `backend/predict_disease.py`
- Word importance in doctor UI: `DoctorDashboard.jsx`

## Still future work (paper Section VII)

- HL7/FHIR EHR integration
- Persistent model serving (TorchServe / ONNX)
- Formal regulatory certification
- Physician study (10 doctors, Likert) — research activity, not code

## Train & deploy

```bash
# Local GPU/CPU
python backend/train_model.py

# Or Colab: notebooks/train_on_colab.ipynb → download medai_model_bundle.zip
# Copy to backend/symptom_disease_model/ and backend/symptom_vocabulary.json
```
