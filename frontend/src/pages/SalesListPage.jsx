import React, { useState, useEffect } from 'react';
import { Receipt, Search, Eye, Printer, Trash2, Calendar, RefreshCw } from 'lucide-react';
import { fetchApi, getUser } from '../api';
import ExcelExportButton from '../components/ExcelExportButton';
import PrintBillModal from './PrintBillModal';
import ConfirmModal from '../components/ConfirmModal';

export default function SalesListPage({ showToast }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // View / Print modal
  const [selectedSale, setSelectedSale] = useState(null);
  const [loadingSale, setLoadingSale] = useState(false);

  // Delete modal
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const user = getUser();
  const isAdmin = user && user.role === 'admin';

  const fetchSales = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const res = await fetchApi(`/sales?${params.toString()}`);
      if (res.success) setSales(res.data);
    } catch (err) {
      showToast(err.message || 'Failed to load sales history', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [search, startDate, endDate]);

  const viewBillDetails = async (saleId) => {
    try {
      setLoadingSale(true);
      const res = await fetchApi(`/sales/${saleId}`);
      if (res.success) {
        setSelectedSale(res.data);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load bill details', 'error');
    } finally {
      setLoadingSale(false);
    }
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      const res = await fetchApi(`/sales/${deleteId}`, { method: 'DELETE' });
      if (res.success) {
        showToast('Sale record deleted successfully', 'success');
        setShowDeleteModal(false);
        fetchSales();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete sale record', 'error');
    }
  };

  const exportParams = {};
  if (search) exportParams.search = search;
  if (startDate) exportParams.start_date = startDate;
  if (endDate) exportParams.end_date = endDate;

  const totalSalesAmount = sales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Sales History (Invoices Master)</h1>
          <p>Browse past sales bills, inspect customer transactions, and download genuine Excel reports</p>
        </div>
        <div className="header-actions">
          <ExcelExportButton
            endpoint="/export/sales"
            filename="sales_export.xlsx"
            params={exportParams}
            label="Export to Excel"
            onSuccess={(msg) => showToast(msg, 'success')}
            onError={(msg) => showToast(msg, 'error')}
          />
        </div>
      </div>

      {/* Search and Date Filter Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div className="filter-bar" style={{ margin: 0 }}>
          <div className="search-input-wrap">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="form-control"
              placeholder="Search by Bill ID or Customer Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>From:</span>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: 145 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>To:</span>
            <input
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ width: 145 }}
            />
          </div>

          {(search || startDate || endDate) && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSearch('');
                setStartDate('');
                setEndDate('');
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Sales Summary Banner */}
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
          Total Invoices: <b>{sales.length}</b>
        </div>
        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
          Total Sales Volume: <span style={{ color: '#059669' }}>₹ {totalSalesAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Sales Table */}
      <div className="card">
        <div className="card-title">
          <span>Invoices Master List</span>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Bill ID</th>
                <th>Date & Time</th>
                <th>Customer Name</th>
                <th>Phone</th>
                <th className="text-right">Items</th>
                <th className="text-right">Total Amount (₹)</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center" style={{ padding: 30, color: '#64748b' }}>
                    <RefreshCw size={22} className="animate-spin" style={{ margin: '0 auto 6px' }} />
                    <p>Loading sales records...</p>
                  </td>
                </tr>
              ) : sales.length > 0 ? (
                sales.map((s) => (
                  <tr key={s.id}>
                    <td><b>#{s.id}</b></td>
                    <td style={{ fontSize: '0.85rem' }}>{s.sale_date}</td>
                    <td><b>{s.customer_name || 'Walk-in'}</b></td>
                    <td>{s.customer_phone || '-'}</td>
                    <td className="text-right">
                      <span className="badge badge-secondary">{s.item_count || 1} items</span>
                    </td>
                    <td className="text-right">
                      <b style={{ color: '#0f172a', fontSize: '0.95rem' }}>
                        ₹ {Number(s.total_amount).toFixed(2)}
                      </b>
                    </td>
                    <td className="text-center">
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => viewBillDetails(s.id)}
                          title="View Bill Invoice"
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => confirmDelete(s.id)}
                            title="Delete sale"
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
                  <td colSpan={7} className="text-center" style={{ padding: 30, color: '#94a3b8' }}>
                    No sales records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Bill Modal */}
      {selectedSale && (
        <PrintBillModal
          saleData={selectedSale}
          onClose={() => setSelectedSale(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Confirm Bill Deletion"
        message="Are you sure you want to delete this invoice record? Associated line items will be removed permanently."
        confirmText="Delete Bill"
        isDanger={true}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
