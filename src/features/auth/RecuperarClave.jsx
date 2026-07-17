import React from 'react';

export default function RecuperarClave({ resetStep, resetData, setResetData, buscarCorreo, actualizarPassword, bloqueoSeguridad, setVista }) {
  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', color: '#004A99', marginBottom: '10px' }}>Recuperar Acceso</h2>
      {resetStep === 1 ? (
        <form onSubmit={buscarCorreo}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Correo Registrado</label>
            <input required type="email" style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setResetData({...resetData, correo: e.target.value})} />
          </div>
          <button type="submit" disabled={bloqueoSeguridad} style={{ width: '100%', padding: '12px', backgroundColor: bloqueoSeguridad ? '#ccc' : '#004A99', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: bloqueoSeguridad ? 'not-allowed' : 'pointer' }}>VERIFICAR</button>
        </form>
      ) : (
        <form onSubmit={actualizarPassword}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Nueva Contraseña</label>
            <input required type="password" style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setResetData({...resetData, nuevaPass: e.target.value})} />
          </div>
          <div style={{ marginBottom: '25px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Nuevo PIN</label>
            <input required type="password" maxLength="6" style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setResetData({...resetData, nuevoPin: e.target.value})} />
          </div>
          <button type="submit" disabled={bloqueoSeguridad} style={{ width: '100%', padding: '12px', backgroundColor: bloqueoSeguridad ? '#ccc' : '#28a745', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: bloqueoSeguridad ? 'not-allowed' : 'pointer' }}>GUARDAR</button>
        </form>
      )}
    </div>
  );
}