# Python Setup Guide for Medical Diagnosis AI Model

This guide will help you set up the Python environment needed to run the disease prediction model with SHAP explanations.

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Node.js 16+ (for the main backend)

## Installation Steps

### 1. Check Python Installation

First, verify that Python is installed on your system:

```bash
# Windows
python --version

# Linux/Mac
python3 --version
```

If Python is not installed, download it from [python.org](https://www.python.org/downloads/)

### 2. Install Python Dependencies

Navigate to the backend directory and install the required packages:

```bash
cd backend
pip install -r requirements.txt
```

**Note:** On Linux/Mac, you might need to use `pip3` instead of `pip`:

```bash
pip3 install -r requirements.txt
```

### 3. Verify Model Files

Ensure your fine-tuned BERT model is located at:

```
backend/symptom_disease_model/
├── config.json
├── model.safetensors
├── special_tokens_map.json
├── tokenizer_config.json
├── tokenizer.json
├── training_args.bin
└── vocab.txt
```

### 4. Test the Python Script

You can test the prediction script independently:

```bash
cd backend
python predict_disease.py "I have a headache, fever, and body aches"
```

Expected output: JSON with predictions and SHAP explanations.

### 5. Configure Python Path in Backend

If you're using `python3` instead of `python`, update your environment variable:

**Option A: Using .env file (Recommended)**

Create a `.env` file in the `backend` directory:

```env
PYTHON_PATH=python3
```

**Option B: System Environment Variable**

- **Windows:** Add `PYTHON_PATH=python` to system environment variables
- **Linux/Mac:** Add to `~/.bashrc` or `~/.zshrc`:
  ```bash
  export PYTHON_PATH=python3
  ```

## GPU Support (Optional)

If you have a CUDA-capable GPU and want faster predictions:

1. Install PyTorch with CUDA support:

```bash
# For CUDA 11.8
pip install torch --index-url https://download.pytorch.org/whl/cu118
```

2. Verify GPU is detected:

```bash
python -c "import torch; print(torch.cuda.is_available())"
```

## Troubleshooting

### Issue: "Python not found"

**Solution:** Make sure Python is in your system PATH, or specify the full path in `.env`:

```env
PYTHON_PATH=/usr/bin/python3
```

### Issue: "Module not found" errors

**Solution:** Reinstall dependencies with:

```bash
pip install -r requirements.txt --force-reinstall
```

### Issue: Model loading takes too long

**Solution:** The first prediction will be slow (20-30 seconds) as the model loads into memory. Subsequent predictions are faster. Consider:
- Using GPU for faster inference
- Keeping the Node.js server running (model stays in memory between requests)

### Issue: "Killed" or memory errors

**Solution:** The BERT model requires significant RAM (2-4GB). Ensure your system has:
- At least 4GB RAM available
- Swap space enabled (Linux/Mac)

### Issue: SHAP explanations fail

**Solution:** Ensure all dependencies are correctly installed:

```bash
pip install shap transformers torch --upgrade
```

## Development vs Production

### Development
- Use default timeout (60 seconds)
- Enable detailed error logging
- Run model on CPU

### Production
- Increase timeout if needed: `MODEL_TIMEOUT=120000` in config
- Use GPU for faster inference
- Consider caching predictions for common symptoms
- Implement request queuing for high load

## Model Update Workflow

When you update your fine-tuned model:

1. Replace files in `backend/symptom_disease_model/`
2. Restart the Node.js backend server
3. Test with a sample prediction
4. Monitor first few predictions for accuracy

## Integration with Node.js

The Node.js backend calls the Python script as a subprocess:

```javascript
// backend/models/aiModel.js
const pythonProcess = spawn(PYTHON_COMMAND, [
  PYTHON_SCRIPT_PATH,
  symptomText
]);
```

This architecture keeps your backend Node.js-based while leveraging Python only for ML inference.

## Performance Optimization

### Tips for faster predictions:

1. **Keep the server running**: Model loading is the slowest part
2. **Use SSD storage**: Faster model loading from disk
3. **Enable GPU**: 5-10x faster inference
4. **Batch predictions**: If processing multiple requests
5. **Consider model quantization**: Smaller model size, faster loading

## Next Steps

After setup is complete:

1. Start the Node.js backend: `npm run dev` (in backend directory)
2. Start the React frontend: `npm run dev` (in frontend directory)
3. Test the symptom checker through the web interface
4. Check browser console and server logs for any errors

## Support

For issues specific to:
- **Python/Model**: Check Python console output and error logs
- **Node.js Integration**: Check backend server logs
- **Frontend Display**: Check browser console for React errors

---

## Quick Reference

```bash
# Install dependencies
cd backend
pip install -r requirements.txt

# Test Python script
python predict_disease.py "test symptoms"

# Start Node.js backend
npm run dev

# Set Python path (if needed)
# Add to backend/.env
PYTHON_PATH=python3
```

