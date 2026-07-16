import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../auth/AuthContext';
import { sanitizarYCapitalizar } from '../../utils/validaciones'; // Importación requerida para mantener la lógica original

export default function AdminRolesPanel() {
  const { usuarioActual } = useAuth();
  
  // Adaptador de compatibilidad para el AuthContext vs monolito
  const identificadorUsuario = usuarioActual?.email || usuarioActual?.correo || usuarioActual?.usuario;

  // Estados idénticos al monolito
  const [administradoresDb, setAdministradoresDb] = useState([]);
  const [nuevoAdmin, setNuevoAdmin] = useState({ nombre: '', apellido: '', usuario: '', correo: '', password: '', pin: '' });
  const [adminEditando, setAdminEditando] = useState(null);
  
  // Estado heredado del App.jsx original para simular el bloqueo
  const [bloqueoSeguridad, setBloqueoSeguridad] = useState(false);

  // 🛡️ ADAPTACIÓN DE SEGURIDAD REQUERIDA (Mantiene el RPC seguro en lugar del select inseguro)
  const cargarAdministradores = async () => {
    try {
      const { data, error } = await supabase.rpc('obtener_usuarios_admin');
      if (error) {
        console.error("Error cargando administradores:", error);
        return;
      }
      // Adaptamos el retorno del RPC para que encaje en el .map() original de App.jsx
      const adaptados = (data || []).map(u => ({
        id: u.id,
        nombre_completo: `${u.metadatos?.nombre || ''} ${u.metadatos?.apellido || ''}`.trim() || 'Admin',
        usuario: u.metadatos?.usuarioAlias || u.email.split('@')[0], // Fallback de visualización
        correo: u.email
      }));
      setAdministradoresDb(adaptados);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    cargarAdministradores();
  }, []);

  // Lógica idéntica al monolito
  const crearAdministrador = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('administradores').insert([{
      usuario: nuevoAdmin.usuario.replace(/[<>]/g, '').trim(), 
      password: nuevoAdmin.password.replace(/[<>]/g, ''), 
      pin: nuevoAdmin.pin.replace(/[<>]/g, ''),
      nombre_completo: sanitizarYCapitalizar(`${nuevoAdmin.nombre} ${nuevoAdmin.apellido}`), 
      correo: nuevoAdmin.correo.replace(/[<>]/g, '').toLowerCase().trim()
    }]);
    if (!error) { 
      alert("✅ Creado."); 
      setNuevoAdmin({ nombre: '', apellido: '', usuario: '', correo: '', password: '', pin: '' }); 
      cargarAdministradores(); 
    } else {
      alert("⚠️ Error al crear administrador.");
    }
  };

  const eliminarAdmin = async (id, usuario) => {
    if(identificadorUsuario !== 'mmaquieiraf@sodimac.cl' || usuario === 'mmaquieiraf@sodimac.cl') return;
    if(window.confirm(`¿Eliminar a ${usuario}?`)) { 
      await supabase.from('administradores').delete().eq('id', id); 
      cargarAdministradores(); 
    }
  };

  const guardarEdicionAdmin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('administradores').update({
      nombre_completo: sanitizarYCapitalizar(adminEditando.nombre_completo), 
      usuario: adminEditando.usuario.replace(/[<>]/g, '').trim(),
      correo: adminEditando.correo.replace(/[<>]/g, '').toLowerCase().trim(), 
      password: adminEditando.password.replace(/[<>]/g, ''), 
      pin: adminEditando.pin.replace(/[<>]/g, '')
    }).eq('id', adminEditando.id);
    
    if (!error) { 
      alert("✅ Actualizado."); 
      setAdminEditando(null); 
      cargarAdministradores(); 
    } else {
      alert("⚠️ Error al actualizar.");
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '40px' }}>
      
      {/* FORMULARIO EXACTO AL MONOLITO */}
      <div>
        <h3 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '18px', borderBottom: '2px solid #EE2D24', paddingBottom: '10px' }}>Registrar Nuevo Administrador</h3>
        <form onSubmit={crearAdministrador} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Nombre</label><input required value={nuevoAdmin.nombre} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setNuevoAdmin({...nuevoAdmin, nombre: e.target.value})} /></div>
          <div><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Apellido</label><input required value={nuevoAdmin.apellido} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setNuevoAdmin({...nuevoAdmin, apellido: e.target.value})} /></div>
          <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Usuario</label><input required value={nuevoAdmin.usuario} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setNuevoAdmin({...nuevoAdmin, usuario: e.target.value})} /></div>
          <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Correo</label><input required type="email" value={nuevoAdmin.correo} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setNuevoAdmin({...nuevoAdmin, correo: e.target.value})} /></div>
          <div><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Contraseña</label><input required type="password" value={nuevoAdmin.password} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setNuevoAdmin({...nuevoAdmin, password: e.target.value})} /></div>
          <div><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>PIN (6 dígitos)</label><input required type="text" maxLength="6" value={nuevoAdmin.pin} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', letterSpacing: '3px' }} onChange={e => setNuevoAdmin({...nuevoAdmin, pin: e.target.value})} /></div>
          <button type="submit" disabled={bloqueoSeguridad} style={{ gridColumn: '1 / -1', padding: '12px', marginTop: '10px', backgroundColor: bloqueoSeguridad ? '#ccc' : '#004A99', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: bloqueoSeguridad ? 'not-allowed' : 'pointer' }}>CREAR USUARIO</button>
        </form>
      </div>

      {/* TABLA EXACTA AL MONOLITO */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #004A99', paddingBottom: '10px', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: '#333', fontSize: '18px' }}>Gestión de Usuarios</h3>
          {identificadorUsuario === 'mmaquieiraf@sodimac.cl' && <span style={{ fontSize: '11px', backgroundColor: '#EE2D24', color: 'white', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold' }}>👑 Modo SuperAdmin Activo</span>}
        </div>
        
        <div style={{ overflowX: 'auto', border: '1px solid #eee', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0', textAlign: 'left' }}>
                <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Nombre</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Usuario</th>
                {identificadorUsuario === 'mmaquieiraf@sodimac.cl' && <th style={{ padding: '12px', borderBottom: '2px solid #ccc', textAlign: 'right' }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {administradoresDb.length === 0 ? (
                 <tr><td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No hay administradores registrados.</td></tr>
              ) : (
                administradoresDb.map(admin => (
                  <tr key={admin.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>
                      <strong>{admin.nombre_completo}</strong><br/>
                      <a href={`mailto:${admin.correo}`} style={{ color: '#004A99', textDecoration: 'none', fontSize: '11px' }}>{admin.correo}</a>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ backgroundColor: '#e2e8f0', padding: '3px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>{admin.usuario}</span>
                    </td>
                    {identificadorUsuario === 'mmaquieiraf@sodimac.cl' && (
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <button onClick={() => setAdminEditando({...admin, password: '', pin: ''})} style={{ padding: '4px 8px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', marginRight: '5px' }}>Editar</button>
                        {admin.usuario !== 'mmaquieiraf@sodimac.cl' && (
                          <button onClick={() => eliminarAdmin(admin.id, admin.usuario)} style={{ padding: '4px 8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Eliminar</button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {identificadorUsuario !== 'mmaquieiraf@sodimac.cl' && (
          <p style={{ fontSize: '12px', color: '#888', marginTop: '15px', textAlign: 'center' }}>Solo el usuario principal puede editar o eliminar accesos.</p>
        )}
      </div>

      {/* MODAL EDICIÓN ADMIN EXACTO AL MONOLITO */}
      {adminEditando && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', maxWidth: '500px', width: '100%', position: 'relative' }}>
            <button onClick={() => setAdminEditando(null)} style={{ position: 'absolute', top: '15px', right: '20px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#EE2D24', fontWeight: 'bold' }}>&times;</button>
            <h2 style={{ color: '#004A99', marginTop: 0, borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Editar Administrador</h2>
            <form onSubmit={guardarEdicionAdmin} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
              <div><label style={{ fontSize: '13px', fontWeight: 'bold' }}>Nombre Completo</label><input required value={adminEditando.nombre_completo || ''} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setAdminEditando({...adminEditando, nombre_completo: e.target.value})} /></div>
              <div><label style={{ fontSize: '13px', fontWeight: 'bold' }}>Usuario</label><input required value={adminEditando.usuario || ''} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setAdminEditando({...adminEditando, usuario: e.target.value})} /></div>
              <div><label style={{ fontSize: '13px', fontWeight: 'bold' }}>Correo</label><input required type="email" value={adminEditando.correo || ''} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setAdminEditando({...adminEditando, correo: e.target.value})} /></div>
              <div><label style={{ fontSize: '13px', fontWeight: 'bold' }}>Contraseña</label><input required type="text" value={adminEditando.password || ''} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setAdminEditando({...adminEditando, password: e.target.value})} /></div>
              <div><label style={{ fontSize: '13px', fontWeight: 'bold' }}>PIN (6 dígitos)</label><input required type="text" maxLength="6" value={adminEditando.pin || ''} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setAdminEditando({...adminEditando, pin: e.target.value})} /></div>
              <button type="submit" disabled={bloqueoSeguridad} style={{ padding: '12px', marginTop: '10px', backgroundColor: bloqueoSeguridad ? '#ccc' : '#004A99', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: bloqueoSeguridad ? 'not-allowed' : 'pointer' }}>GUARDAR USUARIO</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}