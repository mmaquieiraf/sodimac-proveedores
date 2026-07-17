import React from 'react';

export default function Login({ credenciales, setCredenciales, manejarLogin, bloqueoSeguridad, setVista }) {
  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', color: '#004A99', marginBottom: '25px' }}>Ingreso de Administrador</h2>
      <form onSubmit={manejarLogin}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Usuario</label>
          <input required style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setCredenciales({...credenciales, usuario: e.target.value})} />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Contraseña</label>
          <input required type="password" style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setCredenciales({...credenciales, password: e.target.value})} />
        </div>
        <div style={{ marginBottom: '25px' }}>
          <label style={{ fontSize: '13px', fontWeight: 'bold' }}>PIN Interno</label>
          <input required type="password" maxLength="6" style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', letterSpacing: '3px' }} onChange={e => setCredenciales({...credenciales, pin: e.target.value})} />
        </div>
        <button type="submit" disabled={bloqueoSeguridad} style={{ width: '100%', padding: '12px', backgroundColor: bloqueoSeguridad ? '#ccc' : '#004A99', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: bloqueoSeguridad ? 'not-allowed' : 'pointer' }}>INGRESAR AL PANEL</button>
        <div style={{ textAlign: 'center', marginTop: '15px' }}>
          <button type="button" onClick={() => setVista('recuperar')} style={{ background: 'none', border: 'none', color: '#004A99', textDecoration: 'underline', fontSize: '12px', cursor: 'pointer' }}>¿Olvidaste tu contraseña?</button>
        </div>
      </form>
    </div>
  );
}