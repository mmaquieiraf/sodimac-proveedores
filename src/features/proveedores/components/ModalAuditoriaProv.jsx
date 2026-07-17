import React from 'react';

export default function ModalAuditoriaProv({ 
  mostrarModalAuditoria, 
  setMostrarModalAuditoria, 
  logsAuditoriaProv 
}) {
  if (!mostrarModalAuditoria) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px', boxSizing: 'border-box' }}>
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', maxWidth: '900px', width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
        <button onClick={() => setMostrarModalAuditoria(false)} style={{ position: 'absolute', top: '15px', right: '20px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#EE2D24', fontWeight: 'bold' }}>&times;</button>
        <h2 style={{ color: '#004A99', marginTop: 0, borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Auditoría de Cambios en Proveedores</h2>
        <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>Historial cronológico de aprobaciones, ediciones y eliminaciones.</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0', textAlign: 'left' }}>
              <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>Fecha y Hora</th>
              <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>Usuario</th>
              <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>Acción</th>
              <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>RUT / Empresa</th>
              <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {logsAuditoriaProv.length === 0 ? <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#777' }}>No hay registros de auditoría aún.</td></tr> : 
            logsAuditoriaProv.map(log => (
              <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px' }}>{new Date(log.created_at).toLocaleString('es-CL')}</td>
                <td style={{ padding: '10px', fontWeight: 'bold' }}>{log.usuario}</td>
                <td style={{ padding: '10px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', 
                    backgroundColor: log.accion.includes('Aprob') ? '#d4edda' : log.accion.includes('Elimin') ? '#f8d7da' : '#e2e3e5',
                    color: log.accion.includes('Aprob') ? '#155724' : log.accion.includes('Elimin') ? '#721c24' : '#383d41'
                  }}>
                    {log.accion}
                  </span>
                </td>
                <td style={{ padding: '10px' }}><strong>{log.proveedor_nombre}</strong><br/><span style={{color:'#666'}}>{log.proveedor_rut}</span></td>
                <td style={{ padding: '10px', color: '#555' }}>{log.detalles}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}