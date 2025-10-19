# Troubleshooting Guide - AI Model Issues

## 🚨 Common Error: "implemented_by_nx"

### Error Message:
```
Failed to load model: _dispatchable.__new__() got an unexpected keyword argument 'implemented_by_nx'
```

### Cause:
This is a **compatibility issue** between Python 3.13 and the ML libraries (NetworkX, PyTorch, Transformers).

---

## ✅ Solution Options

### **Option 1: Use Python 3.11 (RECOMMENDED)**

Python 3.13 is very new and has compatibility issues. Python 3.11 is stable and well-tested.

#### Install Python 3.11:
1. Download from: https://www.python.org/downloads/release/python-3118/
2. During installation, check "Add Python 3.11 to PATH"
3. Install in custom location (e.g., `C:\Python311`)

#### Use Python 3.11 for this project:
```bash
# Navigate to backend
cd backend

# Create virtual environment with Python 3.11
py -3.11 -m venv venv

# Activate it
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Test
python predict_disease.py "headache and fever"
```

#### Configure backend to use Python 3.11:
Create `backend/.env`:
```env
PYTHON_PATH=C:\Python311\python.exe
```

---

### **Option 2: Fix Python 3.13 Compatibility**

If you must use Python 3.13, try these steps:

#### Step 1: Uninstall existing packages
```bash
pip uninstall torch transformers shap networkx numpy scipy scikit-learn -y
```

#### Step 2: Install compatible versions
```bash
pip install --upgrade pip

pip install torch==2.1.0
pip install transformers==4.36.0
pip install networkx==3.2.1
pip install numpy==1.26.2
pip install scipy==1.11.4
pip install scikit-learn==1.3.2
pip install shap==0.44.0
```

#### Step 3: Test
```bash
python predict_disease.py "headache and fever"
```

---

### **Option 3: Use Virtual Environment (BEST PRACTICE)**

Create an isolated environment to avoid conflicts:

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv ml_env

# Activate it (Windows)
ml_env\Scripts\activate

# Activate it (Linux/Mac)
source ml_env/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Test
python predict_disease.py "headache and fever"
```

#### Update backend/.env to use venv:
```env
PYTHON_PATH=E:\Fullstack Course\demo\backend\ml_env\Scripts\python.exe
```

---

## 🔍 Verify Installation

### Check Python version:
```bash
python --version
```

### Check installed packages:
```bash
pip list | findstr "torch transformers shap networkx"
```

### Expected output:
```
networkx         3.2.1
shap             0.44.0
torch            2.1.0
transformers     4.36.0
```

---

## 🧪 Test Commands

### Test Python import:
```bash
python -c "import torch, transformers, shap; print('✅ All imports successful')"
```

### Test model loading:
```bash
cd backend
python predict_disease.py "test symptoms"
```

### Expected success output:
```json
{
  "success": true,
  "predicted_disease": "...",
  "confidence": 0.xx,
  ...
}
```

---

## 🐛 Other Common Issues

### Issue: "No module named 'transformers'"
**Solution:**
```bash
pip install transformers
```

### Issue: "CUDA not available" (if using GPU)
**Solution:**
```bash
pip install torch --index-url https://download.pytorch.org/whl/cu118
```

### Issue: Model files not found
**Solution:**
Verify `backend/symptom_disease_model/` contains:
- config.json
- model.safetensors
- tokenizer files

### Issue: Out of memory
**Solution:**
- Close other applications
- Ensure 4GB+ RAM available
- Use CPU instead of GPU if needed

### Issue: Prediction timeout
**Solution:**
Increase timeout in `backend/config.js`:
```javascript
aiModel: {
  modelTimeout: 180000  // 3 minutes
}
```

---

## 📋 Quick Fix Checklist

Try these in order:

1. [ ] Check Python version: `python --version`
2. [ ] Uninstall all ML packages: `pip uninstall torch transformers shap -y`
3. [ ] Clear pip cache: `pip cache purge`
4. [ ] Install with specific versions: `pip install -r requirements.txt`
5. [ ] Test imports: `python -c "import torch, transformers, shap"`
6. [ ] Test script: `python predict_disease.py "test"`
7. [ ] Check model files exist in `symptom_disease_model/`
8. [ ] Restart terminal/IDE
9. [ ] Try in virtual environment

---

## 🔄 Complete Reset (Last Resort)

If nothing works, do a complete reset:

```bash
# 1. Remove existing installations
pip uninstall torch transformers shap networkx numpy scipy scikit-learn -y

# 2. Clear pip cache
pip cache purge

# 3. Upgrade pip
python -m pip install --upgrade pip

# 4. Install in specific order
pip install numpy==1.26.2
pip install scipy==1.11.4
pip install networkx==3.2.1
pip install scikit-learn==1.3.2
pip install torch==2.1.0
pip install transformers==4.36.0
pip install shap==0.44.0

# 5. Test
python -c "import torch, transformers, shap; print('Success!')"
```

---

## 🆘 Still Not Working?

### Alternative: Use Conda (if available)

```bash
# Create conda environment
conda create -n medical_ai python=3.11

# Activate
conda activate medical_ai

# Install packages
conda install pytorch transformers -c pytorch
pip install shap

# Test
python predict_disease.py "test"
```

### Update backend/.env:
```env
PYTHON_PATH=C:\Users\YourName\anaconda3\envs\medical_ai\python.exe
```

---

## 📊 System Information

### Your Current Setup:
- OS: Windows 10
- Python: 3.13.1 (may need downgrade to 3.11)
- Backend: Node.js
- Model: BERT (symptom_disease_model/)

### Recommended Setup:
- OS: Windows 10 ✅
- Python: **3.11.x** (more stable)
- Backend: Node.js ✅
- Model: BERT ✅

---

## 💡 Prevention Tips

### For Future Projects:

1. **Use Virtual Environments**
   ```bash
   python -m venv venv
   venv\Scripts\activate
   ```

2. **Pin Dependencies**
   - Use exact versions in requirements.txt
   - Example: `torch==2.1.0` not `torch>=2.0.0`

3. **Test Before Upgrading**
   - Don't upgrade Python immediately
   - Wait for library compatibility

4. **Document Your Environment**
   ```bash
   pip freeze > requirements_frozen.txt
   ```

---

## 📞 Quick Reference

```bash
# Problem: implemented_by_nx error
# Solution: Use Python 3.11 instead of 3.13

# Install Python 3.11
# Download from: python.org

# Create venv with Python 3.11
py -3.11 -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Update backend/.env
PYTHON_PATH=venv\Scripts\python.exe

# Test
python predict_disease.py "test"
```

---

## ✅ Success Indicators

You'll know it's working when:
- ✅ No import errors
- ✅ Python script outputs JSON
- ✅ No "implemented_by_nx" error
- ✅ Model loads successfully
- ✅ Predictions return in <30 seconds

---

## 📚 Additional Resources

- Python 3.11 Download: https://www.python.org/downloads/
- PyTorch Installation: https://pytorch.org/get-started/locally/
- Transformers Docs: https://huggingface.co/docs/transformers
- SHAP Documentation: https://shap.readthedocs.io/

---

*Last Updated: October 18, 2025*
*Issue: Python 3.13 compatibility with ML libraries*
*Recommended Action: Use Python 3.11*

