import React, { useState, useEffect } from 'react';
import { Target, Calendar, Edit3, X, RefreshCw } from 'lucide-react';
import { fetchApi, getUser } from '../api';
import ExcelExportButton from '../components/ExcelExportButton';

export default function BudgetsPage({ showToast }) {
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit budget modal
  const [editingCat, setEditingCat] = useState(null);
  const [newBudget, setNewBudget] = useState('');
  const [saving, setSaving] = useState(false);

  const user = getUser();
  const isAdmin = user && user.role === 'admin';

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const res = await fetchApi(`/expenses/categories?month=${currentMonth}`);
      if (res.success) setCategories(res.data);
    } catch (err) {
      showToast(err.message || 'Failed to load budgets', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [currentMonth]);

  const openBudgetModal = (c) => {
    setEditingCat(c);
    setNewBudget(c.budget || '0');
  };

  const handleBudgetSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetchApi(`/expenses/categories/${editingCat.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editingCat.name,
          icon: editingCat.icon,
          budget: parseFloat(newBudget) || 0
        })
      });

      if (res.success) {
        showToast(`Budget for ${editingCat.name} updated successfully!`, 'success');
        setEditingCat(null);
        fetchBudgets();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update budget', 'error');
    } finally {
      setSaving(false);
    }
  };

  const totalBudget = categories.reduce((sum, c) => sum + (Number(c.budget) || 0), 0);
  const totalSpent = categories.reduce((sum, c) => sum + (Number(c.spent_this_month) || 0), 0);
  const totalRemaining = Math.max(0, totalBudget - totalSpent);
  const overallUtilization = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Budget Management</h1>
          <p>Plan monthly operational caps, track variances, and export comprehensive budget schedules</p>
        </div>
        <div className="header-actions">
          <ExcelExportButton
            endpoint="/export/budgets"
            filename={`budgets_${currentMonth}.xlsx`}
            params={{ month: currentMonth }}
            label="Export Budgets to Excel"
            onSuccess={(msg) => showToast(msg, 'success')}
            onError={(msg) => showToast(msg, 'error')}
          />
        </div>
      </div>

      {/* Month Selector */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={18} color="#2563eb" />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Budget Period:</span>
          </div>
          <input
            type="month"
            className="form-control"
            style={{ width: 170 }}
            value={currentMonth}
            onChange={(e) => setCurrentMonth(e.target.value)}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div className="card" style={{ padding: 18, margin: 0, textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
            ₹ {totalBudget.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginTop: 4 }}>
            TOTAL ALLOCATED BUDGET
          </div>
        </div>

        <div className="card" style={{ padding: 18, margin: 0, textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626' }}>
            ₹ {totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginTop: 4 }}>
            ACTUAL SPENT THIS MONTH
          </div>
        </div>

        <div className="card" style={{ padding: 18, margin: 0, textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669' }}>
            ₹ {totalRemaining.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginTop: 4 }}>
            REMAINING VARIANCE
          </div>
        </div>

        <div className="card" style={{ padding: 18, margin: 0, textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563eb' }}>
            {overallUtilization}%
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginTop: 4 }}>
            OVERALL UTILIZATION RATE
          </div>
        </div>
      </div>

      {/* Budgets Table */}
      <div className="card">
        <div className="card-title">
          <span>Monthly Category Budget Plan</span>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Category</th>
                <th className="text-right">Allocated Budget (₹)</th>
                <th className="text-right">Actual Spent (₹)</th>
                <th className="text-right">Variance / Remaining (₹)</th>
                <th className="text-center">Utilization</th>
                <th className="text-center">Status</th>
                {isAdmin && <th className="text-center">Action</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center" style={{ padding: 30, color: '#64748b' }}>
                    <RefreshCw size={22} className="animate-spin" style={{ margin: '0 auto 6px' }} />
                    <p>Loading budget plan...</p>
                  </td>
                </tr>
              ) : categories.length > 0 ? (
                categories.map((c) => {
                  const b = Number(c.budget) || 0;
                  const s = Number(c.spent_this_month) || 0;
                  const variance = b - s;
                  const util = b > 0 ? Math.round((s / b) * 100) : 0;
                  const r = c.reaction || { emoji: '😊', label: 'Good', class: 'good' };

                  return (
                    <tr key={c.id}>
                      <td>#{c.id}</td>
                      <td>
                        <span style={{ fontSize: '1.2rem', marginRight: 8 }}>{c.icon}</span>
                        <b>{c.name}</b>
                      </td>
                      <td className="text-right">
                        <b>₹ {b.toFixed(2)}</b>
                      </td>
                      <td className="text-right">
                        ₹ {s.toFixed(2)}
                      </td>
                      <td className="text-right">
                        <b style={{ color: variance < 0 ? '#ef4444' : '#059669' }}>
                          ₹ {variance.toFixed(2)}
                        </b>
                      </td>
                      <td className="text-center">
                        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{util}%</span>
                          <div className="progress-bar-wrap" style={{ width: 80, height: 6 }}>
                            <div
                              className="progress-bar-fill"
                              style={{
                                width: `${Math.min(100, util)}%`,
                                background: util > 100 ? '#ef4444' : (util > 80 ? '#f59e0b' : '#10b981')
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="text-center">
                        <span className={`reaction-badge ${r.class}`}>
                          {r.emoji} {r.label}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="text-center">
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => openBudgetModal(c)}
                            title="Adjust budget"
                          >
                            <Edit3 size={13} />
                            <span>Adjust</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center" style={{ padding: 30, color: '#94a3b8' }}>
                    No budget records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Budget Modal */}
      {editingCat && (
        <div className="modal-overlay" onClick={() => setEditingCat(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3>🎯 Adjust Budget for {editingCat.icon} {editingCat.name}</h3>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ border: 'none', background: 'transparent' }}
                onClick={() => setEditingCat(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleBudgetSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">New Monthly Budget (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingCat(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Updating...' : 'Update Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
