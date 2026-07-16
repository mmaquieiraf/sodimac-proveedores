import { supabase } from '../config/supabase';

/**
 * Obtiene todos los procesos sorteando el límite de 1000 registros de Supabase.
 * Réplica exacta de la lógica de App.jsx.
 */
export const fetchProcesos = async () => {
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