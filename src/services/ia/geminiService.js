import { supabase } from '../../supabase';

export const procesarConGeminiService = async (payload) => {
  try {
    console.log("1. Enviando payload a Edge Function:", payload);
    
    const { data, error } = await supabase.functions.invoke('gemini-proxy', {
      body: { payload }
    });

    console.log("2. Respuesta de Edge Function:", { data, error });

    if (error) {
      console.error("3. Error de invocación Supabase:", error);
      throw new Error(`Error de conexión con Supabase: ${error.message}`);
    }

    if (data && data.error) {
      console.error("4. Error interno devuelto por la IA/Edge:", data.error);
      throw new Error(`Error de IA: ${data.error}`);
    }

    if (data && data.text) {
      return data.text;
    }

    throw new Error("El servidor no devolvió el texto esperado.");
  } catch (err) {
    console.error("Fallo crítico en servicio IA:", err);
    // Ahora mostraremos el error TÉCNICO REAL en la alerta de tu pantalla
    throw new Error(`DETALLE TÉCNICO: ${err.message}`);
  }
};