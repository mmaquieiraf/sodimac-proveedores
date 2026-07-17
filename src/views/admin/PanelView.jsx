import React from 'react';
import DashboardPanel from '../../features/dashboard/components/DashboardPanel';
import PendientesPanel from '../../features/proveedores/components/PendientesPanel';
import GestionPanel from '../../features/proveedores/components/GestionPanel';
import ExportarPanel from '../../features/proveedores/components/ExportarPanel';
import ActualizacionFormPanel from '../../features/admin/components/ActualizacionFormPanel';
import AdminRolesPanel from '../../features/admin/components/AdminRolesPanel';
import AuditoriaPanel from '../../features/admin/components/AuditoriaPanel';
import ProcesosPanel from '../../features/procesos/ProcesosPanel';
import GeneradorRFP from '../../GeneradorRFP';
import GeneradorRFQ from '../../GeneradorRFQ';
import GeneradorFT from '../../GeneradorFT';

export default function PanelView({
  tabAdmin,
  setTabAdmin,
  usuarioActual,
  proveedores,
  cargarProveedores,
  categoriasDinamicas,
  setCategoriasDinamicas,
  zonasOpciones,
  macroZonas,
  aprobarProveedor,
  abrirEditorProveedor,
  rechazarProveedor,
  revocarProveedor,
  cargarLogsAuditoriaProv,
  setMostrarModalAuditoria,
  abrirNuevoProcesoConSeleccionados,
  procesos,
  cargarProcesos,
  setProcesoActual,
  setModalProceso,
  editarProceso,
  administradoresDb,
  cargarAdministradores,
  bloqueoSeguridad,
  logsAuditoria,
  cargarLogsAuditoria
}) {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      
      <div style={{ display: 'flex', borderBottom: '3px solid #EE2D24', paddingBottom: '10px', marginBottom: '20px', gap: '20px', overflowX: 'auto' }}>
        <h2 onClick={() => setTabAdmin('dashboard')} style={{ color: tabAdmin === 'dashboard' ? '#004A99' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>Dashboard</h2>
        <h2 onClick={() => setTabAdmin('pendientes')} style={{ color: tabAdmin === 'pendientes' ? '#004A99' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>Pendientes</h2>
        <h2 onClick={() => setTabAdmin('gestion')} style={{ color: tabAdmin === 'gestion' ? '#004A99' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>Gestión</h2>
        <h2 onClick={() => setTabAdmin('actualizacion_form')} style={{ color: tabAdmin === 'actualizacion_form' ? '#004A99' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>Actualización Formulario</h2>
        <h2 onClick={() => setTabAdmin('exportar')} style={{ color: tabAdmin === 'exportar' ? '#28a745' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>Exportar Aprobados</h2>
        <h2 onClick={() => {setTabAdmin('procesos'); cargarProcesos();}} style={{ color: tabAdmin === 'procesos' ? '#ffc107' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>Procesos</h2>
        <h2 onClick={() => setTabAdmin('crear_admin')} style={{ color: tabAdmin === 'crear_admin' ? '#004A99' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>Admin / Roles</h2>
        <h2 onClick={() => setTabAdmin('generador_rfp')} style={{ color: tabAdmin === 'generador_rfp' ? '#004A99' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>📄 Generador RFP</h2>
        <h2 onClick={() => setTabAdmin('generador_rfq')} style={{ color: tabAdmin === 'generador_rfq' ? '#004A99' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap', borderLeft: '1px solid #ddd', paddingLeft: '15px' }}>🛒 Generador RFQ</h2>
        <h2 onClick={() => setTabAdmin('generador_ft')} style={{ color: tabAdmin === 'generador_ft' ? '#004A99' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap', borderLeft: '1px solid #ddd', paddingLeft: '15px' }}>🖼️ Fichas Técnicas</h2>
        {usuarioActual?.usuario === 'mmaquieiraf@sodimac.cl' && (
          <h2 onClick={() => { setTabAdmin('auditoria'); cargarLogsAuditoria(); }} style={{ color: tabAdmin === 'auditoria' ? '#004A99' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap', borderLeft: '2px solid #ccc', paddingLeft: '20px' }}>🛡️ Auditoría</h2>
        )}
      </div>
      
      {tabAdmin === 'dashboard' && (
        <DashboardPanel 
          proveedores={proveedores} 
          categoriasDinamicas={categoriasDinamicas} 
          zonasOpciones={zonasOpciones} 
          macroZonas={macroZonas} 
        />
      )}

      {tabAdmin === 'pendientes' && (
        <PendientesPanel 
          proveedores={proveedores} 
          cargarProveedores={cargarProveedores} 
          aprobarProveedor={aprobarProveedor} 
          abrirEditorProveedor={abrirEditorProveedor} 
          rechazarProveedor={rechazarProveedor} 
        />
      )}

      {tabAdmin === 'gestion' && (
        <GestionPanel 
          proveedores={proveedores} 
          categoriasDinamicas={categoriasDinamicas} 
          cargarLogsAuditoriaProv={cargarLogsAuditoriaProv} 
          setMostrarModalAuditoria={setMostrarModalAuditoria} 
          cargarProveedores={cargarProveedores} 
          abrirEditorProveedor={abrirEditorProveedor} 
          revocarProveedor={revocarProveedor} 
          rechazarProveedor={rechazarProveedor} 
        />
      )}

      {tabAdmin === 'actualizacion_form' && (
        <ActualizacionFormPanel 
          categoriasDinamicas={categoriasDinamicas} 
          setCategoriasDinamicas={setCategoriasDinamicas} 
        />
      )}

      {tabAdmin === 'exportar' && (
        <ExportarPanel 
          proveedores={proveedores} 
          categoriasDinamicas={categoriasDinamicas} 
          zonasOpciones={zonasOpciones} 
          abrirNuevoProcesoConSeleccionados={abrirNuevoProcesoConSeleccionados} 
        />
      )}

      {tabAdmin === 'procesos' && (
        <ProcesosPanel 
          procesos={procesos} 
          cargarProcesos={cargarProcesos} 
          setProcesoActual={setProcesoActual} 
          setModalProceso={setModalProceso} 
          editarProceso={editarProceso} 
        />
      )}

      {tabAdmin === 'crear_admin' && (
        <AdminRolesPanel 
          usuarioActual={usuarioActual} 
          administradoresDb={administradoresDb} 
          cargarAdministradores={cargarAdministradores} 
          bloqueoSeguridad={bloqueoSeguridad} 
        />
      )}

      {tabAdmin === 'generador_rfp' && <GeneradorRFP />}
      
      {tabAdmin === 'generador_rfq' && <GeneradorRFQ />}
      
      {tabAdmin === 'generador_ft' && <GeneradorFT />}

      {tabAdmin === 'auditoria' && usuarioActual?.usuario === 'mmaquieiraf@sodimac.cl' && (
        <AuditoriaPanel 
          logsAuditoria={logsAuditoria} 
          cargarLogsAuditoria={cargarLogsAuditoria} 
        />
      )}

    </div>
  );
}