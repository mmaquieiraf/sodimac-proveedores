import { supabase } from '../config/supabase';

/**
 * Obtiene todos los proveedores sorteando el límite de 1000 registros de Supabase.
 * Réplica exacta de la lógica de App.jsx.
 */
export const fetchProveedores = async () => {
  let todosLosProveedores = [];
  let desde = 0;
  let hasta = 999;
  let seguirCargando = true;

  while (seguirCargando) {
    const { data, error } = await supabase
      .from('proveedores')
      .select('*')
      .range(desde, hasta)
      .order('fecha_registro', { ascending: false });

    if (error) {
      console.error("Error al cargar proveedores:", error);
      break;
    }

    if (data && data.length > 0) {
      todosLosProveedores = [...todosLosProveedores, ...data];
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
  
  return todosLosProveedores;
};