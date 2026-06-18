const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PYTHON_SCRIPT_PATH = path.join(__dirname, '..', 'predict_disease.py');
const VENV_PYTHON = path.join(__dirname, '..', 'venv', 'Scripts', 'python.exe');

// Interpreter resolution order:
//   1. Local venv (has torch, shap, lime, transformers installed).
//   2. Explicit PYTHON_PATH (.env) — optional override.
//   3. 'python' on PATH.
const PYTHON_COMMAND = fs.existsSync(VENV_PYTHON)
  ? VENV_PYTHON
  : (process.env.PYTHON_PATH || 'python');

// First request pays the one-time import + model-load cost (can be minutes on a
// slow machine). Subsequent requests only pay inference + SHAP/LIME time.
const LOAD_TIMEOUT = 600000;    // 10 minutes — worker cold start (imports + model load)
const REQUEST_TIMEOUT = 180000; // 3 minutes — single warm prediction (SHAP + LIME)

// Environment hardening for the Python subprocess. These reduce native crashes
// (access violations / 0xC0000005) caused by duplicate OpenMP runtimes and
// multi-threaded contention when loading torch on Windows.
const PYTHON_ENV = {
  ...process.env,
  KMP_DUPLICATE_LIB_OK: 'TRUE',
  OMP_NUM_THREADS: '1',
  MKL_NUM_THREADS: '1',
  TOKENIZERS_PARALLELISM: 'false',
  PYTHONUNBUFFERED: '1'
};

class AIModel {
  constructor() {
    this.initialized = true;
    this.modelReady = false;

    // Persistent worker state
    this._worker = null;
    this._ready = null;        // Promise that resolves once the worker prints __READY__
    this._stdoutBuffer = '';
    this._pending = null;      // { id, resolve, timer } for the in-flight request
    this._reqCounter = 0;

    // Serialize predictions: the worker processes one request at a time, so we
    // keep a single in-flight request on the Node side too (simplest + robust).
    this._chain = Promise.resolve();

    // Clean up the worker when the backend shuts down.
    const cleanup = () => this._killWorker();
    process.on('exit', cleanup);
    process.on('SIGINT', () => { cleanup(); process.exit(0); });
    process.on('SIGTERM', () => { cleanup(); process.exit(0); });
  }

  /**
   * Public entry point. Queues the prediction so requests never overlap.
   */
  predictDiagnosis(patientData) {
    const resultPromise = this._chain.then(
      () => this._predictDiagnosis(patientData),
      () => this._predictDiagnosis(patientData)
    );
    // Advance the chain regardless of this call's outcome (swallow to avoid
    // unhandled rejections and prevent retaining results in memory).
    this._chain = resultPromise.catch(() => {});
    return resultPromise;
  }

