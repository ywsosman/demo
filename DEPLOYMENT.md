# Deployment Guide

This guide will help you deploy the MediDiagnose application to Vercel with MongoDB Atlas.

## Prerequisites

- [Vercel Account](https://vercel.com)
- [MongoDB Atlas Account](https://www.mongodb.com/cloud/atlas)
- [Vercel CLI](https://vercel.com/cli) installed globally

## Step 1: Set Up MongoDB Atlas

1. **Create a MongoDB Atlas account** at https://www.mongodb.com/cloud/atlas

2. **Create a new cluster:**
   - Click "Build a Cluster"
   - Choose the free tier (M0)
   - Select your preferred region
   - Click "Create Cluster"

3. **Create a database user:**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create a username and strong password
   - Set user privileges to "Read and write to any database"

4. **Whitelist IP addresses:**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - For production, add your Vercel deployment IPs

5. **Get your connection string:**
   - Go to "Clusters" and click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `medical-diagnosis`

   Example:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/medical-diagnosis?retryWrites=true&w=majority
   ```

## Step 2: Deploy Backend to Vercel

### Option A: Using Vercel CLI

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Set environment variables:**
   ```bash
   vercel env add MONGODB_URI
   # Paste your MongoDB Atlas connection string
   
   vercel env add JWT_SECRET
   # Enter a strong random secret
   
   vercel env add NODE_ENV
   # Enter: production
   
   vercel env add FRONTEND_URL
   # Enter: https://your-frontend-url.vercel.app
   ```

5. **Deploy to production:**
   ```bash
   vercel --prod
   ```

### Option B: Using Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your Git repository
4. Configure project:
   - Framework Preset: Other
   - Root Directory: `backend`
   - Build Command: (leave empty)
   - Output Directory: (leave empty)
5. Add Environment Variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: Your strong random secret
   - `NODE_ENV`: production
   - `FRONTEND_URL`: Your frontend URL (will be added after frontend deployment)
6. Click "Deploy"

## Step 3: Deploy Frontend to Vercel

### Option A: Using Vercel CLI

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Set environment variables:**
   ```bash
   vercel env add VITE_API_URL
   # Enter: https://your-backend-url.vercel.app/api
   ```

4. **Deploy to production:**
   ```bash
   vercel --prod
   ```

### Option B: Using Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your Git repository (same repo)
4. Configure project:
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add Environment Variables:
   - `VITE_API_URL`: Your backend API URL (e.g., https://your-backend.vercel.app/api)
6. Click "Deploy"

## Step 4: Update CORS Settings

After both deployments:

1. Go to your backend Vercel project
2. Update the `FRONTEND_URL` environment variable with your actual frontend URL
3. Redeploy the backend

## Step 5: Verify Deployment

1. **Test the backend API:**
   ```bash
   curl https://your-backend-url.vercel.app/api/health
   ```

2. **Test the frontend:**
   - Visit your frontend URL
   - Try logging in with demo credentials:
     - Doctor: `doctor@demo.com` / `demo123`
     - Patient: `patient@demo.com` / `demo123`

## Environment Variables Reference

### Backend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/medical-diagnosis` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-super-secret-key-change-this` |
| `NODE_ENV` | Environment mode | `production` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://your-app.vercel.app` |
| `PORT` | Server port (optional on Vercel) | `5000` |

### Frontend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://your-backend.vercel.app/api` |

## Continuous Deployment

Vercel automatically deploys when you push to your Git repository:

- **Production**: Push to `main` branch
- **Preview**: Push to any other branch

## Monitoring and Logs

1. **View logs:**
   - Go to your Vercel project
   - Click on a deployment
   - Click "Functions" or "Runtime Logs"

2. **Monitor performance:**
   - Use Vercel Analytics
   - Check MongoDB Atlas monitoring

## Troubleshooting

### Backend Issues

1. **Cannot connect to database:**
   - Verify MongoDB Atlas connection string
   - Check IP whitelist in MongoDB Atlas
   - Ensure database user has correct permissions

2. **CORS errors:**
   - Verify `FRONTEND_URL` environment variable
   - Check that it matches your frontend domain exactly

3. **Function timeout:**
   - Optimize database queries
   - Add indexes to MongoDB collections
   - Consider upgrading Vercel plan for longer timeouts

### Frontend Issues

1. **API calls failing:**
   - Verify `VITE_API_URL` is correct
   - Check browser console for errors
   - Ensure backend is deployed and running

2. **Build failures:**
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json
   - Review build logs in Vercel dashboard

## Security Best Practices

1. **Use strong secrets:**
   - Generate JWT_SECRET with: `openssl rand -base64 32`
   - Never commit secrets to Git

2. **Enable MongoDB Atlas security:**
   - Use IP whitelisting
   - Enable authentication
   - Use encryption at rest

3. **Set up custom domains:**
   - Add custom domain in Vercel
   - Enable HTTPS (automatic with Vercel)
   - Update environment variables with new domain

4. **Monitor access:**
   - Review Vercel access logs
   - Monitor MongoDB Atlas access patterns
   - Set up alerts for unusual activity

## Scaling

As your application grows:

1. **Database:**
   - Upgrade MongoDB Atlas tier
   - Add indexes for frequently queried fields
   - Implement caching (Redis)

2. **Backend:**
   - Upgrade Vercel plan for better performance
   - Optimize API endpoints
   - Implement rate limiting

3. **Frontend:**
   - Enable Vercel Edge Network
   - Implement code splitting
   - Optimize images and assets

## Support

For issues:
- Check Vercel [documentation](https://vercel.com/docs)
- Check MongoDB Atlas [documentation](https://docs.atlas.mongodb.com/)
- Open an issue in the repository

