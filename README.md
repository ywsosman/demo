# MediDiagnose - AI Medical Diagnosis System

A full-stack medical diagnosis system powered by AI, built with React + Vite, Node.js, Express, and MongoDB.

## 🚀 Features

- **AI-Powered Diagnosis**: Symptom analysis with AI predictions
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
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Joi** for validation
- **Helmet** for security

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## 🔧 Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd demo
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 4. Environment Setup

#### Backend (.env)
Create a `.env` file in the `backend` directory:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/medical-diagnosis
JWT_SECRET=your_super_secure_jwt_secret_key_change_in_production
FRONTEND_URL=http://localhost:5173
```

#### Frontend (.env)
Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

## 🚀 Running the Application

### Development Mode

#### Start Backend Server
```bash
cd backend
npm run dev
```
Server will run on http://localhost:5000

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
│   ├── database/
│   │   └── db.js
│   ├── models/
│   │   ├── User.js
│   │   ├── PatientProfile.js
│   │   ├── DoctorProfile.js
│   │   ├── DiagnosisSession.js
│   │   ├── AuditLog.js
│   │   └── aiModel.js
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
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── vercel.json
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

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@medidiagnose.com or open an issue in the repository.

## ⚠️ Disclaimer

This is a demonstration application for educational purposes. It should not be used for actual medical diagnosis. Always consult with a qualified healthcare professional for medical advice.
