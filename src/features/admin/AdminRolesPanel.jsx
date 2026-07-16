import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

export default function AdminRolesPanel() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Estados del formulario (Visual por ahora, para mantener la UI intacta)
  const [nuevoAdmin, setNuevoAdmin] = useState({
    nombre: '', apellido: '', usuarioAlias: '', correo: '', password: ''
  });

  // 🛡️ FASE 3: CONEXIÓN AL TÚNEL SEGURO RPC
  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      // Llamamos a la función segura en PostgreSQL que se salta la restricción de auth.users
      const { data, error } = await supabase.rpc('obtener_usuarios_admin');
      
      if (error) {
        console.error("Error de seguridad RPC:", error);
        return;
      }
      
      setUsuarios(data || []);
    } catch (error) {
      console.error("Error crítico al cargar administradores:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const manejarRegistro = (e) => {
    e.preventDefault();
    alert("Módulo de creación de administradores en mantenimiento por seguridad Zero Trust.");
  };

  return (
    <div>
      {/* 👑 CABECERA DE MÓDULO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #ccc', paddingBottom: '10px' }}>
        <h2 style={{ color: '#004A99', margin: 0, fontSize: '20px' }}>Gestión de Administradores y Roles</h2>
        <span style={{ backgroundColor: '#EE2D24', color: 'white', padding: '5px 12px', borderRadius: '15px', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
          👑 Modo SuperAdmin Activo
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        
        {/* ================= COLUMNA IZQUIERDA: FORMULARIO ================= */}
        <div>
          <h3 style={{ borderBottom: '2px solid #EE2D24', paddingBottom: '8px', color: '#333', fontSize: '16px', marginTop: 0 }}>
            Registrar Nuevo Administrador
          </h3>
          <form onSubmit={manejarRegistro}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#555', marginBottom: '5px' }}>Nombre</label>
                <input type="text" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} value={nuevoAdmin.nombre} onChange={e => setNuevoAdmin({...nuevoAdmin, nombre: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#555', marginBottom: '5px' }}>Apellido</label>
                <input type="text" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} value={nuevoAdmin.apellido} onChange={e => setNuevoAdmin({...nuevoAdmin, apellido: e.target.value})} />
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#555', marginBottom: '5px' }}>Usuario (Alias Interno)</label>
              <input type="text" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} value={nuevoAdmin.usuarioAlias} onChange={e => setNuevoAdmin({...nuevoAdmin, usuarioAlias: e.target.value})} />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#555', marginBottom: '5px' }}>Correo (Credencial de Acceso)</label>
              <input type="email" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} value={nuevoAdmin.correo} onChange={e => setNuevoAdmin({...nuevoAdmin, correo: e.target.value})} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#555', marginBottom: '5px' }}>Contraseña Segura</label>
              <input type="password" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} value={nuevoAdmin.password} onChange={e => setNuevoAdmin({...nuevoAdmin, password: e.target.value})} />
            </div>

            <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#004A99', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}>
              CREAR ADMINISTRADOR
            </button>
          </form>
        </div>

        {/* ================= COLUMNA DERECHA: TABLA DE USUARIOS ================= */}
        <div>
          <h3 style={{ borderBottom: '2px solid #004A99', paddingBottom: '8px', color: '#333', fontSize: '16px', marginTop: 0 }}>
            Gestión de Usuarios
          </h3>
          
          <div style={{ border: '1px solid #eee', borderRadius: '6px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead style={{ backgroundColor: '#f0f0f0', textAlign: 'left' }}>
                <tr>
                  <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Nombre</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Usuario</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #ddd', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr><td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Consultando base de datos segura...</td></tr>
                ) : usuarios.length === 0 ? (
                  <tr><td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No se encontraron administradores.</td></tr>
                ) : (
                  usuarios.map((user) => {
                    // Parseo defensivo del JSONB raw_user_meta_data
                    const metadatos = user.metadatos || {};
                    const nombreCompleto = `${metadatos.nombre || ''} ${metadatos.apellido || ''}`.trim() || 'Admin Sistema';
                    
                    return (
                      <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold', color: '#333' }}>{nombreCompleto}</td>
                        <td style={{ padding: '12px', color: '#004A99' }}>{user.email}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button style={{ padding: '4px 8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }} onClick={() => alert("Función protegida.")}>
                            Revocar
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}