import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function Toast({ toasts = [], onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type || 'info'}`}>
          {t.type === 'success' ? (
            <CheckCircle2 size={18} color="#10b981" />
          ) : (
            <AlertCircle size={18} color="#ef4444" />
          )}
          <div style={{ flex: 1 }}>{t.message}</div>
          <button
            type="button"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
            onClick={() => onDismiss(t.id)}
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
