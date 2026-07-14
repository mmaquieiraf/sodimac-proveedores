import React, { useState } from 'react';

export default function GeneradorFT() {
  const [cargandoIA, setCargandoIA] = useState(false);
  const [archivosContexto, setArchivosContexto] = useState([]);
  const [imagenProducto, setImagenProducto] = useState(null);

  // Estado inicial con la estructura del template (Mockup)
  const [fichaData, setFichaData] = useState({
    titulo: "ASPIRADORA INDUSTRIAL DE POLVO Y AGUA",
    subtitulo: "80 LITROS - 3 MOTORES",
    descripcion: "Máquina para aspirado grandes superficies, con sus ruedas y carro permite un fácil traslado con sus 3 motores le dan un poder exclusivo para aspirar rápidamente la suciedad de una superficie.",
    caracteristicas: [
      { titulo: "FÁCIL TRASLADO", texto: "Equipado con ruedas y carro para un transporte cómodo y seguro." },
      { titulo: "ALTO RENDIMIENTO", texto: "Sus 3 motores entregan mayor potencia de succión para una limpieza rápida y eficiente." },
      { titulo: "POLVO Y AGUA", texto: "Diseñada para aspirar eficazmente polvo y líquidos en grandes superficies." }
    ],
    datosTecnicos: [
      { parametro: "Capacidad de Estanque", valor: "80 litros Acero Inoxidable" },
      { parametro: "Potencia Motor", valor: "3000 Wts." },
      { parametro: "Cantidad de Motores", valor: "3" },
      { parametro: "Tensión", valor: "220 Volt." },
      { parametro: "Flujo de aire aspirado", valor: "432 m3/hra." },
      { parametro: "Diámetro", valor: "38 mm." },
      { parametro: "Peso", valor: "14 Kg" },
      { parametro: "Dimensiones", valor: "60 x 54 x 113 cm" },
      { parametro: "Funciones del Producto", valor: "Aspirado de Polvo y líquidos" }
    ],
    usos: ["INDUSTRIAL", "BODEGAS", "CONSTRUCCIÓN", "TALLERES"],
    categoriaPie: "LIMPIEZA INDUSTRIAL"
  });

  const manejarCargaArchivos = (e) => {
    const nuevosArchivos = Array.from(e.target.files);
    setArchivosContexto([...archivosContexto, ...nuevosArchivos]);
    e.target.value = null; 
  };

  const eliminarArchivo = (index) => setArchivosContexto(archivosContexto.filter((_, i) => i !== index));

  const manejarCargaImagen = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImagenProducto(imageUrl);
    }
  };

  const transformarArchivoBase64 = (archivo) => {
    return new Promise((resolve, reject) => {
      const lector = new FileReader();
      lector.readAsDataURL(archivo);
      lector.onload = () => resolve(lector.result.split(',')[1]);
      lector.onerror = (error) => reject(error);
    });
  };

  // --- EXPORTACIÓN A PDF EXACTO (A4, 1 PÁGINA SEGURA) ---
  const exportarPDF = async () => {
    if (!window.html2pdf) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    
    // Forzamos el scroll arriba para evitar cortes en la fotografía del canvas
    window.scrollTo(0,0);window.scrollTo(0,0);

const imagenes = Array.from(elemento.querySelectorAll('img'));
await Promise.all(
  imagenes.map((img) => {
    if (img.complete) return Promise.resolve();
    return new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve;
    });
  })
);
    
    const elemento = document.getElementById('lienzo-ficha-tecnica');
    const opciones = {
      margin: 0,
      filename: `Ficha_Tecnica_${fichaData.titulo.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { 
        scale: 3, // Escala aumentada a 3 para máxima nitidez
        useCORS: true, 
        scrollY: 0,
        backgroundColor: '#ffffff' // Fondo blanco explícito
      }, 
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    window.html2pdf().set(opciones).from(elemento).save();
  };

  // --- LÓGICA DE EXTRACCIÓN CON IA ---
  const procesarConIA = async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) return alert("❌ Error: Vercel no está leyendo la API Key.");
    if (archivosContexto.length === 0) return alert("⚠️ Adjunta al menos un archivo técnico en PDF para analizar.");
    
    setCargandoIA(true);

    try {
      const partesDocumentos = await Promise.all(archivosContexto.map(async (archivo) => {
        const base64Data = await transformarArchivoBase64(archivo);
        return { inlineData: { mimeType: archivo.type, data: base64Data } };
      }));

      const instruccionesSistema = "Eres un analista de productos técnicos para Sodimac. Tu labor es extraer información de fichas técnicas de proveedores y transformarla a un formato JSON estructurado perfecto. NO uses bloques de código (```json), responde ÚNICAMENTE con el objeto JSON plano.";

      const promptEstructurado = `
      Analiza los documentos técnicos adjuntos y extrae la información para crear una Ficha Técnica.
      Debes devolver EXCLUSIVAMENTE un objeto JSON válido con esta estructura exacta:

      {
        "titulo": "NOMBRE DEL PRODUCTO EN MAYÚSCULAS",
        "subtitulo": "ATRIBUTO PRINCIPAL O MODELO EN MAYÚSCULAS (Ej: 80 LITROS - 3 MOTORES)",
        "descripcion": "Párrafo breve y comercial describiendo el uso principal del producto.",
        "caracteristicas": [
          { "titulo": "BENEFICIO 1 EN MAYÚSCULAS", "texto": "Descripción breve del beneficio." },
          { "titulo": "BENEFICIO 2 EN MAYÚSCULAS", "texto": "Descripción breve del beneficio." },
          { "titulo": "BENEFICIO 3 EN MAYÚSCULAS", "texto": "Descripción breve del beneficio." }
        ],
        "datosTecnicos": [
          { "parametro": "Nombre de especificación", "valor": "Valor y unidad de medida" },
          { "parametro": "Nombre de especificación 2", "valor": "Valor y unidad de medida" }
        ],
        "usos": ["USO 1", "USO 2", "USO 3"],
        "categoriaPie": "CATEGORÍA DEL PRODUCTO (Ej: HERRAMIENTAS ELÉCTRICAS)"
      }
      
      Reglas Estrictas:
      1. Extrae máximo 3 características principales.
      2. Extrae máximo 10 datos técnicos relevantes.
      3. Extrae máximo 4 usos recomendados. MUY IMPORTANTE: Los usos deben ser palabras cortas o frases de MÁXIMO 3 PALABRAS (Ej: "SISTEMAS CRÍTICOS" en vez de "Ideal para aplicaciones en sistemas críticos").
      `;

      const payload = {
        contents: [{ parts: [{ text: promptEstructurado }, ...partesDocumentos] }],
        systemInstruction: { parts: [{ text: instruccionesSistema }] }
      };

      const respuestaApi = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const datosRecibidos = await respuestaApi.json();
      if (!respuestaApi.ok) throw new Error(datosRecibidos.error?.message);
      
      const textoSocio = datosRecibidos.candidates[0].content.parts[0].text.trim();
      const nuevoJson = JSON.parse(textoSocio.replace(/```json/g, '').replace(/```/g, ''));
      setFichaData(nuevoJson);

    } catch (error) {
      alert(`⚠️ Fallo de IA: ${error.message} - Asegúrate de subir un archivo legible.`);
    } finally {
      setCargandoIA(false);
    }
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: 'calc(100vh - 100px)', gap: '20px', padding: '15px', boxSizing: 'border-box', backgroundColor: '#e5e5e5', overflow: 'hidden' }}>
      
      {/* PANEL IZQUIERDO: CONTROLES */}
      <div style={{ width: '400px', flexShrink: 0, backgroundColor: 'white', padding: '25px', borderRadius: '8px', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#005AA9', marginTop: 0, borderBottom: '2px solid #E31E24', paddingBottom: '10px' }}>Generador Ficha Técnica</h2>
        
        <div style={{ marginBottom: '25px', backgroundColor: '#eef2f7', padding: '15px', borderRadius: '6px', border: '1px solid #cce5ff' }}>
          <h3 style={{ fontSize: '15px', color: '#005AA9', marginTop: 0 }}>1. Subir Especificaciones (PDF/TXT)</h3>
          <p style={{ fontSize: '11px', color: '#555', marginBottom: '10px' }}>La IA leerá este documento para extraer los datos técnicos, la descripción y los usos.</p>
          
          <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '4px', border: '1px dashed #005AA9' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              <span style={{ backgroundColor: '#005AA9', color: 'white', padding: '6px 10px', borderRadius: '4px', marginRight: '10px' }}>📎 Archivo Origen</span>
              <input type="file" multiple accept=".pdf,.txt" onChange={manejarCargaArchivos} style={{ display: 'none' }} />
            </label>
            {archivosContexto.length > 0 && (
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {archivosContexto.map((a, i) => (
                  <div key={i} style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', backgroundColor: '#f0f0f0', padding: '4px', borderRadius: '4px' }}>
                    <span>{a.name}</span><button onClick={() => eliminarArchivo(i)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>X</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={procesarConIA} disabled={cargandoIA} style={{ width: '100%', padding: '10px', marginTop: '10px', backgroundColor: cargandoIA ? '#ccc' : '#005AA9', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: cargandoIA ? 'not-allowed' : 'pointer' }}>
            {cargandoIA ? '⏳ Analizando Datos...' : '✨ Autocompletar con IA'}
          </button>
        </div>

        <div style={{ marginBottom: '25px', backgroundColor: '#fff3f3', padding: '15px', borderRadius: '6px', border: '1px solid #ffcccc' }}>
          <h3 style={{ fontSize: '15px', color: '#E31E24', marginTop: 0 }}>2. Cargar Imagen del Producto</h3>
          <p style={{ fontSize: '11px', color: '#555', marginBottom: '10px' }}>Sube una imagen preferiblemente cuadrada y con fondo blanco o transparente.</p>
          <input type="file" accept="image/*" onChange={manejarCargaImagen} style={{ width: '100%', fontSize: '12px' }} />
        </div>
      </div>

      {/* PANEL DERECHO: VISUALIZADOR Y EXPORTACIÓN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px', minWidth: 0, alignItems: 'center' }}>
        <div style={{ width: '210mm', display: 'flex', justifyContent: 'flex-end', gap: '10px', backgroundColor: 'white', padding: '10px 20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <button onClick={exportarPDF} style={{ padding: '8px 15px', backgroundColor: '#E31E24', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>🖨️ Descargar Ficha en PDF Oficial</button>
        </div>

        <div style={{ flex: 1, width: '100%', overflowY: 'auto', display: 'flex', justifyContent: 'center', paddingBottom: '20px' }}>
          
          {/* LIENZO A4 DIGITAL ESTRICTO: Ajustado a 295mm para forzar una sola página */}
          <div id="lienzo-ficha-tecnica" style={{ backgroundColor: 'white', width: '210mm', height: '295mm', position: 'relative', fontFamily: 'Arial, sans-serif', color: '#333', overflow: 'hidden', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', boxSizing: 'border-box' }}>
            
            {/* ENCABEZADO PÍXEL-PERFECT (Posicionamiento Absoluto) */}
            <div style={{ position: 'relative', width: '100%', height: '115px', borderBottom: '1px solid #E0E0E0', boxSizing: 'border-box' }}>
              
              {/* LOGO SODIMAC ENCAPSULADO (Corte Limpio sin márgenes transparentes) */}
              <div
                style={{
                  position: 'absolute',
                  left: '66px',
                  top: '36px', // Ajuste fino
                  width: '155px', // Ajuste fino (ligeramente más ancho si es necesario)
                  height: '30px', // Ajuste fino
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  overflow: 'hidden',
                  lineHeight: 0,
                }}
              >
                <img
                  src="/logo-sodimac-sin-margen.png" // Asegúrate de tener este SVG en /public
                  alt="Sodimac"
                  style={{
                    display: 'block',
                    width: '155px',
                    height: '30px',
                    objectFit: 'contain',
                    objectPosition: 'left center',
                    transform: 'none',
                    imageRendering: 'auto',
                  }}
                />
              </div>
              
              {/* BLOQUE GEOMÉTRICO AZUL (Esquina Superior Derecha) */}
              <div style={{ position: 'absolute', right: 0, top: 0, backgroundColor: '#005AA9', color: 'white', height: '80px', display: 'flex', alignItems: 'center', padding: '0 40px 0 60px', fontSize: '26px', fontWeight: '900', clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0% 100%)', letterSpacing: '1px' }}>
                FICHA TÉCNICA
              </div>
            </div>

            {/* CUERPO PRINCIPAL DOS COLUMNAS */}
            <div style={{ display: 'flex', padding: '30px 40px 100px 40px', gap: '35px', height: 'calc(295mm - 115px)', boxSizing: 'border-box' }}>
              
              {/* COLUMNA IZQUIERDA (IMAGEN Y CARACTERÍSTICAS) */}
              <div style={{ flex: '0 0 35%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Cuadro de imagen */}
                <div style={{ width: '100%', height: '320px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
                  {imagenProducto ? (
                    <img src={imagenProducto} alt="Producto" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  ) : (
                    <div style={{ color: '#ccc', textAlign: 'center', border: '2px dashed #ccc', padding: '40px', width: '80%', fontSize: '12px' }}>[Carga la imagen en el panel izquierdo]</div>
                  )}
                </div>

                {/* Tarjeta de Beneficios estilo industrial */}
                <div style={{ backgroundColor: '#F7F7F7', borderRadius: '15px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {fichaData.caracteristicas.map((carac, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '12px', borderBottom: idx !== fichaData.caracteristicas.length - 1 ? '1px solid #E5E5E5' : 'none', paddingBottom: idx !== fichaData.caracteristicas.length - 1 ? '15px' : '0' }}>
                      
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid #005AA9', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#005AA9', flexShrink: 0 }}>
                        {idx === 0 ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        ) : idx === 1 ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                        )}
                      </div>
                      
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#222', fontWeight: '900', letterSpacing: '0.5px' }}>{carac.titulo}</h4>
                        <p style={{ margin: 0, fontSize: '11.5px', color: '#666', lineHeight: '1.4' }}>{carac.texto}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* COLUMNA DERECHA (TÍTULOS Y DATOS TÉCNICOS) */}
              <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
                <h1 style={{ fontSize: '30px', margin: '0 0 5px 0', color: '#222', lineHeight: '1', textTransform: 'uppercase', fontFamily: 'Impact, Arial Narrow, sans-serif', letterSpacing: '0.5px' }}>{fichaData.titulo}</h1>
                <h2 style={{ fontSize: '18px', margin: '0 0 15px 0', color: '#005AA9', fontWeight: '800', letterSpacing: '0.5px' }}>{fichaData.subtitulo}</h2>
                <p style={{ fontSize: '13px', color: '#555', lineHeight: '1.5', marginBottom: '25px' }}>{fichaData.descripcion}</p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ width: '28px', height: '28px', backgroundColor: '#005AA9', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#222', fontWeight: '900' }}>DATOS TÉCNICOS</h3>
                </div>
                
                {/* Tabla de Especificaciones */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '25px' }}>
                  <tbody>
                    <tr style={{ borderTop: '2px solid #005AA9' }}></tr>
                    {fichaData.datosTecnicos.map((dato, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #EBEBEB' }}>
                        <td style={{ padding: '8px 5px', fontSize: '12px', fontWeight: 'bold', color: '#333', width: '45%' }}>{dato.parametro}</td>
                        <td style={{ padding: '8px 5px', fontSize: '12px', color: '#555' }}>{dato.valor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* USOS RECOMENDADOS (USANDO CSS GRID PARA ALINEACIÓN PERFECTA) */}
                <div style={{ border: '1px solid #005AA9', borderRadius: '8px', padding: '15px' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#005AA9', fontSize: '12px', fontWeight: '900' }}>USOS RECOMENDADOS</h4>
                  
                  {/* Grid asegura columnas de igual tamaño, evitando desalineaciones */}
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(fichaData.usos.length, 1)}, 1fr)`, gap: '10px', alignItems: 'start' }}>
                    {fichaData.usos.map((uso, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px' }}>
                        <div style={{ width: '40px', height: '40px', backgroundColor: '#005AA9', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '6px', flexShrink: 0 }}>
                          {i === 0 ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21V8l9-4l9 4v13"></path><rect x="6" y="12" width="3" height="3"></rect><rect x="15" y="12" width="3" height="3"></rect></svg>
                          ) : i === 1 ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                          ) : i === 2 ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                          ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
                          )}
                        </div>
                        <span style={{ fontSize: '8.5px', fontWeight: 'bold', color: '#005AA9', textTransform: 'uppercase', lineHeight: '1.2' }}>{uso}</span>
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            </div>

            {/* PIE DE PÁGINA (Franja Diagonal Perfecta: Izquierda Azul, Derecha Roja) */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '24mm', background: 'linear-gradient(105deg, #005AA9 55%, #E31E24 55%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px', boxSizing: 'border-box', color: 'white' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.5px' }}>CATEGORÍA:</div>
                  <div style={{ fontSize: '12px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{fichaData.categoriaPie}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1.5px solid white', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px' }}>CALIDAD GARANTIZADA</div>
                  <div style={{ fontSize: '9.5px', opacity: 0.9 }}>Respaldado por Sodimac</div>
                </div>
              </div>
              
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}