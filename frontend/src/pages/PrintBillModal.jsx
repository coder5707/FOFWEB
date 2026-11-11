import React from 'react';
import { Printer, X } from 'lucide-react';

export default function PrintBillModal({ saleData, onClose }) {
  if (!saleData) return null;

  const { sale, items = [] } = saleData;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 720 }}
      >
        <div className="modal-header no-print">
          <h3>🧾 Invoice # {sale.id}</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-primary btn-sm" onClick={handlePrint}>
              <Printer size={15} />
              <span>Print Invoice</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ border: 'none', background: 'transparent' }}
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="modal-body print-bill-container" style={{ padding: '24px 30px' }}>
          {/* Bill Printable Layout */}
          <div style={{ textAlign: 'center', marginBottom: 20, borderBottom: '2px solid #1e293b', paddingBottom: 14 }}>
            <h2 style={{ fontSize: '1.6rem', color: '#0f172a', fontWeight: 800 }}>FRIENDS OF FASHION</h2>
            <p style={{ color: '#475569', fontSize: '0.85rem', marginTop: 5, lineHeight: 1.5 }}>PKR College Opposite, Muruganputhur,<br />Gobichettipalayam, Erode - 638452</p><h4 style={{ color: '#475569', fontWeight: 600, marginTop: 8 }}>TAX INVOICE / CASH BILL</h4>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.9rem',
            color: '#334155',
            marginBottom: 20,
            background: '#f8fafc',
            padding: '12px 16px',
            borderRadius: 8
          }}>
            <div>
              <p><b>Bill No:</b> #{sale.id}</p>
              <p><b>Date & Time:</b> {sale.sale_date}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p><b>Customer:</b> {sale.customer_name || 'Walk-in Customer'}</p>
              <p><b>Phone:</b> {sale.customer_phone || '-'}</p>
              {sale.customer_email && <p><b>Email:</b> {sale.customer_email}</p>}
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, fontSize: '0.92rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '8px 12px', textAlign: 'center', width: 40 }}>#</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Item Description</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', width: 60 }}>Qty</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', width: 100 }}>Price (₹)</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', width: 120 }}>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => {
                const total = Number(it.quantity) * Number(it.unit_price);
                return (
                  <tr key={it.id || idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <b>{it.product_name}</b>
                      {it.category && <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: 8 }}>({it.category})</span>}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>{it.quantity}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>{Number(it.unit_price).toFixed(2)}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}><b>{total.toFixed(2)}</b></td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #0f172a', background: '#f8fafc' }}>
                <td colSpan={4} style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, fontSize: '1.05rem',color:'green' }}>
                  Grand Total Amount:
                </td>
                <td style={{ padding: '5px 5px', textAlign: 'right', fontWeight: 800, fontSize: '1.2rem', color: '#0f172a' }}>
                  ₹ {Number(sale.total_amount).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>

          <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.85rem', marginTop: 24 }}>
            <p>Thank you for shopping with us! Visit again.</p>
          </div>
        </div>

        <div className="modal-footer no-print">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button type="button" className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>
    </div>
  );
}
