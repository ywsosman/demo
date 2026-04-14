const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PYTHON_SCRIPT_PATH = path.join(__dirname, '..', 'predict_disease.py');
const VENV_PYTHON = path.join(__dirname, '..', 'venv', 'Scripts', 'python.exe');
const PYTHON_COMMAND = fs.existsSync(VENV_PYTHON) ? VENV_PYTHON : (process.env.PYTHON_PATH || 'python');
const MODEL_TIMEOUT = 180000; // 3 minutes — BERT model + SHAP + LIME init

class AIModel {
  constructor() {
    this.initialized = true;
    this.modelReady = false;
  }

  /**
   * Predict disease from patient data.
   * Accepts both free-text symptoms and structured dropdown selections.
   */
  async predictDiagnosis(patientData) {
    try {
      const { symptoms, selectedSymptoms, severity, duration, additionalInfo } = patientData;

      // Build the JSON payload that predict_disease.py now expects
      const payload = {};

      if (selectedSymptoms && selectedSymptoms.length > 0) {
        payload.selectedSymptoms = selectedSymptoms;
      }

      // Free-text goes into "text" field; append additionalInfo if present
      let text = symptoms || '';
      if (additionalInfo) {
        text += `. Additional info: ${additionalInfo}`;
      }
      if (text) {
        payload.text = text;
      }

      const pythonResult = await this.callPythonPredictor(JSON.stringify(payload));

      if (!pythonResult.success) {
        console.error('Python prediction failed:', pythonResult.error);
        return {
          predictions: [],
          confidence: 0,
          explanation: pythonResult.message || 'Model prediction failed. Please try again.',
          error: pythonResult.error,
          timestamp: new Date().toISOString()
        };
      }

      // Use real precautions returned by the Python script (from Disease precaution.csv)
      const precautions = pythonResult.precautions || [];

      const predictions = pythonResult.top_predictions.map(pred => ({
        condition: pred.disease,
        confidence: pred.confidence,
        description: `AI-predicted condition: ${pred.disease}`,
        recommendations: pred.disease === pythonResult.predicted_disease && precautions.length
          ? precautions
          : this.getGenericRecommendations(),
        matchedSymptoms: (pythonResult.matched_symptoms || []).map(s => s.label)
      }));

      const explanation = this.generateExplanationFromShap(
        pythonResult.predicted_disease,
        pythonResult.confidence,
        pythonResult.word_importance
      );

      return {
        predictions,
        confidence: pythonResult.confidence,
        explanation,
        wordImportance: pythonResult.word_importance,
        predictedDisease: pythonResult.predicted_disease,
        matchedSymptoms: pythonResult.matched_symptoms,
        normalisedInput: pythonResult.normalised_input,
        precautions,
        timestamp: new Date().toISOString(),
        modelDevice: pythonResult.device
      };

    } catch (error) {
      console.error('AI Model prediction error:', error);
      return {
        predictions: [],
        confidence: 0,
        explanation: 'Unable to generate prediction due to processing error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Spawn Python process with a JSON payload instead of plain text.
   */
  callPythonPredictor(jsonPayload) {
    return new Promise((resolve) => {
      console.log('[AI] Python command:', PYTHON_COMMAND);
      console.log('[AI] Script path:', PYTHON_SCRIPT_PATH);
      console.log('[AI] Payload:', jsonPayload);

      const pythonProcess = spawn(PYTHON_COMMAND, [
        PYTHON_SCRIPT_PATH,
        jsonPayload
      ]);

      let outputData = '';
      let errorData = '';

      pythonProcess.stdout.on('data', (data) => {
        outputData += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
      });

      pythonProcess.on('close', (code) => {
        console.log('[AI] Python exit code:', code);
        if (errorData) console.log('[AI] stderr:', errorData.slice(-500));
        if (code !== 0) {
          console.error('Python script error:', errorData || '(empty stderr)');
          resolve({
            success: false,
            error: errorData || 'Python script execution failed',
            message: 'Failed to run prediction model'
          });
          return;
        }

        try {
          const result = JSON.parse(outputData);
          resolve(result);
        } catch (parseError) {
          console.error('Failed to parse Python output:', outputData);
          resolve({
            success: false,
            error: parseError.message,
            message: 'Failed to parse model output'
          });
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('Failed to start Python process:', error);
        resolve({
          success: false,
          error: error.message,
          message: 'Failed to start prediction process. Ensure Python is installed.'
        });
      });

      setTimeout(() => {
        pythonProcess.kill();
        resolve({
          success: false,
          error: 'Prediction timeout',
          message: 'Model prediction took too long. Please try again.'
        });
      }, MODEL_TIMEOUT);
    });
  }

  generateExplanationFromShap(disease, confidence, wordImportance) {
    if (!wordImportance || wordImportance.length === 0) {
      return `The AI model predicts ${disease} with ${(confidence * 100).toFixed(1)}% confidence.`;
    }

    const topWords = wordImportance
      .filter(w => w.importance > 0)
      .slice(0, 5)
      .map(w => w.word)
      .join(', ');

    let explanation = `Based on AI analysis, the model predicts ${disease} with ${(confidence * 100).toFixed(1)}% confidence. `;

    if (topWords) {
      explanation += `Key symptoms that contributed to this prediction include: ${topWords}. `;
    }

    explanation += 'This assessment uses advanced natural language processing and should be reviewed by a healthcare professional.';
    return explanation;
  }

  getGenericRecommendations() {
    return [
      'Consult with a healthcare professional for proper diagnosis',
      'Monitor your symptoms and note any changes',
      'Keep track of symptom severity and duration',
      'Seek immediate medical attention if symptoms worsen'
    ];
  }
}

module.exports = new AIModel();
