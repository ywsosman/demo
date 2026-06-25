# MediDiagnose

A full-stack medical diagnosis platform for graduation research. Patients submit symptoms, a fine-tuned BERT model generates disease predictions with SHAP and LIME explainability, and licensed doctors review cases, prescribe treatment, and sign off on results.

**Not for clinical use.** This is an educational demonstration and must not be used for real medical decisions.

## Features

- **AI disease prediction** — Fine-tuned BERT model with temperature-scaled confidence
- **Explainable AI** — Unified SHAP + LIME word-importance visualization
- **Symptom input** — Structured dropdown vocabulary or free-text descriptions
- **Doctor workflow** — Session locking, review queue, prescriptions (PDF), ICD-10 mapping
- **Patient portal** — Symptom checker, diagnosis history, profile management
- **Admin dashboard** — User management, audit logs, system statistics
- **Notifications** — In-app alerts and optional SMTP email delivery
- **Diagnosis state machine** — Tracked session lifecycle from submission to doctor review
- **Authentication** — JWT-based auth with patient, doctor, and admin roles

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, GSAP, Recharts |
| Backend | Node.js, Express, MongoDB, Mongoose |
| AI | Python, PyTorch, Transformers, SHAP, LIME |
| Auth & security | JWT, bcrypt, Helmet, rate limiting, Joi validation |

## Prerequisites

- Node.js 16+
- Python 3.12 or 3.13 (3.14+ is not supported by the current PyTorch stack)
- MongoDB (local or Atlas)
- npm

## Installation

### 1. Clone and install dependencies

```bash
git clone <your-repo-url>
cd demo
npm run install:all
```

### 2. Python environment (AI model)

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
pip install -r requirements.txt

# macOS / Linux
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Model files

Ensure the trained model is present:

```
backend/symptom_disease_model/
├── config.json
├── model.safetensors
├── tokenizer.json
└── ...
```

### 4. Environment variables

**Backend** — create `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/medical-diagnosis
JWT_SECRET=your_super_secure_jwt_secret_key_change_in_production
FRONTEND_URL=http://localhost:5173
PYTHON_PATH=python

# Optional SMTP (emails are logged when unset)
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=MediDiagnose <no-reply@medidiagnose.local>
```

**Frontend** — create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

## Running locally

### Test the Python predictor

```bash
cd backend
python predict_disease.py "{\"text\":\"I have a headache and fever\"}"
```

### Start both servers (from project root)

```bash
npm run dev
```

Or run them separately:

```bash
npm run dev:backend   # http://localhost:5000
npm run dev:frontend  # http://localhost:5173
```

The first AI prediction after startup can take 20–30 seconds while the persistent Python worker loads the model. Subsequent requests are faster.

### Production build

```bash
npm run build:frontend
npm run start:backend
```

## Demo accounts

On first run with an empty database, demo users are seeded automatically:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | demo123 |
| Doctor | doctor@demo.com | demo123 |
| Patient | patient@demo.com | demo123 |

## Project structure

```
demo/
├── backend/
│   ├── server.js                  # Express server
│   ├── predict_disease.py         # BERT inference + SHAP/LIME (CLI & --serve worker)
│   ├── train_model.py             # Model training script
│   ├── symptom_disease_model/     # Fine-tuned BERT weights
│   ├── symptom_vocabulary.json    # Dropdown symptom vocabulary
│   ├── models/                    # Mongoose schemas + aiModel.js worker wrapper
│   ├── routes/                    # auth, diagnosis, users, admin, notifications
│   ├── services/                  # Email and notification delivery
│   └── utils/                     # FSM, ICD-10, PDF generation, formatting
├── frontend/
│   └── src/
│       ├── pages/                 # Role-specific dashboards and symptom checker
│       ├── components/            # UI, layout, animations
│       ├── contexts/              # Auth, theme, loading
│       └── services/api.jsx       # Axios API client
├── documentations/                # Thesis figures and implementation notes
├── notebooks/                     # Training and evaluation notebooks
└── package.json                   # Root scripts (concurrent dev, install:all)
```

## API overview

### Auth
- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login
- `GET /api/auth/profile` — Current user + profile
- `PUT /api/auth/profile` — Update profile

### Diagnosis
- `GET /api/diagnosis/symptoms` — Symptom vocabulary
- `POST /api/diagnosis/submit` — Submit symptoms (patient)
- `POST /api/diagnosis/:id/resubmit` — Resubmit after doctor request (patient)
- `GET /api/diagnosis/history` — Patient history
- `GET /api/diagnosis/pending` — Doctor review queue
- `GET /api/diagnosis/:id` — Session details
- `POST /api/diagnosis/:id/lock` — Acquire review lock (doctor)
- `PUT /api/diagnosis/:id/review` — Submit doctor review
- `GET /api/diagnosis/:id/prescription/pdf` — Download prescription PDF
- `GET /api/diagnosis/stats/overview` — Statistics

### Users
- `GET /api/users/patients` — List patients (doctor)
- `GET /api/users/patients/:id` — Patient details + sessions
- `GET /api/users/search/patients?q=` — Search patients
- `GET /api/users/activity/:id?` — Audit activity

### Admin
- `GET /api/admin/stats` — Dashboard statistics
- `GET /api/admin/users` — List users (paginated)
- `POST /api/admin/users` — Create user
- `PUT /api/admin/users/:id` — Update user
- `DELETE /api/admin/users/:id` — Delete user
- `POST /api/admin/users/:id/reset-password` — Reset password
- `GET /api/admin/audit-logs` — Audit trail

### Notifications
- `GET /api/notifications` — List in-app notifications
- `PATCH /api/notifications/:id/read` — Mark one read
- `PATCH /api/notifications/read-all` — Mark all read

## AI pipeline

1. Patient submits symptoms via the React frontend.
2. Express creates a diagnosis session and responds immediately.
3. A background job calls the persistent Python worker (`predict_disease.py --serve`).
4. BERT predicts the disease; SHAP and LIME produce unified word-importance scores.
5. Results are saved to MongoDB and doctors are notified.
6. The frontend displays predictions and explainability charts once the doctor review is complete.

Retrain the model with `python backend/train_model.py`. Export thesis figures with `python backend/generate_xai_figures.py`.

## Deploying to Vercel

The backend includes a Vercel serverless entry point at `backend/api/index.js`.

```bash
npm install -g vercel
vercel login
vercel
```

Set environment variables in the Vercel dashboard (`MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL`, `NODE_ENV=production`, and frontend `VITE_API_URL`).

## License

Reserved to Youssef Waleed and Ali Mohamed Hassanein. Graduation project — all rights reserved. Not intended for real-world medical use.

## Support

youssef.waleed2231@gmail.com

## Disclaimer

This application is for educational and research purposes only. Always consult a qualified healthcare professional for medical advice.
