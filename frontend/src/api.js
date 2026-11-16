// API helper client for Retail Shop Management System
const configuredApiBase = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '')
  : '';

const API_BASE = configuredApiBase ? `${configuredApiBase}/api` : '/api';

// Uploaded files are served by the Flask backend, not necessarily by the
// frontend host (for example when the frontend is deployed on Vercel).
export function getProductImageUrl(filename) {
  if (!filename || typeof filename !== 'string') return null;
  const value = filename.trim();
  if (!value) return null;
  if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:')) return value;
  if (value.startsWith('/uploads/')) {
    return configuredApiBase ? `${new URL(configuredApiBase, window.location.origin).origin}${value}` : value;
  }
  const safeName = value.split('/').pop();
  const path = `/uploads/products/${encodeURIComponent(safeName)}`;
  return configuredApiBase ? `${new URL(configuredApiBase, window.location.origin).origin}${path}` : path;
}

export const getAuthToken = () => localStorage.getItem('retail_token');
export const setAuthToken = (token) => {
  if (token) localStorage.setItem('retail_token', token);
  else localStorage.removeItem('retail_token');
};

export const getUser = () => {
  try {
    const raw = localStorage.getItem('retail_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export const setUser = (user) => {
  if (user) localStorage.setItem('retail_user', JSON.stringify(user));
  else localStorage.removeItem('retail_user');
};

export const clearAuth = () => {
  localStorage.removeItem('retail_token');
  localStorage.removeItem('retail_user');
};

export async function fetchApi(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // If unauthorized and not already on login, clear auth
    clearAuth();
    if (!window.location.hash.includes('login') && !window.location.hash.includes('store')) {
      window.dispatchEvent(new Event('auth-logout'));
    }
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errMessage = (data && data.message) || `Request failed with status ${response.status}`;
    throw new Error(errMessage);
  }

  return data;
}

export async function downloadExcel(endpoint, defaultFilename = 'export.xlsx', params = {}) {
  const token = getAuthToken();
  const queryStr = new URLSearchParams(params).toString();
  const fullEndpoint = `${endpoint}${queryStr ? (endpoint.includes('?') ? '&' : '?') + queryStr : ''}`;
  const url = fullEndpoint.startsWith('http') ? fullEndpoint : `${API_BASE}${fullEndpoint.startsWith('/') ? fullEndpoint : `/${fullEndpoint}`}`;

  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Excel download failed with status ${response.status}`);
  }

  // Extract filename from Content-Disposition if present
  let filename = defaultFilename;
  const disposition = response.headers.get('content-disposition');
  if (disposition && disposition.indexOf('filename=') !== -1) {
    const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
    if (matches != null && matches[1]) {
      filename = matches[1].replace(/['"]/g, '');
    }
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
}
