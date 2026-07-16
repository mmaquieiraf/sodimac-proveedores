import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { categoriasSodimacSeed } from './utils/validaciones';

// 1. IMPORTACIÓN DEL MÓDULO PÚBLICO (Formulario de Registro)
import FormularioPublico from './pages/FormularioPublico';

// 2. IMPORTACIÓN DE LA ARQUITECTURA MODULAR ADMIN (Features)
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

// ============================================================================
// COMPONENTE RAÍZ: MÁQUINA DE ESTADOS Y COMPUERTAS
// ============================================================================
export default function App() {
  // ESTADO CENTRAL DE NAVEGACIÓN
  const [vistaActual, setVistaActual] = useState('registro'); // 'registro' | 'pin_acceso' | 'login' | 'admin'

  // ESTADOS DE AUTENTICACIÓN
  const [session, setSession] = useState(null);
  const [verificandoSesion, setVerificandoSesion] = useState(true);

  // ESTADOS DE FORMULARIOS DE ACCESO
  const [pinAcceso, setPinAcceso] = useState('');
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginPinInterno, setLoginPinInterno] = useState('');

  // VERIFICACIÓN INICIAL DE SESIÓN (Supabase)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) setVistaActual('admin');
      setVerificandoSesion(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setVistaActual('admin');
      } else {
        setVistaActual('registro');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // HANDLERS DE SEGURIDAD (Compuertas)
  const manejarAccesoPin = (e) => {
    e.preventDefault();
    const pinCorrecto = import.meta.env.VITE_PIN_ACCESO || '123456'; 
    if (pinAcceso === pinCorrecto) {
      setVistaActual('login');
      setPinAcceso('');
    } else {
      alert('🔒 PIN Incorrecto. Acceso denegado.');
    }
  };

  const manejarLoginSupabase = async (e) => {
    e.preventDefault();
    const pinInternoCorrecto = import.meta.env.VITE_PIN_INTERNO || '654321'; 

    if (loginPinInterno !== pinInternoCorrecto) {
      alert('🔒 PIN Interno Incorrecto. Intento bloqueado.');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: loginUser,
      password: loginPass,
    });

    if (error) {
      alert('❌ Credenciales inválidas. Verifique su usuario y contraseña.');
    } else {
      setLoginUser('');
      setLoginPass('');
      setLoginPinInterno('');
    }
  };

  // PANTALLA DE CARGA INICIAL
  if (verificandoSesion) {
    return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}><h2 style={{ color: '#004A99' }}>⏳ Cargando entorno...</h2></div>;
  }

  // RENDERIZADO DE CABECERA DINÁMICA CORPORATIVA
  const renderCabecera = () => (
    <header style={{ backgroundColor: '#004A99', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', borderBottom: '4px solid #EE2D24', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <img src="/logo-sodimac-sin-margen.png" alt="Sodimac" style={{ height: '30px', filter: 'brightness(0) invert(1)' }} />
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', letterSpacing: '0.5px' }}>Portal de Proveedores</h2>
      </div>
      {vistaActual === 'registro' && (
        <button onClick={() => setVistaActual('pin_acceso')} style={{ padding: '8px 20px', backgroundColor: 'transparent', color: 'white', border: '1px solid white', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          Acceso Interno
        </button>
      )}
      {(vistaActual === 'pin_acceso' || vistaActual === 'login') && (
        <button onClick={() => setVistaActual('registro')} style={{ padding: '8px 20px', backgroundColor: 'transparent', color: 'white', border: '1px solid white', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          Ir a Registro
        </button>
      )}
    </header>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f4f4f4' }}>
      
      {/* La cabecera solo se muestra en las vistas públicas */}
      {vistaActual !== 'admin' && renderCabecera()}

      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: vistaActual !== 'registro' ? 'center' : 'flex-start', padding: vistaActual === 'registro' ? '40px 20px' : '0' }}>
        
        {/* ========================================================= */}
        {/* COMPUERTA 1: PORTAL PÚBLICO DE REGISTRO */}
        {/* ========================================================= */}
        {vistaActual === 'registro' && (
          <div style={{ width: '100%', maxWidth: '1000px', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
            <h2 style={{ color: '#333', borderBottom: '2px solid #EE2D24', paddingBottom: '10px', marginTop: 0 }}>Registro de Nuevos Proveedores</h2>
            <FormularioPublico />
          </div>
        )}

        {/* ========================================================= */}
        {/* COMPUERTA 2: SEGURIDAD DE ACCESO (PIN INICIAL) */}
        {/* ========================================================= */}
        {vistaActual === 'pin_acceso' && (
          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 8px 20px rgba(0,0,0,0.1)', width: '350px', textAlign: 'center' }}>
            <h3 style={{ color: '#004A99', fontSize: '20px', marginBottom: '25px', fontWeight: 'bold' }}>Seguridad de Acceso</h3>
            <form onSubmit={manejarAccesoPin}>
              <input 
                type="password" 
                placeholder="* * * * * *" 
                value={pinAcceso}
                onChange={(e) => setPinAcceso(e.target.value)}
                style={{ width: '100%', padding: '15px', fontSize: '24px', letterSpacing: '10px', textAlign: 'center', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '20px', boxSizing: 'border-box' }}
                maxLength={6}
                required
              />
              <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#004A99', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px', transition: '0.2s' }}>
                VALIDAR ACCESO
              </button>
              <button type="button" onClick={() => setVistaActual('registro')} style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', color: '#333', border: '1px solid #ccc', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}>
                VOLVER
              </button>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* COMPUERTA 3: INGRESO DE ADMINISTRADOR (LOGIN SUPABASE) */}
        {/* ========================================================= */}
        {vistaActual === 'login' && (
          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 8px 20px rgba(0,0,0,0.1)', width: '350px' }}>
            <h3 style={{ color: '#004A99', fontSize: '20px', marginBottom: '25px', textAlign: 'center', fontWeight: 'bold' }}>Ingreso de Administrador</h3>
            <form onSubmit={manejarLoginSupabase}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>Usuario</label>
              <input type="email" value={loginUser} onChange={(e) => setLoginUser(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '15px', boxSizing: 'border-box' }} required />
              
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>Contraseña</label>
              <input type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '15px', boxSizing: 'border-box' }} required />
              
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>PIN Interno</label>
              <input type="password" value={loginPinInterno} onChange={(e) => setLoginPinInterno(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '25px', boxSizing: 'border-box' }} maxLength={6} required />
              
              <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#004A99', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '15px', transition: '0.2s' }}>
                INGRESAR AL PANEL
              </button>
              <div style={{ textAlign: 'center' }}>
                <a href="#" style={{ color: '#004A99', fontSize: '12px', textDecoration: 'underline' }}>¿Olvidaste tu contraseña?</a>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* COMPUERTA 4: BÓVEDA SEGURA (PANEL ADMIN) */}
        {/* ========================================================= */}
        {vistaActual === 'admin' && session && (
          <div style={{ width: '100vw' }}>
             <OrquestadorAdmin session={session} />
          </div>
        )}

      </main>
    </div>
  );
}

// ============================================================================
// COMPONENTE PRIVADO: ORQUESTADOR DEL PANEL DE ADMINISTRACIÓN
// ============================================================================
function OrquestadorAdmin({ session }) {
  const [vistaActiva, setVistaActiva] = useState('dashboard');
  
  // ESTADOS GLOBALES DE BASE DE DATOS
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

  // PERSISTENCIA DE CATEGORÍAS LOCAL
  useEffect(() => {
    localStorage.setItem('sodimac_categorias_dinamicas', JSON.stringify(categoriasDinamicas));
  }, [categoriasDinamicas]);

  // FUNCIONES DE EXTRACCIÓN (READ)
  const cargarProveedores = async () => {
    try {
      const { data, error } = await supabase.from('proveedores').select('*').order('created_at', { ascending: false });
      if (!error) setProveedores(data || []);
    } catch (error) { console.error("Error:", error); }
  };

  const cargarProcesos = async () => {
    try {
      const { data, error } = await supabase.from('procesos').select('*').order('created_at', { ascending: false });
      if (!error) setProcesos(data || []);
    } catch (error) { console.error("Error:", error); }
  };

  const cargarLogsAuditoria = async () => {
    try {
      const { data, error } = await supabase.from('auditoria_proveedores').select('*').order('created_at', { ascending: false }).limit(200);
      if (!error) setLogsAuditoria(data || []);
    } catch (error) { console.error("Error:", error); }
  };

  // Carga inicial al entrar al panel
  useEffect(() => {
    cargarProveedores();
    cargarProcesos();
  }, []);

  // FUNCIONES DE MUTACIÓN (WRITE)
  const aprobarProveedor = async (prov) => {
    if (!window.confirm(`¿Aprobar a ${prov.razon_social}?`)) return;
    const { error } = await supabase.from('proveedores').update({ estado: 'Aprobado', aprobado_por: session.user.email, fecha_aprobacion: new Date().toISOString() }).eq('id', prov.id);
    if (!error) { alert("✅ Proveedor aprobado."); cargarProveedores(); }
  };

  const rechazarProveedor = async (prov) => {
    if (!window.confirm(`⚠️ ¿ELIMINAR a ${prov.razon_social} permanentemente?`)) return;
    const { error } = await supabase.from('proveedores').delete().eq('id', prov.id);
    if (!error) { alert("🗑️ Proveedor eliminado."); cargarProveedores(); }
  };

  const revocarProveedor = async (prov) => {
    if (!window.confirm(`¿Devolver a ${prov.razon_social} a estado PENDIENTE?`)) return;
    const { error } = await supabase.from('proveedores').update({ estado: 'Pendiente' }).eq('id', prov.id);
    if (!error) cargarProveedores();
  };

  const abrirEditorProveedor = (prov) => alert("Módulo de edición en construcción."); 
  const eliminarProceso = async (id) => {
    if (!window.confirm("¿Eliminar este proceso?")) return;
    const { error } = await supabase.from('procesos').delete().eq('id', id);
    if (!error) cargarProcesos();
  };
  const gestionarArchivosProceso = async (proc, accion) => alert(`Storage en construcción: ${accion}`);

  // MOTOR DE RENDERIZADO DEL PANEL ADMIN
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
    <div style={{ display: 'flex', minHeight: '100vh' }}>
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
          Conectado como:<br/><strong style={{ color: '#ffc107', wordBreak: 'break-all' }}>{session.user.email}</strong>
          <button onClick={() => supabase.auth.signOut()} style={{ marginTop: '10px', width: '100%', padding: '8px', backgroundColor: '#EE2D24', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Cerrar Sesión</button>
        </div>
      </div>

      {/* ÁREA DE RENDERIZADO DEL ADMINISTRADOR */}
      <div style={{ flex: 1, padding: '30px', boxSizing: 'border-box', overflowY: 'auto' }}>
        {renderizarModulo()}
      </div>

      {/* MODAL DE AUDITORÍA FLOTANTE */}
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