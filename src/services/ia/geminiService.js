// Ajusta la ruta '../supabase' o '../../supabase' según la ubicación real de tu cliente exportado
import { supabase } from '../../supabase'; 

export const procesarConGeminiService = async (payload, apiKey_obsoleta = null) => {
  try {
    // El cliente de Supabase inyecta automáticamente el JWT de la sesión del admin en los headers
    const { data, error } = await supabase.functions.invoke('gemini-proxy', {
      body: { payload }
    });

    if (error) {
      console.error("Error al invocar Edge Function IA:", error);
      throw new Error("Falla de red o de autorización con el servidor seguro.");
    }

    if (data && data.error) {
      // Replicar el error exacto si ocurrió la alta demanda
      throw new Error(data.error);
    }

    if (data && data.text) {
      return data.text;
    }

    throw new Error("Respuesta inválida del servidor.");
  } catch (err) {
    // Mantenemos la salida exacta de error para no romper las alertas en la UI
    if (err.message && err.message.includes("alta demanda")) {
      throw err;
    }
    throw new Error("Todos los servidores gratuitos están experimentando una alta demanda en este momento. Por favor, reintenta en unos instantes.");
  }
};