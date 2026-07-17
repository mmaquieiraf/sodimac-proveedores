import React from 'react';

export default function AuditoriaPanel({ 
  logsAuditoria = [], 
  cargarLogsAuditoria 
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #EE2D24', paddingBottom: '10px' }}>
        <h3 style={{ margin: '0', color: '#333', fontSize: '18px' }}>Registro de Auditoría de Accesos</h3>
        <button onClick={cargarLogsAuditoria} style={{ padding: '6px 15px', backgroundColor: '#004A99', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Actualizar Registros</button>
      </div>
      <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>Historial de intentos de conexión a la plataforma administrativa. Muestra accesos exitosos y bloqueos de seguridad de cualquier usuario.</p>
      
      <div style={{ overflowX: 'auto', border: '1px solid #ccc', borderRadius: '8px', maxHeight: '500px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr style={{ backgroundColor: '#f0f0f0', textAlign: 'left' }}>
              <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Fecha y Hora</th>
              <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Tipo de Evento</th>
              <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Usuario / Input</th>
              <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {logsAuditoria.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#777' }}>
                  No hay registros de auditoría aún.
                </td>
              </tr>
            ) : (
              logsAuditoria.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid #eee', backgroundColor: log.estado === 'Fallido' ? '#fff5f5' : 'white' }}>
                  <td style={{ padding: '12px' }}>{new Date(log.created_at).toLocaleString('es-CL')}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#004A99' }}>{log.tipo}</td>
                  <td style={{ padding: '12px', fontFamily: 'monospace' }}>{log.usuario_intentado}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', backgroundColor: log.estado === 'Éxito' ? '#d4edda' : '#f8d7da', color: log.estado === 'Éxito' ? '#155724' : '#721c24' }}>
                      {log.estado}
                    </span>
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