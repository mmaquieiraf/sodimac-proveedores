import { createClient } from '@supabase/supabase-js';

// 1. Extracción de variables desde el entorno (Vite)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

// 2. Validación estricta (Fail-Fast Protocol)
function validateEnvVariables() {
  // Verificamos existencia sin imprimir los valores reales en consola
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('🛑 CRÍTICO: Faltan variables de entorno de Supabase (VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY).');
    throw new Error('Inicialización detenida: Configuración de seguridad incompleta en el entorno.');
  }

  // Validación de formato para evitar inyecciones o errores tipográficos en la URL
  try {
    new URL(supabaseUrl);
  } catch (error) {
    console.error('🛑 CRÍTICO: VITE_SUPABASE_URL no tiene un formato de URL válido.');
    throw new Error('Inicialización detenida: URL malformada.');
  }

  return { supabaseUrl, supabaseAnonKey };
}

// Ejecutamos validación antes de intentar cualquier conexión
const { supabaseUrl: validUrl, supabaseAnonKey: validKey } = validateEnvVariables();

// 3. Creación del cliente seguro
export const supabase = createClient(validUrl, validKey);