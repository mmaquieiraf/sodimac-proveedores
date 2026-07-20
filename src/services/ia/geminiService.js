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

    const data = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(data.error || 'Error de conexión con el servidor seguro.');
    }

    return data.text;
  } catch (err) {
    console.error("Fallo en servicio IA:", err);
    throw new Error(`Fallo de IA: ${err.message}`);
  }
};