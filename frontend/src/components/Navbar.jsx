import React from 'react';
import { ShoppingBag, LogOut, Store, Menu } from 'lucide-react';
import { getUser, clearAuth } from '../api';

export default function Navbar({ onNavigate, onToggleSidebar }) {
  const user = getUser();

  const handleLogout = () => {
    clearAuth();
    onNavigate('login');
  };

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          type="button"
          onClick={onToggleSidebar}
          className="btn btn-secondary btn-sm"
          style={{ background: 'transparent', border: 'none', color: '#fff', padding: 6, display: 'flex' }}
          title="Toggle Navigation"
        >
          <Menu size={20} />
        </button>

        <a
          href="#dashboard"
          onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}
          className="topbar-brand"
        >
          <span className="store-icon">🛍️</span>
          <span>FRIENDS OF FASHION</span>
        </a>
      </div>

      <div className="topbar-actions">
        <button
          type="button"
          className="btn btn-sm"
          style={{ background: '#334155', color: '#f8fafc', border: '1px solid #475569' }}
          onClick={() => onNavigate('storefront')}
        >
          <Store size={15} />
          <span>Customer Storefront</span>
        </button>

        {user && (
          <div className="user-badge">
            <span>Welcome, <b>{user.username}</b></span>
            <span className="role-tag">{user.role}</span>
          </div>
        )}

        <button
          type="button"
          className="btn btn-danger btn-sm"
          onClick={handleLogout}
          title="Sign out of system"
        >
          <LogOut size={15} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
