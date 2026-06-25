import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import {
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  KeyIcon
} from '@heroicons/react/24/outline';

const ManageUsers = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialRole = searchParams.get('role') || 'all';

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0, limit: 10 });
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); 
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [resetData, setResetData] = useState({ password: '', confirm: '' });
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'patient',
    profileData: {}
  });

  useEffect(() => {
    fetchUsers();
  }, [selectedRole, searchTerm, pagination.page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users', {
        params: {
          role: selectedRole,
          search: searchTerm,
          page: pagination.page,
          limit: pagination.limit
        }
      });
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setModalMode('create');
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: selectedRole !== 'all' ? selectedRole : 'patient',
      profileData: {}
    });
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFormData({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      profileData: user.profile || {}
    });
    setShowModal(true);
  };

  const handleDeleteUser = (user) => {
    setModalMode('delete');
    setSelectedUser(user);
    setShowModal(true);
  };

  const openResetModal = (user) => {
    setModalMode('reset');
    setSelectedUser(user);
    setResetData({ password: '', confirm: '' });
    setShowPassword(false);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    
    if (modalMode === 'reset') {
      if (resetData.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      if (resetData.password !== resetData.confirm) {
        toast.error('Passwords do not match');
        return;
      }
    }

    try {
      if (modalMode === 'create') {
        await api.post('/admin/users', formData);
        toast.success('User created successfully');
      } else if (modalMode === 'edit') {
        const updateData = { ...formData };
        delete updateData.password; 
        await api.put(`/admin/users/${selectedUser._id}`, updateData);
        toast.success('User updated successfully');
      } else if (modalMode === 'delete') {
        await api.delete(`/admin/users/${selectedUser._id}`);
        toast.success('User deleted successfully');
      } else if (modalMode === 'reset') {
        await api.post(`/admin/users/${selectedUser._id}/reset-password`, { newPassword: resetData.password });
        toast.success('Password reset successfully');
      }
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const getRoleBadge = (role) => {
    const map = {
      admin: 'badge--danger',
      doctor: 'badge--info',
      patient: 'badge--success'
    };
    return map[role] || 'badge--neutral';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 mb-4 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="page-title">Manage Users</h1>
          <p className="page-subtitle">
            View, create, edit, and delete user accounts
          </p>
        </div>

        {}
        <div className="card p-4 sm:p-5 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1 flex flex-col sm:flex-row gap-3 sm:gap-4">
              {}
              <select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value);
                  setPagination({ ...pagination, page: 1 });
                }}
                className="form-input sm:w-44"
              >
                <option value="all">All Roles</option>
                <option value="doctor">Doctors</option>
                <option value="patient">Patients</option>
                <option value="admin">Admins</option>
              </select>

              {}
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPagination({ ...pagination, page: 1 });
                }}
                className="form-input flex-1"
              />
            </div>

            <button
              onClick={handleCreateUser}
              className="btn-primary"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create User
            </button>
          </div>
        </div>

        {}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-200 border-t-primary-600"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">No users found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Created</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td className="whitespace-nowrap">
                          <div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-white">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              {user.email}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap">
                          <span className={`badge ${getRoleBadge(user.role)} capitalize`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:text-slate-400 dark:hover:text-primary-400 dark:hover:bg-primary-500/10 transition-colors"
                              title="Edit user"
                              aria-label="Edit user"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => openResetModal(user)}
                              className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:text-slate-400 dark:hover:text-amber-400 dark:hover:bg-amber-500/10 transition-colors"
                              title="Reset password"
                              aria-label="Reset password"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-colors"
                              title="Delete user"
                              aria-label="Delete user"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {}
              {pagination.pages > 1 && (
                <div className="bg-slate-50 dark:bg-slate-800/60 px-6 py-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-700">
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                      disabled={pagination.page === 1}
                      className="btn-secondary btn-sm"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                      disabled={pagination.page === pagination.pages}
                      className="btn-secondary btn-sm"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {}
          <div
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-md transition-opacity"
            onClick={() => setShowModal(false)}
            aria-hidden="true"
          ></div>

          {}
          <div
            className="relative flex min-h-full items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700 animate-fadeIn"
            >
              {}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {modalMode === 'create' && 'Create New User'}
                  {modalMode === 'edit' && 'Edit User'}
                  {modalMode === 'delete' && 'Delete User'}
                  {modalMode === 'reset' && 'Reset Password'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  aria-label="Close"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                {}
                <div className="px-6 py-5">
                  {modalMode === 'delete' ? (
                    <div className="flex items-start gap-3.5">
                      <span className="icon-chip icon-chip--danger w-10 h-10 shrink-0">
                        <ExclamationTriangleIcon />
                      </span>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        Are you sure you want to delete{' '}
                        <strong className="text-slate-900 dark:text-white">
                          {selectedUser?.firstName} {selectedUser?.lastName}
                        </strong>
                        ? This action cannot be undone.
                      </p>
                    </div>
                  ) : modalMode === 'reset' ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 rounded-xl bg-amber-50/70 dark:bg-amber-500/10 border border-amber-200/70 dark:border-amber-500/20 px-3.5 py-3">
                        <span className="icon-chip icon-chip--warning w-9 h-9 shrink-0">
                          <KeyIcon />
                        </span>
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                          Setting a new password for{' '}
                          <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>
                        </p>
                      </div>

                      <div>
                        <label htmlFor="newPassword" className="form-label">New password</label>
                        <div className="relative">
                          <input
                            id="newPassword"
                            type={showPassword ? 'text' : 'password'}
                            required
                            minLength={6}
                            autoFocus
                            value={resetData.password}
                            onChange={(e) => setResetData({ ...resetData, password: e.target.value })}
                            className="form-input pr-11"
                            placeholder="At least 6 characters"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                          >
                            {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="confirmNewPassword" className="form-label">Confirm new password</label>
                        <input
                          id="confirmNewPassword"
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={resetData.confirm}
                          onChange={(e) => setResetData({ ...resetData, confirm: e.target.value })}
                          className="form-input"
                          placeholder="Re-enter the new password"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="userEmail" className="form-label">Email</label>
                        <input
                          id="userEmail"
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="form-input"
                        />
                      </div>

                      {modalMode === 'create' && (
                        <div>
                          <label htmlFor="userPassword" className="form-label">Password</label>
                          <input
                            id="userPassword"
                            type="password"
                            required
                            minLength={6}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="form-input"
                            placeholder="At least 6 characters"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="userFirstName" className="form-label">First Name</label>
                          <input
                            id="userFirstName"
                            type="text"
                            required
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            className="form-input"
                          />
                        </div>
                        <div>
                          <label htmlFor="userLastName" className="form-label">Last Name</label>
                          <input
                            id="userLastName"
                            type="text"
                            required
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            className="form-input"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="userRole" className="form-label">Role</label>
                        <select
                          id="userRole"
                          required
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                          className="form-input"
                        >
                          <option value="patient">Patient</option>
                          <option value="doctor">Doctor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {}
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`w-full sm:w-auto ${modalMode === 'delete' ? 'btn-danger' : 'btn-primary'}`}
                  >
                    {modalMode === 'create' && 'Create User'}
                    {modalMode === 'edit' && 'Save Changes'}
                    {modalMode === 'delete' && 'Delete'}
                    {modalMode === 'reset' && 'Reset Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;

