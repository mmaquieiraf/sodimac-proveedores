import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { categoriasSodimacSeed } from './utils/validaciones';

// IMPORTACIÓN DE LA ARQUITECTURA MODULAR (Features)
import DashboardPanel from './features/dashboard/DashboardPanel';
import PendientesPanel from './features/proveedores/PendientesPanel';
import GestionPanel from './features/proveedores/GestionPanel';
import ExportarPanel from './features/proveedores/ExportarPanel';
import ProcesosPanel from './features/procesos/ProcesosPanel';
import ActualizacionFormPanel from './features/admin/ActualizacionFormPanel';
import AuditoriaPanel from './features/admin/AuditoriaPanel';
import GeneradorRFP from './features/generadores/GeneradorRFP';
import GeneradorRFQ from './features/generadores/GeneradorRFQ';
import GeneradorFT from './features/generadores/GeneradorFT';

export default function App() {
  // 1. ESTADOS DE SESIÓN Y NAVEGACIÓN
  const [session, setSession] = useState(null);
  const [cargandoAuth, setCargandoAuth] = useState(true);
  const [vistaActiva, setVistaActiva] = useState('dashboard');
  
  // 2. ESTADOS GLOBALES (Los Datos Maestros)
  const [proveedores, setProveedores] = useState([]);
  const [procesos, setProcesos] = useState([]);
  const [logsAuditoria, setLogsAuditoria] = useState([]);
  const [mostrarModalAuditoria, setMostrarModalAuditoria] = useState(false);
  const [categoriasDinamicas, setCategoriasDinamicas] = useState(() => {
    const guardadas = localStorage.getItem('sodimac_categorias_dinamicas');
    return guardadas ? JSON.parse(guardadas) : categoriasSodimacSeed;
  });

  const zonasOpciones = [
    "Todo el País", "Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", 
    "Coquimbo", "Valparaíso", "Metropolitana de Santiago", "O'Higgins", 
    "Maule", "Ñuble", "Biobío", "La Araucanía", "Los Ríos", "Los Lagos", 
    "Aysén", "Magallanes y de la Antártica Chilena"
  ];

  // 3. GUARDIÁN DE SEGURIDAD (Auth Wrapper)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCargandoAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Persistencia Local de Categorías (Migrar a Supabase en el futuro)
  useEffect(() => {
    localStorage.setItem('sodimac_categorias_dinamicas', JSON.stringify(categoriasDinamicas));
  }, [categoriasDinamicas]);

  // 4. FUNCIONES DE EXTRACCIÓN DE DATOS (Backend a Frontend)
  const cargarProveedores = async () => {
    try {
      const { data, error } = await supabase.from('proveedores').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setProveedores(data || []);
    } catch (error) {
      console.error("Error al cargar proveedores:", error);
    }
  };

  const cargarProcesos = async () => {
    try {
      const { data, error } = await supabase.from('procesos').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setProcesos(data || []);
    } catch (error) {
      console.error("Error al cargar procesos:", error);
    }
  };

  const cargarLogsAuditoria = async () => {
    try {
      const { data, error } = await supabase.from('auditoria_proveedores').select('*').order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      setLogsAuditoria(data || []);
    } catch (error) {
      console.error("Error al cargar auditoría:", error);
    }
  };

  // Carga inicial al loguear
  useEffect(() => {
    if (session) {
      cargarProveedores();
      cargarProcesos();
    }
  }, [session]);

  // 5. FUNCIONES DE MUTACIÓN (Delegadas a los Paneles)
  const aprobarProveedor = async (prov) => {
    if (!window.confirm(`¿Aprobar a ${prov.razon_social}?`)) return;
    const { error } = await supabase.from('proveedores').update({ estado: 'Aprobado', aprobado_por: session.user.email, fecha_aprobacion: new Date().toISOString() }).eq('id', prov.id);
    if (!error) { alert("✅ Proveedor aprobado."); cargarProveedores(); }
  };

  const rechazarProveedor = async (prov) => {
    if (!window.confirm(`⚠️ ¿ELIMINAR a ${prov.razon_social} de la base de datos permanentemente?`)) return;
    const { error } = await supabase.from('proveedores').delete().eq('id', prov.id);
    if (!error) { alert("🗑️ Proveedor eliminado."); cargarProveedores(); }
    else { alert("Acceso denegado o error de red."); }
  };

  const revocarProveedor = async (prov) => {
    if (!window.confirm(`¿Devolver a ${prov.razon_social} a estado PENDIENTE?`)) return;
    const { error } = await supabase.from('proveedores').update({ estado: 'Pendiente' }).eq('id', prov.id);
    if (!error) cargarProveedores();
  };

  const abrirEditorProveedor = (prov) => {
    alert("Función de edición en construcción en el nuevo módulo."); // Aquí puedes conectar tu modal de edición en el futuro
  };

  const eliminarProceso = async (id) => {
    if (!window.confirm("¿Eliminar este proceso?")) return;
    const { error } = await supabase.from('procesos').delete().eq('id', id);
    if (!error) cargarProcesos();
  };

  const gestionarArchivosProceso = async (proc, accion) => {
    alert(`Módulo de archivos (Storage) en construcción para la acción: ${accion}`); 
  };

  // 6. RENDERIZADO DEL ENTORNO
  if (cargandoAuth) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f4f4f4' }}><h2 style={{color: '#004A99'}}>⏳ Verificando Seguridad...</h2></div>;
  if (!session) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f4f4f4' }}><h2 style={{color: '#EE2D24'}}>🔒 Acceso Restringido. Por favor, inicie sesión.</h2></div>; // Aquí idealmente va <LoginAdmin />

  // Renderizador condicional de módulos
  const renderizarModulo = () => {
    switch (vistaActiva) {
      case 'dashboard': return <DashboardPanel proveedores={proveedores} categoriasDinamicas={categoriasDinamicas} zonasOpciones={zonasOpciones} />;
      case 'pendientes': return <PendientesPanel proveedores={proveedores} cargarProveedores={cargarProveedores} aprobarProveedor={aprobarProveedor} rechazarProveedor={rechazarProveedor} abrirEditorProveedor={abrirEditorProveedor} />;
      case 'gestion': return <GestionPanel proveedores={proveedores} categoriasDinamicas={categoriasDinamicas} cargarProveedores={cargarProveedores} revocarProveedor={revocarProveedor} rechazarProveedor={rechazarProveedor} abrirEditorProveedor={abrirEditorProveedor} cargarLogsAuditoriaProv={cargarLogsAuditoria} setMostrarModalAuditoria={setMostrarModalAuditoria} />;
      case 'form': return <ActualizacionFormPanel categoriasDinamicas={categoriasDinamicas} setCategoriasDinamicas={setCategoriasDinamicas} />;
      case 'exportar': return <ExportarPanel proveedores={proveedores} />;
      case 'procesos': return <ProcesosPanel procesos={procesos} cargarProcesos={cargarProcesos} abrirEditorProceso={abrirEditorProceso} eliminarProceso={eliminarProceso} gestionarArchivosProceso={gestionarArchivosProceso} />;
      case 'rfp': return <GeneradorRFP />;
      case 'rfq': return <GeneradorRFQ />;
      case 'ft': return <GeneradorFT />;
      case 'auditoria': return <AuditoriaPanel logsAuditoria={logsAuditoria} cargarLogsAuditoria={cargarLogsAuditoria} />;
      default: return <DashboardPanel proveedores={proveedores} categoriasDinamicas={categoriasDinamicas} zonasOpciones={zonasOpciones} />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f4f4' }}>
      
      {/* SIDEBAR CORPORATIVA */}
      <div style={{ width: '250px', backgroundColor: '#004A99', color: 'white', display: 'flex', flexDirection: 'column', boxShadow: '2px 0 5px rgba(0,0,0,0.1)', zIndex: 10 }}>
        <div style={{ padding: '20px', backgroundColor: '#003366', textAlign: 'center', borderBottom: '3px solid #EE2D24' }}>
          <img src="/logo-sodimac-sin-margen.png" alt="Sodimac" style={{ maxWidth: '100%', filter: 'brightness(0) invert(1)' }} />
          <h4 style={{ margin: '10px 0 0 0', fontSize: '13px', letterSpacing: '1px' }}>PORTAL PROVEEDORES</h4>
        </div>
        
        <div style={{ padding: '15px 0', flex: 1, overflowY: 'auto' }}>
          <p style={{ fontSize: '10px', color: '#99c2ff', padding: '0 20px', margin: '0 0 10px 0', fontWeight: 'bold', letterSpacing: '1px' }}>MENÚ PRINCIPAL</p>
          {[
            { id: 'dashboard', label: '📊 Dashboard' },
            { id: 'pendientes', label: '⏳ Proveedores Pendientes' },
            { id: 'gestion', label: '✅ Gestión Base Aprobados' },
            { id: 'exportar', label: '📁 Exportar Bases' },
            { id: 'form', label: '⚙️ Configurar Formulario' },
            { id: 'procesos', label: '💼 Licitaciones y Procesos' },
          ].map(item => (
            <button key={item.id} onClick={() => setVistaActiva(item.id)} style={{ width: '100%', padding: '12px 20px', textAlign: 'left', background: vistaActiva === item.id ? '#003366' : 'transparent', border: 'none', borderLeft: vistaActiva === item.id ? '4px solid #EE2D24' : '4px solid transparent', color: 'white', cursor: 'pointer', fontSize: '13px', transition: '0.2s' }}>
              {item.label}
            </button>
          ))}

          <p style={{ fontSize: '10px', color: '#99c2ff', padding: '0 20px', margin: '20px 0 10px 0', fontWeight: 'bold', letterSpacing: '1px' }}>IA & DOCUMENTOS</p>
          {[
            { id: 'rfp', label: '📄 Generador RFP' },
            { id: 'rfq', label: '📦 Generador RFQ' },
            { id: 'ft', label: '🛠️ Generador Fichas Técnicas' },
          ].map(item => (
            <button key={item.id} onClick={() => setVistaActiva(item.id)} style={{ width: '100%', padding: '12px 20px', textAlign: 'left', background: vistaActiva === item.id ? '#003366' : 'transparent', border: 'none', borderLeft: vistaActiva === item.id ? '4px solid #EE2D24' : '4px solid transparent', color: 'white', cursor: 'pointer', fontSize: '13px', transition: '0.2s' }}>
              {item.label}
            </button>
          ))}

          <p style={{ fontSize: '10px', color: '#99c2ff', padding: '0 20px', margin: '20px 0 10px 0', fontWeight: 'bold', letterSpacing: '1px' }}>SEGURIDAD</p>
          <button onClick={() => { cargarLogsAuditoria(); setVistaActiva('auditoria'); }} style={{ width: '100%', padding: '12px 20px', textAlign: 'left', background: vistaActiva === 'auditoria' ? '#003366' : 'transparent', border: 'none', borderLeft: vistaActiva === 'auditoria' ? '4px solid #EE2D24' : '4px solid transparent', color: 'white', cursor: 'pointer', fontSize: '13px', transition: '0.2s' }}>
            🔍 Auditoría del Sistema
          </button>
        </div>

        <div style={{ padding: '15px', backgroundColor: '#003366', fontSize: '11px', textAlign: 'center' }}>
          Conectado como:<br/><strong style={{ color: '#ffc107', wordBreak: 'break-all' }}>{session?.user?.email}</strong>
          <button onClick={() => supabase.auth.signOut()} style={{ marginTop: '10px', width: '100%', padding: '8px', backgroundColor: '#EE2D24', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Cerrar Sesión</button>
        </div>
      </div>

      {/* ÁREA DE RENDERIZADO PRINCIPAL (Los Módulos) */}
      <div style={{ flex: 1, padding: '30px', boxSizing: 'border-box', overflowY: 'auto' }}>
        {renderizarModulo()}
      </div>

      {/* MODAL DE AUDITORÍA FLOTANTE (Para cuando se llama desde Gestión) */}
      {mostrarModalAuditoria && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', width: '90%', maxWidth: '1000px', height: '80vh', borderRadius: '8px', padding: '20px', overflowY: 'auto', position: 'relative', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <button onClick={() => setMostrarModalAuditoria(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: '#dc3545', color: 'white', border: 'none', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>✖</button>
            <AuditoriaPanel logsAuditoria={logsAuditoria} cargarLogsAuditoria={cargarLogsAuditoria} />
          </div>
        </div>
      )}
    </div>
  );
}