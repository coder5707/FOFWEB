import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit2, Trash2, Eye, X, Phone, Mail, RefreshCw } from 'lucide-react';
import { fetchApi } from '../api';
import ExcelExportButton from '../components/ExcelExportButton';
import ConfirmModal from '../components/ConfirmModal';

export default function CustomersPage({ showToast }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  // Purchases history modal
  const [viewCustomer, setViewCustomer] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);

  // Delete modal
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await fetchApi(`/customers${params}`);
      if (res.success) setCustomers(res.data);
    } catch (err) {
      showToast(err.message || 'Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const openAddModal = () => {
    setModalMode('add');
    setCurrentCustomer(null);
    setName('');
    setPhone('');
    setEmail('');
    setIsModalOpen(true);
  };

  const openEditModal = (c) => {
    setModalMode('edit');
    setCurrentCustomer(c);
    setName(c.name || '');
    setPhone(c.phone || '');
    setEmail(c.email || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Customer name is required', 'error');
      return;
    }

    try {
      setSaving(true);
      const payload = { name: name.trim(), phone: phone.trim(), email: email.trim() };
      if (modalMode === 'add') {
        const res = await fetchApi('/customers', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (res.success) {
          showToast('Customer added successfully', 'success');
          setIsModalOpen(false);
          fetchCustomers();
        }
      } else {
        const res = await fetchApi(`/customers/${currentCustomer.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        if (res.success) {
          showToast('Customer updated successfully', 'success');
          setIsModalOpen(false);
          fetchCustomers();
        }
      }
    } catch (err) {
      showToast(err.message || 'Failed to save customer', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openPurchasesModal = async (c) => {
    setViewCustomer(c);
    try {
      setLoadingPurchases(true);
      const res = await fetchApi(`/customers/${c.id}`);
      if (res.success) {
        setPurchases(res.purchases || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load purchase history', 'error');
    } finally {
      setLoadingPurchases(false);
    }
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      const res = await fetchApi(`/customers/${deleteId}`, { method: 'DELETE' });
      if (res.success) {
        showToast('Customer deleted successfully', 'success');
        setShowDeleteModal(false);
        fetchCustomers();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete customer', 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Customer Management</h1>
          <p>Maintain customer profiles, purchase history, and export records</p>
        </div>
        <div className="header-actions">
          <ExcelExportButton
            endpoint="/export/customers"
            filename="customers_export.xlsx"
            params={search ? { search } : {}}
            label="Export to Excel"
            onSuccess={(msg) => showToast(msg, 'success')}
            onError={(msg) => showToast(msg, 'error')}
          />
          <button type="button" className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="form-control"
            placeholder="Search customers by name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="card">
        <div className="card-title">
          <span>Customers Directory ({customers.length} records)</span>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th className="text-right">Total Bills</th>
                <th className="text-right">Total Spent</th>
                <th>Registered Date</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center" style={{ padding: 30, color: '#64748b' }}>
                    <RefreshCw size={22} className="animate-spin" style={{ margin: '0 auto 6px' }} />
                    <p>Loading customers...</p>
                  </td>
                </tr>
              ) : customers.length > 0 ? (
                customers.map((c) => (
                  <tr key={c.id}>
                    <td><b>#{c.id}</b></td>
                    <td><b>{c.name}</b></td>
                    <td>
                      {c.phone ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Phone size={13} color="#64748b" />
                          <span>{c.phone}</span>
                        </span>
                      ) : '-'}
                    </td>
                    <td>
                      {c.email ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Mail size={13} color="#64748b" />
                          <span>{c.email}</span>
                        </span>
                      ) : '-'}
                    </td>
                    <td className="text-right">
                      <span className="badge badge-secondary">{c.total_bills} bills</span>
                    </td>
                    <td className="text-right">
                      <b>₹ {Number(c.total_spent || 0).toFixed(2)}</b>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      {c.created_at ? c.created_at.replace('T', ' ') : '-'}
                    </td>
                    <td className="text-center">
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openPurchasesModal(c)}
                          title="View purchases"
                        >
                          <Eye size={13} />
                          <span>Purchases</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEditModal(c)}
                          title="Edit customer"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => confirmDelete(c.id)}
                          title="Delete customer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center" style={{ padding: 30, color: '#94a3b8' }}>
                    No customer records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3>{modalMode === 'add' ? '👤 Add New Customer' : '✏️ Edit Customer'}</h3>
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
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="e.g. customer@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                  {saving ? 'Saving...' : (modalMode === 'add' ? 'Add Customer' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase History Modal */}
      {viewCustomer && (
        <div className="modal-overlay" onClick={() => setViewCustomer(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3>🛍️ Purchases for {viewCustomer.name}</h3>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ border: 'none', background: 'transparent' }}
                onClick={() => setViewCustomer(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              {loadingPurchases ? (
                <p>Loading purchase history...</p>
              ) : purchases.length > 0 ? (
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Bill ID</th>
                        <th>Date</th>
                        <th className="text-right">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchases.map((p) => (
                        <tr key={p.id}>
                          <td><b>#{p.id}</b></td>
                          <td>{p.sale_date}</td>
                          <td className="text-right"><b>₹ {Number(p.total_amount).toFixed(2)}</b></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>No bills logged for this customer yet.</p>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setViewCustomer(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Confirm Customer Delete"
        message="Are you sure you want to delete this customer? Their past sales history will be preserved as Walk-in purchases."
        confirmText="Delete Customer"
        isDanger={true}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
