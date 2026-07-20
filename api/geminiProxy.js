import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No autorizado.' });
    const token = authHeader.replace('Bearer ', '');
    
    const supabaseClient = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) return res.status(401).json({ error: 'Sesión inválida.' });

    const serverApiKey = process.env.GEMINI_API_KEY;
    const { payload } = req.body;
    
    // --- BODEGA DE TRÁNSITO: RECOGER Y CONVERTIR ARCHIVOS ---
    const contents = payload.contents[0];
    const resolvedParts = [];

    for (const part of contents.parts) {
      if (part.text) {
        resolvedParts.push(part);
      } else if (part.storagePath) {
        // 1. Descargamos el archivo pesado desde Supabase
        const { data: fileData, error: downloadError } = await supabaseClient.storage.from('archivos_ia').download(part.storagePath);
        if (downloadError) throw new Error("Error descargando archivo de tránsito.");
        
        // 2. Lo convertimos a formato legible para la IA en la memoria del servidor
        const arrayBuffer = await fileData.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');
        resolvedParts.push({ inlineData: { mimeType: part.mimeType, data: base64Data } });
        
        // 3. Destruimos el archivo de Supabase para mantener tu almacenamiento en cero
        await supabaseClient.storage.from('archivos_ia').remove([part.storagePath]);
      }
    }

    const finalPayload = {
      systemInstruction: payload.systemInstruction,
      contents: [{ parts: resolvedParts }]
    };
    // --------------------------------------------------------

    const modelosDisponibles = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-2.5-flash'];
    for (const modelo of modelosDisponibles) {
      try {
        const respuestaApi = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${serverApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalPayload)
        });
        
        const datosRecibidos = await respuestaApi.json();
        if (respuestaApi.status === 429) continue; 
        if (!respuestaApi.ok) throw new Error(datosRecibidos.error?.message);
        
        return res.status(200).json({ text: datosRecibidos.candidates[0].content.parts[0].text });
      } catch (errInterno) {
        console.error(errInterno);
      }
    }

    throw new Error("Alta demanda en servidores gratuitos.");
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}