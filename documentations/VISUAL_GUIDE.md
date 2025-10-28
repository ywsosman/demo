# Visual Guide - AI Model Integration

## 🎨 What Your Users Will See

This guide shows the actual UI/UX changes from the AI model integration.

---

## 1. Symptom Submission (Unchanged)

```
┌────────────────────────────────────────────────────┐
│           🏥 Symptom Checker                       │
├────────────────────────────────────────────────────┤
│                                                    │
│  Describe your symptoms *                         │
│  ┌──────────────────────────────────────────────┐│
│  │ I have a severe headache, nausea, and        ││
│  │ sensitivity to light. It started this        ││
│  │ morning and gets worse in bright rooms.      ││
│  └──────────────────────────────────────────────┘│
│                                                    │
│  Severity Level: 7/10                             │
│  ├────────────●─────────────────────────┤         │
│  1 - Mild              Severe          10 - Emergency
│                                                    │
│  Duration: [6-24 hours ▼]                         │
│                                                    │
│  Additional Info (optional)                       │
│  ┌──────────────────────────────────────────────┐│
│  │ Getting worse in bright environments         ││
│  └──────────────────────────────────────────────┘│
│                                                    │
│  [  Analyze Symptoms  ]                           │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## 2. Results - AI Predictions (Enhanced)

```
┌────────────────────────────────────────────────────┐
│           📊 Diagnosis Results                      │
├────────────────────────────────────────────────────┤
│                                                    │
│  ⚠️ Important Medical Disclaimer                   │
│  This AI analysis is for informational purposes... │
│                                                    │
├────────────────────────────────────────────────────┤
│                                                    │
│  AI Analysis Results                               │
│  ┌────────────────────────────────────────────┐  │
│  │ 🔴 Migraine                    89% confidence││
│  │                                              │  │
│  │ A neurological condition characterized by... │  │
│  │                                              │  │
│  │ Matched Symptoms:                            │  │
│  │ [headache] [nausea] [light sensitivity]     │  │
│  │                                              │  │
│  │ Recommendations:                             │  │
│  │ ✓ Rest in a dark, quiet room                │  │
│  │ ✓ Apply cold compress to head/neck          │  │
│  │ ✓ Stay hydrated                             │  │
│  │ ✓ Consider prescription migraine medications│  │
│  └────────────────────────────────────────────┘  │
│                                                    │
│  ┌────────────────────────────────────────────┐  │
│  │ 🟡 Tension Headache            7% confidence ││
│  │ ...                                          │  │
│  └────────────────────────────────────────────┘  │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## 3. NEW! - SHAP Word Importance Visualization

```
┌────────────────────────────────────────────────────┐
│  🧠 AI Explainability: Key Symptom Words           │
├────────────────────────────────────────────────────┤
│                                                    │
│  The following words had the most influence on the │
│  AI's prediction. Words in red/pink contributed    │
│  positively to the diagnosis.                      │
│                                                    │
│  ┌────────────────────────────────────────────┐  │
│  │ ████ "severe" [Key symptom]                │  │
│  │                             Impact: 45.23%  │  │
│  └────────────────────────────────────────────┘  │
│       ↑ Dark red (very important)                  │
│                                                    │
│  ┌────────────────────────────────────────────┐  │
│  │ ███ "headache" [Key symptom]               │  │
│  │                             Impact: 38.14%  │  │
│  └────────────────────────────────────────────┘  │
│       ↑ Red (important)                            │
│                                                    │
│  ┌────────────────────────────────────────────┐  │
│  │ ██ "nausea" [Key symptom]                  │  │
│  │                             Impact: 32.07%  │  │
│  └────────────────────────────────────────────┘  │
│       ↑ Light red (moderately important)           │
│                                                    │
│  ┌────────────────────────────────────────────┐  │
│  │ ██ "sensitivity" [Key symptom]             │  │
│  │                             Impact: 28.91%  │  │
│  └────────────────────────────────────────────┘  │
│                                                    │
│  ┌────────────────────────────────────────────┐  │
│  │ █ "light" [Key symptom]                    │  │
│  │                             Impact: 25.33%  │  │
│  └────────────────────────────────────────────┘  │
│                                                    │
│  ┌────────────────────────────────────────────┐  │
│  │  "morning"                                  │  │
│  │                             Impact: 5.12%   │  │
│  └────────────────────────────────────────────┘  │
│       ↑ Light blue (less important)                │
│                                                    │
│  ┌────────────────────────────────────────────┐  │
│  │  "and"                                      │  │
│  │                             Impact: 1.20%   │  │
│  └────────────────────────────────────────────┘  │
│       ↑ Very light blue (minimal importance)       │
│                                                    │
│  ℹ️ How to read this:                              │
│  The AI model analyzed each word in your symptom  │
│  description. Words with higher positive impact   │
│  scores were more influential in predicting the   │
│  disease. This visualization uses SHAP to make    │
│  the AI's decision-making process transparent.    │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## 4. Color Coding System

### High Importance (Positive Contributors)
```
████████ Dark Red (rgba(239, 68, 68, 0.4))
Impact: 40%+
Meaning: Very strong indicator for diagnosis
```

### Medium Importance
```
█████ Red (rgba(239, 68, 68, 0.3))
Impact: 25-40%
Meaning: Significant contributor to diagnosis
```

### Low Importance
```
██ Light Red (rgba(239, 68, 68, 0.2))
Impact: 10-25%
Meaning: Moderate contributor
```

### Minimal Importance
```
░ Light Blue (rgba(59, 130, 246, 0.2))
Impact: 0-10%
Meaning: Little to no contribution
```

---

## 5. Backend Console Output

### Starting Server:
```bash
$ npm run dev

