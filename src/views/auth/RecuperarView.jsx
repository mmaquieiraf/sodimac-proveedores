import React, { useState } from 'react';
import { supabase } from '../../config/supabase';

export default function RecuperarView({
  setVista,
  bloqueoSeguridad,
  registrarAuditoria,
  registrarIntentoFallido
}) {
  const [resetData, setResetData] = useState({ correo: '' });

  const buscarCorreo = async (e) => {
    e.preventDefault();
    const correoLimpio = resetData.correo.replace(/[<>]/g, '').toLowerCase().trim();
    
    // OWASP: Usamos la API nativa para no exponer si el correo existe o no a un atacante
    const { error } = await supabase.auth.resetPasswordForEmail(correoLimpio);
    
    if (error) { 
      await registrarAuditoria(correoLimpio, 'Fallido', 'Recuperar Pass Auth'); 
      registrarIntentoFallido(); 
      alert("Hubo un error al procesar la solicitud de recuperación."); 
    } else { 
      alert("✅ Si el correo está registrado, recibirás instrucciones seguras en tu bandeja de entrada."); 
      setVista('login'); 
      setResetData({ correo: '' }); 
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', color: '#004A99', marginBottom: '10px' }}>Recuperar Acceso</h2>
      <form onSubmit={buscarCorreo}>
        <div style={{ marginBottom: '20px' }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>Correo Registrado</label><input required type="email" style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setResetData({...resetData, correo: e.target.value})} /></div>
        <button type="submit" disabled={bloqueoSeguridad} style={{ width: '100%', padding: '12px', backgroundColor: bloqueoSeguridad ? '#ccc' : '#004A99', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: bloqueoSeguridad ? 'not-allowed' : 'pointer' }}>VERIFICAR</button>
      </form>
    </div>
  );
}