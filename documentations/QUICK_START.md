# Quick Start Guide

Get the MediDiagnose application running in 5 minutes!

## Prerequisites

- Node.js 16+ installed
- MongoDB installed locally OR MongoDB Atlas account
- npm or yarn

## Setup Steps

### 1. Install Dependencies (2 minutes)

```bash
# From project root
npm run install:all
```

This will install dependencies for root, backend, and frontend.

### 2. Set Up MongoDB

**Option A: Local MongoDB (Fastest for Development)**

1. Install MongoDB: https://docs.mongodb.com/manual/installation/
2. Start MongoDB:
   ```bash
   mongod
   ```

**Option B: MongoDB Atlas (Recommended for Production)**

1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get your connection string

### 3. Configure Environment Variables (1 minute)

**Backend Environment**

Create `backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/medical-diagnosis
JWT_SECRET=my_super_secret_jwt_key_12345
FRONTEND_URL=http://localhost:5173
```

For MongoDB Atlas, use your connection string:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/medical-diagnosis
```

**Frontend Environment**

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Start the Application (30 seconds)

**Option A: Start Both Together**
```bash
npm run dev
```

**Option B: Start Separately**

Terminal 1 - Backend:
```bash
npm run dev:backend
```

Terminal 2 - Frontend:
```bash
npm run dev:frontend
```

### 5. Access the Application

Open your browser:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

### 6. Login with Demo Account

**Doctor Account:**
- Email: `doctor@demo.com`
- Password: `demo123`

**Patient Account:**
- Email: `patient@demo.com`
- Password: `demo123`

## 🎉 You're All Set!

The application should now be running with:
- ✅ MongoDB database connected
- ✅ Backend API on port 5000
- ✅ Frontend on port 5173
- ✅ Hot reload enabled for development

## Common Issues

### MongoDB Connection Error

**Error**: "Failed to connect to MongoDB"

**Solution**:
```bash
# Check if MongoDB is running
mongosh

# Or start MongoDB
mongod
```

### Port Already in Use

**Error**: "Port 5000 is already in use"

**Solution**: Change the port in `backend/.env`:
```env
PORT=5001
```

### Dependencies Installation Failed

**Solution**:
```bash
# Clean install
rm -rf node_modules backend/node_modules frontend/node_modules
rm package-lock.json backend/package-lock.json frontend/package-lock.json
npm run install:all
```

### Vite Not Starting

**Solution**:
```bash
cd frontend
npm install vite --save-dev
npm run dev
```

## Next Steps

1. **Explore the Application**:
   - Create a new patient account
   - Submit a diagnosis as a patient
   - Review diagnoses as a doctor

2. **Customize**:
   - Modify frontend components in `frontend/src/pages`
   - Update API endpoints in `backend/routes`
   - Enhance AI model in `backend/models/aiModel.js`

3. **Deploy**:
   - Follow `DEPLOYMENT.md` for Vercel deployment
   - Set up MongoDB Atlas for production

## Development Tips

### Hot Reload
- **Frontend**: Automatic on file save (Vite HMR)
- **Backend**: Automatic with nodemon

### Database Inspection

**MongoDB Compass** (GUI):
```bash
# Download: https://www.mongodb.com/products/compass
# Connect to: mongodb://localhost:27017
```

**MongoDB Shell**:
```bash
mongosh
use medical-diagnosis
db.users.find()
```

### API Testing

**Using curl**:
```bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@demo.com","password":"demo123"}'
```

**Using Postman**:
Import the API endpoints from `backend/routes/`

## File Structure Overview

```
demo/
├── backend/          # Node.js + Express + MongoDB
│   ├── routes/       # API endpoints
│   ├── models/       # Mongoose models
│   ├── middleware/   # Auth & validation
│   └── server.js     # Entry point
├── frontend/         # React + Vite
│   ├── src/
│   │   ├── pages/    # Page components
│   │   ├── components/ # Reusable components
│   │   └── contexts/ # React contexts
│   └── vite.config.js
└── package.json      # Root scripts
```

## Available Scripts

```bash
npm run dev              # Start both backend and frontend
npm run dev:backend      # Start backend only
npm run dev:frontend     # Start frontend only
npm run build:frontend   # Build frontend for production
npm run start:backend    # Start backend in production mode
npm run install:all      # Install all dependencies
```

## Getting Help

- Check `README.md` for detailed documentation
- See `DEPLOYMENT.md` for deployment instructions
- Review `MIGRATION_SUMMARY.md` for technical details

## 🚀 Ready to Build!

You're now ready to develop and customize the MediDiagnose application!

