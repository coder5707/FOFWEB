import React, { useState, useEffect } from 'react';
import { Calendar, RefreshCw, Eye } from 'lucide-react';
import { fetchApi } from '../api';
import ExcelExportButton from '../components/ExcelExportButton';
import PrintBillModal from './PrintBillModal';

export default function DailyReportPage({ showToast }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sales, setSales] = useState([]);
  const [dayTotal, setDayTotal] = useState(0);
  const [billCount, setBillCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // View bill modal
  const [selectedSale, setSelectedSale] = useState(null);

  const fetchDailyReport = async () => {
    try {
      setLoading(true);
      const res = await fetchApi(`/reports/daily?date=${date}`);
      if (res.success) {
        setSales(res.sales || []);
        setDayTotal(res.day_total || 0);
        setBillCount(res.bill_count || 0);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load daily report', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyReport();
  }, [date]);

  const viewBill = async (id) => {
    try {
      const res = await fetchApi(`/sales/${id}`);
      if (res.success) setSelectedSale(res.data);
    } catch (err) {
      showToast('Failed to load bill', 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Daily Sales Report</h1>
          <p>Inspect all revenue and transactions closed on a selected calendar day</p>
        </div>
        <div className="header-actions">
          <ExcelExportButton
            endpoint="/export/daily-report"
            filename={`daily_report_${date}.xlsx`}
            params={{ date }}
            label="Export Daily Report"
            onSuccess={(msg) => showToast(msg, 'success')}
            onError={(msg) => showToast(msg, 'error')}
          />
        </div>
      </div>

      {/* Date Filter Card */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={18} color="#2563eb" />
            <label className="form-label" style={{ margin: 0 }}>Select Report Date:</label>
          </div>
          <input
            type="date"
            className="form-control"
            style={{ width: 180 }}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setDate(new Date().toISOString().split('T')[0])}
          >
            Today
          </button>
        </div>
      </div>

      {/* Summary KPI Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        padding: '16px 22px',
        marginBottom: 20,
        flexWrap: 'wrap',
        gap: 14
      }}>
        <div>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Date: <b>{date}</b></div>
          <div style={{ fontSize: '1rem', color: '#334155', marginTop: 2 }}>
            Total Invoices Generated: <b>{billCount}</b>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Day Cumulative Total</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669' }}>
            ₹ {dayTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Sales for Selected Date Table */}
      <div className="card">
        <div className="card-title">
          <span>Invoices Closed on {date}</span>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Bill ID</th>
                <th>Time</th>
                <th>Customer</th>
                <th>Phone</th>
                <th className="text-right">Total Amount (₹)</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center" style={{ padding: 30, color: '#64748b' }}>
                    <RefreshCw size={22} className="animate-spin" style={{ margin: '0 auto 6px' }} />
                    <p>Loading daily sales...</p>
                  </td>
                </tr>
              ) : sales.length > 0 ? (
                sales.map((s) => (
                  <tr key={s.id}>
                    <td><b>#{s.id}</b></td>
                    <td style={{ fontSize: '0.85rem' }}>{s.sale_date}</td>
                    <td>{s.customer_name || 'Walk-in'}</td>
                    <td>{s.customer_phone || '-'}</td>
                    <td className="text-right">
                      <b>₹ {Number(s.total_amount).toFixed(2)}</b>
                    </td>
                    <td className="text-center">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => viewBill(s.id)}
                      >
                        <Eye size={13} />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center" style={{ padding: 30, color: '#94a3b8' }}>
                    No sales recorded on {date}.
                  </td>
                </tr>
              )}
            </tbody>
            {sales.length > 0 && (
              <tfoot>
                <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                  <td colSpan={4} style={{ textAlign: 'right', padding: '12px 16px' }}>
                    Total Sales for {date}:
                  </td>
                  <td className="text-right" style={{ padding: '12px 16px', color: '#059669', fontSize: '1.05rem' }}>
                    ₹ {dayTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {selectedSale && (
        <PrintBillModal
          saleData={selectedSale}
          onClose={() => setSelectedSale(null)}
        />
      )}
    </div>
  );
}
