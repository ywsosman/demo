# MediDiagnose - AI Medical Diagnosis System

A full-stack medical diagnosis system powered by AI, built with React + Vite, Node.js, Express, and MongoDB.

## 🚀 Features

- **AI-Powered Diagnosis**: Fine-tuned BERT model for disease prediction
- **Explainable AI**: SHAP visualization showing which symptoms influenced the diagnosis
- **Word Importance**: Visual highlighting of key symptoms in patient descriptions
- **Patient Dashboard**: Track medical history and diagnosis sessions
- **Doctor Dashboard**: Review patient cases and provide medical feedback
- **Secure Authentication**: JWT-based authentication system
- **Real-time Updates**: Live diagnosis status updates
- **Responsive Design**: Beautiful UI built with Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- **React 18** with **Vite** for fast development
- **React Router** for navigation
- **Axios** for API calls
- **Tailwind CSS** for styling
- **Heroicons** for icons
- **React Hot Toast** for notifications

### Backend
- **Node.js** with **Express**
- **MongoDB** with **Mongoose** for database
- **Python** with **Transformers** for AI model
- **SHAP** for explainable AI
- **PyTorch** for model inference
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Joi** for validation
- **Helmet** for security

## 📋 Prerequisites

- Node.js (v16 or higher)
- Python (v3.8 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn
- pip (Python package manager)

## 🔧 Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd demo
```

### 2. Install Python Dependencies (for AI Model)

```bash
cd backend
pip install -r requirements.txt
```

**Note**: On Linux/Mac, use `pip3` instead of `pip`

### 3. Install Backend Dependencies

```bash
cd backend
npm install
```

### 4. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 5. Verify AI Model Files

Ensure your fine-tuned BERT model is in:
```
backend/symptom_disease_model/
├── config.json
├── model.safetensors
├── tokenizer files...
```

### 6. Environment Setup

#### Backend (.env)
Create a `.env` file in the `backend` directory:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/medical-diagnosis
JWT_SECRET=your_super_secure_jwt_secret_key_change_in_production
FRONTEND_URL=http://localhost:5173
PYTHON_PATH=python  # or python3 on Linux/Mac
```

#### Frontend (.env)
Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

## 🚀 Running the Application

### Quick Start

For a quick start with the AI model, see [QUICK_START_AI_MODEL.md](./QUICK_START_AI_MODEL.md)

### Development Mode

#### Test Python AI Model (First Time)
```bash
cd backend
python predict_disease.py "I have a headache and fever"
```
You should see JSON output with disease prediction and SHAP explanations.

#### Start Backend Server
```bash
cd backend
npm run dev
```
Server will run on http://localhost:5000

**Note**: First AI prediction will be slow (20-30s) as the model loads into memory.

#### Start Frontend Development Server
```bash
cd frontend
npm run dev
```
Frontend will run on http://localhost:5173

### Production Build

#### Build Frontend
```bash
cd frontend
npm run build
```

#### Start Backend in Production
```bash
cd backend
npm start
```

## 👥 Demo Accounts

After first run, the system creates demo accounts:

**Doctor Account:**
- Email: `doctor@demo.com`
- Password: `demo123`

**Patient Account:**
- Email: `patient@demo.com`
- Password: `demo123`

## 🌐 Deploying to Vercel

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Deploy

```bash
vercel
```

### 4. Environment Variables on Vercel

Set the following environment variables in Vercel dashboard:

**For Backend:**
- `MONGODB_URI`: Your MongoDB Atlas connection string
- `JWT_SECRET`: Your production JWT secret
- `NODE_ENV`: production
- `FRONTEND_URL`: Your Vercel frontend URL

**For Frontend:**
- `VITE_API_URL`: Your Vercel backend API URL

## 📁 Project Structure

```
demo/
├── backend/
│   ├── config.js
│   ├── server.js
│   ├── predict_disease.py         # Python script for AI predictions
│   ├── requirements.txt            # Python dependencies
│   ├── symptom_disease_model/      # Fine-tuned BERT model
│   │   ├── config.json
│   │   ├── model.safetensors
│   │   └── tokenizer files
│   ├── database/
│   │   └── db.js
│   ├── models/
│   │   ├── User.js
│   │   ├── PatientProfile.js
│   │   ├── DoctorProfile.js
│   │   ├── DiagnosisSession.js    # Now includes SHAP data
│   │   ├── AuditLog.js
│   │   └── aiModel.js              # Node.js wrapper for Python model
│   ├── routes/
│   │   ├── auth.js
│   │   ├── diagnosis.js
│   │   └── users.js
│   ├── middleware/
│   │   └── auth.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   │   └── SymptomChecker.jsx  # Now with SHAP visualization
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── AI_MODEL_INTEGRATION.md         # AI integration documentation
├── PYTHON_SETUP.md                 # Python setup guide
├── QUICK_START_AI_MODEL.md         # Quick start guide
└── README.md
```

## 🔐 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting on API endpoints
- Helmet.js for security headers
- Input validation with Joi
- CORS configuration

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Diagnosis Endpoints
- `POST /api/diagnosis/submit` - Submit new diagnosis
- `GET /api/diagnosis/history` - Get patient history
- `GET /api/diagnosis/pending` - Get pending cases (doctors)
- `GET /api/diagnosis/:id` - Get specific diagnosis
- `PUT /api/diagnosis/:id/review` - Review diagnosis (doctors)
- `GET /api/diagnosis/stats/overview` - Get statistics

### User Endpoints
- `GET /api/users/patients` - Get all patients (doctors)
- `GET /api/users/patients/:id` - Get patient details
- `GET /api/users/search/patients` - Search patients
- `GET /api/users/activity/:id?` - Get activity logs


## 🤖 AI Model Integration

This application uses a fine-tuned BERT model for disease prediction with SHAP explanations.

### Key Features:
- **Fine-tuned BERT**: Medical symptom-to-disease prediction
- **SHAP Explanations**: Visual word importance for transparency
- **Node.js Integration**: Python called as subprocess from Node.js
- **Explainable AI**: See which symptoms influenced the diagnosis

### Documentation:
- [Quick Start Guide](./QUICK_START_AI_MODEL.md) - Get up and running in 5 minutes
- [Python Setup](./PYTHON_SETUP.md) - Detailed Python environment setup
- [Integration Guide](./AI_MODEL_INTEGRATION.md) - Architecture and technical details

### How It Works:
1. Patient enters symptoms in React frontend
2. Node.js backend receives request
3. Node.js spawns Python subprocess with symptom text
4. Python loads BERT model and generates predictions
5. Python calculates SHAP values for explainability
6. Results returned to Node.js and saved to MongoDB
7. Frontend displays predictions with word importance visualization

## 📄 License

This project is reserved to Youssef Waleed and Ali Mohamed Hassanein. PROJECT IS FOR GRADUATION PROJECT, SHOULD NOT BE USED IN REAL LIFE AS IT IS NOT FINISHED OR TAILORED TO USE IN THE REAL WORLD, ALL RIGHTS RESERVED.

## 🆘 Support

For support, email youssef.waleed2231@gmail.com

## ⚠️ Disclaimer

This is a demonstration application for educational purposes. It should not be used for actual medical diagnosis. Always consult with a qualified healthcare professional for medical advice.
