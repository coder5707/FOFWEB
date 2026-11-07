import React, { useState, useEffect } from 'react';
import { Boxes, Package, AlertTriangle, IndianRupee, RefreshCw } from 'lucide-react';
import { fetchApi } from '../api';
import ExcelExportButton from '../components/ExcelExportButton';

export default function StockReportPage({ showToast }) {
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState({ total_items: 0, total_units: 0, total_inventory_value: 0, low_stock_count: 0 });
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchStock = async () => {
    try {
      setLoading(true);
      const params = selectedCategory ? `?category=${encodeURIComponent(selectedCategory)}` : '';
      const res = await fetchApi(`/reports/stock${params}`);
      if (res.success) {
        setProducts(res.products || []);
        if (res.summary) setSummary(res.summary);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load stock report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetchApi('/products/categories');
      if (res.success) setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStock();
  }, [selectedCategory]);

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Product Stock Report</h1>
          <p>Real-time inventory levels, valuation analysis, and stock health monitoring</p>
        </div>
        <div className="header-actions">
          <ExcelExportButton
            endpoint="/export/stock"
            filename="stock_export.xlsx"
            params={selectedCategory ? { category: selectedCategory } : {}}
            label="Export Stock to Excel"
            onSuccess={(msg) => showToast(msg, 'success')}
            onError={(msg) => showToast(msg, 'error')}
          />
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <Package size={24} />
          </div>
          <div className="stat-details">
            <div className="stat-val">{summary.total_items}</div>
            <div className="stat-label">Unique Products</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <Boxes size={24} />
          </div>
          <div className="stat-details">
            <div className="stat-val">{summary.total_units.toLocaleString()}</div>
            <div className="stat-label">Total Units on Hand</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <IndianRupee size={24} />
          </div>
          <div className="stat-details">
            <div className="stat-val">₹ {summary.total_inventory_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div className="stat-label">Total Inventory Value</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-details">
            <div className="stat-val" style={{ color: summary.low_stock_count > 0 ? '#ef4444' : '#10b981' }}>
              {summary.low_stock_count}
            </div>
            <div className="stat-label">Low Stock Alerts (&lt; 15 units)</div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <label className="form-label" style={{ margin: 0 }}>Filter by Category:</label>
          <select
            className="form-control"
            style={{ maxWidth: 220 }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.category} value={c.category}>
                {c.category} ({c.product_count})
              </option>
            ))}
          </select>
          {selectedCategory && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setSelectedCategory('')}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Stock Table */}
      <div className="card">
        <div className="card-title">
          <span>Current Stock Levels ({products.length} products)</span>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Size</th>
                <th>Color</th>
                <th className="text-right">Unit Price</th>
                <th className="text-right">Stock (Units)</th>
                <th className="text-right">Inventory Valuation</th>
                <th className="text-center">Stock Health</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center" style={{ padding: 30, color: '#64748b' }}>
                    <RefreshCw size={22} className="animate-spin" style={{ margin: '0 auto 6px' }} />
                    <p>Loading stock levels...</p>
                  </td>
                </tr>
              ) : products.length > 0 ? (
                products.map((p) => (
                  <tr key={p.id}>
                    <td><b>#{p.id}</b></td>
                    <td><b>{p.name}</b></td>
                    <td>{p.category || '-'}</td>
                    <td>{p.brand || '-'}</td>
                    <td>{p.size || '-'}</td>
                    <td>{p.color || '-'}</td>
                    <td className="text-right">₹ {Number(p.price).toFixed(2)}</td>
                    <td className="text-right">
                      <b style={{ color: p.stock < 15 ? '#ef4444' : '#0f172a' }}>{p.stock}</b>
                    </td>
                    <td className="text-right">
                      <b>₹ {Number(p.inventory_value || p.price * p.stock).toFixed(2)}</b>
                    </td>
                    <td className="text-center">
                      <span className={`badge ${p.stock <= 0 ? 'badge-danger' : (p.stock < 15 ? 'badge-warning' : 'badge-success')}`}>
                        {p.stock <= 0 ? 'Out of Stock' : (p.stock < 15 ? 'Low Stock' : 'Optimal')}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="text-center" style={{ padding: 30, color: '#94a3b8' }}>
                    No product stock records found.
                  </td>
                </tr>
              )}
            </tbody>
            {products.length > 0 && (
              <tfoot>
                <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                  <td colSpan={7} style={{ textAlign: 'right', padding: '12px 16px' }}>
                    Grand Total Valuation:
                  </td>
                  <td className="text-right" style={{ padding: '12px 16px' }}>
                    {summary.total_units.toLocaleString()} units
                  </td>
                  <td className="text-right" style={{ padding: '12px 16px', color: '#059669', fontSize: '1.05rem' }}>
                    ₹ {summary.total_inventory_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
