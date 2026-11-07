import React, { useState, useEffect } from 'react';
import { ListOrdered, Search, RefreshCw } from 'lucide-react';
import { fetchApi } from '../api';
import ExcelExportButton from '../components/ExcelExportButton';

export default function SaleItemsPage({ showToast }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchItems = async () => {
    try {
      setLoading(true);
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await fetchApi(`/sales/items${params}`);
      if (res.success) setItems(res.data);
    } catch (err) {
      showToast(err.message || 'Failed to load sale line items', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [search]);

  const totalQuantity = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
  const totalRevenue = items.reduce((sum, it) => sum + (Number(it.line_total) || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Sales Item Details</h1>
          <p>Granular breakdown of every product unit sold across all invoices with item-level analytics</p>
        </div>
        <div className="header-actions">
          <ExcelExportButton
            endpoint="/export/sale-items"
            filename="sale_items_export.xlsx"
            params={search ? { search } : {}}
            label="Export Items to Excel"
            onSuccess={(msg) => showToast(msg, 'success')}
            onError={(msg) => showToast(msg, 'error')}
          />
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="form-control"
            placeholder="Search items by product name, category, brand, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
        marginBottom: 20,
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ color: '#475569', fontSize: '0.9rem' }}>
          Total Lines: <b>{items.length}</b> &nbsp;|&nbsp; Total Units Sold: <b>{totalQuantity}</b>
        </div>
        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
          Cumulative Item Revenue: <span style={{ color: '#059669' }}>₹ {totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Items Table */}
      <div className="card">
        <div className="card-title">
          <span>All Sold Line Items</span>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Item #</th>
                <th>Bill ID</th>
                <th>Date & Time</th>
                <th>Customer</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Brand</th>
                <th className="text-center">Quantity</th>
                <th className="text-right">Unit Price (₹)</th>
                <th className="text-right">Line Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center" style={{ padding: 30, color: '#64748b' }}>
                    <RefreshCw size={22} className="animate-spin" style={{ margin: '0 auto 6px' }} />
                    <p>Loading line items...</p>
                  </td>
                </tr>
              ) : items.length > 0 ? (
                items.map((it) => (
                  <tr key={it.id}>
                    <td>#{it.id}</td>
                    <td><b>#{it.sale_id}</b></td>
                    <td style={{ fontSize: '0.85rem' }}>{it.sale_date}</td>
                    <td>{it.customer_name}</td>
                    <td><b>{it.product_name}</b></td>
                    <td>{it.category || '-'}</td>
                    <td>{it.brand || '-'}</td>
                    <td className="text-center">
                      <span className="badge badge-info">{it.quantity}</span>
                    </td>
                    <td className="text-right">₹ {Number(it.unit_price).toFixed(2)}</td>
                    <td className="text-right">
                      <b>₹ {Number(it.line_total).toFixed(2)}</b>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="text-center" style={{ padding: 30, color: '#94a3b8' }}>
                    No sale items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
