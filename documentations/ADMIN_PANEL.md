# Admin Panel - Role-Based Access Control

## Overview

The admin panel provides comprehensive user management capabilities with role-based access control (RBAC). Administrators can manage doctors and patients, view system statistics, and monitor activity logs.

## Features

### 1. **Admin Role**
- New `admin` role added to the system
- Admins have full access to user management features
- Protected routes ensure only admins can access admin panel

### 2. **Admin Dashboard**
- **Statistics Cards**: View total doctors, patients, diagnoses, and recent activity
- **Quick Actions**: Navigate to manage doctors, patients, or all users
- **Recent Activity Log**: Monitor user logins, account creation, updates, and deletions
- **Real-time Updates**: Dashboard data refreshes automatically

### 3. **User Management**
- **View Users**: Browse all users with filtering by role (doctor/patient/admin)
- **Search**: Find users by name or email
- **Pagination**: Navigate through large user lists
- **Create Users**: Add new doctors, patients, or admins
- **Edit Users**: Update user information and profiles
- **Delete Users**: Remove user accounts (with profile cleanup)
- **Reset Password**: Generate new passwords for users
- **Role Management**: Change user roles (with automatic profile migration)

### 4. **Security Features**
- Protected routes require admin authentication
- Audit logging for all admin actions
- Prevent self-deletion (admin cannot delete their own account)
- Prevent self-demotion (admin cannot change their own role)
- Password hashing using bcrypt
- JWT token-based authentication

## Demo Credentials

```
Email: admin@demo.com
Password: demo123
```

## API Endpoints

All admin endpoints require authentication and admin role.

### Statistics
- `GET /api/admin/stats` - Get dashboard statistics and recent activity

### User Management
- `GET /api/admin/users` - Get all users (with filters, search, pagination)
  - Query params: `role`, `search`, `page`, `limit`
- `GET /api/admin/users/:id` - Get single user details
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `POST /api/admin/users/:id/reset-password` - Reset user password

### Audit Logs
- `GET /api/admin/audit-logs` - Get audit logs
  - Query params: `page`, `limit`, `userId`, `action`

## Frontend Routes

### Admin Routes
- `/admin/dashboard` - Admin dashboard with statistics
- `/admin/users` - User management interface
  - Query params: `?role=doctor` or `?role=patient` to filter

## Database Changes

### User Model
```javascript
role: {
  type: String,
  required: true,
  enum: ['patient', 'doctor', 'admin']  // Added 'admin'
}
```

### Seed Data
A demo admin account is automatically created:
- Email: `admin@demo.com`
- Password: `demo123`

## Usage Guide

### Accessing Admin Panel
1. Login with admin credentials
2. Click "Admin Dashboard" in the navigation menu
3. View statistics and recent activity
4. Click "Manage Users" or use quick action buttons

### Managing Users

#### Create User
1. Go to "Manage Users"
2. Click "Create User" button
3. Fill in required information:
   - Email
   - Password (min 6 characters)
   - First Name
   - Last Name
   - Role (Patient/Doctor/Admin)
4. Click "Create"

#### Edit User
1. Find user in the list
2. Click the edit icon (pencil)
3. Modify user information
4. Click "Save"

#### Delete User
1. Find user in the list
2. Click the delete icon (trash)
3. Confirm deletion
4. User and associated profiles will be removed

#### Reset Password
1. Find user in the list
2. Click the key icon
3. Enter new password (min 6 characters)
4. Password will be updated immediately

### Filtering and Search
- Use the role dropdown to filter by user type
- Use the search box to find users by name or email
- Results update automatically as you type

### Audit Logging
All admin actions are logged with:
- Action type (USER_CREATED, USER_UPDATED, USER_DELETED, etc.)
- Admin who performed the action
- Timestamp
- Action details

## Security Considerations

1. **Authentication Required**: All admin routes require valid JWT token
2. **Role Verification**: Middleware checks user role on every request
3. **Self-Protection**: Admins cannot delete or demote themselves
4. **Password Security**: Passwords are hashed with bcrypt (10 rounds)
5. **Audit Trail**: All actions are logged for accountability
6. **Input Validation**: All inputs are validated before processing
7. **Email Uniqueness**: System prevents duplicate email addresses

## Technical Implementation

### Backend Structure
```
backend/
├── routes/
│   └── admin.js          # Admin API routes
├── models/
│   ├── User.js           # Updated with admin role
│   └── AuditLog.js       # Audit logging model
└── middleware/
    └── auth.js           # Authentication & role middleware
```

### Frontend Structure
```
frontend/src/
├── pages/
│   ├── AdminDashboard.jsx    # Admin dashboard component
│   ├── ManageUsers.jsx       # User management interface
│   └── Dashboard.jsx         # Updated routing logic
└── components/layout/
    └── Navbar.jsx            # Updated with admin links
```

### Middleware
The `requireRole` middleware ensures only authorized users can access routes:
```javascript
router.use(authMiddleware);
router.use(requireRole(['admin']));
```

## Future Enhancements

Potential improvements for the admin panel:

1. **Bulk Operations**: Select and manage multiple users at once
2. **Export Data**: Export user lists to CSV/Excel
3. **Advanced Filtering**: Filter by creation date, last login, etc.
4. **User Analytics**: Charts and graphs for user statistics
5. **Email Notifications**: Send emails when accounts are created/modified
6. **Two-Factor Authentication**: Enhanced security for admin accounts
7. **Role Permissions**: More granular permission system
8. **Session Management**: View and manage active user sessions
9. **System Settings**: Configure application-wide settings
10. **Backup & Restore**: Database backup management

## Troubleshooting

### Cannot Access Admin Panel
- Verify you're logged in as an admin user
- Check that your JWT token is valid
- Ensure the backend server is running

### Users Not Loading
- Check browser console for errors
- Verify API endpoint is accessible
- Check network connectivity
- Ensure MongoDB is running

### Cannot Create Users
- Verify all required fields are filled
- Check that email is unique
- Ensure password meets minimum requirements
- Check backend logs for detailed errors

## Support

For issues or questions:
1. Check the browser console for errors
2. Review backend logs for API errors
3. Verify database connectivity
4. Ensure all dependencies are installed

