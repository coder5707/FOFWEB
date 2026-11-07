import React, { useState, useEffect } from 'react';
import { BarChart3, Calendar, RefreshCw } from 'lucide-react';
import { fetchApi } from '../api';
import ExcelExportButton from '../components/ExcelExportButton';

export default function MonthlyReportPage({ showToast }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [breakdown, setBreakdown] = useState([]);
  const [monthTotal, setMonthTotal] = useState(0);
  const [totalBills, setTotalBills] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchMonthlyReport = async () => {
    try {
      setLoading(true);
      const res = await fetchApi(`/reports/monthly?year=${year}&month=${month}`);
      if (res.success) {
        setBreakdown(res.daily_breakdown || []);
        setMonthTotal(res.month_total || 0);
        setTotalBills(res.total_bills || 0);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load monthly report', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyReport();
  }, [year, month]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthStr = `${year}-${String(month).padStart(2, '0')}`;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Monthly Sales Report</h1>
          <p>Analyze revenue trends and aggregated daily performance for any month and year</p>
        </div>
        <div className="header-actions">
          <ExcelExportButton
            endpoint="/export/monthly-report"
            filename={`monthly_report_${monthStr}.xlsx`}
            params={{ year, month }}
            label="Export Monthly Report"
            onSuccess={(msg) => showToast(msg, 'success')}
            onError={(msg) => showToast(msg, 'error')}
          />
        </div>
      </div>

      {/* Month & Year Selectors */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={18} color="#2563eb" />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Period:</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Month:</span>
            <select
              className="form-control"
              style={{ width: 150 }}
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value, 10))}
            >
              {monthNames.map((name, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Year:</span>
            <input
              type="number"
              className="form-control"
              style={{ width: 100 }}
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
            />
          </div>
        </div>
      </div>

      {/* Monthly KPI Banner */}
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
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Period: <b>{monthNames[month - 1]} {year}</b>
          </div>
          <div style={{ fontSize: '1rem', color: '#334155', marginTop: 2 }}>
            Total Invoices Generated: <b>{totalBills}</b>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Monthly Grand Total</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669' }}>
            ₹ {monthTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Daily Breakdown Table */}
      <div className="card">
        <div className="card-title">
          <span>Daily Breakdown for {monthNames[month - 1]} {year}</span>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th className="text-center">Bills Generated</th>
                <th className="text-right">Total Revenue (₹)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="text-center" style={{ padding: 30, color: '#64748b' }}>
                    <RefreshCw size={22} className="animate-spin" style={{ margin: '0 auto 6px' }} />
                    <p>Loading monthly report...</p>
                  </td>
                </tr>
              ) : breakdown.length > 0 ? (
                breakdown.map((row) => (
                  <tr key={row.date}>
                    <td><b>{row.date}</b></td>
                    <td className="text-center">
                      <span className="badge badge-secondary">{row.bill_count} bills</span>
                    </td>
                    <td className="text-right">
                      <b>₹ {Number(row.total).toFixed(2)}</b>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="text-center" style={{ padding: 30, color: '#94a3b8' }}>
                    No sales recorded in {monthNames[month - 1]} {year}.
                  </td>
                </tr>
              )}
            </tbody>
            {breakdown.length > 0 && (
              <tfoot>
                <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                  <td style={{ padding: '12px 16px' }}>Month Summary Total</td>
                  <td className="text-center" style={{ padding: '12px 16px' }}>{totalBills} bills</td>
                  <td className="text-right" style={{ padding: '12px 16px', color: '#059669', fontSize: '1.05rem' }}>
                    ₹ {monthTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
