import React from 'react';

export default function GestionUsuarios({
  nuevoAdmin, setNuevoAdmin, crearAdministrador, bloqueoSeguridad,
  usuarioActual, administradoresDb, setAdminEditando, eliminarAdmin
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '40px' }}>
      <div>
        <h3 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '18px', borderBottom: '2px solid #EE2D24', paddingBottom: '10px' }}>Registrar Nuevo Administrador</h3>
        <form onSubmit={crearAdministrador} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Nombre</label>
            <input required value={nuevoAdmin.nombre} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setNuevoAdmin({...nuevoAdmin, nombre: e.target.value})} />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Apellido</label>
            <input required value={nuevoAdmin.apellido} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setNuevoAdmin({...nuevoAdmin, apellido: e.target.value})} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Usuario (Alias Interno)</label>
            <input required value={nuevoAdmin.usuario} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setNuevoAdmin({...nuevoAdmin, usuario: e.target.value})} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Correo (Credencial de Acceso)</label>
            <input required type="email" value={nuevoAdmin.correo} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setNuevoAdmin({...nuevoAdmin, correo: e.target.value})} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Contraseña Segura</label>
            <input required type="password" value={nuevoAdmin.password} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setNuevoAdmin({...nuevoAdmin, password: e.target.value})} />
          </div>
          <button type="submit" disabled={bloqueoSeguridad} style={{ gridColumn: '1 / -1', padding: '12px', marginTop: '10px', backgroundColor: bloqueoSeguridad ? '#ccc' : '#004A99', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: bloqueoSeguridad ? 'not-allowed' : 'pointer' }}>CREAR ADMINISTRADOR</button>
        </form>
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #004A99', paddingBottom: '10px', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: '#333', fontSize: '18px' }}>Gestión de Usuarios</h3>
          {usuarioActual?.usuario === 'mmaquieiraf@sodimac.cl' && <span style={{ fontSize: '11px', backgroundColor: '#EE2D24', color: 'white', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold' }}>👑 Modo SuperAdmin Activo</span>}
        </div>
        
        <div style={{ overflowX: 'auto', border: '1px solid #eee', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0', textAlign: 'left' }}>
                <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Nombre</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Usuario</th>
                {usuarioActual?.usuario === 'mmaquieiraf@sodimac.cl' && <th style={{ padding: '12px', borderBottom: '2px solid #ccc', textAlign: 'right' }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {administradoresDb.map(admin => (
                <tr key={admin.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>
                    <strong>{admin.nombre_completo}</strong><br/>
                    <a href={`mailto:${admin.correo}`} style={{ color: '#004A99', textDecoration: 'none', fontSize: '11px' }}>{admin.correo}</a>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ backgroundColor: '#e2e8f0', padding: '3px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>{admin.usuario}</span>
                  </td>
                  {usuarioActual?.usuario === 'mmaquieiraf@sodimac.cl' && (
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button onClick={() => setAdminEditando(admin)} style={{ padding: '4px 8px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', marginRight: '5px' }}>Editar</button>
                      {admin.usuario !== 'mmaquieiraf@sodimac.cl' && (
                        <button onClick={() => eliminarAdmin(admin.id, admin.usuario)} style={{ padding: '4px 8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Eliminar</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {usuarioActual?.usuario !== 'mmaquieiraf@sodimac.cl' && (
          <p style={{ fontSize: '12px', color: '#888', marginTop: '15px', textAlign: 'center' }}>Solo el usuario principal puede editar o eliminar accesos.</p>
        )}
      </div>
    </div>
  );
}