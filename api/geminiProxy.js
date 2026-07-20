import { createClient } from '@supabase/supabase-js';

// NUEVO: Aumentar el límite de tamaño para permitir PDFs y fotos (Límite máximo de Vercel Hobby)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb', 
    },
  },
};

export default async function handler(req, res) {
  // Solo aceptamos peticiones POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No autorizado. Token ausente.' });

    const token = authHeader.replace('Bearer ', '');
    
    const supabaseClient = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) return res.status(401).json({ error: 'Sesión inválida o expirada.' });

    const serverApiKey = process.env.GEMINI_API_KEY;
    if (!serverApiKey) return res.status(500).json({ error: 'Llave de IA no configurada en el servidor Vercel.' });

    const { payload } = req.body;
    const modelosDisponibles = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-2.5-flash'];

    for (const modelo of modelosDisponibles) {
      try {
        const respuestaApi = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${serverApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        const datosRecibidos = await respuestaApi.json();
        
        if (respuestaApi.status === 429) {
          console.warn(`Modelo ${modelo} saturado. Pasando al siguiente...`);
          continue; 
        }
        if (!respuestaApi.ok) throw new Error(datosRecibidos.error?.message);
        
        return res.status(200).json({ text: datosRecibidos.candidates[0].content.parts[0].text });
      } catch (errInterno) {
        console.error(`Fallo interno modelo ${modelo}:`, errInterno);
      }
    }

    throw new Error("Alta demanda en servidores gratuitos. Reintenta en unos instantes.");

  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}