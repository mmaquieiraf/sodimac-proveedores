import React from 'react';

export default function TabMenu({ tabAdmin, setTabAdmin, usuarioActual, cargarProcesos, cargarLogsAuditoria, setSeleccionados }) {
  return (
    <div style={{ display: 'flex', borderBottom: '3px solid #EE2D24', paddingBottom: '10px', marginBottom: '20px', gap: '20px', overflowX: 'auto' }}>
      <h2 onClick={() => setTabAdmin('dashboard')} style={{ color: tabAdmin === 'dashboard' ? '#004A99' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>Dashboard</h2>
      <h2 onClick={() => setTabAdmin('pendientes')} style={{ color: tabAdmin === 'pendientes' ? '#004A99' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>Pendientes</h2>
      <h2 onClick={() => setTabAdmin('gestion')} style={{ color: tabAdmin === 'gestion' ? '#004A99' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>Gestión</h2>
      <h2 onClick={() => setTabAdmin('actualizacion_form')} style={{ color: tabAdmin === 'actualizacion_form' ? '#004A99' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>Actualización Formulario</h2>
      <h2 onClick={() => {setTabAdmin('exportar'); setSeleccionados([]);}} style={{ color: tabAdmin === 'exportar' ? '#28a745' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>Exportar Aprobados</h2>
      <h2 onClick={() => {setTabAdmin('procesos'); cargarProcesos();}} style={{ color: tabAdmin === 'procesos' ? '#ffc107' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>Procesos</h2>
      <h2 onClick={() => setTabAdmin('crear_admin')} style={{ color: tabAdmin === 'crear_admin' ? '#004A99' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>Admin / Roles</h2>
      <h2 onClick={() => setTabAdmin('generador_rfp')} style={{ color: tabAdmin === 'generador_rfp' ? '#004A99' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>📄 Generador RFP</h2>
      <h2 onClick={() => setTabAdmin('generador_rfq')} style={{ color: tabAdmin === 'generador_rfq' ? '#004A99' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap', borderLeft: '1px solid #ddd', paddingLeft: '15px' }}>🛒 Generador RFQ</h2>
      <h2 onClick={() => setTabAdmin('generador_ft')} style={{ color: tabAdmin === 'generador_ft' ? '#004A99' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap', borderLeft: '1px solid #ddd', paddingLeft: '15px' }}>🖼️ Fichas Técnicas</h2>
      {usuarioActual?.usuario === 'mmaquieiraf@sodimac.cl' && (
        <h2 onClick={() => { setTabAdmin('auditoria'); cargarLogsAuditoria(); }} style={{ color: tabAdmin === 'auditoria' ? '#004A99' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap', borderLeft: '2px solid #ccc', paddingLeft: '20px' }}>🛡️ Auditoría</h2>
      )}
    </div>
  );
}