import React from 'react';

export default function PreLogin({ preLoginPin, setPreLoginPin, manejarPreLogin, bloqueoSeguridad, setVista }) {
  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', backgroundColor: 'white', padding: '40px 30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', color: '#004A99', marginBottom: '10px', fontSize: '24px' }}>Seguridad de Acceso</h2>
      <form onSubmit={manejarPreLogin}>
        <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'center' }}>
          <input required type="password" maxLength="6" placeholder="******" value={preLoginPin} onChange={e => setPreLoginPin(e.target.value)} style={{ width: '100%', maxWidth: '250px', padding: '15px', border: '2px solid #ccc', borderRadius: '8px', letterSpacing: '15px', textAlign: 'center', fontSize: '28px', outline: 'none', fontWeight: 'bold', color: '#004A99' }} />
        </div>
        <button type="submit" disabled={bloqueoSeguridad} style={{ width: '100%', padding: '14px', backgroundColor: bloqueoSeguridad ? '#ccc' : '#004A99', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '14px', borderRadius: '4px', cursor: bloqueoSeguridad ? 'not-allowed' : 'pointer' }}>VALIDAR ACCESO</button>
        <button type="button" onClick={() => setVista('registro')} style={{ width: '100%', padding: '14px', marginTop: '10px', backgroundColor: 'transparent', border: '1px solid #ccc', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>VOLVER</button>
      </form>
    </div>
  );
}