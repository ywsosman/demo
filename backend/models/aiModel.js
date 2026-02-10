const { spawn } = require('child_process');
const path = require('path');

// Configuration
const PYTHON_SCRIPT_PATH = path.join(__dirname, '..', 'predict_disease.py');
const PYTHON_COMMAND = process.env.PYTHON_PATH || 'python';  // or 'python3' on some systems
const MODEL_TIMEOUT = 180000; // 180 seconds (3 minutes) - allows time for BERT model + SHAP initialization

class AIModel {
  constructor() {
    this.initialized = true;
    this.modelReady = false;
  }

  /**
   * Call Python script to predict disease using fine-tuned BERT model
   * @param {Object} patientData - Patient symptom data
   * @returns {Promise<Object>} Prediction results with SHAP explanations
   */
  async predictDiagnosis(patientData) {
    try {
      const { symptoms, severity, duration, additionalInfo } = patientData;

      // Construct full symptom text
      let fullSymptomText = symptoms;

      // Optionally enhance with additional context
      if (additionalInfo) {
        fullSymptomText += `. Additional info: ${additionalInfo}`;
      }

      // Call Python prediction script
      const pythonResult = await this.callPythonPredictor(fullSymptomText);

      if (!pythonResult.success) {
        console.error('Python prediction failed:', pythonResult.error);
        // Fallback to basic response
        return {
          predictions: [],
          confidence: 0,
          explanation: pythonResult.message || 'Model prediction failed. Please try again.',
          error: pythonResult.error,
          timestamp: new Date().toISOString()
        };
      }

      // Format predictions for frontend
      const predictions = pythonResult.top_predictions.map(pred => ({
        condition: pred.disease,
        confidence: pred.confidence,
        description: `AI-predicted condition: ${pred.disease}`,
        recommendations: this.getRecommendations(pred.disease),
        matchedSymptoms: []
      }));

      // Build explanation text
      const explanation = this.generateExplanationFromShap(
        pythonResult.predicted_disease,
        pythonResult.confidence,
        pythonResult.word_importance
      );

      return {
        predictions,
        confidence: pythonResult.confidence,
        explanation,
        shapExplanation: pythonResult.explanation,  // Raw SHAP data
        wordImportance: pythonResult.word_importance,  // Top important words
        predictedDisease: pythonResult.predicted_disease,
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
   * Spawn Python process to run disease prediction
   * @param {string} symptomText - Patient's symptom description
   * @returns {Promise<Object>} Prediction result from Python
   */
  callPythonPredictor(symptomText) {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn(PYTHON_COMMAND, [
        PYTHON_SCRIPT_PATH,
        symptomText
      ]);

      let outputData = '';
      let errorData = '';

      // Collect stdout
      pythonProcess.stdout.on('data', (data) => {
        outputData += data.toString();
      });

      // Collect stderr
      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
      });

      // Handle process completion
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Python script error:', errorData);
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

      // Handle process errors
      pythonProcess.on('error', (error) => {
        console.error('Failed to start Python process:', error);
        resolve({
          success: false,
          error: error.message,
          message: 'Failed to start prediction process. Ensure Python is installed.'
        });
      });

      // Set timeout
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

  /**
   * Generate human-readable explanation from SHAP word importance
   * @param {string} disease - Predicted disease
   * @param {number} confidence - Confidence score
   * @param {Array} wordImportance - Array of word importance objects
   * @returns {string} Explanation text
   */
  generateExplanationFromShap(disease, confidence, wordImportance) {
    if (!wordImportance || wordImportance.length === 0) {
      return `The AI model predicts ${disease} with ${(confidence * 100).toFixed(1)}% confidence.`;
    }

    // Get top positive contributors
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

  /**
   * Get general recommendations for a disease
   * @param {string} diseaseName - Name of the disease
   * @returns {Array<string>} List of recommendations
   */
  getRecommendations(diseaseName) {
    // Generic recommendations - can be expanded based on disease database
    const genericRecommendations = [
      'Consult with a healthcare professional for proper diagnosis',
      'Monitor your symptoms and note any changes',
      'Keep track of symptom severity and duration',
      'Seek immediate medical attention if symptoms worsen'
    ];

    // You can add disease-specific recommendations here
    return genericRecommendations;
  }

}

module.exports = new AIModel();
