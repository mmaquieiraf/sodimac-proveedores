import { supabase } from '../supabase';

export const registrarAuditoria = async (usuario, estado, tipo) => {
  try {
    await supabase.from('auditoria_logins').insert([{ 
      usuario_intentado: usuario, 
      estado: estado, 
      tipo: tipo 
    }]);
  } catch (err) { 
    console.error(err); 
  }
};

export const registrarAuditoriaProv = async (rut, nombre, accion, detalles, usuario) => {
  try {
    await supabase.from('auditoria_proveedores').insert([{
      proveedor_rut: rut, 
      proveedor_nombre: nombre, 
      accion: accion,
      detalles: detalles, 
      usuario: usuario || 'Sistema'
    }]);
  } catch (err) { 
    console.error(err); 
  }
};

export const obtenerLogsAuditoriaProv = async () => {
  try {
    const { data, error } = await supabase
      .from('auditoria_proveedores')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
      
    if (!error && data) return data;
    return [];
  } catch (err) {
    console.error(err);
    return [];
  }
};

export const obtenerLogsAuditoria = async () => {
  try {
    const { data, error } = await supabase
      .from('auditoria_logins')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300);
      
    if (!error && data) return data;
    return [];
  } catch (err) {
    console.error(err);
    return [];
  }
};