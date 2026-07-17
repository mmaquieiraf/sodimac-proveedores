import { supabase } from '../../supabase';
import { sanitizarYCapitalizar } from '../../utils/formato';

export const cargarProcesosService = async () => {
  let todosLosProcesos = [];
  let desde = 0;
  let hasta = 999;
  let seguirCargando = true;

  while (seguirCargando) {
    const { data, error } = await supabase
      .from('procesos')
      .select('*')
      .range(desde, hasta)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error al cargar procesos:", error);
      break;
    }

    if (data && data.length > 0) {
      todosLosProcesos = [...todosLosProcesos, ...data];
      if (data.length < 1000) {
        seguirCargando = false;
      } else {
        desde += 1000;
        hasta += 1000;
      }
    } else {
      seguirCargando = false;
    }
  }
  return todosLosProcesos;
};

export const guardarProcesoService = async (procesoActual) => {
  const payload = {
    nombre: procesoActual.nombre.trim(),
    tipo: procesoActual.tipo,
    fecha_inicio: procesoActual.fecha_inicio,
    fecha_termino: procesoActual.fecha_termino,
    proveedores_invitados: Array.isArray(procesoActual.proveedores_invitados) ? procesoActual.proveedores_invitados.join(', ') : procesoActual.proveedores_invitados,
    cantidad_ofertas: procesoActual.cantidad_ofertas || null,
    proveedor_adjudicado: Array.isArray(procesoActual.proveedor_adjudicado) && procesoActual.proveedor_adjudicado.length > 0 ? procesoActual.proveedor_adjudicado.join(', ') : null,
    adjudicaciones_detalle: procesoActual.adjudicaciones_detalle || [],
    baseline: procesoActual.baseline ? parseInt(procesoActual.baseline.toString().replace(/\D/g, '')) : null,
    monto_adjudicado: procesoActual.monto_adjudicado ? parseInt(procesoActual.monto_adjudicado.toString().replace(/\D/g, '')) : null,
    controller: procesoActual.controller,
    subgerencia: procesoActual.subgerencia,
    estado_proceso: procesoActual.estado_proceso,
    clasificacion: procesoActual.clasificacion,
    solicitante: sanitizarYCapitalizar(procesoActual.solicitante),
    tipo_compra: procesoActual.tipo_compra
  };

  if (procesoActual.id) {
    return await supabase.from('procesos').update(payload).eq('id', procesoActual.id);
  } else {
    return await supabase.from('procesos').insert([payload]);
  }
};

export const eliminarProcesoService = async (id) => {
  return await supabase.from('procesos').delete().eq('id', id);
};

export const actualizarEstadoProcesoService = async (id, estado_proceso) => {
  return await supabase.from('procesos').update({ estado_proceso }).eq('id', id);
};

export const insertarProcesosMasivoService = async (procesosNuevos) => {
  return await supabase.from('procesos').insert(procesosNuevos);
};