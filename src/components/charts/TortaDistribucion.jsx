import React from 'react';

export default function TortaDistribucion({ pieSlices, tortaGradient }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '200px', height: '200px', borderRadius: '50%', background: tortaGradient, marginBottom: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}></div>
      <div style={{ width: '100%', maxHeight: '150px', overflowY: 'auto' }}>
        {pieSlices.map(s => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', fontSize: '12px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: s.color, marginRight: '10px', borderRadius: '2px' }}></div>
            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.key}</span>
            <span style={{ fontWeight: 'bold' }}>{s.val} ({Math.round(s.percent)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}