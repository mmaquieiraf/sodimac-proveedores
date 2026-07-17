import { useState } from 'react';
import { cargarAdministradoresService, invocarEdgeFunctionCrearAdmin, insertarAdministradorDbService, cargarLogsAuditoriaProvService, cargarLogsAuditoriaService } from '../../../services/supabase/auditoriaYAdminService';
import { sanitizarYCapitalizar } from '../../../utils/formato';

export const useAdmin = (usuarioActual) => {
  const [administradoresDb, setAdministradoresDb] = useState([]);
  const [nuevoAdmin, setNuevoAdmin] = useState({ nombre: '', apellido: '', usuario: '', correo: '', password: '' });
  const [adminEditando, setAdminEditando] = useState(null);
  const [mostrarModalAuditoria, setMostrarModalAuditoria] = useState(false);
  const [logsAuditoriaProv, setLogsAuditoriaProv] = useState([]);
  const [logsAuditoria, setLogsAuditoria] = useState([]);

  const cargarAdministradores = async () => {
    const { data } = await cargarAdministradoresService();
    if (data) setAdministradoresDb(data);
  };

  const crearAdministrador = async (e) => {
    e.preventDefault();
    const esSuperAdmin = usuarioActual?.usuario === 'mmaquieiraf@sodimac.cl' || usuarioActual?.usuario === 'matiasignaciof01@gmail.com';
    if (!esSuperAdmin) return alert("Acceso denegado: Solo los Super Administradores pueden crear credenciales.");

    const emailLimpio = nuevoAdmin.correo.replace(/[<>]/g, '').toLowerCase().trim();
    const passLimpia = nuevoAdmin.password.replace(/[<>]/g, '');

    const { data: authData, error: authError } = await invocarEdgeFunctionCrearAdmin(emailLimpio, passLimpia);
    if (authError || (authData && authData.error)) {
      return alert(`❌ Error creando credencial: ${authError?.message || authData?.error}`);
    }

    const { error: dbError } = await insertarAdministradorDbService({
      usuario: nuevoAdmin.usuario.replace(/[<>]/g, '').trim(),
      correo: emailLimpio,
      nombre_completo: sanitizarYCapitalizar(`${nuevoAdmin.nombre} ${nuevoAdmin.apellido}`),
      password: 'ENCRIPTADA_EN_AUTH',
      pin: 'MÁSTER_VERCEL'
    });

    if (dbError) alert("⚠️ La credencial se creó en Auth, pero hubo un error al guardar su perfil visual.");
    else {
      alert("✅ Nuevo administrador creado exitosamente y protegido en Supabase Auth.");
      setNuevoAdmin({ nombre: '', apellido: '', usuario: '', correo: '', password: '' });
      cargarAdministradores();
    }
  };

  const eliminarAdmin = async (id, usuario) => {
    if(usuarioActual?.usuario !== 'mmaquieiraf@sodimac.cl' || usuario === 'mmaquieiraf@sodimac.cl') return;
    alert("🛑 Arquitectura Segura Activa: Para eliminar un administrador, bórrelo primero desde el panel 'Authentication > Users' en Supabase y luego elimine su registro aquí.");
  };

  const guardarEdicionAdmin = async (e) => {
    e.preventDefault();
    alert("🛑 Arquitectura Segura Activa: La edición de contraseñas SQL ha sido deshabilitada. Utilice la función 'Reset Password' de Supabase.");
  };

  const cargarLogsAuditoriaProv = async () => {
    const { data, error } = await cargarLogsAuditoriaProvService();
    if (!error && data) setLogsAuditoriaProv(data);
  };
  
  const cargarLogsAuditoria = async () => {
    const { data } = await cargarLogsAuditoriaService();
    if (data) setLogsAuditoria(data);
  };

  return {
    administradoresDb, nuevoAdmin, setNuevoAdmin, adminEditando, setAdminEditando,
    cargarAdministradores, crearAdministrador, eliminarAdmin, guardarEdicionAdmin,
    mostrarModalAuditoria, setMostrarModalAuditoria, logsAuditoriaProv, setLogsAuditoriaProv,
    logsAuditoria, setLogsAuditoria, cargarLogsAuditoriaProv, cargarLogsAuditoria
  };
};