import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabase';
import { useAuth } from '../auth/AuthContext'; 

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuarioActual } = useAuth(); 

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const isActive = (path) => location.pathname.includes(path);

  // Helper defensivo para compatibilidad entre el AuthContext modular (Supabase) y el objeto original del monolito
  const identificadorUsuario = usuarioActual?.email || usuarioActual?.correo || usuarioActual?.usuario;

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#f4f4f4', minHeight: '100vh', padding: '20px' }}>
      
      {/* NAVBAR IDÉNTICO AL MONOLITO */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#004A99', padding: '15px 20px', borderRadius: '8px', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/logo.png" alt="Sodimac" style={{ height: '50px', objectFit: 'contain', transform: 'scale(2.8)', transformOrigin: 'left center', marginLeft: '5px' }} />
          <span style={{ fontSize: '22px', fontWeight: '600', letterSpacing: '0.5px', zIndex: 10, marginLeft: '4cm' }}>Portal de Proveedores</span>
        </div>
        <div style={{ zIndex: 10, display: 'flex', alignItems: 'center', gap: '15px' }}>
          {usuarioActual && <span style={{ fontSize: '14px', color: '#cce5ff', borderRight: '1px solid rgba(255,255,255,0.3)', paddingRight: '15px' }}>👤 {identificadorUsuario}</span>}
          <button onClick={handleLogout} style={{ background: '#EE2D24', border: 'none', color: 'white', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>Cerrar Sesión</button>
        </div>
      </div>

      {/* PANEL ADMINISTRATIVO PRINCIPAL */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        
        {/* BARRA DE NAVEGACIÓN HORIZONTAL DE PESTAÑAS */}
        <div style={{ display: 'flex', borderBottom: '3px solid #EE2D24', paddingBottom: '10px', marginBottom: '20px', gap: '20px', overflowX: 'auto' }}>
          <h2 onClick={() => navigate('/admin/dashboard')} style={{ color: isActive('dashboard') ? '#004A99' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>Dashboard</h2>
          <h2 onClick={() => navigate('/admin/pendientes')} style={{ color: isActive('pendientes') ? '#004A99' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>Pendientes</h2>
          <h2 onClick={() => navigate('/admin/gestion')} style={{ color: isActive('gestion') ? '#004A99' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>Gestión</h2>
          <h2 onClick={() => navigate('/admin/form')} style={{ color: isActive('form') ? '#004A99' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>Actualización Formulario</h2>
          <h2 onClick={() => navigate('/admin/exportar')} style={{ color: isActive('exportar') ? '#28a745' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>Exportar Aprobados</h2>
          <h2 onClick={() => navigate('/admin/procesos')} style={{ color: isActive('procesos') ? '#ffc107' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>Procesos</h2>
          <h2 onClick={() => navigate('/admin/roles')} style={{ color: isActive('roles') ? '#004A99' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>Admin / Roles</h2>
          
          {/* MÓDULOS DE GENERADORES AÑADIDOS POR EXCEPCIÓN DEL USUARIO */}
          <h2 onClick={() => navigate('/admin/rfp')} style={{ color: isActive('rfp') ? '#004A99' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>Generador RFP</h2>
          <h2 onClick={() => navigate('/admin/rfq')} style={{ color: isActive('rfq') ? '#004A99' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>Generador RFQ</h2>
          <h2 onClick={() => navigate('/admin/ft')} style={{ color: isActive('ft') ? '#004A99' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>Generador FT</h2>
          
          {/* RESTRICCIÓN DE SEGURIDAD EXACTA MODIFICADA A CORREO */}
          {identificadorUsuario === 'mmaquieiraf@sodimac.cl' && (
            <h2 onClick={() => navigate('/admin/auditoria')} style={{ color: isActive('auditoria') ? '#004A99' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap', borderLeft: '2px solid #ccc', paddingLeft: '20px' }}>🛡️ Auditoría</h2>
          )}
        </div>
        
        {/* ÁREA DE INYECCIÓN DE PANELES */}
        <Outlet />

      </div>
    </div>
  );
}