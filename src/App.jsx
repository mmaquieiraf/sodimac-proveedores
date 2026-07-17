import React, { useState, useEffect } from 'react';

// Hooks de Seguridad y Proceso
// Hooks de Seguridad y Proceso
import { useSecurityLock } from './features/auth/hooks/useSecurityLock';
import { useInactivityTimer } from './features/auth/hooks/useInactivityTimer';
import { useAuthProcess } from './features/auth/hooks/useAuthProcess';
import { useProveedores } from './features/auth/hooks/useProveedores'; 
import { useProcesos } from './features/auth/hooks/useProcesos';       
import { useAdmin } from './features/auth/hooks/useAdmin';             
import { signOutService } from './services/supabase/authService';
import { useCategorias } from './features/admin/hooks/useCategorias';

// Servicios
import { signOutService } from './services/supabase/authService';
import { exportarProcesosExcel, descargarPlantillaProcesos, exportarProveedoresCSV, exportarProveedoresExcel } from './services/export/excelExportService';

// Componentes
import Navbar from './components/layout/Navbar';
import ModalTerminos from './components/shared/ModalTerminos';
import ModalAuditoria from './components/shared/ModalAuditoria';
import TabMenu from './components/shared/TabMenu';
import PreLogin from './features/auth/PreLogin';
import Login from './features/auth/Login';
import RecuperarClave from './features/auth/RecuperarClave';
import RegistroPublico from './features/proveedores/RegistroPublico';
import AdminPendientes from './features/proveedores/AdminPendientes';
import AdminGestion from './features/proveedores/AdminGestion';
import ModalEdicionProveedor from './features/proveedores/ModalEdicionProveedor';
import PanelProcesos from './features/procesos/PanelProcesos';
import ModalProceso from './features/procesos/ModalProceso';
import ConfiguracionDocs from './features/admin/ConfiguracionDocs';
import DashboardStats from './features/admin/DashboardStats';
import GestionUsuarios from './features/admin/GestionUsuarios';
import ModalEdicionAdmin from './features/admin/ModalEdicionAdmin';
import PanelExportar from './features/exportacion/PanelExportar';
import PanelAuditoria from './features/admin/PanelAuditoria';

// Generadores
import GeneradorRFP from './generators/GeneradorRFP';
import GeneradorRFQ from './generators/GeneradorRFQ';
import GeneradorFT from './generators/GeneradorFT';

