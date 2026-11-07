import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Edit2, Trash2, X, Lock, User, RefreshCw } from 'lucide-react';
import { fetchApi, getUser } from '../api';
import ExcelExportButton from '../components/ExcelExportButton';
import ConfirmModal from '../components/ConfirmModal';

export default function UsersPage({ showToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentUser, setCurrentUser] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('staff');
  const [saving, setSaving] = useState(false);

  // Delete modal
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const activeUser = getUser();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/auth/users');
      if (res.success) setUsers(res.data);
    } catch (err) {
      showToast(err.message || 'Failed to load users list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openAddModal = () => {
    setModalMode('add');
    setCurrentUser(null);
    setUsername('');
    setPassword('');
    setRole('staff');
    setIsModalOpen(true);
  };

  const openEditModal = (u) => {
    setModalMode('edit');
    setCurrentUser(u);
    setUsername(u.username);
    setPassword('');
    setRole(u.role);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      showToast('Username is required', 'error');
      return;
    }

    try {
      setSaving(true);
      if (modalMode === 'add') {
        if (!password) {
          showToast('Password is required for new accounts', 'error');
          setSaving(false);
          return;
        }
        const res = await fetchApi('/auth/users', {
          method: 'POST',
          body: JSON.stringify({ username: username.trim(), password, role })
        });
        if (res.success) {
          showToast('User created successfully!', 'success');
          setIsModalOpen(false);
          fetchUsers();
        }
      } else {
        const payload = { role };
        if (password.trim()) payload.password = password.trim();

        const res = await fetchApi(`/auth/users/${currentUser.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        if (res.success) {
          showToast('User updated successfully!', 'success');
          setIsModalOpen(false);
          fetchUsers();
        }
      }
    } catch (err) {
      showToast(err.message || 'Failed to save user', 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (id) => {
    if (activeUser && activeUser.id === id) {
      showToast('You cannot delete your own account.', 'error');
      return;
    }
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      const res = await fetchApi(`/auth/users/${deleteId}`, { method: 'DELETE' });
      if (res.success) {
        showToast('User deleted successfully', 'success');
        setShowDeleteModal(false);
        fetchUsers();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete user', 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Staff & System Users</h1>
          <p>Admin control for team roles, authorization, and employee account credentials</p>
        </div>
        <div className="header-actions">
          <ExcelExportButton
            endpoint="/export/users"
            filename="users_export.xlsx"
            label="Export Users to Excel"
            onSuccess={(msg) => showToast(msg, 'success')}
            onError={(msg) => showToast(msg, 'error')}
          />
          <button type="button" className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="card-title">
          <span>Registered System Accounts ({users.length})</span>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Assigned Role</th>
                <th>Account Created</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center" style={{ padding: 30, color: '#64748b' }}>
                    <RefreshCw size={22} className="animate-spin" style={{ margin: '0 auto 6px' }} />
                    <p>Loading accounts...</p>
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.id}>
                    <td><b>#{u.id}</b></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <User size={15} color="#64748b" />
                        <b>{u.username}</b>
                        {activeUser?.id === u.id && (
                          <span className="badge badge-info">(You)</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-danger' : 'badge-secondary'}`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      {u.created_at ? u.created_at.replace('T', ' ') : '-'}
                    </td>
                    <td className="text-center">
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEditModal(u)}
                          title="Edit role or password"
                        >
                          <Edit2 size={13} />
                          <span>Edit</span>
                        </button>
                        {activeUser?.id !== u.id && (
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => confirmDelete(u.id)}
                            title="Delete user"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center" style={{ padding: 30, color: '#94a3b8' }}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3>{modalMode === 'add' ? '👤 Create System Account' : `✏️ Edit Account: ${currentUser.username}`}</h3>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ border: 'none', background: 'transparent' }}
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Username *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. cashier1"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={modalMode === 'edit'}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {modalMode === 'add' ? 'Password *' : 'Reset Password (leave empty to keep current)'}
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Enter secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={modalMode === 'add'}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <select
                    className="form-control"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="staff">Staff (Standard Access)</option>
                    <option value="admin">Admin (Full Control)</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : (modalMode === 'add' ? 'Create User' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Confirm User Deletion"
        message="Are you sure you want to delete this user account? They will no longer be able to log in to the management system."
        confirmText="Delete Account"
        isDanger={true}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
