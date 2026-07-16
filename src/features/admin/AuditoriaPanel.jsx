import React, { useState, useMemo } from 'react';

export default function AuditoriaPanel({ 
  logsAuditoria = [], 
  cargarLogsAuditoria 
}) {
  // 1. Estados de Filtrado Local (Alto Rendimiento)
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroAccion, setFiltroAccion] = useState('');

  // 2. Motor de Búsqueda Memorizado
  const logsFiltrados = useMemo(() => {
    return logsAuditoria.filter(log => {
      const texto = filtroTexto.toLowerCase();
      // Búsqueda profunda en múltiples campos, incluyendo la nueva columna de IP
      const matchTexto = 
        (log.usuario || '').toLowerCase().includes(texto) ||
        (log.proveedor_nombre || '').toLowerCase().includes(texto) ||
        (log.proveedor_rut || '').toLowerCase().includes(texto) ||
        (log.ip_origen || '').toLowerCase().includes(texto);
        
      const matchAccion = filtroAccion === '' || log.accion === filtroAccion;
      return matchTexto && matchAccion;
    });
  }, [logsAuditoria, filtroTexto, filtroAccion]);

  // Formateo de fechas estandarizado
  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return 'Desconocida';
    const fecha = new Date(fechaISO);
    return fecha.toLocaleString('es-CL', { 
      day: '2-digit', month: '2-digit', year: 'numeric', 
      hour: '2-digit', minute: '2-digit', second: '2-digit' 
    });
  };

  return (
    <div>
      {/* ENCABEZADO Y ACCIONES PRINCIPALES */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ margin: '0 0 5px 0', color: '#004A99', fontSize: '18px', borderBottom: '2px solid #EE2D24', paddingBottom: '10px' }}>
            Auditoría y Trazabilidad del Sistema
          </h3>
          <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
            Registro inmutable de modificaciones críticas y control de accesos por IP.
          </p>
        </div>
        <button 
          onClick={cargarLogsAuditoria} 
          style={{ padding: '8px 15px', backgroundColor: '#004A99', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}
        >
          🔄 Actualizar Registros
        </button>
      </div>

      {/* PANEL DE FILTROS */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', border: '1px solid #eee', borderRadius: '8px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#555', marginBottom: '5px' }}>Búsqueda Global</label>
          <input 
            type="text" 
            placeholder="Buscar por Usuario, Proveedor, RUT o Dirección IP..." 
            value={filtroTexto} 
            onChange={e => setFiltroTexto(e.target.value)} 
            style={{ width: '100%', padding: '10px', fontSize: '13px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} 
          />
        </div>
        <div style={{ width: '250px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#555', marginBottom: '5px' }}>Filtrar por Acción</label>
          <select 
            value={filtroAccion} 
            onChange={e => setFiltroAccion(e.target.value)} 
            style={{ width: '100%', padding: '10px', fontSize: '13px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
          >
            <option value="">Todas las Acciones</option>
            <option value="Cambio de Estado">Cambio de Estado (Aprobaciones/Rechazos)</option>
            <option value="Eliminación Directa">Eliminación Directa</option>
            <option value="Edición Manual">Edición Manual</option>
          </select>
        </div>
      </div>

      {/* GRILLA DE AUDITORÍA */}
      <div style={{ overflowX: 'auto', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0', color: '#333', textAlign: 'left' }}>
              <th style={{ padding: '12px 15px', borderBottom: '2px solid #ccc', width: '12%' }}>Timestamp</th>
              <th style={{ padding: '12px 15px', borderBottom: '2px solid #ccc', width: '18%' }}>Usuario (Actor)</th>
              <th style={{ padding: '12px 15px', borderBottom: '2px solid #ccc', width: '15%' }}>IP / Origen</th>
              <th style={{ padding: '12px 15px', borderBottom: '2px solid #ccc', width: '15%' }}>Tipo de Acción</th>
              <th style={{ padding: '12px 15px', borderBottom: '2px solid #ccc', width: '20%' }}>Proveedor Afectado</th>
              <th style={{ padding: '12px 15px', borderBottom: '2px solid #ccc', width: '20%' }}>Detalles del Sistema</th>
            </tr>
          </thead>
          <tbody>
            {logsFiltrados.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#777', fontStyle: 'italic' }}>
                  No se encontraron registros de auditoría con los filtros actuales.
                </td>
              </tr>
            ) : (
              logsFiltrados.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #eee', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#fdfdfd'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '12px 15px', color: '#666', fontSize: '11px' }}>
                    {formatearFecha(log.created_at)}
                  </td>
                  <td style={{ padding: '12px 15px', fontWeight: 'bold', color: '#004A99', wordBreak: 'break-all' }}>
                    {log.usuario || 'Sistema Automático'}
                  </td>
                  <td style={{ padding: '12px 15px' }}>
                    <span style={{ backgroundColor: '#eef2f7', color: '#333', padding: '4px 8px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '11px', border: '1px solid #d0d7de' }}>
                      {log.ip_origen || 'No registrada'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 15px' }}>
                    <span style={{ 
                      backgroundColor: log.accion.includes('Eliminación') ? '#ffeeba' : (log.accion.includes('Cambio') ? '#cce5ff' : '#e2e3e5'), 
                      color: log.accion.includes('Eliminación') ? '#856404' : (log.accion.includes('Cambio') ? '#004085' : '#383d41'), 
                      padding: '4px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', display: 'inline-block' 
                    }}>
                      {log.accion}
                    </span>
                  </td>
                  <td style={{ padding: '12px 15px' }}>
                    <strong style={{ display: 'block', color: '#333' }}>{log.proveedor_nombre}</strong>
                    <span style={{ color: '#888', fontSize: '10px' }}>RUT: {log.proveedor_rut}</span>
                  </td>
                  <td style={{ padding: '12px 15px', color: '#555', fontSize: '11px', lineHeight: '1.4' }}>
                    {log.detalles}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}