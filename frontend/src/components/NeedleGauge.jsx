import React, { useEffect, useRef } from 'react';

export default function NeedleGauge({ value = 0, max = 100, label = 'Inventory Level' }) {
  const canvasRef = useRef(null);
  const clampedVal = Math.max(0, Math.min(max, value));
  const percent = Math.round((clampedVal / max) * 100);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height - 20;
    const radius = Math.min(centerX, centerY) - 15;

    // Draw background gauge arc (gray)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, 0, false);
    ctx.lineWidth = 20;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Draw filled arc with color based on level
    let fillColor = '#10b981'; // Green (good)
    if (percent < 30) {
      fillColor = '#ef4444'; // Red (low)
    } else if (percent < 60) {
      fillColor = '#f59e0b'; // Amber (medium)
    }

    const endAngle = Math.PI + (Math.PI * (percent / 100));
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, endAngle, false);
    ctx.lineWidth = 20;
    ctx.strokeStyle = fillColor;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Draw Needle
    const needleAngle = Math.PI + (Math.PI * (percent / 100));
    const needleLen = radius - 8;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(needleAngle);

    // Needle body
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.lineTo(needleLen, 0);
    ctx.lineTo(0, 4);
    ctx.fillStyle = '#dc2626';
    ctx.fill();
    ctx.restore();

    // Needle pivot circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
  }, [percent]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0' }}>
      <div style={{ position: 'relative', width: 240, height: 140 }}>
        <canvas ref={canvasRef} width={240} height={140} />
        <div
          style={{
            position: 'absolute',
            bottom: 4,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: '1.4rem',
            fontWeight: 700,
            color: '#0f172a'
          }}
        >
          {percent}%
        </div>
      </div>
      <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginTop: 4 }}>
        {label}
      </div>
      {percent < 30 && (
        <div style={{ color: '#ef4444', fontSize: '0.82rem', fontWeight: 700, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>⚠ Low Inventory Alert! (&lt; 30%)</span>
        </div>
      )}
    </div>
  );
}
