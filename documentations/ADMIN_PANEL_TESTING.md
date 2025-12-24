# Quick Start: Testing the Admin Panel

## 🚀 Starting the Application

### Option 1: Using the Demo Script (Recommended)
```bash
npm run demo
```

### Option 2: Manual Start
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 🔑 Login as Admin

1. Open your browser to `http://localhost:5173` (or the port shown)
2. Click "Login" or navigate to `/login`
3. Use these credentials:
   ```
   Email: admin@demo.com
   Password: demo123
   ```
4. Click "Login"

## 📋 Testing the Admin Dashboard

After logging in, you should be automatically redirected to `/admin/dashboard`.

### Dashboard Features to Test:

1. **Statistics Cards**
   - Should show total number of doctors
   - Should show total number of patients
   - Should show total diagnoses
   - Should show recent diagnoses (last 7 days)

2. **Quick Action Buttons**
   - Click "Manage Doctors" - should filter to doctors
   - Click "Manage Patients" - should filter to patients
   - Click "All Users" - should show all users

3. **Recent Activity**
   - Should display recent login and user management actions
   - Actions should be color-coded
   - Should show timestamps

## 👥 Testing User Management

Navigate to "Manage Users" from the dashboard or menu.

### Test Cases:

#### 1. View All Users
- [ ] User list loads successfully
- [ ] Can see existing demo accounts (admin, doctor, patient)
- [ ] Pagination controls appear if > 10 users

#### 2. Filter by Role
- [ ] Select "Doctors" - should show only doctor accounts
- [ ] Select "Patients" - should show only patient accounts
- [ ] Select "Admins" - should show only admin accounts
- [ ] Select "All Roles" - should show all accounts

#### 3. Search Users
- [ ] Type "doctor" in search - should filter results
- [ ] Type an email - should find matching user
- [ ] Clear search - should show all users again

#### 4. Create New User (Doctor)
- [ ] Click "Create User" button
- [ ] Fill in the form:
  ```
  Email: test.doctor@example.com
  Password: test123
  First Name: Test
  Last Name: Doctor
  Role: Doctor
  ```
- [ ] Click "Create"
- [ ] Should see success message
- [ ] New doctor should appear in the list

#### 5. Create New User (Patient)
- [ ] Click "Create User" button
- [ ] Fill in the form:
  ```
  Email: test.patient@example.com
  Password: test123
  First Name: Test
  Last Name: Patient
  Role: Patient
  ```
- [ ] Click "Create"
- [ ] Should see success message
- [ ] New patient should appear in the list

#### 6. Edit User
- [ ] Click the edit icon (pencil) on a user
- [ ] Modify the first name to "Updated"
- [ ] Click "Save"
- [ ] Should see success message
- [ ] Changes should be reflected in the list

#### 7. Reset Password
- [ ] Click the key icon on a user
- [ ] Enter a new password: `newpass123`
- [ ] Should see success message
- [ ] Log out and try logging in as that user with new password

#### 8. Delete User
- [ ] Click the delete icon (trash) on a test user
- [ ] Confirm deletion in the modal
- [ ] Should see success message
- [ ] User should be removed from the list

#### 9. Security Tests
- [ ] Try to delete your own admin account - should be prevented
- [ ] Try to edit your own role to "patient" - should be prevented
- [ ] Log out and try accessing `/admin/dashboard` - should redirect to login

## 🎨 UI/UX Tests

### Dark Mode
- [ ] Toggle dark mode using the theme switcher
- [ ] Admin dashboard should display properly in dark mode
- [ ] User management page should display properly in dark mode
- [ ] Modals should display properly in dark mode

### Responsive Design
- [ ] Resize browser to mobile width
- [ ] Dashboard cards should stack vertically
- [ ] User table should be scrollable horizontally
- [ ] Forms should be usable on mobile
- [ ] Navigation menu should work on mobile

### Loading States
- [ ] Refresh page - should see loading spinner
- [ ] Create user - button should show loading state
- [ ] Fetch users - should show loading spinner

### Error Handling
- [ ] Try to create user with existing email - should show error
- [ ] Try to create user with password < 6 chars - should show error
- [ ] Disconnect from internet - operations should show error messages

## 🔐 Security Tests

### Authentication
- [ ] Access `/admin/dashboard` without logging in - should redirect to login
- [ ] Access `/admin/users` without logging in - should redirect to login

### Authorization
1. **Login as Patient** (`patient@demo.com` / `demo123`)
   - [ ] Cannot see admin menu items
   - [ ] Direct access to `/admin/dashboard` should redirect
   - [ ] Direct access to `/admin/users` should redirect

2. **Login as Doctor** (`doctor@demo.com` / `demo123`)
   - [ ] Cannot see admin menu items
   - [ ] Direct access to `/admin/dashboard` should redirect
   - [ ] Direct access to `/admin/users` should redirect

3. **Login as Admin** (`admin@demo.com` / `demo123`)
   - [ ] Can see admin menu items
   - [ ] Can access `/admin/dashboard`
   - [ ] Can access `/admin/users`
   - [ ] All admin operations work

## 📊 Expected Initial Data

After seeding, you should have:
- 1 Admin account
- 1 Doctor account
- 1 Patient account

Statistics should show:
- Total Doctors: 1
- Total Patients: 1
- Total Diagnoses: 0 (initially)
- Recent Diagnoses: 0 (initially)

## 🐛 Troubleshooting

### "Cannot connect to database"
- Check MongoDB is running
- Verify MONGODB_URI in .env
- Check backend console for errors

### "Failed to load users"
- Open browser DevTools Network tab
- Check for 401/403 errors (auth issue)
- Check for 500 errors (server issue)
- Verify JWT token in localStorage

### "User list is empty"
- Check database seeding ran successfully
- Verify backend console shows seed messages
- Try creating a user manually

### Modal doesn't open
- Check browser console for errors
- Verify React components loaded
- Try refreshing the page

### Changes don't save
- Check browser console for errors
- Verify backend API is responding
- Check MongoDB connection
- Review backend logs

## ✅ Success Criteria

All features working correctly when:
- ✅ Can login as admin
- ✅ Dashboard shows statistics
- ✅ Can view all users
- ✅ Can filter and search users
- ✅ Can create new users (doctor/patient/admin)
- ✅ Can edit existing users
- ✅ Can reset passwords
- ✅ Can delete users
- ✅ Security measures work (no self-delete, role protection)
- ✅ Dark mode works
- ✅ Responsive on mobile
- ✅ Non-admin users cannot access admin panel

## 📝 Notes

- All created test accounts can be deleted except your own admin account
- Password must be at least 6 characters
- Email must be unique across all users
- Deleting a user also deletes their profile and associated data
- All admin actions are logged in the audit system

## 🎉 Ready to Test!

Follow the test cases above and check off each one as you verify it works. If you encounter any issues, refer to the troubleshooting section or check the main documentation at `documentations/ADMIN_PANEL.md`.

