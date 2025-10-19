# Quick Start: AI Model Integration

## 🚀 Get Started in 5 Minutes

This guide will get your AI-powered medical diagnosis system up and running quickly.

## Step 1: Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

**Note**: Use `pip3` on Linux/Mac if needed.

## Step 2: Verify Model Files

Make sure your fine-tuned model is in the correct location:

```bash
backend/symptom_disease_model/
├── config.json
├── model.safetensors
├── tokenizer files...
```

✅ If you see these files, you're good to go!

## Step 3: Test Python Script

Quick test to ensure everything works:

```bash
cd backend
python predict_disease.py "I have a headache and fever"
```

**Expected output**: JSON with disease prediction and SHAP values

## Step 4: Configure Python Path (if needed)

### Windows:
```bash
# Usually works with:
python --version
# If yes, no configuration needed!
```

### Linux/Mac:
```bash
# Check which Python command works:
python3 --version

# If python3 works, create backend/.env:
echo "PYTHON_PATH=python3" > backend/.env
```

## Step 5: Start Your Application

### Terminal 1 - Backend:
```bash
cd backend
npm install  # First time only
npm run dev
```

### Terminal 2 - Frontend:
```bash
cd frontend
npm install  # First time only
npm run dev
```

## Step 6: Test It Out!

1. Open browser to: `http://localhost:5173`
2. Login as a patient (or register)
3. Go to **Symptom Checker**
4. Enter symptoms like: "severe headache, nausea, sensitivity to light"
5. Submit and watch the magic! ✨

You should see:
- **Disease predictions** with confidence scores
- **SHAP visualization** showing which words influenced the prediction
- **Color-coded words** (red = important for diagnosis)

## 🎉 That's It!

Your AI model is now integrated and working!

---

## ⚠️ Troubleshooting

### "Python not found"
```bash
# Find Python path:
which python3  # Linux/Mac
where python   # Windows

# Add to backend/.env:
PYTHON_PATH=/full/path/to/python3
```

### "Module not found"
```bash
pip install transformers shap torch --upgrade
```

### First prediction is slow
- **Normal!** First prediction takes 20-30 seconds (loading model)
- Subsequent predictions are much faster (2-5 seconds)
- Keep the server running between tests

### Out of memory
- Ensure 4GB+ RAM available
- Close other applications
- Consider using model on a server with more RAM

---

## 📚 Next Steps

- Read [PYTHON_SETUP.md](./PYTHON_SETUP.md) for detailed setup
- Read [AI_MODEL_INTEGRATION.md](./AI_MODEL_INTEGRATION.md) for architecture details
- Customize disease recommendations in `backend/models/aiModel.js`
- Add more disease-specific information

## 🔧 Configuration Options

### Increase Timeout (if predictions timeout)

`backend/config.js`:
```javascript
aiModel: {
  modelTimeout: 120000  // 120 seconds
}
```

### Use GPU (for faster predictions)

```bash
pip install torch --index-url https://download.pytorch.org/whl/cu118
```

### Change Model Path

```env
# backend/.env
MODEL_PATH=/path/to/different/model
```

---

## 📊 What You've Built

Your application now:
- ✅ Uses state-of-the-art BERT model for disease prediction
- ✅ Provides explainable AI with SHAP visualizations
- ✅ Shows which symptoms influenced the diagnosis
- ✅ Maintains Node.js backend architecture
- ✅ Stores predictions in MongoDB
- ✅ Displays beautiful visualizations in React

**Congratulations!** 🎊 You've successfully integrated advanced medical AI into your web application!

