import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Trash2, CheckCircle2, User, Phone, Mail, AlertCircle, Printer, RefreshCw } from 'lucide-react';
import { fetchApi } from '../api';
import PrintBillModal from './PrintBillModal';

export default function NewSalePage({ showToast }) {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Customer Form
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Bill Items
  const [items, setItems] = useState([
    { product_id: '', quantity: 1, unit_price: 0, line_total: 0, stock: 0, name: '' }
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [createdBill, setCreatedBill] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const prodRes = await fetchApi('/products?status=1');
      const custRes = await fetchApi('/customers');
      if (prodRes.success) setProducts(prodRes.data);
      if (custRes.success) setCustomers(custRes.data);
    } catch (err) {
      showToast(err.message || 'Failed to initialize billing data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCustomerSelect = (e) => {
    const cid = e.target.value;
    setSelectedCustomerId(cid);
    if (cid) {
      const c = customers.find((cust) => String(cust.id) === String(cid));
      if (c) {
        setCustomerName(c.name || '');
        setCustomerPhone(c.phone || '');
        setCustomerEmail(c.email || '');
      }
    } else {
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
    }
  };

  const handleProductChange = (index, productId) => {
    const updated = [...items];
    const prod = products.find((p) => String(p.id) === String(productId));

    if (prod) {
      const price = Number(prod.price) || 0;
      const qty = updated[index].quantity || 1;
      updated[index] = {
        ...updated[index],
        product_id: prod.id,
        name: prod.name,
        unit_price: price,
        stock: prod.stock,
        line_total: price * qty
      };
    } else {
      updated[index] = {
        product_id: '',
        quantity: 1,
        unit_price: 0,
        line_total: 0,
        stock: 0,
        name: ''
      };
    }
    setItems(updated);
  };

  const handleQtyChange = (index, qty) => {
    const updated = [...items];
    const numQty = parseInt(qty, 10) || 0;
    updated[index].quantity = numQty;
    updated[index].line_total = (Number(updated[index].unit_price) || 0) * numQty;
    setItems(updated);
  };

  const handlePriceChange = (index, price) => {
    const updated = [...items];
    const numPrice = parseFloat(price) || 0;
    updated[index].unit_price = numPrice;
    updated[index].line_total = (Number(updated[index].quantity) || 0) * numPrice;
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([...items, { product_id: '', quantity: 1, unit_price: 0, line_total: 0, stock: 0, name: '' }]);
  };

  const removeItemRow = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const grandTotal = items.reduce((sum, it) => sum + (Number(it.line_total) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const validItems = items.filter((it) => it.product_id && it.quantity > 0);
    if (!validItems.length) {
      showToast('Add at least one product with quantity > 0', 'error');
      return;
    }

    // Check stock locally before sending
    for (const it of validItems) {
      if (it.quantity > it.stock) {
        showToast(`Insufficient stock for "${it.name}". Available: ${it.stock}, Requested: ${it.quantit}`, 'error');
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload = {
        customer_id: selectedCustomerId ? parseInt(selectedCustomerId, 10) : null,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim(),
        items: validItems.map((it) => ({
          product_id: it.product_id,
          quantity: it.quantity,
          unit_price: it.unit_price
        }))
      };

      const res = await fetchApi('/sales', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.success && res.sale_id) {
        showToast(`Sale recorded successfully! Bill #${res.sale_id}`, 'success');

        // Fetch full bill details for immediate printable invoice
        const billRes = await fetchApi(`/sales/${res.sale_id}`);
        if (billRes.success) {
          setCreatedBill(billRes.data);
        }

        // Reset form
        setSelectedCustomerId('');
        setCustomerName('');
        setCustomerPhone('');
        setCustomerEmail('');
        setItems([{ product_id: '', quantity: 1, unit_price: 0, line_total: 0, stock: 0, name: '' }]);
        loadData(); // Reload products to get latest stock levels
      }
    } catch (err) {
      showToast(err.message || 'Failed to create sale', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>New Sale (Billing & POS)</h1>
          <p>Create customer invoices with real-time stock verification and automatic inventory deduction</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Customer Details Box */}
        <div className="card">
          <div className="card-title">
            <span>👤 Customer Information (Optional)</span>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ minWidth: 260 }}>
              <label className="form-label">Existing Customer (Select or type below)</label>
              <select
                className="form-control"
                value={selectedCustomerId}
                onChange={handleCustomerSelect}
              >
                <option value="">-- Walk-in / New Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Customer Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Walk-in Customer"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 9876543210"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="e.g. name@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Bill Items Box */}
        <div className="card">
          <div className="card-title">
            <span>🛍️ Bill Items</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={addItemRow}
            >
              <Plus size={15} />
              <span>Add Another Item</span>
            </button>
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Select Product</th>
                  <th style={{ width: '20%' }} className="text-right">Unit Price (₹)</th>
                  <th style={{ width: '15%' }} className="text-center">Quantity</th>
                  <th style={{ width: '20%' }} className="text-right">Line Total (₹)</th>
                  <th style={{ width: '5%' }} className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={idx}>
                    <td>
                      <select
                        className="form-control"
                        value={it.product_id}
                        onChange={(e) => handleProductChange(idx, e.target.value)}
                        required
                      >
                        <option value="">-- Choose Product --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                            {p.name} {p.category ? `(${p.category})` : ''} — {p.brand} [Size: {p.size}] {p.stock <= 0 ? '(Out of stock)' : ''}
                          </option>
                        ))}
                      </select>
                      {it.product_id && (
                        <div style={{ fontSize: '0.8rem', color: it.quantity > it.stock ? '#ef4444' : '#64748b', marginTop: 4 }}>
                          Available in stock: <b>{it.stock} units</b>
                          {it.quantity > it.stock && (
                            <span style={{ fontWeight: 700, marginLeft: 6 }}>⚠ Insufficient stock!</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-control text-right"
                        value={it.unit_price}
                        onChange={(e) => handlePriceChange(idx, e.target.value)}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        className="form-control text-center"
                        value={it.quantity}
                        onChange={(e) => handleQtyChange(idx, e.target.value)}
                        required
                      />
                    </td>
                    <td className="text-right">
                      <b>₹ {Number(it.line_total || 0).toFixed(2)}</b>
                    </td>
                    <td className="text-center">
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        style={{ padding: '6px 8px' }}
                        onClick={() => removeItemRow(idx)}
                        disabled={items.length === 1}
                        title="Remove row"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Grand Total and Checkout Banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: '16px 20px',
            marginTop: 20,
            flexWrap: 'wrap',
            gap: 16
          }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Invoice Summary</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
                Grand Total: <span style={{ color: '#059669' }}>₹ {grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-success btn-lg"
              disabled={submitting || grandTotal <= 0}
            >
              <ShoppingCart size={20} />
              <span>{submitting ? 'Processing Bill...' : 'Complete Sale & Generate Bill'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Immediate Printable Bill Modal */}
      {createdBill && (
        <PrintBillModal
          saleData={createdBill}
          onClose={() => setCreatedBill(null)}
        />
      )}
    </div>
  );
}
