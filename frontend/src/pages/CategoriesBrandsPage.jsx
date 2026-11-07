import React, { useState, useEffect } from 'react';
import { Layers, Award, RefreshCw } from 'lucide-react';
import { fetchApi } from '../api';
import ExcelExportButton from '../components/ExcelExportButton';

export default function CategoriesBrandsPage({ showToast }) {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const catRes = await fetchApi('/products/categories');
      const brandRes = await fetchApi('/products/brands');
      if (catRes.success) setCategories(catRes.data);
      if (brandRes.success) setBrands(brandRes.data);
    } catch (err) {
      showToast(err.message || 'Failed to load categories and brands', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Product Categories & Brands</h1>
          <p>Group inventory items, inspect product distributions, and export category/brand summaries</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24 }}>
        {/* Categories Section */}
        <div className="card">
          <div className="card-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={20} color="#2563eb" />
              <span>Product Categories ({categories.length})</span>
            </div>
            <ExcelExportButton
              endpoint="/export/categories"
              filename="product_categories_export.xlsx"
              label="Export Categories"
              onSuccess={(msg) => showToast(msg, 'success')}
              onError={(msg) => showToast(msg, 'error')}
            />
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th className="text-right">Active Products</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={2} className="text-center" style={{ padding: 20 }}>Loading...</td>
                  </tr>
                ) : categories.length > 0 ? (
                  categories.map((c) => (
                    <tr key={c.category}>
                      <td><b>{c.category}</b></td>
                      <td className="text-right">
                        <span className="badge badge-info">{c.product_count} items</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="text-center" style={{ color: '#94a3b8' }}>
                      No categories found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Brands Section */}
        <div className="card">
          <div className="card-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Award size={20} color="#8b5cf6" />
              <span>Product Brands ({brands.length})</span>
            </div>
            <ExcelExportButton
              endpoint="/export/brands"
              filename="product_brands_export.xlsx"
              label="Export Brands"
              onSuccess={(msg) => showToast(msg, 'success')}
              onError={(msg) => showToast(msg, 'error')}
            />
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Brand Name</th>
                  <th className="text-right">Active Products</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={2} className="text-center" style={{ padding: 20 }}>Loading...</td>
                  </tr>
                ) : brands.length > 0 ? (
                  brands.map((b) => (
                    <tr key={b.brand}>
                      <td><b>{b.brand}</b></td>
                      <td className="text-right">
                        <span className="badge badge-secondary">{b.product_count} items</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="text-center" style={{ color: '#94a3b8' }}>
                      No brands found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
