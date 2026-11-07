import React, { useState, useEffect, useRef } from 'react';
import {
  Wallet,
  Plus,
  BarChart2,
  List,
  Layers,
  Trash2,
  Calendar,
  Search,
  RefreshCw
} from 'lucide-react';
import { Chart, registerables } from 'chart.js';
import { fetchApi } from '../api';
import ExcelExportButton from '../components/ExcelExportButton';
import ConfirmModal from '../components/ConfirmModal';

Chart.register(...registerables);

export default function ExpensesPage({ showToast }) {
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7)); // 'YYYY-MM'
  const [activeTab, setActiveTab] = useState('categories'); // 'categories', 'chart', 'list', 'add'
  const [expenseData, setExpenseData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add form state
  const [formCatId, setFormCatId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formNote, setFormNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete modal
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Chart refs
  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const barChartInstance = useRef(null);
  const pieChartInstance = useRef(null);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('month', currentMonth);
      if (search) params.append('search', search);

      const res = await fetchApi(`/expenses?${params.toString()}`);
      if (res.success) {
        setExpenseData(res);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load expenses', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetchApi(`/expenses/categories?month=${currentMonth}`);
      if (res.success) setCategories(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadExpenses();
    loadCategories();
  }, [currentMonth, search]);

  // Handle Chart Rendering on 'chart' tab
  useEffect(() => {
    if (activeTab !== 'chart' || !expenseData) return;

    // Fetch analytics data for charts
    const renderCharts = async () => {
      try {
        const anaRes = await fetchApi(`/expenses/analytics?month=${currentMonth}`);
        if (!anaRes.success) return;

        const { bar_chart, doughnut_chart } = anaRes;

        // Clean previous instances
        if (barChartInstance.current) barChartInstance.current.destroy();
        if (pieChartInstance.current) pieChartInstance.current.destroy();

        // 1. Bar Chart: Spent vs Budget
        if (barChartRef.current) {
          barChartInstance.current = new Chart(barChartRef.current, {
            type: 'bar',
            data: {
              labels: bar_chart.labels,
              datasets: [
                {
                  label: 'Spent (₹)',
                  data: bar_chart.spent,
                  backgroundColor: bar_chart.colors,
                  borderRadius: 6
                },
                {
                  label: 'Budget (₹)',
                  data: bar_chart.budgets,
                  backgroundColor: 'rgba(51, 65, 85, 0.2)',
                  borderColor: '#334155',
                  borderWidth: 1.5,
                  borderRadius: 6
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'top' },
                tooltip: {
                  callbacks: {
                    label: (ctx) => `₹ ${Number(ctx.parsed.y).toLocaleString('en-IN')}`
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: (v) => `₹${Number(v).toLocaleString('en-IN')}`
                  }
                }
              }
            }
          });
        }

        // 2. Doughnut Chart: Distribution
        if (pieChartRef.current && doughnut_chart.data.length > 0) {
          pieChartInstance.current = new Chart(pieChartRef.current, {
            type: 'doughnut',
            data: {
              labels: doughnut_chart.labels,
              datasets: [
                {
                  data: doughnut_chart.data,
                  backgroundColor: doughnut_chart.colors,
                  borderWidth: 2,
                  borderColor: '#ffffff'
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'right' },
                tooltip: {
                  callbacks: {
                    label: (ctx) => `${ctx.label}: ₹ ${Number(ctx.parsed).toLocaleString('en-IN')}`
                  }
                }
              }
            }
          });
        }
      } catch (err) {
        console.error('Chart error:', err);
      }
    };

    renderCharts();

    return () => {
      if (barChartInstance.current) barChartInstance.current.destroy();
      if (pieChartInstance.current) pieChartInstance.current.destroy();
    };
  }, [activeTab, currentMonth, expenseData]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!formCatId || !formTitle.trim() || !formAmount) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    try {
      setSaving(true);
      const res = await fetchApi('/expenses', {
        method: 'POST',
        body: JSON.stringify({
          category_id: formCatId,
          title: formTitle.trim(),
          amount: parseFloat(formAmount),
          expense_date: formDate,
          note: formNote.trim()
        })
      });

      if (res.success) {
        showToast('Expense recorded successfully!', 'success');
        setFormTitle('');
        setFormAmount('');
        setFormNote('');
        setActiveTab('list');
        loadExpenses();
      }
    } catch (err) {
      showToast(err.message || 'Failed to record expense', 'error');
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
      const res = await fetchApi(`/expenses/${deleteId}`, { method: 'DELETE' });
      if (res.success) {
        showToast('Expense deleted successfully', 'success');
        setShowDeleteModal(false);
        loadExpenses();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete expense', 'error');
    }
  };

  const summary = expenseData?.summary || {
    grand_total: 0,
    total_budget: 0,
    remaining_budget: 0,
    budget_used_percent: 0,
    entries_count: 0,
    overall_reaction: { emoji: '😊', label: 'Good', color: '#10b981' }
  };

  const reaction = summary.overall_reaction || { emoji: '😊', label: 'Good', color: '#10b981' };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Expense Tracker</h1>
          <p>Monitor operational overheads, budget utilization, and financial reactions</p>
        </div>
        <div className="header-actions">
          <ExcelExportButton
            endpoint="/export/expenses"
            filename={`expenses_${currentMonth}.xlsx`}
            params={{ month: currentMonth }}
            label="Export Expenses to Excel"
            onSuccess={(msg) => showToast(msg, 'success')}
            onError={(msg) => showToast(msg, 'error')}
          />
        </div>
      </div>

      {/* Month Selector Bar */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={18} color="#2563eb" />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Expense Month:</span>
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

      {/* Summary KPI Cards & Overall Reaction */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div className="card" style={{ padding: 18, textAlign: 'center', margin: 0 }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
            ₹ {Number(summary.grand_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginTop: 4 }}>
            TOTAL SPENT THIS MONTH
          </div>
        </div>

        <div className="card" style={{ padding: 18, textAlign: 'center', margin: 0 }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
            ₹ {Number(summary.total_budget).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginTop: 4 }}>
            MONTHLY BUDGET ALLOCATION
          </div>
        </div>

        <div className="card" style={{ padding: 18, textAlign: 'center', margin: 0 }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669' }}>
            ₹ {Number(summary.remaining_budget).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginTop: 4 }}>
            REMAINING BUDGET
          </div>
        </div>

        <div className="card" style={{ padding: 18, textAlign: 'center', margin: 0 }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563eb' }}>
            {summary.entries_count}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginTop: 4 }}>
            TOTAL EXPENSE ENTRIES
          </div>
        </div>
      </div>

      {/* Overall Reaction Widget */}
      <div className="card" style={{ textAlign: 'center', padding: '18px 24px', background: '#f8fafc', marginBottom: 24 }}>
        <div style={{ fontSize: '3rem', lineHeight: 1 }}>{reaction.emoji}</div>
        <div style={{ fontSize: '1.15rem', fontWeight: 700, color: reaction.color, marginTop: 6 }}>
          Overall Monthly Health: {reaction.label}
        </div>
        <div style={{ maxWidth: 360, margin: '12px auto 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
            <span>₹ 0</span>
            <span>Budget Used: {summary.budget_used_percent}%</span>
            <span>₹ {Number(summary.total_budget).toLocaleString('en-IN')}</span>
          </div>
          <div className="progress-bar-wrap" style={{ height: 10 }}>
            <div
              className="progress-bar-fill"
              style={{ width: `${Math.min(100, summary.budget_used_percent)}%`, background: reaction.color }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`btn ${activeTab === 'categories' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('categories')}
        >
          <Layers size={16} />
          <span>Category Breakdown</span>
        </button>

        <button
          type="button"
          className={`btn ${activeTab === 'chart' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('chart')}
        >
          <BarChart2 size={16} />
          <span>Analytics Charts</span>
        </button>

        <button
          type="button"
          className={`btn ${activeTab === 'list' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('list')}
        >
          <List size={16} />
          <span>Expense List</span>
        </button>

        <button
          type="button"
          className={`btn ${activeTab === 'add' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('add')}
        >
          <Plus size={16} />
          <span>Record Expense</span>
        </button>
      </div>

      {/* Tab 1: Category Breakdown Cards */}
      {activeTab === 'categories' && (
        <div className="card">
          <div className="card-title">
            <span>Category Spending vs Allocated Budget</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {expenseData?.category_totals?.map((ct) => {
              const r = ct.reaction || { emoji: '😊', label: 'Good', color: '#10b981', class: 'good' };
              const pct = ct.budget > 0 ? Math.min(100, Math.round((ct.total_spent / ct.budget) * 100)) : 0;

              return (
                <div
                  key={ct.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ fontSize: '2rem' }}>{ct.icon}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>{ct.name}</div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 2 }}>
                        Spent: <b>₹{Number(ct.total_spent).toFixed(2)}</b> / Budget: ₹{Number(ct.budget).toFixed(2)}
                      </div>
                      <div className="progress-bar-wrap" style={{ width: 160, marginTop: 6 }}>
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${pct}%`, background: r.color }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.8rem', lineHeight: 1 }}>{r.emoji}</div>
                    <span className={`reaction-badge ${r.class}`} style={{ marginTop: 4 }}>
                      {r.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Analytics Charts */}
      {activeTab === 'chart' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: 24 }}>
          <div className="card">
            <div className="card-title">
              <span>Expense vs Budget Comparison</span>
            </div>
            <div style={{ height: 350, position: 'relative' }}>
              <canvas ref={barChartRef} />
            </div>
          </div>

          <div className="card">
            <div className="card-title">
              <span>Spending Distribution</span>
            </div>
            <div style={{ height: 350, position: 'relative' }}>
              <canvas ref={pieChartRef} />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Expense List */}
      {activeTab === 'list' && (
        <div className="card">
          <div className="card-title">
            <span>Expenses Recorded for {currentMonth} ({expenseData?.expenses?.length || 0})</span>
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Title / Purpose</th>
                  <th className="text-right">Amount (₹)</th>
                  <th>Notes</th>
                  <th className="text-center">Status</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center" style={{ padding: 30, color: '#64748b' }}>
                      <RefreshCw size={22} className="animate-spin" style={{ margin: '0 auto 6px' }} />
                      <p>Loading expenses...</p>
                    </td>
                  </tr>
                ) : expenseData?.expenses?.length > 0 ? (
                  expenseData.expenses.map((ex, idx) => {
                    const r = ex.reaction || { emoji: '😊', label: 'Good', class: 'good' };
                    return (
                      <tr key={ex.id}>
                        <td>{idx + 1}</td>
                        <td style={{ fontSize: '0.85rem' }}>{ex.expense_date}</td>
                        <td>
                          <span style={{ marginRight: 6 }}>{ex.category_icon}</span>
                          <b>{ex.category_name}</b>
                        </td>
                        <td>{ex.title}</td>
                        <td className="text-right">
                          <b>₹ {Number(ex.amount).toFixed(2)}</b>
                        </td>
                        <td style={{ fontSize: '0.82rem', color: '#64748b' }}>{ex.note || '-'}</td>
                        <td className="text-center">
                          <span className={`reaction-badge ${r.class}`}>
                            {r.emoji} {r.label}
                          </span>
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            style={{ padding: '4px 8px' }}
                            onClick={() => confirmDelete(ex.id)}
                            title="Delete expense"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center" style={{ padding: 30, color: '#94a3b8' }}>
                      No expenses logged for {currentMonth}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Add Expense Form */}
      {activeTab === 'add' && (
        <div className="card" style={{ maxWidth: 540 }}>
          <div className="card-title">
            <span>➕ Record New Operational Expense</span>
          </div>

          <form onSubmit={handleAddExpense}>
            <div className="form-group">
              <label className="form-label">Expense Category *</label>
              <select
                className="form-control"
                value={formCatId}
                onChange={(e) => setFormCatId(e.target.value)}
                required
              >
                <option value="">-- Choose Category --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name} (Budget: ₹{c.budget})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Expense Title / Description *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Monthly Electricity Bill"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-control"
                  placeholder="0.00"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Remarks / Note (Optional)</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Paid via UPI"
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Plus size={16} />
              <span>{saving ? 'Recording...' : 'Save Expense Record'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Confirm Expense Deletion"
        message="Are you sure you want to delete this expense record?"
        confirmText="Delete Expense"
        isDanger={true}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
