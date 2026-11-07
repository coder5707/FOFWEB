import React, { useState, useEffect } from 'react';
import { FolderKanban, Plus, Edit2, Trash2, X, RefreshCw } from 'lucide-react';
import { fetchApi, getUser } from '../api';
import ExcelExportButton from '../components/ExcelExportButton';
import ConfirmModal from '../components/ConfirmModal';

export default function ExpenseCategoriesPage({ showToast }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentCat, setCurrentCat] = useState(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('💰');
  const [budget, setBudget] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete modal
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const user = getUser();
  const isAdmin = user && user.role === 'admin';

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/expenses/categories');
      if (res.success) setCategories(res.data);
    } catch (err) {
      showToast(err.message || 'Failed to load expense categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setModalMode('add');
    setCurrentCat(null);
    setName('');
    setIcon('💰');
    setBudget('0.00');
    setIsModalOpen(true);
  };

  const openEditModal = (c) => {
    setModalMode('edit');
    setCurrentCat(c);
    setName(c.name || '');
    setIcon(c.icon || '💰');
    setBudget(c.budget || '0');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Category name is required', 'error');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: name.trim(),
        icon: icon.trim() || '💰',
        budget: parseFloat(budget) || 0
      };

      if (modalMode === 'add') {
        const res = await fetchApi('/expenses/categories', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (res.success) {
          showToast('Expense category created successfully!', 'success');
          setIsModalOpen(false);
          fetchCategories();
        }
      } else {
        const res = await fetchApi(`/expenses/categories/${currentCat.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        if (res.success) {
          showToast('Expense category updated successfully!', 'success');
          setIsModalOpen(false);
          fetchCategories();
        }
      }
    } catch (err) {
      showToast(err.message || 'Failed to save expense category', 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      const res = await fetchApi(`/expenses/categories/${deleteId}`, { method: 'DELETE' });
      if (res.success) {
        showToast('Expense category deleted successfully', 'success');
        setShowDeleteModal(false);
        fetchCategories();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete expense category', 'error');
    }
  };

  const totalBudgets = categories.reduce((sum, c) => sum + (Number(c.budget) || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Expense Categories</h1>
          <p>Organize company expenses by department or type, and configure monthly spending ceilings</p>
        </div>
        <div className="header-actions">
          <ExcelExportButton
            endpoint="/export/expense-categories"
            filename="expense_categories_export.xlsx"
            label="Export Categories to Excel"
            onSuccess={(msg) => showToast(msg, 'success')}
            onError={(msg) => showToast(msg, 'error')}
          />
          {isAdmin && (
            <button type="button" className="btn btn-primary" onClick={openAddModal}>
              <Plus size={16} />
              <span>Add Category</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        padding: '12px 18px',
        marginBottom: 20
      }}>
        <div style={{ color: '#475569', fontSize: '0.9rem' }}>
          Active Categories: <b>{categories.length}</b>
        </div>
        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
          Total Monthly Budget Allocation: <span style={{ color: '#2563eb' }}>₹ {totalBudgets.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Categories Table */}
      <div className="card">
        <div className="card-title">
          <span>Expense Categories Master</span>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Icon</th>
                <th>Category Name</th>
                <th className="text-right">Monthly Budget (₹)</th>
                <th className="text-right">Spent This Month</th>
                <th className="text-center">Status</th>
                {isAdmin && <th className="text-center">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center" style={{ padding: 30, color: '#64748b' }}>
                    <RefreshCw size={22} className="animate-spin" style={{ margin: '0 auto 6px' }} />
                    <p>Loading categories...</p>
                  </td>
                </tr>
              ) : categories.length > 0 ? (
                categories.map((c) => {
                  const r = c.reaction || { emoji: '😊', label: 'Good', class: 'good' };
                  return (
                    <tr key={c.id}>
                      <td><b>#{c.id}</b></td>
                      <td style={{ fontSize: '1.4rem' }}>{c.icon}</td>
                      <td><b>{c.name}</b></td>
                      <td className="text-right">
                        <b>₹ {Number(c.budget).toFixed(2)}</b>
                      </td>
                      <td className="text-right">
                        ₹ {Number(c.spent_this_month || 0).toFixed(2)}
                      </td>
                      <td className="text-center">
                        <span className={`reaction-badge ${r.class}`}>
                          {r.emoji} {r.label}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="text-center">
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => openEditModal(c)}
                              title="Edit category"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => confirmDelete(c.id)}
                              title="Delete category"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center" style={{ padding: 30, color: '#94a3b8' }}>
                    No expense categories configured.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3>{modalMode === 'add' ? '➕ Add Expense Category' : '✏️ Edit Expense Category'}</h3>
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
                  <label className="form-label">Category Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Internet & Telecom"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Icon (Emoji) *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 📶 or 💰"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Monthly Budget (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    placeholder="0.00"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    required
                  />
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
                  {saving ? 'Saving...' : (modalMode === 'add' ? 'Add Category' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Confirm Category Deletion"
        message="Are you sure you want to delete this expense category? Any associated expense entries will also be permanently deleted."
        confirmText="Delete Category"
        isDanger={true}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
