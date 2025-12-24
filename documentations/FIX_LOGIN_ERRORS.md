# 🔧 Fixing Login Errors - Database Reset Guide

## 🚨 Problem
After adding the admin role to the User model, existing users in the database have incompatible role values, causing login to fail with **400 Bad Request** errors.

## ✅ Solution
Reset and reseed the database with the updated schema.

## 📋 Quick Fix Steps

### Option 1: Using the Reset Script (Recommended)

1. **Stop the backend server** (if running)
   - Press `Ctrl+C` in the terminal running the backend

2. **Run the reset script:**
   ```bash
   cd backend
   npm run reset-db
   ```

3. **Restart the backend:**
   ```bash
   npm start
   ```

4. **Login with admin credentials:**
   ```
   Email: admin@demo.com
   Password: demo123
   ```

### Option 2: Manual MongoDB Reset

If you have MongoDB Compass or MongoDB Shell:

1. **Connect to MongoDB**
2. **Drop the `medical-diagnosis` database**
3. **Restart the backend** - it will auto-seed

### Option 3: Delete Database File (if using local MongoDB)

1. **Stop the backend server**
2. **Delete the database file:**
   ```bash
   # If using SQLite (check backend folder)
   rm backend/database.sqlite
   
   # If using MongoDB, connect and drop:
   mongo medical-diagnosis --eval "db.dropDatabase()"
   ```
3. **Restart the backend**

## 🎯 What the Reset Script Does

The `reset-db.js` script will:
1. ✅ Connect to MongoDB
2. ✅ Clear all existing data (Users, Profiles, Diagnoses, Logs)
3. ✅ Create 3 demo accounts with the NEW schema:
   - **Admin:** admin@demo.com / demo123
   - **Doctor:** doctor@demo.com / demo123
   - **Patient:** patient@demo.com / demo123
4. ✅ Close the connection

## 📝 After Reset

You should see this output:

```
🔄 Connecting to MongoDB...
✅ Connected to MongoDB
🗑️  Clearing existing data...
✅ Existing data cleared
🌱 Seeding new data...
✅ Admin created: admin@demo.com / demo123
✅ Doctor created: doctor@demo.com / demo123
✅ Patient created: patient@demo.com / demo123

🎉 Database reset complete!

📋 Demo Accounts:
👑 Admin:   admin@demo.com   / demo123
👨‍⚕️ Doctor:  doctor@demo.com  / demo123
🧑‍🦱 Patient: patient@demo.com / demo123

✅ Database connection closed
```

## 🔍 Understanding the Errors

### 1. `runtime.lastError: Could not establish connection`
- **Cause:** Browser extension trying to communicate
- **Impact:** None (can be ignored)
- **Fix:** Not needed

### 2. `favicon.ico 404`
- **Cause:** Missing favicon file
- **Impact:** Visual only (browser tab icon)
- **Fix:** Optional (add favicon later)

### 3. `400 Bad Request on /api/auth/login` ⚠️
- **Cause:** Database users have old role enum values
- **Impact:** Cannot login (CRITICAL)
- **Fix:** Reset database (this guide)

## ✅ Verification Steps

After resetting the database:

1. **Backend should show:**
   ```
   📊 Connected to MongoDB database
   🌱 Demo data seeded successfully
   👑 Demo Admin: admin@demo.com / demo123
   👨‍⚕️ Demo Doctor: doctor@demo.com / demo123
   🧑‍🦱 Demo Patient: patient@demo.com / demo123
   ```

2. **Try logging in at http://localhost:5173/login**
   - Use: `admin@demo.com` / `demo123`
   - Should successfully login and redirect to admin dashboard

3. **Check browser console**
   - Should see no 400 errors
   - Login should succeed

## 🎉 Success!

Once logged in as admin, you should see:
- Admin Dashboard with statistics
- Navigation menu with "Admin Dashboard" and "Manage Users"
- Ability to create/edit/delete users

## 🐛 Still Having Issues?

### Backend not starting?
- Check MongoDB is running: `mongosh` or check MongoDB service
- Check `.env` file has correct MONGODB_URI
- Check backend console for errors

### Still getting 400 errors?
- Verify the reset script ran successfully
- Check backend logs for detailed error messages
- Try clearing browser cache and localStorage
- Restart both frontend and backend

### Database connection errors?
```bash
# Check MongoDB status
# Windows:
net start MongoDB

# Mac/Linux:
sudo systemctl status mongod
```

## 📞 Need More Help?

Check these files:
- `backend/reset-db.js` - The reset script
- `backend/database/db.js` - Database initialization
- `backend/models/User.js` - User model with admin role
- Console output for specific error messages

---

**Remember:** After any schema changes to models, always reset the database or migrate existing data to match the new schema!

