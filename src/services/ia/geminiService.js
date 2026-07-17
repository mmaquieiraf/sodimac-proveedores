export const procesarConGeminiService = async (payload, apiKey) => {
  const modelosDisponibles = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-2.5-flash'];
  for (const modelo of modelosDisponibles) {
    try {
      const respuestaApi = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const datosRecibidos = await respuestaApi.json();
      
      if (respuestaApi.status === 429) {
        console.warn(`⚠️ Modelo ${modelo} saturado. Pasando al siguiente...`);
        continue; 
      }
      if (!respuestaApi.ok) throw new Error(datosRecibidos.error?.message);
      
      return datosRecibidos.candidates[0].content.parts[0].text;
    } catch (errInterno) {
      console.error(`Fallo con el modelo ${modelo}:`, errInterno);
    }
  }
  throw new Error("Todos los servidores gratuitos están experimentando una alta demanda en este momento. Por favor, reintenta en unos instantes.");
};