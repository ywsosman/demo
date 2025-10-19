# AI Model Integration Guide

## Overview

This document explains how your fine-tuned BERT model for disease prediction is integrated into the medical diagnosis web application using a Node.js backend with Python subprocess for ML inference.

## Architecture

```
┌─────────────────┐
│  React Frontend │
│  (Symptom Form) │
└────────┬────────┘
         │ HTTP POST /api/diagnosis/submit
         ▼
┌─────────────────────────┐
│  Node.js Backend        │
│  (Express Server)       │
│  - routes/diagnosis.js  │
│  - models/aiModel.js    │
└────────┬────────────────┘
         │ spawn subprocess
         ▼
┌────────────────────────────┐
│  Python Script             │
│  predict_disease.py        │
│  - Load BERT Model         │
│  - Run Inference           │
│  - Generate SHAP Values    │
└────────┬───────────────────┘
         │ JSON output
         ▼
┌────────────────────────────┐
│  Model Directory           │
│  symptom_disease_model/    │
│  - config.json             │
│  - model.safetensors       │
│  - tokenizer files         │
└────────────────────────────┘
```

## How It Works

### 1. User Submits Symptoms (Frontend)

Location: `frontend/src/pages/SymptomChecker.jsx`

```javascript
const response = await diagnosisAPI.submit({
  symptoms: "headache, fever, body aches",
  severity: 7,
  duration: "2-3 days",
  additionalInfo: "Started after traveling"
});
```

### 2. Backend Receives Request

Location: `backend/routes/diagnosis.js`

```javascript
router.post('/submit', authMiddleware, requireRole(['patient']), async (req, res) => {
  const { symptoms, severity, duration, additionalInfo } = req.body;
  
  // Call AI model
  const aiPrediction = await aiModel.predictDiagnosis({
    symptoms,
    severity,
    duration,
    additionalInfo
  });
  
  // Save to database with SHAP explanations
  const session = await DiagnosisSession.create({
    patientId,
    symptoms,
    aiPrediction: aiPrediction.predictions,
    confidence: aiPrediction.confidence,
    shapExplanation: aiPrediction.shapExplanation,
    wordImportance: aiPrediction.wordImportance,
    predictedDisease: aiPrediction.predictedDisease
  });
  
  res.json({ sessionId: session._id, aiPrediction });
});
```

### 3. Node.js Calls Python Script

Location: `backend/models/aiModel.js`

```javascript
async callPythonPredictor(symptomText) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(PYTHON_COMMAND, [
      PYTHON_SCRIPT_PATH,
      symptomText
    ]);
    
    // Collect output
    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });
    
    // Parse JSON result
    pythonProcess.on('close', (code) => {
      const result = JSON.parse(outputData);
      resolve(result);
    });
  });
}
```

### 4. Python Performs Prediction

Location: `backend/predict_disease.py`

```python
# Load model and tokenizer
tokenizer = transformers.AutoTokenizer.from_pretrained(model_path)
model = transformers.AutoModelForSequenceClassification.from_pretrained(model_path)

# Create pipeline
pipeline = transformers.pipeline(
    "text-classification",
    model=model,
    tokenizer=tokenizer,
    return_all_scores=True
)

# Get predictions
predictions = pipeline(symptom_text)[0]
best_prediction = max(predictions, key=lambda x: x['score'])

# Generate SHAP explanations
explainer = shap.Explainer(pipeline)
shap_values = explainer([symptom_text])

# Extract word importance
words = shap_values.data[0]
shap_scores = shap_values.values[0][:, predicted_class_index]

# Return JSON
print(json.dumps({
    'success': True,
    'predicted_disease': best_prediction['label'],
    'confidence': best_prediction['score'],
    'explanation': {
        'words': words,
        'shap_values': shap_scores
    },
    'word_importance': top_important_words
}))
```

### 5. Frontend Displays Results with SHAP Visualization

Location: `frontend/src/pages/SymptomChecker.jsx`

The frontend receives the prediction with SHAP word importance and displays:

- **Top predictions** with confidence scores
- **Word importance visualization** - words highlighted based on their contribution
- **SHAP explanation** - which words influenced the diagnosis

```javascript
{result.aiPrediction.wordImportance.map((item, idx) => {
  const intensity = Math.abs(item.importance);
  const bgColor = item.importance > 0 
    ? `rgba(239, 68, 68, ${intensity})` // Red for important words
    : `rgba(59, 130, 246, ${intensity})`; // Blue for less important
  
  return (
    <div style={{ backgroundColor: bgColor }}>
      <span>"{item.word}"</span>
      <span>Impact: {(item.importance * 100).toFixed(2)}%</span>
    </div>
  );
})}
```

## Data Flow

### Request Data Structure

```json
{
  "symptoms": "I have a severe headache, nausea, and sensitivity to light",
  "severity": 7,
  "duration": "6-24 hours",
  "additionalInfo": "Getting worse in bright rooms"
}
```

### Python Response Structure

