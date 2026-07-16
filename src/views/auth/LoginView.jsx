import React, { useState } from 'react';
import { supabase } from '../../config/supabase';

export default function LoginView({
  setVista,
  bloqueoSeguridad,
  registrarAuditoria,
  registrarIntentoFallido,
  intentosFallidos,
  setIntentosFallidos,
  setUsuarioActual,
  cargarProveedores,
  cargarProcesos
}) {
  const [credenciales, setCredenciales] = useState({ usuario: '', password: '', pin: '' });

  const manejarLogin = async (e) => {
    e.preventDefault();
    if (bloqueoSeguridad) return alert("❌ Sistema bloqueado.");
    
    // Normalizamos el correo para evitar errores por mayúsculas
    const emailLimpio = credenciales.usuario.replace(/[<>]/g, '').trim().toLowerCase();
    
    // Obtenemos el PIN maestro desde las variables de entorno de Vite
    const pinAcceso = import.meta.env.VITE_PIN_ACCESO?.trim();
    if (!pinAcceso) return alert("⚠️ Error Crítico: PIN de seguridad no inyectado desde Vercel.");

    // 1. VALIDACIÓN DE PIN (El mismo de la pantalla anterior, sin tocar SQL)
    if (credenciales.pin.replace(/[<>]/g, '').trim() !== pinAcceso) {
      await registrarAuditoria(emailLimpio || 'Desconocido', 'Fallido', 'Error de PIN Interno');
      const fueBloqueado = registrarIntentoFallido();
      if (!fueBloqueado) alert(`🔍 PIN Interno incorrecto. Intentos restantes: ${3 - (intentosFallidos + 1)}`);
      return;
    }

    // 2. AUTENTICACIÓN EXCLUSIVA VÍA SUPABASE AUTH
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailLimpio,
      password: credenciales.password
    });

    if (error || !data.user) {
      console.error("Fallo Auth:", error?.message);
      await registrarAuditoria(emailLimpio || 'Desconocido', 'Fallido', 'Login Reject Auth');
      const fueBloqueado = registrarIntentoFallido();
      if (!fueBloqueado) alert(`🔍 Credenciales inválidas. Verifica tu usuario y contraseña.`);
      return;
    }

    // 3. ASIGNACIÓN DE ROLES (Super Admin vs Admin normal)
    const esSuperAdmin = data.user.email === 'mmaquieiraf@sodimac.cl';

    await registrarAuditoria(data.user.email, 'Éxito', 'Login Panel Admin');
    setIntentosFallidos(0); 
    
    // Guardamos el usuario y su rol en el estado de React
    setUsuarioActual({ 
      usuario: data.user.email,
      esSuperAdmin: esSuperAdmin 
    }); 
    
    setVista('panel');
    cargarProveedores(); 
    cargarProcesos();
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', color: '#004A99', marginBottom: '25px' }}>Ingreso de Administrador</h2>
      <form onSubmit={manejarLogin}>
        <div style={{ marginBottom: '15px' }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>Usuario</label><input required style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setCredenciales({...credenciales, usuario: e.target.value})} /></div>
        <div style={{ marginBottom: '15px' }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>Contraseña</label><input required type="password" style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setCredenciales({...credenciales, password: e.target.value})} /></div>
        <div style={{ marginBottom: '25px' }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>PIN Interno</label><input required type="password" maxLength="6" style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', letterSpacing: '3px' }} onChange={e => setCredenciales({...credenciales, pin: e.target.value})} /></div>
        <button type="submit" disabled={bloqueoSeguridad} style={{ width: '100%', padding: '12px', backgroundColor: bloqueoSeguridad ? '#ccc' : '#004A99', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: bloqueoSeguridad ? 'not-allowed' : 'pointer' }}>INGRESAR AL PANEL</button>
        <div style={{ textAlign: 'center', marginTop: '15px' }}><button type="button" onClick={() => setVista('recuperar')} style={{ background: 'none', border: 'none', color: '#004A99', textDecoration: 'underline', fontSize: '12px', cursor: 'pointer' }}>¿Olvidaste tu contraseña?</button></div>
      </form>
    </div>
  );
}