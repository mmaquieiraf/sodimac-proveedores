import { useState } from 'react';
import { signInService, resetPasswordService, validarPinService } from '../../../services/supabase/authService';
import { registrarAuditoriaService } from '../../../services/supabase/auditoriaYAdminService';

export const useAuthProcess = ({ bloqueoSeguridad, intentosFallidos, registrarIntentoFallido, resetearIntentos, setVista, setUsuarioActual, cargarProveedores, cargarProcesos, cargarAdministradores }) => {
  const [preLoginPin, setPreLoginPin] = useState('');
  const [credenciales, setCredenciales] = useState({ usuario: '', password: '', pin: '' });
  const [resetStep, setResetStep] = useState(1); 
  const [resetData, setResetData] = useState({ correo: '' });

  const manejarPreLogin = async (e) => {
    e.preventDefault();
    if (bloqueoSeguridad) return alert("❌ Sistema bloqueado por 24 horas.");
    
    // VALIDACIÓN ZERO TRUST: Se consulta al servidor, no al archivo .env local
    const { data: pinEsValido, error } = await validarPinService(preLoginPin.trim());
    if (error) return alert("⚠️ Error de conexión al validar seguridad.");

    if (pinEsValido) {
      await registrarAuditoriaService('Anónimo', 'Éxito', 'Acceso a PIN Público');
      setVista('login'); setPreLoginPin(''); resetearIntentos(); 
    } else {
      await registrarAuditoriaService('Anónimo', 'Fallido', 'Acceso a PIN Público');
      const fueBloqueado = registrarIntentoFallido();
      if (!fueBloqueado) alert(`⚠️ Código incorrecto. Intentos restantes: ${3 - (intentosFallidos + 1)}`); 
      setPreLoginPin(''); 
    }
  };

  const manejarLogin = async (e) => {
    e.preventDefault();
    if (bloqueoSeguridad) return alert("❌ Sistema bloqueado.");
    const emailLimpio = credenciales.usuario.replace(/[<>]/g, '').trim().toLowerCase();
    
    // VALIDACIÓN ZERO TRUST: Servidor valida el PIN del formulario de login
    const { data: pinEsValido, error: pinError } = await validarPinService(credenciales.pin.replace(/[<>]/g, '').trim());
    if (pinError) return alert("⚠️ Error de conexión al validar seguridad.");

    if (!pinEsValido) {
      await registrarAuditoriaService(emailLimpio || 'Desconocido', 'Fallido', 'Error de PIN Interno');
      const fueBloqueado = registrarIntentoFallido();
      if (!fueBloqueado) alert(`🔍 PIN Interno incorrecto. Intentos restantes: ${3 - (intentosFallidos + 1)}`);
      return;
    }

    const { data, error } = await signInService(emailLimpio, credenciales.password);
    if (error || !data.user) {
      await registrarAuditoriaService(emailLimpio || 'Desconocido', 'Fallido', 'Login Reject Auth');
      const fueBloqueado = registrarIntentoFallido();
      if (!fueBloqueado) alert(`🔍 Credenciales inválidas. Verifica tu usuario y contraseña.`);
      return;
    }

    const esSuperAdmin = data.user.email === 'mmaquieiraf@sodimac.cl';
    await registrarAuditoriaService(data.user.email, 'Éxito', 'Login Panel Admin');
    resetearIntentos(); 
    setUsuarioActual({ usuario: data.user.email, esSuperAdmin: esSuperAdmin }); 
    setVista('panel');
    cargarProveedores(); cargarProcesos(); cargarAdministradores();
  };

  const buscarCorreo = async (e) => {
    e.preventDefault();
    const correoLimpio = resetData.correo.replace(/[<>]/g, '').toLowerCase().trim();
    const { error } = await resetPasswordService(correoLimpio);
    if (error) { 
      await registrarAuditoriaService(correoLimpio, 'Fallido', 'Recuperar Pass Auth'); 
      registrarIntentoFallido(); alert("Hubo un error al procesar la solicitud de recuperación."); 
    } else { 
      alert("✅ Si el correo está registrado, recibirás instrucciones seguras en tu bandeja de entrada."); 
      setVista('login'); setResetData({ correo: '' }); 
    }
  };

  const actualizarPassword = async (e) => {
    e.preventDefault();
    alert("🛑 Arquitectura Segura Activa: La edición de contraseñas SQL ha sido deshabilitada. Utilice la función 'Reset Password' de Supabase.");
  };

  return { preLoginPin, setPreLoginPin, credenciales, setCredenciales, resetStep, setResetStep, resetData, setResetData, manejarPreLogin, manejarLogin, buscarCorreo, actualizarPassword };
};