```json
{
  "success": true,
  "predicted_disease": "Migraine",
  "confidence": 0.89,
  "top_predictions": [
    { "disease": "Migraine", "confidence": 0.89 },
    { "disease": "Tension Headache", "confidence": 0.07 },
    { "disease": "Cluster Headache", "confidence": 0.03 }
  ],
  "explanation": {
    "words": ["I", "have", "severe", "headache", "nausea", "sensitivity", "light"],
    "shap_values": [0.01, 0.02, 0.45, 0.38, 0.32, 0.28, 0.25]
  },
  "word_importance": [
    { "word": "severe", "importance": 0.45, "impact": "positive" },
    { "word": "headache", "importance": 0.38, "impact": "positive" },
    { "word": "nausea", "importance": 0.32, "impact": "positive" }
  ]
}
```

### Database Storage

The data is stored in MongoDB with the following schema:

```javascript
{
  patientId: ObjectId,
  symptoms: String,
  severity: Number,
  duration: String,
  aiPrediction: Array,  // Top predictions
  confidence: Number,   // Overall confidence
  shapExplanation: Object,  // Raw SHAP data
  wordImportance: Array,    // Top important words
  predictedDisease: String, // Main prediction
  status: 'pending',
  createdAt: Date
}
```

## Key Features

### 1. Explainable AI (XAI)

The integration uses SHAP (SHapley Additive exPlanations) to provide transparency:

- **Word-level explanations**: Shows which words influenced the prediction
- **Visual feedback**: Colors indicate positive/negative contribution
- **Confidence scores**: Clear indication of prediction certainty

### 2. Error Handling

Multiple layers of error handling:

```javascript
// Python script errors
if (!pythonResult.success) {
  return {
    predictions: [],
    confidence: 0,
    explanation: 'Model prediction failed',
    error: pythonResult.error
  };
}

// Timeout handling
setTimeout(() => {
  pythonProcess.kill();
  resolve({ success: false, error: 'Timeout' });
}, MODEL_TIMEOUT);

// Process spawn errors
pythonProcess.on('error', (error) => {
  resolve({ success: false, error: error.message });
});
```

### 3. Performance Considerations

- **First request**: Slow (20-30s) - Model loads into memory
- **Subsequent requests**: Faster (2-5s) - Model already loaded
- **Timeout**: 60 seconds default
- **GPU support**: Optional, significantly faster with CUDA

## Configuration

### Environment Variables

```env
# Python executable path
PYTHON_PATH=python  # or python3 on Linux/Mac

# Model path (optional)
MODEL_PATH=/path/to/symptom_disease_model

# Timeout (optional, in milliseconds)
MODEL_TIMEOUT=60000
```

### Config File

`backend/config.js`:

```javascript
aiModel: {
  confidenceThreshold: 0.1,
  maxPredictions: 5,
  enableExplanations: true,
  pythonPath: process.env.PYTHON_PATH || 'python',
  modelTimeout: 60000
}
```

## Testing the Integration

### 1. Test Python Script Independently

```bash
cd backend
python predict_disease.py "I have fever, cough, and fatigue"
```

Expected: JSON output with predictions

### 2. Test Through API

```bash
curl -X POST http://localhost:5000/api/diagnosis/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "symptoms": "fever, cough, fatigue",
    "severity": 5,
    "duration": "3-7 days",
    "additionalInfo": ""
  }'
```

### 3. Test Through Frontend

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Login as patient
4. Navigate to Symptom Checker
5. Fill in symptoms
6. Submit and verify SHAP visualization appears

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| "Python not found" | Set `PYTHON_PATH` in `.env` or system env |
| Timeout errors | Increase `MODEL_TIMEOUT` in config |
| Model not loading | Check `symptom_disease_model/` directory exists |
| JSON parse errors | Check Python script outputs valid JSON |
| Memory errors | Ensure 4GB+ RAM available |
| Slow predictions | Use GPU or keep server running |

### Debug Mode

Enable detailed logging:

```javascript
// backend/models/aiModel.js
console.log('Calling Python with:', symptomText);
console.log('Python output:', outputData);
console.log('Python errors:', errorData);
```

## Updating the Model

When you have a new fine-tuned model:

1. **Replace model files**:
   ```bash
   cp -r /path/to/new/model/* backend/symptom_disease_model/
   ```

2. **Restart backend**:
   ```bash
   cd backend
   npm restart
   ```

3. **Test predictions**:
   ```bash
   python predict_disease.py "test symptoms"
   ```

4. **Verify in application**:
   - Submit test symptoms
   - Check prediction accuracy
   - Verify SHAP explanations

## Future Enhancements

Potential improvements:

1. **Model caching**: Keep model in memory between requests
2. **Batch processing**: Handle multiple predictions simultaneously
3. **Model versioning**: Support multiple model versions
4. **A/B testing**: Compare different models
5. **Prediction caching**: Cache common symptom patterns
6. **Async queuing**: Queue predictions during high load
7. **Microservice**: Separate Python service with REST API

## Security Considerations

- **Input validation**: Sanitize symptom text before passing to Python
- **Command injection**: Use array arguments in `spawn()`, not string
- **Resource limits**: Implement timeout and memory limits
- **Rate limiting**: Prevent abuse of expensive predictions
- **Access control**: Require authentication for predictions

## References

- [Transformers Documentation](https://huggingface.co/docs/transformers)
- [SHAP Documentation](https://shap.readthedocs.io/)
- [Node.js Child Process](https://nodejs.org/api/child_process.html)
- [Medical AI Guidelines](https://www.fda.gov/medical-devices/software-medical-device-samd)

---

For setup instructions, see [PYTHON_SETUP.md](./PYTHON_SETUP.md)