export default function App() {
  const [vista, setVista] = useState('registro'); 
  const [tabAdmin, setTabAdmin] = useState('dashboard');
  const [mostrarTerminos, setMostrarTerminos] = useState(false);
  const [usuarioActual, setUsuarioActual] = useState(null);

  const { bloqueoSeguridad, intentosFallidos, registrarIntentoFallido, resetearIntentos } = useSecurityLock();
  
  useInactivityTimer(usuarioActual, async () => {
    await signOutService();
    setUsuarioActual(null);
    setVista('login');
  });

  const {
    categoriasDinamicas, nuevaCatInput, setNuevaCatInput, nuevasSubInputs, setNuevasSubInputs,
    handleAgregarCategoria, handleEliminarCategoria, handleAgregarSubcategoria, handleEliminarSubcategoria
  } = useCategorias();

  const {
    administradoresDb, nuevoAdmin, setNuevoAdmin, adminEditando, setAdminEditando,
    cargarAdministradores, crearAdministrador, eliminarAdmin, guardarEdicionAdmin,
    mostrarModalAuditoria, setMostrarModalAuditoria, logsAuditoriaProv,
    logsAuditoria, cargarLogsAuditoriaProv, cargarLogsAuditoria
  } = useAdmin(usuarioActual);

  const {
    proveedores, cargarProveedores, proveedorEditando, setProveedorEditando, formData, setFormData,
    filtroRut, setFiltroRut, filtroNombre, setFiltroNombre, filtroCategoria, setFiltroCategoria,
    filtroSubcategoria, setFiltroSubcategoria, filtroExportarZona, setFiltroExportarZona, seleccionados, setSeleccionados,
    filtroGestionNombre, setFiltroGestionNombre, filtroGestionCat, setFiltroGestionCat,
    filtroGestionSub, setFiltroGestionSub, filtroGestionZona, setFiltroGestionZona,
    aprobarProveedor, revocarProveedor, rechazarProveedor, abrirEditorProveedor,
    guardarEdicionProveedor, manejarCambioZona, manejarCambioCategoria,
    manejarCambioSubcategoria, manejarEnvioRegistro, toggleSeleccion, proveedoresAprobados,
    proveedoresFiltrados, toggleSeleccionarTodo, proveedoresGestionFiltrados
  } = useProveedores(usuarioActual, categoriasDinamicas);

  const {
    procesos, cargarProcesos, modalProceso, setModalProceso, procesoActual, setProcesoActual,
    filtroProcesosController, setFiltroProcesosController, filtroProcesosEstado, setFiltroProcesosEstado,
    filtroProcesosMesAno, setFiltroProcesosMesAno, filtroDocsEmitidos, setFiltroDocsEmitidos,
    guardarProceso, eliminarProceso, marcarAcuerdoFinalizado, abrirNuevoProcesoConSeleccionados,
    editarProceso, removerProveedorInvitado, agregarProveedorInvitado, removerProveedorAdjudicado,
    agregarProveedorAdjudicado, handleDetalleAdjudicacionChange, manejarCargaMasivaProcesos,
    controllersUnicos, mesesAnosUnicos, procesosFiltradosDashboard, totalBaselineProcesos,
    procesosRecuentoCount, countSpot, countAnualizado, ahorroTotalProcesos, ahorroPorcentajeProcesos,
    procesosConAlertaFinalizacion, alertasContratos, alertasRenovacion
  } = useProcesos(usuarioActual, proveedoresFiltrados, seleccionados, setTabAdmin);

  const {
    preLoginPin, setPreLoginPin, credenciales, setCredenciales, resetStep, resetData, setResetData,
    manejarPreLogin, manejarLogin, buscarCorreo, actualizarPassword
  } = useAuthProcess({
    bloqueoSeguridad, intentosFallidos, registrarIntentoFallido, resetearIntentos,
    setVista, setUsuarioActual, cargarProveedores, cargarProcesos, cargarAdministradores
  });

  useEffect(() => { 
    if (tabAdmin === 'auditoria' && usuarioActual?.usuario === 'mmaquieiraf@sodimac.cl') {
      cargarLogsAuditoria(); 
    }
  }, [tabAdmin, usuarioActual]);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#f4f4f4', minHeight: '100vh', padding: '20px' }}>
      <Navbar usuarioActual={usuarioActual} vista={vista} setVista={setVista} setTabAdmin={setTabAdmin} setUsuarioActual={setUsuarioActual} />
      
      {mostrarModalAuditoria && <ModalAuditoria setMostrarModalAuditoria={setMostrarModalAuditoria} logsAuditoriaProv={logsAuditoriaProv} />}
      <ModalProceso modalProceso={modalProceso} setModalProceso={setModalProceso} procesoActual={procesoActual} setProcesoActual={setProcesoActual} guardarProceso={guardarProceso} removerProveedorInvitado={removerProveedorInvitado} proveedoresAprobados={proveedoresAprobados} agregarProveedorInvitado={agregarProveedorInvitado} removerProveedorAdjudicado={removerProveedorAdjudicado} agregarProveedorAdjudicado={agregarProveedorAdjudicado} handleDetalleAdjudicacionChange={handleDetalleAdjudicacionChange} />
      <ModalEdicionProveedor proveedorEditando={proveedorEditando} setProveedorEditando={setProveedorEditando} guardarEdicionProveedor={guardarEdicionProveedor} manejarCambioZona={manejarCambioZona} categoriasDinamicas={categoriasDinamicas} bloqueoSeguridad={bloqueoSeguridad} />
      <ModalEdicionAdmin adminEditando={adminEditando} setAdminEditando={setAdminEditando} guardarEdicionAdmin={guardarEdicionAdmin} bloqueoSeguridad={bloqueoSeguridad} />
      {mostrarTerminos && <ModalTerminos setMostrarTerminos={setMostrarTerminos} />}

      {vista === 'registro' && <RegistroPublico formData={formData} setFormData={setFormData} manejarEnvioRegistro={manejarEnvioRegistro} categoriasDinamicas={categoriasDinamicas} manejarCambioCategoria={manejarCambioCategoria} manejarCambioSubcategoria={manejarCambioSubcategoria} manejarCambioZona={manejarCambioZona} setMostrarTerminos={setMostrarTerminos} bloqueoSeguridad={bloqueoSeguridad} />}
      {vista === 'pre_login' && <PreLogin preLoginPin={preLoginPin} setPreLoginPin={setPreLoginPin} manejarPreLogin={manejarPreLogin} bloqueoSeguridad={bloqueoSeguridad} setVista={setVista} />}
      {vista === 'login' && <Login credenciales={credenciales} setCredenciales={setCredenciales} manejarLogin={manejarLogin} bloqueoSeguridad={bloqueoSeguridad} setVista={setVista} />}
      {vista === 'recuperar' && <RecuperarClave resetStep={resetStep} resetData={resetData} setResetData={setResetData} buscarCorreo={buscarCorreo} actualizarPassword={actualizarPassword} bloqueoSeguridad={bloqueoSeguridad} setVista={setVista} />}

      {vista === 'panel' && (
        <div style={{ maxWidth: '1200px', margin: '0 auto', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <TabMenu tabAdmin={tabAdmin} setTabAdmin={setTabAdmin} usuarioActual={usuarioActual} cargarProcesos={cargarProcesos} cargarLogsAuditoria={cargarLogsAuditoria} setSeleccionados={setSeleccionados} />
          
          {tabAdmin === 'dashboard' && <DashboardStats proveedores={proveedores} proveedoresAprobados={proveedoresAprobados} categoriasDinamicas={categoriasDinamicas} />}
          {tabAdmin === 'pendientes' && <AdminPendientes proveedores={proveedores} cargarProveedores={cargarProveedores} aprobarProveedor={aprobarProveedor} abrirEditorProveedor={abrirEditorProveedor} rechazarProveedor={rechazarProveedor} />}
          {tabAdmin === 'gestion' && <AdminGestion proveedoresGestionFiltrados={proveedoresGestionFiltrados} cargarProveedores={cargarProveedores} cargarLogsAuditoriaProv={cargarLogsAuditoriaProv} setMostrarModalAuditoria={setMostrarModalAuditoria} filtroGestionNombre={filtroGestionNombre} setFiltroGestionNombre={setFiltroGestionNombre} filtroGestionCat={filtroGestionCat} setFiltroGestionCat={setFiltroGestionCat} filtroGestionSub={filtroGestionSub} setFiltroGestionSub={setFiltroGestionSub} filtroGestionZona={filtroGestionZona} setFiltroGestionZona={setFiltroGestionZona} categoriasDinamicas={categoriasDinamicas} abrirEditorProveedor={abrirEditorProveedor} revocarProveedor={revocarProveedor} rechazarProveedor={rechazarProveedor} />}
          {tabAdmin === 'actualizacion_form' && <ConfiguracionDocs categoriasDinamicas={categoriasDinamicas} nuevaCatInput={nuevaCatInput} setNuevaCatInput={setNuevaCatInput} handleAgregarCategoria={handleAgregarCategoria} handleEliminarCategoria={handleEliminarCategoria} nuevasSubInputs={nuevasSubInputs} setNuevasSubInputs={setNuevasSubInputs} handleAgregarSubcategoria={handleAgregarSubcategoria} handleEliminarSubcategoria={handleEliminarSubcategoria} />}
          {tabAdmin === 'exportar' && <PanelExportar filtroRut={filtroRut} setFiltroRut={setFiltroRut} filtroNombre={filtroNombre} setFiltroNombre={setFiltroNombre} filtroCategoria={filtroCategoria} setFiltroCategoria={setFiltroCategoria} filtroSubcategoria={filtroSubcategoria} setFiltroSubcategoria={setFiltroSubcategoria} filtroExportarZona={filtroExportarZona} setFiltroExportarZona={setFiltroExportarZona} seleccionados={seleccionados} toggleSeleccion={toggleSeleccion} toggleSeleccionarTodo={toggleSeleccionarTodo} proveedoresFiltrados={proveedoresFiltrados} abrirNuevoProcesoConSeleccionados={abrirNuevoProcesoConSeleccionados} exportarCSV={() => exportarProveedoresCSV(proveedoresFiltrados.filter(p => seleccionados.includes(p.id)))} exportarExcel={() => exportarProveedoresExcel(proveedoresFiltrados.filter(p => seleccionados.includes(p.id)))} categoriasDinamicas={categoriasDinamicas} />}
          {tabAdmin === 'procesos' && <PanelProcesos procesos={procesos} procesosFiltradosDashboard={procesosFiltradosDashboard} usuarioActual={usuarioActual} descargarPlantillaProcesos={descargarPlantillaProcesos} manejarCargaMasivaProcesos={manejarCargaMasivaProcesos} exportarProcesosExcel={() => exportarProcesosExcel(procesosFiltradosDashboard)} setProcesoActual={setProcesoActual} setModalProceso={setModalProceso} marcarAcuerdoFinalizado={marcarAcuerdoFinalizado} procesosConAlertaFinalizacion={procesosConAlertaFinalizacion} alertasContratos={alertasContratos} alertasRenovacion={alertasRenovacion} filtroProcesosController={filtroProcesosController} setFiltroProcesosController={setFiltroProcesosController} controllersUnicos={controllersUnicos} filtroProcesosEstado={filtroProcesosEstado} setFiltroProcesosEstado={setFiltroProcesosEstado} filtroProcesosMesAno={filtroProcesosMesAno} setFiltroProcesosMesAno={setFiltroProcesosMesAno} mesesAnosUnicos={mesesAnosUnicos} filtroDocsEmitidos={filtroDocsEmitidos} setFiltroDocsEmitidos={setFiltroDocsEmitidos} procesosRecuentoCount={procesosRecuentoCount} countSpot={countSpot} countAnualizado={countAnualizado} totalBaselineProcesos={totalBaselineProcesos} ahorroTotalProcesos={ahorroTotalProcesos} ahorroPorcentajeProcesos={ahorroPorcentajeProcesos} editarProceso={editarProceso} eliminarProceso={eliminarProceso} />}
          {tabAdmin === 'crear_admin' && <GestionUsuarios nuevoAdmin={nuevoAdmin} setNuevoAdmin={setNuevoAdmin} crearAdministrador={crearAdministrador} bloqueoSeguridad={bloqueoSeguridad} usuarioActual={usuarioActual} administradoresDb={administradoresDb} setAdminEditando={setAdminEditando} eliminarAdmin={eliminarAdmin} />}
          
          {tabAdmin === 'generador_rfp' && <GeneradorRFP />}
          {tabAdmin === 'generador_rfq' && <GeneradorRFQ />}
          {tabAdmin === 'generador_ft' && <GeneradorFT />}

          {tabAdmin === 'auditoria' && usuarioActual?.usuario === 'mmaquieiraf@sodimac.cl' && (
            <PanelAuditoria cargarLogsAuditoria={cargarLogsAuditoria} logsAuditoria={logsAuditoria} />
          )}
        </div>
      )}
    </div>
  );
}