🏥 Medical Diagnosis Server running on port 5000
📊 Health check: http://localhost:5000/api/health
🌍 Environment: development
```

### First Prediction (Model Loading):
```bash
Python subprocess started...
Loading model from: ./symptom_disease_model
Using device: cpu
Loading tokenizer...
Loading model...
Creating pipeline...
Creating SHAP explainer...
Model and explainer loaded successfully.
Prediction completed in 23.4 seconds
```

### Subsequent Predictions (Faster):
```bash
Python subprocess started...
Model already in memory
Prediction completed in 2.1 seconds
```

---

## 6. Python Script Output

### Successful Prediction:
```json
{
  "success": true,
  "predicted_disease": "Migraine",
  "confidence": 0.89,
  "top_predictions": [
    {
      "disease": "Migraine",
      "confidence": 0.89
    },
    {
      "disease": "Tension Headache",
      "confidence": 0.07
    },
    {
      "disease": "Cluster Headache",
      "confidence": 0.03
    }
  ],
  "explanation": {
    "words": [
      "severe",
      "headache",
      "nausea",
      "sensitivity",
      "light",
      "morning",
      "and",
      "..."
    ],
    "shap_values": [
      0.4523,
      0.3814,
      0.3207,
      0.2891,
      0.2533,
      0.0512,
      0.0120,
      "..."
    ]
  },
  "word_importance": [
    {
      "word": "severe",
      "importance": 0.4523,
      "impact": "positive"
    },
    {
      "word": "headache",
      "importance": 0.3814,
      "impact": "positive"
    }
  ],
  "device": "cpu"
}
```

---

## 7. Database Document (MongoDB)

### DiagnosisSession with SHAP Data:
```javascript
{
  "_id": ObjectId("671c8d2f8e9a1b2c3d4e5f6a"),
  "patientId": ObjectId("671c8d1f8e9a1b2c3d4e5f60"),
  "symptoms": "severe headache, nausea, sensitivity to light",
  "severity": 7,
  "duration": "6-24 hours",
  "additionalInfo": "Getting worse in bright environments",
  
  // Standard AI Prediction
  "aiPrediction": [
    {
      "condition": "Migraine",
      "confidence": 0.89,
      "description": "AI-predicted condition: Migraine",
      "recommendations": [...]
    }
  ],
  "confidence": 0.89,
  
  // NEW SHAP Data
  "shapExplanation": {
    "words": ["severe", "headache", "nausea", ...],
    "shap_values": [0.4523, 0.3814, 0.3207, ...]
  },
  "wordImportance": [
    {
      "word": "severe",
      "importance": 0.4523,
      "impact": "positive"
    },
    {
      "word": "headache",
      "importance": 0.3814,
      "impact": "positive"
    }
  ],
  "predictedDisease": "Migraine",
  
  // Standard fields
  "status": "pending",
  "doctorNotes": "",
  "doctorId": null,
  "createdAt": ISODate("2025-10-18T10:30:00.000Z"),
  "updatedAt": ISODate("2025-10-18T10:30:00.000Z")
}
```

---

## 8. Doctor's View (Enhanced)

When doctors review cases, they now see:

```
┌────────────────────────────────────────────────────┐
│  Patient Case Review                                │
├────────────────────────────────────────────────────┤
│                                                    │
│  Patient: John Doe                                 │
│  Date: October 18, 2025                           │
│                                                    │
│  Reported Symptoms:                                │
│  "severe headache, nausea, sensitivity to light"   │
│                                                    │
│  AI Prediction: Migraine (89% confidence)          │
│                                                    │
│  🧠 AI Analysis - Word Importance:                 │
│  • "severe" - 45.23% impact                        │
│  • "headache" - 38.14% impact                      │
│  • "nausea" - 32.07% impact                        │
│  • "sensitivity" - 28.91% impact                   │
│  • "light" - 25.33% impact                         │
│                                                    │
│  Doctor Notes:                                     │
│  ┌──────────────────────────────────────────────┐│
│  │ [Doctor can add notes here]                  ││
│  └──────────────────────────────────────────────┘│
│                                                    │
│  [ Mark as Reviewed ]  [ Close Case ]             │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## 9. Comparison: Before vs After

