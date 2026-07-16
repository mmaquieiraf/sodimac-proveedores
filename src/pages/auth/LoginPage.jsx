import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { useAuth } from '../../features/auth/AuthContext'; // Restaurado para reaccionar al estado global

export default function LoginPage({ onIrARegistro }) {
  const navigate = useNavigate();
  const { usuarioActual } = useAuth(); // Extraemos el estado del contexto seguro
  
  const [vistaLocal, setVistaLocal] = useState('pre_login');
  
  // Estados de datos
  const [preLoginPin, setPreLoginPin] = useState('');
  const [credenciales, setCredenciales] = useState({ usuario: '', password: '', pin: '' });
  const [resetData, setResetData] = useState({ correo: '' });

  // Estados de Seguridad (Fuerza Bruta Frontend)
  const [intentosFallidos, setIntentosFallidos] = useState(0);
  const [bloqueoSeguridad, setBloqueoSeguridad] = useState(false);

  // 🛡️ LÓGICA DE NAVEGACIÓN ESTRICTA
  // Si el AuthContext detecta que hay un usuario válido, expulsa esta vista y entra al panel admin
  useEffect(() => {
    if (usuarioActual) {
      navigate('/admin', { replace: true });
    }
  }, [usuarioActual, navigate]);

  // Auditoría centralizada
  const registrarAuditoria = async (usuario, estado, tipo) => {
    try {
      await supabase.from('auditoria_logins').insert([{ usuario_intentado: usuario, estado: estado, tipo: tipo }]);
    } catch (err) { console.error("Auditoría offline"); }
  };

  const registrarIntentoFallido = () => {
    const nuevosIntentos = intentosFallidos + 1;
    setIntentosFallidos(nuevosIntentos);
    if (nuevosIntentos >= 3) {
      setBloqueoSeguridad(true);
      setTimeout(() => {
        setBloqueoSeguridad(false);
        setIntentosFallidos(0);
      }, 300000); // 5 minutos de bloqueo
      return true; 
    }
    return false; 
  };

  const manejarPreLogin = async (e) => {
    e.preventDefault();
    if (bloqueoSeguridad) return alert("❌ Sistema bloqueado temporalmente por demasiados intentos.");
    
    const pinAcceso = import.meta.env.VITE_PIN_ACCESO?.trim();

    if (preLoginPin.trim() === pinAcceso) {
      await registrarAuditoria('Anónimo', 'Éxito', 'Acceso a PIN Público');
      setVistaLocal('login'); 
      setPreLoginPin(''); 
      setIntentosFallidos(0); 
    } else {
      await registrarAuditoria('Anónimo', 'Fallido', 'Acceso a PIN Público');
      const fueBloqueado = registrarIntentoFallido();
      if (!fueBloqueado) alert(`⚠️ Código incorrecto. Intentos restantes: ${3 - (intentosFallidos + 1)}`); 
      setPreLoginPin(''); 
    }
  };

  const manejarLogin = async (e) => {
    e.preventDefault();
    if (bloqueoSeguridad) return alert("❌ Sistema bloqueado.");
    
    const emailLimpio = credenciales.usuario.replace(/[<>]/g, '').trim().toLowerCase();
    const pinAcceso = import.meta.env.VITE_PIN_ACCESO?.trim();

    if (credenciales.pin.replace(/[<>]/g, '').trim() !== pinAcceso) {
      await registrarAuditoria(emailLimpio || 'Desconocido', 'Fallido', 'Error de PIN Interno');
      const fueBloqueado = registrarIntentoFallido();
      if (!fueBloqueado) alert(`🔍 PIN Interno incorrecto. Intentos restantes: ${3 - (intentosFallidos + 1)}`);
      return;
    }

    // Autenticación nativa con Supabase
    const { error } = await supabase.auth.signInWithPassword({
      email: emailLimpio,
      password: credenciales.password
    });

    if (error) {
      await registrarAuditoria(emailLimpio || 'Desconocido', 'Fallido', 'Login Reject Auth');
      const fueBloqueado = registrarIntentoFallido();
      if (!fueBloqueado) alert(`🔍 Credenciales inválidas. Verifica tu usuario y contraseña.`);
      return;
    }

    // El useEffect de arriba detectará el cambio de sesión automáticamente gracias al AuthContext y ejecutará el navigate()
    await registrarAuditoria(emailLimpio, 'Éxito', 'Login Panel Admin');
    setIntentosFallidos(0); 
  };

  const buscarCorreo = async (e) => {
    e.preventDefault();
    if (bloqueoSeguridad) return alert("❌ Sistema bloqueado.");
    const correoLimpio = resetData.correo.replace(/[<>]/g, '').toLowerCase().trim();
    
    const { error } = await supabase.auth.resetPasswordForEmail(correoLimpio);
    
    if (error) { 
      await registrarAuditoria(correoLimpio, 'Fallido', 'Recuperar Pass Auth'); 
      registrarIntentoFallido(); 
      alert("Hubo un error al procesar la solicitud."); 
    } else { 
      alert("✅ Si el correo está registrado, recibirás instrucciones seguras en tu bandeja de entrada."); 
      setVistaLocal('login'); 
      setResetData({ correo: '' }); 
    }
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#f4f4f4', minHeight: '100vh', padding: '20px', display: 'flex', flexDirection: 'column' }}>
      
      {/* NAVBAR CORPORATIVO */}
      <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#004A99', padding: '15px 20px', borderRadius: '8px', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/logo.png" alt="Sodimac" style={{ height: '50px', objectFit: 'contain', transform: 'scale(2.8)', transformOrigin: 'left center', marginLeft: '5px' }} />
          <span style={{ fontSize: '22px', fontWeight: '600', letterSpacing: '0.5px', marginLeft: '4cm' }}>Portal de Proveedores</span>
        </div>
        <div>
          <button onClick={() => navigate('/registro')} style={{ background: 'none', border: '1px solid white', color: 'white', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>Ir a Registro</button>
        </div>
      </div>

      {/* COMPUERTAS DE FORMULARIO */}
      {vistaLocal === 'pre_login' && (
        <div style={{ maxWidth: '400px', width: '100%', margin: '50px auto', backgroundColor: 'white', padding: '40px 30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h2 style={{ textAlign: 'center', color: '#004A99', marginBottom: '10px', fontSize: '24px' }}>Seguridad de Acceso</h2>
          <form onSubmit={manejarPreLogin}>
            <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'center' }}>
              <input required type="password" maxLength="6" placeholder="******" value={preLoginPin} onChange={e => setPreLoginPin(e.target.value)} style={{ width: '100%', maxWidth: '250px', padding: '15px', border: '2px solid #ccc', borderRadius: '8px', letterSpacing: '15px', textAlign: 'center', fontSize: '28px', outline: 'none', fontWeight: 'bold', color: '#004A99' }} />
            </div>
            <button type="submit" disabled={bloqueoSeguridad} style={{ width: '100%', padding: '14px', backgroundColor: bloqueoSeguridad ? '#ccc' : '#004A99', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '14px', borderRadius: '4px', cursor: bloqueoSeguridad ? 'not-allowed' : 'pointer' }}>VALIDAR ACCESO</button>
            <button type="button" onClick={() => navigate('/registro')} style={{ width: '100%', padding: '14px', marginTop: '10px', backgroundColor: 'transparent', border: '1px solid #ccc', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>VOLVER</button>
          </form>
        </div>
      )}

      {vistaLocal === 'login' && (
        <div style={{ maxWidth: '400px', width: '100%', margin: '50px auto', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h2 style={{ textAlign: 'center', color: '#004A99', marginBottom: '25px' }}>Ingreso de Administrador</h2>
          <form onSubmit={manejarLogin}>
            <div style={{ marginBottom: '15px' }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>Usuario</label><input required type="email" style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setCredenciales({...credenciales, usuario: e.target.value})} /></div>
            <div style={{ marginBottom: '15px' }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>Contraseña</label><input required type="password" style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setCredenciales({...credenciales, password: e.target.value})} /></div>
            <div style={{ marginBottom: '25px' }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>PIN Interno</label><input required type="password" maxLength="6" style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', letterSpacing: '3px' }} onChange={e => setCredenciales({...credenciales, pin: e.target.value})} /></div>
            <button type="submit" disabled={bloqueoSeguridad} style={{ width: '100%', padding: '12px', backgroundColor: bloqueoSeguridad ? '#ccc' : '#004A99', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: bloqueoSeguridad ? 'not-allowed' : 'pointer' }}>INGRESAR AL PANEL</button>
            <div style={{ textAlign: 'center', marginTop: '15px' }}><button type="button" onClick={() => setVistaLocal('recuperar')} style={{ background: 'none', border: 'none', color: '#004A99', textDecoration: 'underline', fontSize: '12px', cursor: 'pointer' }}>¿Olvidaste tu contraseña?</button></div>
          </form>
        </div>
      )}

      {vistaLocal === 'recuperar' && (
        <div style={{ maxWidth: '400px', width: '100%', margin: '50px auto', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h2 style={{ textAlign: 'center', color: '#004A99', marginBottom: '10px' }}>Recuperar Acceso</h2>
          <form onSubmit={buscarCorreo}>
            <div style={{ marginBottom: '20px' }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>Correo Registrado</label><input required type="email" style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setResetData({...resetData, correo: e.target.value})} /></div>
            <button type="submit" disabled={bloqueoSeguridad} style={{ width: '100%', padding: '12px', backgroundColor: bloqueoSeguridad ? '#ccc' : '#004A99', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: bloqueoSeguridad ? 'not-allowed' : 'pointer' }}>VERIFICAR</button>
            <div style={{ textAlign: 'center', marginTop: '15px' }}><button type="button" onClick={() => setVistaLocal('login')} style={{ background: 'none', border: 'none', color: '#666', textDecoration: 'underline', fontSize: '12px', cursor: 'pointer' }}>Volver al Login</button></div>
          </form>
        </div>
      )}
    </div>
  );
}