  /**
   * Predict disease from patient data.
   * Accepts both free-text symptoms and structured dropdown selections.
   */
  async _predictDiagnosis(patientData) {
    try {
      const { symptoms, selectedSymptoms, severity, duration, additionalInfo } = patientData;

      // Build the JSON payload for predict_disease.py (symptoms only — severity/duration
      // are stored on the session for the doctor, not sent to the model)
      const payload = {};

      if (selectedSymptoms && selectedSymptoms.length > 0) {
        payload.selectedSymptoms = selectedSymptoms;
      }

      if (symptoms && symptoms.trim()) {
        payload.text = symptoms.trim();
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
        shapExplanation: pythonResult.explanation || null,
        limeExplanation: pythonResult.lime_explanation || null,
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
   * Ensure the persistent Python worker is running and has finished loading the
   * model. Returns a promise that resolves when the worker is ready.
   */
  _ensureWorker() {
    if (this._worker && this._ready) {
      return this._ready;
    }

    this._ready = new Promise((resolve, reject) => {
      console.log('[AI] Starting persistent prediction worker:', PYTHON_COMMAND);

      let worker;
      try {
        worker = spawn(PYTHON_COMMAND, [PYTHON_SCRIPT_PATH, '--serve'], { env: PYTHON_ENV });
      } catch (err) {
        return reject(err);
      }
      this._worker = worker;
      this._stdoutBuffer = '';

      let loadTimer = setTimeout(() => {
        console.error('[AI] Worker failed to become ready within load timeout.');
        this._killWorker();
        reject(new Error('Model load timeout'));
      }, LOAD_TIMEOUT);

      worker.stdout.on('data', (data) => this._onStdout(data));

      worker.stderr.on('data', (data) => {
        const text = data.toString();
        if (text.includes('__READY__')) {
          clearTimeout(loadTimer);
          loadTimer = null;
          this.modelReady = true;
          console.log('[AI] Worker ready — model loaded and warm.');
          resolve();
        }
        // Surface a trimmed view of worker logs for debugging.
        const trimmed = text.trim();
        if (trimmed) console.log('[AI worker]', trimmed.slice(-300));
      });

      worker.on('exit', (code) => {
        if (loadTimer) clearTimeout(loadTimer);
        console.error(`[AI] Worker exited (code ${code}).`);
        const isNativeCrash = code === 3221225477 || code === 139;
        if (isNativeCrash) {
          console.error(
            `[AI] Worker crashed natively (exit ${code}) — likely an unstable ` +
            `interpreter/torch build or OOM. Ensure PYTHON_PATH points to a stable env.`
          );
        }
        this._worker = null;
        this._ready = null;
        this.modelReady = false;
        // Fail the in-flight request, if any, so the caller doesn't hang.
        if (this._pending) {
          const { resolve: res, timer } = this._pending;
          clearTimeout(timer);
          this._pending = null;
          res({
            success: false,
            error: `Worker exited with code ${code}`,
            message: isNativeCrash
              ? 'Prediction engine crashed. It will restart on the next request.'
              : 'Prediction engine stopped unexpectedly.'
          });
        }
        reject(new Error(`Worker exited with code ${code}`));
      });

      worker.on('error', (err) => {
        if (loadTimer) clearTimeout(loadTimer);
        console.error('[AI] Failed to start worker:', err.message);
        this._worker = null;
        this._ready = null;
        reject(err);
      });
    });

    // Avoid unhandled rejection noise; callers handle failures explicitly.
    this._ready.catch(() => {});
    return this._ready;
  }

  /**
   * Parse newline-delimited JSON responses from the worker's stdout and resolve
   * the matching in-flight request.
   */
  _onStdout(data) {
    this._stdoutBuffer += data.toString();
    let newlineIndex;
    while ((newlineIndex = this._stdoutBuffer.indexOf('\n')) !== -1) {
      const line = this._stdoutBuffer.slice(0, newlineIndex).trim();
      this._stdoutBuffer = this._stdoutBuffer.slice(newlineIndex + 1);
      if (!line) continue;

      let result;
      try {
        result = JSON.parse(line);
      } catch (err) {
        console.error('[AI] Could not parse worker output line:', line.slice(0, 200));
        continue;
      }

      if (this._pending && (result.id === undefined || result.id === this._pending.id)) {
        const { resolve, timer } = this._pending;
        clearTimeout(timer);
        this._pending = null;
        delete result.id;
        resolve(result);
      }
    }
  }

  /**
   * Send a JSON payload to the persistent worker and await its response.
   */
  async callPythonPredictor(jsonPayload) {
    try {
      await this._ensureWorker();
    } catch (err) {
      return {
        success: false,
        error: err.message,
        message: 'Failed to start prediction engine. Check PYTHON_PATH and dependencies.'
      };
    }

    const id = ++this._reqCounter;
    const request = { id, ...JSON.parse(jsonPayload) };

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        console.error(`[AI] Request ${id} timed out; restarting worker.`);
        this._pending = null;
        this._killWorker(); // stuck worker — force a clean restart next call
        resolve({
          success: false,
          error: 'Prediction timeout',
          message: 'Model prediction took too long. Please try again.'
        });
      }, REQUEST_TIMEOUT);

      this._pending = { id, resolve, timer };

      try {
        this._worker.stdin.write(JSON.stringify(request) + '\n');
      } catch (err) {
        clearTimeout(timer);
        this._pending = null;
        this._killWorker();
        resolve({
          success: false,
          error: err.message,
          message: 'Failed to send request to prediction engine.'
        });
      }
    });
  }

  _killWorker() {
    if (this._worker) {
      try {
        this._worker.kill();
      } catch {
        /* ignore */
      }
      this._worker = null;
    }
    this._ready = null;
    this.modelReady = false;
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
