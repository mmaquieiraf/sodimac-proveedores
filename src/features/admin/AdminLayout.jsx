import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../../../supabase';

export default function AdminLayout() {
  const navigate = useNavigate();

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
            { path: '/admin/dashboard', label: '📊 Dashboard' },
            { path: '/admin/pendientes', label: '⏳ Proveedores Pendientes' },
            { path: '/admin/gestion', label: '✅ Gestión Base Aprobados' },
            { path: '/admin/exportar', label: '📁 Exportar Bases' },
            { path: '/admin/form', label: '⚙️ Configurar Formulario' },
            { path: '/admin/procesos', label: '💼 Licitaciones y Procesos' },
          ].map(item => (
            <button key={item.path} onClick={() => navigate(item.path)} style={{ width: '100%', padding: '12px 20px', textAlign: 'left', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '13px', transition: '0.2s' }}>
              {item.label}
            </button>
          ))}

          <p style={{ fontSize: '10px', color: '#99c2ff', padding: '0 20px', margin: '20px 0 10px 0', fontWeight: 'bold', letterSpacing: '1px' }}>IA & DOCUMENTOS</p>
          {[
            { path: '/admin/rfp', label: '📄 Generador RFP' },
            { path: '/admin/rfq', label: '📦 Generador RFQ' },
            { path: '/admin/ft', label: '🛠️ Generador Fichas Técnicas' },
          ].map(item => (
            <button key={item.path} onClick={() => navigate(item.path)} style={{ width: '100%', padding: '12px 20px', textAlign: 'left', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '13px', transition: '0.2s' }}>
              {item.label}
            </button>
          ))}
        </div>

        <button onClick={() => { supabase.auth.signOut(); navigate('/login'); }} style={{ padding: '15px', backgroundColor: '#EE2D24', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Cerrar Sesión</button>
      </div>

      {/* ÁREA DE CONTENIDO DINÁMICO */}
      <main style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}