### Before (Rule-Based):
```
Input: "headache and nausea"
↓
Simple keyword matching
↓
Output: "Common Cold (40% confidence)"
         "Flu (35% confidence)"
         "Migraine (25% confidence)"
↓
No explanation of why
```

### After (BERT + SHAP):
```
Input: "severe headache, nausea, sensitivity to light"
↓
Fine-tuned BERT model
↓
Output: "Migraine (89% confidence)"
        "Tension Headache (7% confidence)"
        "Cluster Headache (3% confidence)"
↓
+ SHAP Visualization showing:
  - "severe" contributed 45.23%
  - "headache" contributed 38.14%
  - "nausea" contributed 32.07%
  - etc.
↓
Transparent, explainable AI
```

---

## 10. Loading States

### While Processing:
```
┌────────────────────────────────────────┐
│  ⏳ Analyzing Symptoms...              │
│                                        │
│  🔄 This may take 20-30 seconds for    │
│     the first prediction as the model  │
│     loads into memory.                 │
│                                        │
│     Subsequent predictions will be     │
│     much faster (2-5 seconds).         │
│                                        │
│  [━━━━━━━━━━░░░░░░░░░░] 60%            │
└────────────────────────────────────────┘
```

---

## 11. Error States

### If Python Fails:
```
┌────────────────────────────────────────┐
│  ⚠️ Prediction Error                   │
│                                        │
│  The AI model encountered an error     │
│  processing your symptoms.             │
│                                        │
│  Your case has still been submitted    │
│  and a doctor will review it shortly.  │
│                                        │
│  Error: Model prediction timeout       │
│                                        │
│  [ Try Again ]  [ View History ]       │
└────────────────────────────────────────┘
```

---

## 12. Mobile View

```
┌──────────────────┐
│ Diagnosis Results│
├──────────────────┤
│                  │
│ 🔴 Migraine      │
│ 89% confidence   │
│                  │
│ Recommendations: │
│ ✓ Rest in dark   │
│ ✓ Cold compress  │
│ ✓ Stay hydrated  │
│                  │
├──────────────────┤
│ Key Words:       │
│                  │
│ ████ "severe"    │
│ 45.23% impact    │
│                  │
│ ███ "headache"   │
│ 38.14% impact    │
│                  │
│ ██ "nausea"      │
│ 32.07% impact    │
│                  │
│ [View Full]      │
└──────────────────┘
```

---

## 🎨 Summary of Visual Changes

### What's New:
1. ✅ SHAP word importance section
2. ✅ Color-coded word highlights
3. ✅ Impact percentage displays
4. ✅ "Key symptom" badges
5. ✅ Educational tooltip
6. ✅ Dynamic opacity based on importance
7. ✅ Responsive design for mobile

### What's Enhanced:
1. 📈 More accurate predictions
2. 🎯 Higher confidence scores
3. 💡 Transparent decision-making
4. 📊 Visual data representation
5. 🧠 Explainable AI features

---

## 🎓 Educational Value for Users

Users now understand:
- **Why** the AI made its prediction
- **Which** symptoms were most important
- **How much** each symptom contributed
- **What** the model is analyzing

This builds:
- ✅ Trust in the AI system
- ✅ Understanding of their condition
- ✅ Confidence in seeking appropriate care
- ✅ Better communication with doctors

---

*Visual guide for Youssef Waleed & Ali Mohamed Hassanein's Graduation Project*
*All visualizations are functional and implemented in the codebase*

