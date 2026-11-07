import React, { useState, useEffect } from 'react';
import {
  Package,
  Boxes,
  TrendingUp,
  Receipt,
  AlertTriangle,
  ArrowRight,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { fetchApi, getUser } from '../api';
import NeedleGauge from '../components/NeedleGauge';
import ConfirmModal from '../components/ConfirmModal';

export default function DashboardPage({ onNavigate, showToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);
  const user = getUser();
  const isAdmin = user && user.role === 'admin';

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/dashboard/metrics');
      if (res.success) {
        setData(res.metrics);
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to load dashboard metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleClearAll = async () => {
    try {
      setClearing(true);
      const res = await fetchApi('/dashboard/clear-all', { method: 'POST' });
      if (res.success) {
        showToast('All transaction and customer data cleared!', 'success');
        setShowClearModal(false);
        fetchDashboard();
      }
    } catch (err) {
      showToast(err.message || 'Failed to clear data', 'error');
    } finally {
      setClearing(false);
    }
  };

  if (loading && !data) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
        <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
        <p>Loading dashboard analytics...</p>
      </div>
    );
  }

  const exp = data?.expenses || {};

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Dashboard</h1>
          <p>Real-time retail metrics, inventory level, and financial overview</p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={fetchDashboard}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <Package size={24} />
          </div>
          <div className="stat-details">
            <div className="stat-val">{data?.total_products ?? 0}</div>
            <div className="stat-label">Total Active Products</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <Boxes size={24} />
          </div>
          <div className="stat-details">
            <div className="stat-val">{data?.total_stock?.toLocaleString() ?? 0}</div>
            <div className="stat-label">Total Stock Units</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <TrendingUp size={24} />
          </div>
          <div className="stat-details">
            <div className="stat-val">₹ {data?.today_sales?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) ?? '0.00'}</div>
            <div className="stat-label">Today's Sales</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">
            <Receipt size={24} />
          </div>
          <div className="stat-details">
            <div className="stat-val">{data?.total_sales_count ?? 0}</div>
            <div className="stat-label">Total Bills Generated</div>
          </div>
        </div>
      </div>

      {/* Speedometer Gauge & Expense Overview in 2 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 24 }}>
        {/* Speedometer Gauge */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card-title" style={{ width: '100%', textAlign: 'center', justifyContent: 'center' }}>
            <span>Inventory Capacity Level</span>
          </div>
          <NeedleGauge
            value={data?.stock_percent ?? 0}
            max={100}
            label={`Current Stock: ${data?.total_stock ?? 0} / ${data?.max_capacity ?? 5000} Max Capacity`}
          />
        </div>

        {/* Expense Overview Card */}
        <div className="card">
          <div className="card-title">
            <span>💰 Expense Overview — {exp.month}</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigate('expenses')}
            >
              <span>View Details</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Total Spent This Month</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
                ₹ {exp.spent?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) ?? '0.00'}
              </div>
            </div>
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Monthly Budget</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
                ₹ {exp.budget?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) ?? '0.00'}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
              <span>Budget Utilization: {exp.percent}%</span>
              <span style={{ color: exp.color, fontWeight: 700 }}>
                {exp.emoji} {exp.label}
              </span>
            </div>
            <div className="progress-bar-wrap" style={{ height: 10 }}>
              <div
                className="progress-bar-fill"
                style={{ width: `${Math.min(100, exp.percent || 0)}%`, background: exp.color || '#10b981' }}
              />
            </div>
          </div>

          <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 10 }}>
            Remaining balance: <b>₹ {Math.max(0, (exp.budget || 0) - (exp.spent || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</b>
          </div>
        </div>
      </div>

      {/* Recent Sales & Low Stock alert tables */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 24 }}>
        {/* Recent Sales */}
        <div className="card">
          <div className="card-title">
            <span>Recent Invoices</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigate('sales_list')}
            >
              <span>All Sales</span>
            </button>
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Bill ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data?.recent_sales?.length > 0 ? (
                  data.recent_sales.map((s) => (
                    <tr key={s.id}>
                      <td><b>#{s.id}</b></td>
                      <td>{s.customer_name}</td>
                      <td><b>₹ {Number(s.total_amount).toFixed(2)}</b></td>
                      <td style={{ fontSize: '0.82rem', color: '#64748b' }}>{s.sale_date}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center" style={{ color: '#94a3b8' }}>
                      No recent sales found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="card">
          <div className="card-title">
            <span>Low Stock Items Alert</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigate('stock_report')}
            >
              <span>Stock Report</span>
            </button>
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Remaining</th>
                </tr>
              </thead>
              <tbody>
                {data?.low_stock_items?.length > 0 ? (
                  data.low_stock_items.map((p) => (
                    <tr key={p.id}>
                      <td><b>{p.name}</b></td>
                      <td>{p.category || '-'}</td>
                      <td>₹ {Number(p.price).toFixed(2)}</td>
                      <td>
                        <span className={`badge ${p.stock <= 5 ? 'badge-danger' : 'badge-warning'}`}>
                          {p.stock} units
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center" style={{ color: '#10b981', fontWeight: 600 }}>
                      ✓ All inventory levels are healthy!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Danger Zone (Admin Only) */}
      {isAdmin && (
        <div className="card" style={{ borderColor: '#fca5a5', background: '#fff5f5' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <h3 style={{ color: '#b91c1c', display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem' }}>
                <AlertTriangle size={20} />
                <span>Danger Zone: Clear All Data</span>
              </h3>
              <p style={{ color: '#7f1d1d', fontSize: '0.85rem', marginTop: 4 }}>
                Permanently clears all sales, bills, customer records, and product inventory. Preserves system users and expense categories.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => setShowClearModal(true)}
              disabled={clearing}
            >
              <Trash2 size={16} />
              <span>🔥 Clear All Data</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearModal}
        title="⚠ Confirm Reset All Data"
        message="Are you sure you want to permanently clear all products, customer records, and sales history? This action cannot be undone."
        confirmText={clearing ? 'Clearing...' : 'Yes, Permanently Clear All'}
        isDanger={true}
        onConfirm={handleClearAll}
        onCancel={() => setShowClearModal(false)}
      />
    </div>
  );
}
