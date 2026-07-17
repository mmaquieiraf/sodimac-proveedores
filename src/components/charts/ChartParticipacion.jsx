import React from 'react';

export default function ChartParticipacion({ chartWidthProc, chartHeightProc, procesosOrdenados, puntosTendencia, stepXProc, maxPart }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: `${chartHeightProc}px` }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${chartWidthProc} ${chartHeightProc}`} preserveAspectRatio="none">
        <line x1="20" y1={chartHeightProc - 20} x2={chartWidthProc} y2={chartHeightProc - 20} stroke="#ccc" strokeWidth="1" />
        <line x1="20" y1="0" x2="20" y2={chartHeightProc - 20} stroke="#ccc" strokeWidth="1" />
        {procesosOrdenados.length > 1 && <polyline points={puntosTendencia} fill="none" stroke="#28a745" strokeWidth="2" />}
        {procesosOrdenados.map((p, i) => {
          const invitados = p.proveedores_invitados ? p.proveedores_invitados.split(',').length : 0; 
          const ofertas = parseInt(p.cantidad_ofertas) || 0;
          const porcentaje = invitados > 0 ? (ofertas / invitados) * 100 : 0;
          const cx = 20 + i * stepXProc; 
          const cy = chartHeightProc - 20 - ((Math.min(porcentaje, 100) / maxPart) * (chartHeightProc - 40));
          return (
            <g key={p.id}>
              <circle cx={cx} cy={cy} r="4" fill="#004A99" />
              <text x={cx} y={cy - 10} fontSize="10" fill="#333" textAnchor="middle">{porcentaje.toFixed(0)}%</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}