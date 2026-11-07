import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  RotateCcw,
  X,
  Upload,
  Check,
  RefreshCw
} from 'lucide-react';
import { fetchApi } from '../api';
import ExcelExportButton from '../components/ExcelExportButton';
import ConfirmModal from '../components/ConfirmModal';

export default function ProductsPage({ showToast }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('1');

  // Categories & Brands list for filters
  const [categories, setCategories] = useState([]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentProduct, setCurrentProduct] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formSize, setFormSize] = useState('');
  const [formColor, setFormColor] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formImage, setFormImage] = useState(null);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory) params.append('category', selectedCategory);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetchApi(`/products?${params.toString()}`);
      if (res.success) {
        setProducts(res.data);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const catRes = await fetchApi('/products/categories');
      if (catRes.success) setCategories(catRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCategory, statusFilter]);

  useEffect(() => {
    fetchFilters();
  }, []);

  const openAddModal = () => {
    setModalMode('add');
    setCurrentProduct(null);
    setFormName('');
    setFormCategory('');
    setFormBrand('');
    setFormSize('');
    setFormColor('');
    setFormPrice('');
    setFormStock('0');
    setFormImage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setModalMode('edit');
    setCurrentProduct(p);
    setFormName(p.name || '');
    setFormCategory(p.category || '');
    setFormBrand(p.brand || '');
    setFormSize(p.size || '');
    setFormColor(p.color || '');
    setFormPrice(p.price || '');
    setFormStock(p.stock || '0');
    setFormImage(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Product name is required', 'error');
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('name', formName.trim());
      formData.append('category', formCategory.trim());
      formData.append('brand', formBrand.trim());
      formData.append('size', formSize.trim());
      formData.append('color', formColor.trim());
      formData.append('price', formPrice);
      formData.append('stock', formStock);
      if (formImage) {
        formData.append('image', formImage);
      }

      if (modalMode === 'add') {
        const res = await fetchApi('/products', {
          method: 'POST',
          body: formData
        });
        if (res.success) {
          showToast('Product added successfully!', 'success');
          setIsModalOpen(false);
          fetchProducts();
          fetchFilters();
        }
      } else {
        const res = await fetchApi(`/products/${currentProduct.id}`, {
          method: 'PUT',
          body: formData
        });
        if (res.success) {
          showToast('Product updated successfully!', 'success');
          setIsModalOpen(false);
          fetchProducts();
          fetchFilters();
        }
      }
    } catch (err) {
      showToast(err.message || 'Failed to save product', 'error');
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
      const res = await fetchApi(`/products/${deleteId}`, { method: 'DELETE' });
      if (res.success) {
        showToast('Product deleted successfully', 'success');
        setShowDeleteModal(false);
        fetchProducts();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete product', 'error');
    }
  };

  const handleRestore = async (id) => {
    try {
      const res = await fetchApi(`/products/${id}/restore`, { method: 'POST' });
      if (res.success) {
        showToast('Product restored successfully', 'success');
        fetchProducts();
      }
    } catch (err) {
      showToast(err.message || 'Failed to restore product', 'error');
    }
  };

  const exportParams = {};
  if (search) exportParams.search = search;
  if (selectedCategory) exportParams.category = selectedCategory;
  if (statusFilter) exportParams.status = statusFilter;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Product Management</h1>
          <p>Add, edit, view, delete, and export all inventory products</p>
        </div>
        <div className="header-actions">
          {/* Export to Excel Button */}
          <ExcelExportButton
            endpoint="/export/products"
            filename="products_export.xlsx"
            params={exportParams}
            label="Export to Excel"
            onSuccess={(msg) => showToast(msg, 'success')}
            onError={(msg) => showToast(msg, 'error')}
          />
          <button type="button" className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div className="filter-bar" style={{ margin: 0 }}>
          <div className="search-input-wrap">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="form-control"
              placeholder="Search products by name, brand, color..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ minWidth: 160 }}>
            <select
              className="form-control"
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
          </div>

          <div style={{ minWidth: 140 }}>
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="1">Active Only</option>
              <option value="0">Deleted Only</option>
              <option value="all">All Products</option>
            </select>
          </div>

          {(search || selectedCategory || statusFilter !== '1') && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSearch('');
                setSelectedCategory('');
                setStatusFilter('1');
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Products Table */}
      <div className="card">
        <div className="card-title">
          <span>Products List ({products.length} records)</span>
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
                <th className="text-right">Price (₹)</th>
                <th className="text-right">Stock</th>
                <th className="text-center">Storefront</th>
                <th className="text-center">Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="text-center" style={{ padding: 40, color: '#64748b' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                    <p>Loading products...</p>
                  </td>
                </tr>
              ) : products.length > 0 ? (
                products.map((p) => (
                  <tr key={p.id}>
                    <td><b>#{p.id}</b></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                    </td>
                    <td>{p.category || '-'}</td>
                    <td>{p.brand || '-'}</td>
                    <td>{p.size || '-'}</td>
                    <td>{p.color || '-'}</td>
                    <td className="text-right">
                      <b>₹ {Number(p.price).toFixed(2)}</b>
                    </td>
                    <td className="text-right">
                      <span className={`badge ${p.stock <= 5 ? 'badge-danger' : (p.stock < 20 ? 'badge-warning' : 'badge-success')}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={`badge ${p.publish_status === 1 ? 'badge-success' : 'badge-secondary'}`}>
                        {p.publish_status === 1 ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={`badge ${p.status === 1 ? 'badge-success' : 'badge-danger'}`}>
                        {p.status === 1 ? 'Active' : 'Deleted'}
                      </span>
                    </td>
                    <td className="text-center">
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        {p.status === 1 ? (
                          <>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => openEditModal(p)}
                              title="Edit product"
                            >
                              <Edit2 size={13} />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => confirmDelete(p.id)}
                              title="Delete product"
                            >
                              <Trash2 size={13} />
                              <span>Delete</span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-success btn-sm"
                            onClick={() => handleRestore(p.id)}
                            title="Restore product"
                          >
                            <RotateCcw size={13} />
                            <span>Restore</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="text-center" style={{ padding: 40, color: '#94a3b8' }}>
                    No products found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalMode === 'add' ? '➕ Add New Product' : '✏️ Edit Product'}</h3>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ border: 'none', background: 'transparent' }}
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Cotton Casual Shirt"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Mens, Womens, Kids"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Brand</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Nike, Adidas, Raymond"
                      value={formBrand}
                      onChange={(e) => setFormBrand(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Size</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. S, M, L, XL, 32"
                      value={formSize}
                      onChange={(e) => setFormSize(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Color</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Black, Navy Blue, Red"
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Price (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control"
                      placeholder="0.00"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Initial Stock *</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      placeholder="0"
                      value={formStock}
                      onChange={(e) => setFormStock(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Product Image (Optional)</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={(e) => setFormImage(e.target.files[0])}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : (modalMode === 'add' ? 'Add Product' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Confirm Soft Delete"
        message="Are you sure you want to delete this product? It will be marked as deleted and can be restored at any time."
        confirmText="Delete Product"
        isDanger={true}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
