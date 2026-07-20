import { supabase } from '../../supabase';

export const procesarConGeminiService = async (payload) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) throw new Error("No hay sesión activa para autorizar la IA.");

    const respuesta = await fetch('/api/geminiProxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ payload })
    });

    // VALIDACIÓN ROBUSTA: Capturamos fallos del servidor antes de parsear JSON
    const textResponse = await respuesta.text();
    let data;
    try {
      data = JSON.parse(textResponse);
    } catch (e) {
      if (respuesta.status === 413 || textResponse.includes('Request Entity Too Large')) {
        throw new Error('El archivo adjunto es demasiado pesado. El límite máximo de servidor es 4MB. Por favor, comprime tu PDF o Imagen e intenta de nuevo.');
      }
      throw new Error(`Fallo de servidor desconocido: ${textResponse.substring(0, 40)}...`);
    }

    if (!respuesta.ok) {
      throw new Error(data.error || 'Error de conexión con el servidor seguro.');
    }

    return data.text;
  } catch (err) {
    console.error("Fallo en servicio IA:", err);
    throw new Error(`${err.message}`);
  }
};