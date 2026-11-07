import React, { useState, useEffect } from 'react';
import { Store, Search, LogIn, ArrowLeft, Image, Tag, RefreshCw } from 'lucide-react';
import { fetchApi } from '../api';

export default function CustomerStorefrontPage({ onBackToPortal }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchStorefront = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory) params.append('category', selectedCategory);

      const res = await fetchApi(`/products/storefront?${params.toString()}`);
      if (res.success) {
        setProducts(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load storefront products:', err);
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
    fetchStorefront();
  }, [search, selectedCategory]);

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* Store Header */}
      <header style={{
        background: '#1e293b',
        color: '#ffffff',
        padding: '16px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '1.8rem' }}>🛍️</span>
          <div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Retail Clothes Shop — Customer Catalog
            </h1>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Browse our latest arrivals and published collections
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          style={{ background: '#334155', color: '#fff', border: '1px solid #475569' }}
          onClick={onBackToPortal}
        >
          <ArrowLeft size={16} />
          <span>Staff / Admin Portal</span>
        </button>
      </header>

      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
        color: '#ffffff',
        padding: '40px 24px',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>
          Discover Trending Apparel & Fashion
        </h2>
        <p style={{ fontSize: '1rem', color: '#bfdbfe', maxWidth: 600, margin: '0 auto 20px' }}>
          Explore premium clothing, quality fabrics, and fashionable styles in our retail collection.
        </p>

        {/* Search inside hero */}
        <div style={{ maxWidth: 500, margin: '0 auto', display: 'flex', gap: 8, background: '#fff', borderRadius: 8, padding: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 10, color: '#64748b' }}>
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search our published collection..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '0.95rem',
              color: '#0f172a'
            }}
          />
        </div>
      </div>

      {/* Main Container */}
      <main style={{ maxWidth: 1300, margin: '0 auto', padding: '30px 20px', width: '100%', flex: 1 }}>
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, overflowX: 'auto', paddingBottom: 6 }}>
          <button
            type="button"
            className={`btn btn-sm ${!selectedCategory ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedCategory('')}
            style={{ borderRadius: 20, padding: '6px 16px' }}
          >
            All Categories ({products.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.category}
              type="button"
              className={`btn btn-sm ${selectedCategory === c.category ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedCategory(c.category)}
              style={{ borderRadius: 20, padding: '6px 16px', whiteSpace: 'nowrap' }}
            >
              {c.category}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 10px' }} />
            <p>Loading published store catalog...</p>
          </div>
        ) : products.length > 0 ? (
          <div className="store-grid">
            {products.map((p) => {
              const imgUrl = p.publish_image
                ? `/uploads/products/${p.publish_image}`
                : (p.image ? `/uploads/products/${p.image}` : null);

              return (
                <div key={p.id} className="store-card">
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={p.name}
                      className="store-card-img"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=500&auto=format&fit=crop&q=60';
                      }}
                    />
                  ) : (
                    <div className="store-card-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Image size={48} color="#cbd5e1" />
                    </div>
                  )}

                  <div className="store-card-body">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                          {p.category || 'Apparel'}
                        </span>
                        {p.brand && (
                          <span style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 700 }}>
                            {p.brand}
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: '4px 0' }}>
                        {p.name}
                      </h3>

                      <div style={{ display: 'flex', gap: 8, fontSize: '0.82rem', color: '#64748b', marginTop: 6 }}>
                        {p.size && <span>Size: <b>{p.size}</b></span>}
                        {p.color && <span>Color: <b>{p.color}</b></span>}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 14 }}>
                      <div className="store-price">
                        ₹ {Number(p.price).toFixed(2)}
                      </div>
                      <span className={`badge ${p.stock > 0 ? 'badge-success' : 'badge-danger'}`}>
                        {p.stock > 0 ? `In Stock (${p.stock})` : 'Out of Stock'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <h3 style={{ color: '#0f172a', fontSize: '1.2rem', marginBottom: 6 }}>No products published yet</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
              Products published by the store administrator will appear here for customers.
            </p>
          </div>
        )}
      </main>

      {/* Customer Store Footer */}
      <footer style={{
        background: '#1e293b',
        color: '#94a3b8',
        textAlign: 'center',
        padding: '24px',
        fontSize: '0.85rem',
        marginTop: 40,
        borderTop: '1px solid #334155'
      }}>
        &copy; {new Date().getFullYear()} Retail Clothes Shop — Customer Catalog & Storefront.
      </footer>
    </div>
  );
}
