import React from 'react';

export default function MapaCobertura({ macroZonas, mapStats }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
      {Object.entries(macroZonas).map(([macro, regiones]) => (
        <div key={macro} style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '15px', backgroundColor: '#fafafa' }}>
          <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#004A99', borderBottom: '2px solid #EE2D24', paddingBottom: '5px' }}>Zona {macro}</h4>
          {regiones.map(reg => {
            const cantidad = mapStats.conteo[reg] || 0;
            const intensidad = mapStats.maxMapa > 0 ? cantidad / mapStats.maxMapa : 0;
            const bgColor = cantidad > 0 ? `rgba(238, 45, 36, ${0.15 + (intensidad * 0.85)})` : '#ffffff';
            const txtColor = cantidad > 0 ? (intensidad > 0.5 ? '#ffffff' : '#333333') : '#999999';
            return (
              <div key={reg} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '12px', padding: '8px 10px', backgroundColor: bgColor, color: txtColor, borderRadius: '4px', border: '1px solid #eee', transition: 'all 0.3s' }}>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80%' }} title={reg}>{reg}</span>
                <span style={{ fontWeight: 'bold' }}>{cantidad}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}