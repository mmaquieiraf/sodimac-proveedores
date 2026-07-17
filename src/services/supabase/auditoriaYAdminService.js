import { supabase } from '../../supabase';

export const registrarAuditoriaService = async (usuario, estado, tipo) => {
  try {
    await supabase.from('auditoria_logins').insert([{ usuario_intentado: usuario, estado: estado, tipo: tipo }]);
  } catch (err) { console.error(err); }
};

export const registrarAuditoriaProvService = async (rut, nombre, accion, detalles, usuario) => {
  try {
    await supabase.from('auditoria_proveedores').insert([{
      proveedor_rut: rut, proveedor_nombre: nombre, accion: accion,
      detalles: detalles, usuario: usuario || 'Sistema'
    }]);
  } catch (err) { console.error(err); }
};

export const cargarLogsAuditoriaProvService = async () => {
  return await supabase.from('auditoria_proveedores').select('*').order('created_at', { ascending: false }).limit(200);
};

export const cargarLogsAuditoriaService = async () => {
  return await supabase.from('auditoria_logins').select('*').order('created_at', { ascending: false }).limit(300);
};

export const cargarAdministradoresService = async () => {
  return await supabase.from('administradores').select('*').order('id', { ascending: true });
};

export const invocarEdgeFunctionCrearAdmin = async (emailLimpio, passLimpia) => {
  return await supabase.functions.invoke('crear-admin', {
    body: { email: emailLimpio, password: passLimpia }
  });
};

export const insertarAdministradorDbService = async (adminPayload) => {
  return await supabase.from('administradores').insert([adminPayload]);
};