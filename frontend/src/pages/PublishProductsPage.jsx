import React, { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle, EyeOff, Image, RefreshCw } from 'lucide-react';
import { fetchApi } from '../api';
import ExcelExportButton from '../components/ExcelExportButton';

export default function PublishProductsPage({ showToast }) {
  const [unpublished, setUnpublished] = useState([]);
  const [published, setPublished] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const unpubRes = await fetchApi('/products?status=1&publish_status=0');
      const pubRes = await fetchApi('/products?status=1&publish_status=1');
      if (unpubRes.success) setUnpublished(unpubRes.data);
      if (pubRes.success) setPublished(pubRes.data);
    } catch (err) {
      showToast(err.message || 'Failed to fetch publishing records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!selectedProductId) {
      showToast('Please select a product to publish', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      if (imageFile) {
        formData.append('publish_image', imageFile);
      }

      const res = await fetchApi(`/products/${selectedProductId}/publish`, {
        method: 'POST',
        body: formData
      });

      if (res.success) {
        showToast('Product published to Customer Storefront!', 'success');
        setSelectedProductId('');
        setImageFile(null);
        loadData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to publish product', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnpublish = async (productId) => {
    try {
      const res = await fetchApi(`/products/${productId}/unpublish`, { method: 'POST' });
      if (res.success) {
        showToast('Product unpublished from storefront', 'success');
        loadData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to unpublish product', 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Publish Products (Customer Storefront)</h1>
          <p>Control which items appear in the customer-facing storefront and attach catalog photos</p>
        </div>
        <div className="header-actions">
          <ExcelExportButton
            endpoint="/export/products"
            filename="published_products_export.xlsx"
            params={{ publish_status: 1 }}
            label="Export Published to Excel"
            onSuccess={(msg) => showToast(msg, 'success')}
            onError={(msg) => showToast(msg, 'error')}
          />
        </div>
      </div>

      {/* Publish Form Card */}
      <div className="card" style={{ maxWidth: 640 }}>
        <div className="card-title">
          <span>🚀 Publish Product to Store</span>
        </div>

        <form onSubmit={handlePublish}>
          <div className="form-group">
            <label className="form-label">Select Unpublished Product *</label>
            <select
              className="form-control"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              required
            >
              <option value="">-- Choose Product to Publish --</option>
              {unpublished.map((p) => (
                <option key={p.id} value={p.id}>
                  #{p.id} — {p.name} ({p.category || 'No Category'}, ₹{p.price}, Stock: {p.stock})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Upload Cover Photo (Optional)</label>
            <input
              type="file"
              className="form-control"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
            />
            <small style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 4, display: 'block' }}>
              Formats supported: JPG, PNG, WEBP, AVIF. If left blank, existing image is kept.
            </small>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || unpublished.length === 0}
          >
            <UploadCloud size={16} />
            <span>{submitting ? 'Publishing...' : 'Publish Product to Storefront'}</span>
          </button>
        </form>
      </div>

      {/* Published Products Listing */}
      <div className="card">
        <div className="card-title">
          <span>Currently Published Products ({published.length})</span>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Photo</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Brand</th>
                <th className="text-right">Price</th>
                <th className="text-right">Stock</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center" style={{ padding: 30, color: '#64748b' }}>
                    <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 6px' }} />
                    <p>Loading published items...</p>
                  </td>
                </tr>
              ) : published.length > 0 ? (
                published.map((p) => {
                  const imgUrl = p.publish_image
                    ? `/uploads/products/${p.publish_image}`
                    : (p.image ? `/uploads/products/${p.image}` : null);

                  return (
                    <tr key={p.id}>
                      <td><b>#{p.id}</b></td>
                      <td>
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={p.name}
                            style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, border: '1px solid #e2e8f0' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div style={{ width: 44, height: 44, borderRadius: 6, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Image size={18} color="#94a3b8" />
                          </div>
                        )}
                      </td>
                      <td><b>{p.name}</b></td>
                      <td>{p.category || '-'}</td>
                      <td>{p.brand || '-'}</td>
                      <td className="text-right">₹ {Number(p.price).toFixed(2)}</td>
                      <td className="text-right">{p.stock}</td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleUnpublish(p.id)}
                          title="Remove from storefront"
                        >
                          <EyeOff size={14} />
                          <span>Unpublish</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center" style={{ padding: 30, color: '#94a3b8' }}>
                    No products published to customer store yet.
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
