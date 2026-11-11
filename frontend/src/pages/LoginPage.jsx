import React, { useState } from 'react';
import { ShoppingBag, Lock, User, ArrowRight, Store, KeyRound } from 'lucide-react';
import { fetchApi, setAuthToken, setUser } from '../api';

export default function LoginPage({ onLoginSuccess, onGoToStore }) {
  const [loginType, setLoginType] = useState('admin');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (loginType === 'user') {
      setUser({ username: 'Customer', role: 'customer' });
      onGoToStore();
      return;
    }

    try {
      setLoading(true);
      const res = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ login_type: loginType, username, password })
      });

      if (res.success && res.token) {
        setAuthToken(res.token);
        setUser(res.user);
        onLoginSuccess(res.user);
      } else {
        setError(res.message || 'Login failed');
      }
    } catch (err) {
      setError(err.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  const autofillCredentials = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #8e0e00 0%, #1f1c18 100%)',
      padding: 20
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: 16,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: 420,
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ background: '#0f172a', color: '#fff', padding: '28px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🛍️</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>FRIENDS OF FASHION</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: 4 }}>

          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '28px 24px' }}>
          {error && (
            <div style={{
              background: '#fee2e2',
              color: '#b91c1c',
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: '0.88rem',
              marginBottom: 18,
              border: '1px solid #fca5a5'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Login As</label>
              <select
                className="form-control"
                value={loginType}
                onChange={(e) => setLoginType(e.target.value)}
              >
                <option value="admin">Administrator / Staff</option>
                <option value="user">Customer (Storefront Only)</option>
              </select>
            </div>

            {loginType !== 'user' && (
              <>
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="form-control"
                      style={{ paddingLeft: 38 }}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. admin or staff"
                      required
                    />
                    <User size={18} style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8' }} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="password"
                      className="form-control"
                      style={{ paddingLeft: 38 }}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      required
                    />
                    <Lock size={18} style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8' }} />
                  </div>
                </div>

                {/* Credentials Quick Autofill */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: '10px 12px',
                  marginBottom: 18,
                  fontSize: '0.82rem',
                  color: '#475569'
                }}>
                  <div style={{ fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <KeyRound size={14} color="#2563eb" />
                    <span>Quick Demo Credentials:</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => autofillCredentials('admin')}
                    >
                      Admin: admin
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => autofillCredentials('staff')}
                    >
                      Staff: staff
                    </button>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '11px', marginTop: 6 }}
              disabled={loading}
            >
              {loading ? 'Logging in...' : (loginType === 'user' ? 'Browse Store as Customer' : 'Sign In to Management')}
              <ArrowRight size={16} />
            </button>
          </form>

          {loginType !== 'user' && (
            <div style={{ textAlign: 'center', marginTop: 18, paddingTop: 14, borderTop: '1px solid #e2e8f0' }}>
              <button
                type="button"
                onClick={onGoToStore}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#2563eb',
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Store size={16} />
                <span>Or View Published Storefront Directly</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
