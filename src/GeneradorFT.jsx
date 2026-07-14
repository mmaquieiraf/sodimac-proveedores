import React, { useState } from 'react';
import html2pdf from 'html2pdf.js';

export default function GeneradorFT() {
  const [cargandoIA, setCargandoIA] = useState(false);
  const [archivosContexto, setArchivosContexto] = useState([]);
  const [imagenProducto, setImagenProducto] = useState(null);

  // Estado inicial con la estructura de prueba (Mockup)
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
    const elemento = document.getElementById('lienzo-ficha-tecnica');
    const opciones = {
      margin: 0,
      filename: `Ficha_Tecnica_${fichaData.titulo.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 3, useCORS: true }, 
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    window.html2pdf().set(opciones).from(elemento).save();
  };

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
      
      Reglas:
      1. Extrae máximo 3 características principales.
      2. Extrae máximo 10 datos técnicos relevantes.
      3. Extrae máximo 4 usos recomendados en formato arreglo de strings cortos.
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
    <div style={{ display: 'flex', width: '100%', height: 'calc(100vh - 100px)', gap: '20px', padding: '15px', boxSizing: 'border-box', backgroundColor: '#f4f4f4', overflow: 'hidden' }}>
      
      {/* PANEL IZQUIERDO: CONTROLES */}
      <div style={{ width: '400px', flexShrink: 0, backgroundColor: 'white', padding: '25px', borderRadius: '8px', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#004A99', marginTop: 0, borderBottom: '2px solid #EE2D24', paddingBottom: '10px' }}>Generador Ficha Técnica</h2>
        
        <div style={{ marginBottom: '25px', backgroundColor: '#eef2f7', padding: '15px', borderRadius: '6px', border: '1px solid #cce5ff' }}>
          <h3 style={{ fontSize: '15px', color: '#004A99', marginTop: 0 }}>1. Subir Especificaciones (PDF/TXT)</h3>
          <p style={{ fontSize: '11px', color: '#555', marginBottom: '10px' }}>La IA leerá este documento para extraer los datos técnicos, la descripción y los usos.</p>
          
          <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '4px', border: '1px dashed #004A99' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              <span style={{ backgroundColor: '#004A99', color: 'white', padding: '6px 10px', borderRadius: '4px', marginRight: '10px' }}>📎 Archivo Origen</span>
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
          <button onClick={procesarConIA} disabled={cargandoIA} style={{ width: '100%', padding: '10px', marginTop: '10px', backgroundColor: cargandoIA ? '#ccc' : '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: cargandoIA ? 'not-allowed' : 'pointer' }}>
            {cargandoIA ? '⏳ Analizando Datos...' : '✨ Autocompletar con IA'}
          </button>
        </div>

        <div style={{ marginBottom: '25px', backgroundColor: '#fff3f3', padding: '15px', borderRadius: '6px', border: '1px solid #ffcccc' }}>
          <h3 style={{ fontSize: '15px', color: '#EE2D24', marginTop: 0 }}>2. Cargar Imagen del Producto</h3>
          <p style={{ fontSize: '11px', color: '#555', marginBottom: '10px' }}>Sube una imagen preferiblemente cuadrada y con fondo blanco o transparente.</p>
          <input type="file" accept="image/*" onChange={manejarCargaImagen} style={{ width: '100%', fontSize: '12px' }} />
        </div>

      </div>

      {/* PANEL DERECHO: VISUALIZADOR Y EXPORTACIÓN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px', minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', backgroundColor: 'white', padding: '15px 20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <button onClick={exportarPDF} style={{ padding: '8px 15px', backgroundColor: '#EE2D24', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>🖨️ Descargar Ficha en PDF Oficial</button>
        </div>

        <div style={{ flex: 1, backgroundColor: '#555', padding: '20px', borderRadius: '8px', overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
          
          {/* LIENZO A4 DIGITAL: DISEÑO CORPORATIVO SODIMAC */}
          <div id="lienzo-ficha-tecnica" style={{ backgroundColor: 'white', width: '210mm', height: '297mm', position: 'relative', fontFamily: 'Arial, sans-serif', color: '#333', overflow: 'hidden', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }}>
            
            {/* ENCABEZADO */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', borderBottom: '1px solid #eee' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src="/logo.png" alt="Sodimac Logo" style={{ height: '50px', objectFit: 'contain' }} />
              </div>
              <div style={{ backgroundColor: '#004A99', color: 'white', padding: '15px 40px', fontSize: '28px', fontWeight: 'bold', clipPath: 'polygon(10% 0, 100% 0, 100% 100%, 0% 100%)', marginRight: '-40px' }}>
                FICHA TÉCNICA
              </div>
            </div>

            {/* CUERPO PRINCIPAL DOS COLUMNAS */}
            <div style={{ display: 'flex', padding: '30px 40px', gap: '30px' }}>
              
              {/* COLUMNA IZQUIERDA (IMAGEN Y CARACTERÍSTICAS) */}
              <div style={{ flex: '0 0 35%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ width: '100%', height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
                  {imagenProducto ? (
                    <img src={imagenProducto} alt="Producto" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  ) : (
                    <div style={{ color: '#ccc', textAlign: 'center', border: '2px dashed #ccc', padding: '40px', width: '80%' }}>[Sube una imagen]</div>
                  )}
                </div>

                <div style={{ backgroundColor: '#f8f9fa', borderRadius: '15px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {fichaData.caracteristicas.map((carac, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '15px', borderBottom: idx !== fichaData.caracteristicas.length - 1 ? '1px solid #ddd' : 'none', paddingBottom: idx !== fichaData.caracteristicas.length - 1 ? '15px' : '0' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #004A99', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#004A99', fontWeight: 'bold', fontSize: '18px', flexShrink: 0 }}>
                        {idx === 0 ? '✓' : idx === 1 ? '⚡' : '★'}
                      </div>
                      <div>
                        <h4 style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#333' }}>{carac.titulo}</h4>
                        <p style={{ margin: 0, fontSize: '12px', color: '#666', lineHeight: '1.4' }}>{carac.texto}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* COLUMNA DERECHA (TÍTULOS Y DATOS TÉCNICOS) */}
              <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
                <h1 style={{ fontSize: '32px', margin: '0 0 5px 0', color: '#333', lineHeight: '1.1', textTransform: 'uppercase' }}>{fichaData.titulo}</h1>
                <h2 style={{ fontSize: '20px', margin: '0 0 20px 0', color: '#004A99', fontWeight: 'bold' }}>{fichaData.subtitulo}</h2>
                <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.5', marginBottom: '30px' }}>{fichaData.descripcion}</p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                  <div style={{ width: '35px', height: '35px', backgroundColor: '#004A99', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: '16px' }}>⚙️</div>
                  <h3 style={{ margin: 0, fontSize: '18px', color: '#333' }}>DATOS TÉCNICOS</h3>
                </div>
                
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                  <tbody>
                    <tr style={{ borderTop: '2px solid #004A99' }}></tr>
                    {fichaData.datosTecnicos.map((dato, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '10px 5px', fontSize: '13px', fontWeight: 'bold', color: '#444', width: '45%' }}>{dato.parametro}</td>
                        <td style={{ padding: '10px 5px', fontSize: '13px', color: '#666' }}>{dato.valor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* USOS RECOMENDADOS */}
                <div style={{ border: '2px solid #b3d4ff', borderRadius: '8px', padding: '15px' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#004A99', fontSize: '13px' }}>USOS RECOMENDADOS</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                    {fichaData.usos.map((uso, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '40px', height: '40px', backgroundColor: '#004A99', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px', borderRadius: '4px' }}>
                          {i === 0 ? '🏭' : i === 1 ? '📦' : i === 2 ? '🏗️' : '🔧'}
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#004A99' }}>{uso}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* PIE DE PÁGINA */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', backgroundColor: '#004A99', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ fontSize: '30px' }}>⌂</div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold' }}>CATEGORÍA:</div>
                  <div style={{ fontSize: '13px' }}>{fichaData.categoriaPie}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', border: '2px solid white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>✓</div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold' }}>CALIDAD GARANTIZADA</div>
                  <div style={{ fontSize: '10px' }}>Respaldado por Sodimac</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}