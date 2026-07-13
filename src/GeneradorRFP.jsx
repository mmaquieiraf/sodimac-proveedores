import React, { useState } from 'react';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';

// URL de tu plantilla base en el Storage público de Supabase
const URL_PLANTILLA = "https://zpxptembhqlmpkbctvml.supabase.co/storage/v1/object/public/plantillas/plantilla-rfp-sodimac.docx";

// Lista de administradores predefinidos
const administradores = [
  { nombre: 'Matías Maquieira', email: 'mmaquieiraf@sodimac.cl' },
  { nombre: 'Ignacio Pizarro', email: 'ipizarro@sodimac.cl' },
  { nombre: 'Macarena Valenzuela', email: 'mvalenzuelam@sodimac.cl' },
  { nombre: 'Jorge Alarcon', email: 'jaalarconal@Sodimac.cl' }
];

export default function GeneradorRFP() {
  // --- ESTADOS PARA LA FICHA RESUMEN ---
  const [adminSeleccionado, setAdminSeleccionado] = useState(administradores[0]);
  const [reqSeriedad, setReqSeriedad] = useState('No');
  const [valSeriedad, setValSeriedad] = useState('No aplica');
  const [reqFiel, setReqFiel] = useState('No');
  const [valFiel, setValFiel] = useState('No aplica');
  const [reqVigenciaFiel, setReqVigenciaFiel] = useState('No');
  const [valVigenciaFiel, setValVigenciaFiel] = useState('No aplica');

  // --- ESTADOS PARA ALCANCE E INTEGRACIÓN CON GEMINI IA ---
  const [contextoIA, setContextoIA] = useState('');
  const [archivosContexto, setArchivosContexto] = useState([]);
  const [alcanceGenerado, setAlcanceGenerado] = useState('El alcance detallado será generado por la IA integrando los aspectos técnicos de sus anexos...');
  const [cargandoIA, setCargandoIA] = useState(false);

  // --- ESTADOS PARA EL CALENDARIO ---
  const [calLiberacion, setCalLiberacion] = useState('');
  const [calLimiteConsultas, setCalLimiteConsultas] = useState('');
  const [calRespuestas, setCalRespuestas] = useState('');
  const [calEnvioOfertas, setCalEnvioOfertas] = useState('');
  const [calMesAdjudicacion, setCalMesAdjudicacion] = useState('');
  const [calMesServicio, setCalMesServicio] = useState('');

  // --- ESTADOS PARA CLÁUSULAS ESPECÍFICAS ---
  const [vigenciaMeses, setVigenciaMeses] = useState('3');
  const [inicioSubgerencia, setInicioSubgerencia] = useState('Prevención');
  const [inicioMes, setInicioMes] = useState('junio');
  const [garantiaDias, setGarantiaDias] = useState('30');

  // --- ESTADOS PARA DESPACHO ---
  const [lugaresDespacho, setLugaresDespacho] = useState([
    { id: 1, punto: 'HC Quinta Vergara', direccion: 'Av. Valparaíso 1070', comuna: 'Viña del Mar' }
  ]);
  const [despachoCargo, setDespachoCargo] = useState('Jefa de Seguridad Electrónica');
  const [despachoNombre, setDespachoNombre] = useState('Cristian Reyes');
  const [despachoEmail, setDespachoEmail] = useState('creyesb@sodimac.cl');

  // --- FUNCIONES MANEJADORAS GENERALES ---
  const handleAdminChange = (e) => {
    const admin = administradores.find(a => a.nombre === e.target.value);
    if(admin) setAdminSeleccionado(admin);
  };

  const manejarCargaArchivos = (e) => {
    const nuevosArchivos = Array.from(e.target.files);
    setArchivosContexto([...archivosContexto, ...nuevosArchivos]);
    e.target.value = null; 
  };

  const eliminarArchivo = (index) => {
    setArchivosContexto(archivosContexto.filter((_, i) => i !== index));
  };

  const agregarLugarDespacho = () => {
    setLugaresDespacho([...lugaresDespacho, { id: Date.now(), punto: '', direccion: '', comuna: '' }]);
  };

  const eliminarLugarDespacho = (id) => {
    setLugaresDespacho(lugaresDespacho.filter(l => l.id !== id));
  };

  const modificarLugar = (id, campo, valor) => {
    setLugaresDespacho(lugaresDespacho.map(l => l.id === id ? { ...l, [campo]: valor } : l));
  };

  const formatearMesAno = (valorMes) => {
    if(!valorMes) return '[Mes y Año]';
    const [year, month] = valorMes.split('-');
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${meses[parseInt(month)-1]} ${year}`;
  };

  const transformarArchivoBase64 = (archivo) => {
    return new Promise((resolve, reject) => {
      const lector = new FileReader();
      lector.readAsDataURL(archivo);
      lector.onload = () => resolve(lector.result.split(',')[1]);
      lector.onerror = (error) => reject(error);
    });
  };

  // --- EXPORTACIÓN A PDF DINÁMICA (SIN NPM INSTALL) ---
  const exportarPDF = async () => {
    // Si la librería no está cargada en el navegador, la inyectamos en vivo desde internet
    if (!window.html2pdf) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    // Una vez cargada, tomamos la "foto" del documento y generamos el PDF
    const elemento = document.getElementById('documento-rfp');
    const opciones = {
      margin:       [15, 15, 15, 15], 
      filename:     `Bases_RFP_${adminSeleccionado.nombre.replace(' ', '_')}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true }, 
      jsPDF:        { unit: 'mm', format: 'letter', orientation: 'portrait' }
    };

    window.html2pdf().set(opciones).from(elemento).save();
  };

  // --- CONEXIÓN DIRECTA CON GEMINI IA (TEXTO LIBRE, FORMATO ESTRICTO) ---
  const procesarConIA = async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      alert("❌ Error: Vercel no está leyendo la API Key.");
      return;
    }

    setCargandoIA(true);

    try {
      const archivosValidos = archivosContexto.filter(f => 
        f.type === 'application/pdf' || f.type.startsWith('image/') || f.type.startsWith('text/')
      );

      const partesDocumentos = await Promise.all(
        archivosValidos.map(async (archivo) => {
          const base64Data = await transformarArchivoBase64(archivo);
          return { inlineData: { mimeType: archivo.type, data: base64Data } };
        })
      );

      // Instrucción maestra: Libertad contextual, pero esclavitud al formato
      const instruccionesSistema = "Eres un ingeniero experto en adquisiciones para Sodimac. Tu tarea es redactar TODO el 'ALCANCE DEL PROCESO', desde la introducción hasta el punto 3.7. Debes usar la estructura base proporcionada, pero ADAPTANDO, EXPANDIENDO Y MODIFICANDO el contenido de todos los puntos (3.2, 3.3, 3.4, 3.5, 3.6) según los archivos y el contexto técnico entregado. \n\nREGLAS DE FORMATO OBLIGATORIAS:\n1. Usa **asteriscos dobles** para las negritas en los títulos (ej: **3.2 Alcance de los Servicios**).\n2. Usa **asteriscos dobles** en las letras o viñetas de los listados hasta los dos puntos (ej: **a) Instalación y Configuración:**).\n3. Separa CADA párrafo y elemento de lista con un DOBLE SALTO DE LÍNEA (línea en blanco) para asegurar el espaciado correcto en el documento final.";

      const promptEstructurado = `
      Basándote en el siguiente contexto y en los documentos técnicos adjuntos, redacta el texto completo del ALCANCE DEL PROCESO. 
      
      Debes tomar esta estructura base y reescribir/expandir sus puntos para que calcen perfectamente con el servicio que se está licitando (añadiendo obligaciones técnicas, entregables, condiciones de ejecución específicas, etc. que se mencionen en el contexto).
      
      ESTRUCTURA BASE A ADAPTAR Y EXPANDIR INTEGRAMENTE:
      
  
      El presente Proceso de Licitación tiene por objeto la contratación de los servicios de **[ADAPTAR SERVICIO]**, a ejecutarse en **[ADAPTAR UBICACIÓN]**... [Mantén la legalidad de los párrafos introductorios base]
      
      **3.2 Alcance de los Servicios**
      [Adapta y genera las letras a), b), c)... según el servicio técnico específico del contexto. No olvides poner en negrita hasta los dos puntos]
      
      **3.3 Alcances Complementarios**
      [Mantén la base de continuidad operacional y resguardo, pero agrega cualquier otro alcance complementario que exija el contexto técnico]
      
      **3.4 Condiciones de Ejecución**
      [Agrega aquí normativas específicas, certificaciones, herramientas o personal especializado que el proveedor haya puesto en sus anexos técnicos]
      
      **3.5 Obligaciones del Adjudicatario**
      [Expande las obligaciones a), b), c)... sumando las responsabilidades operativas derivadas del contexto]
      
      **3.6 Entregables**
      [Modifica y expande la lista de entregables según lo que el servicio requiera (ej: reportes técnicos, actas, garantías de software, protocolos, etc.)]
      
      **3.7 Interpretación del Alcance**
      [Mantén este punto con su texto legal estándar sin modificar]
      
      --- CONTEXTO TÉCNICO A INYECTAR Y ANALIZAR ---
      ${contextoIA}
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

      if (!respuestaApi.ok) {
        console.error("Error devuelto por Google:", datosRecibidos);
        throw new Error(datosRecibidos.error?.message || `Código: ${respuestaApi.status}`);
      }

      if (datosRecibidos.candidates && datosRecibidos.candidates[0]?.content?.parts[0]?.text) {
        setAlcanceGenerado(datosRecibidos.candidates[0].content.parts[0].text);
      } else {
        throw new Error("La IA no devolvió texto.");
      }

    } catch (error) {
      console.error("Fallo:", error);
      alert(`⚠️ Fallo de conexión:\n\n${error.message}`);
    } finally {
      setCargandoIA(false);
    }
  };

  // --- MOTOR DE FUSIÓN CON TU PLANTILLA WORD DE SUPABASE ---
  const generarWordFinal = async () => {
    try {
      const response = await fetch(URL_PLANTILLA);
      const content = await response.arrayBuffer();
      const zip = new PizZip(content);
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

      // Eliminamos los asteriscos y aplicamos el salto de tabulador para evitar la sopa de letras en Word
      const alcanceLimpioParaWord = alcanceGenerado
        .replace(/\*\*/g, '')
        .split('\n')
        .map(linea => linea.trim() + '\t')
        .join('\n');

      doc.setData({
        administrador_nombre: adminSeleccionado.nombre,
        administrador_email: adminSeleccionado.email,
        val_seriedad: valSeriedad,
        val_fiel: valFiel,
        val_vigencia_fiel: valVigenciaFiel,
        alcance_ia: alcanceLimpioParaWord, 
        cal_liberacion: calLiberacion ? new Date(calLiberacion).toLocaleDateString('es-CL') : '[Sin Fecha]',
        cal_consultas: calLimiteConsultas ? new Date(calLimiteConsultas).toLocaleDateString('es-CL') : '[Sin Fecha]',
        cal_respuestas: calRespuestas ? new Date(calRespuestas).toLocaleDateString('es-CL') : '[Sin Fecha]',
        cal_ofertas: calEnvioOfertas ? new Date(calEnvioOfertas).toLocaleDateString('es-CL') : '[Sin Fecha]',
        cal_adjudicacion: formatearMesAno(calMesAdjudicacion),
        cal_servicio: formatearMesAno(calMesServicio),
        vigencia_meses: vigenciaMeses,
        inicio_subgerencia: inicioSubgerencia,
        inicio_mes: inicioMes,
        garantia_dias: garantiaDias,
        despacho_cargo: despachoCargo,
        despacho_nombre: despachoNombre,
        despacho_email: despachoEmail,
        lugaresDespacho: lugaresDespacho
      });

      doc.render();
      const out = doc.getZip().generate({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      saveAs(out, `Bases_RFP_${adminSeleccionado.nombre.replace(' ', '_')}.docx`);
    } catch (error) {
      console.error(error);
      alert("Error al generar Word. Verifica las llaves en la plantilla.");
    }
  };

  // --- FUNCIÓN NATIVA PARA RENDERIZAR NEGRITAS EN LA PANTALLA ---
  const renderTextoConNegritas = (texto) => {
    if (!texto) return null;
    return texto.split(/(\*\*.*?\*\*)/g).map((parte, index) => {
      if (parte.startsWith('**') && parte.endsWith('**')) {
        return <strong key={index}>{parte.slice(2, -2)}</strong>;
      }
      return <span key={index}>{parte}</span>;
    });
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: 'calc(100vh - 100px)', gap: '20px', padding: '15px', boxSizing: 'border-box', backgroundColor: '#f4f4f4', overflow: 'hidden' }}>
      
      {/* PANEL IZQUIERDO: FORMULARIO Y CONTROLES */}
      <div style={{ width: '450px', flexShrink: 0, backgroundColor: 'white', padding: '25px', borderRadius: '8px', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#004A99', marginTop: 0, borderBottom: '2px solid #EE2D24', paddingBottom: '10px' }}>Configuración de Bases RFP</h2>
        
        {/* 1. FICHA RESUMEN */}
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ fontSize: '16px', color: '#333' }}>1. Ficha Resumen</h3>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Administrador del Proceso</label>
          <select value={adminSeleccionado.nombre} onChange={handleAdminChange} style={{ width: '100%', padding: '8px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '4px' }}>
            {administradores.map(a => <option key={a.nombre} value={a.nombre}>{a.nombre}</option>)}
          </select>
          <input disabled value={adminSeleccionado.email} style={{ width: '100%', padding: '8px', marginBottom: '15px', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Boleta Seriedad Oferta</label>
              <select value={reqSeriedad} onChange={e => { setReqSeriedad(e.target.value); if(e.target.value === 'No') setValSeriedad('No aplica'); else setValSeriedad(''); }} style={{ width: '100%', padding: '6px', marginTop: '5px' }}>
                <option value="No">No requiere</option><option value="Si">Sí requiere</option>
              </select>
              {reqSeriedad === 'Si' && <input placeholder="Ingrese monto..." value={valSeriedad} onChange={e => setValSeriedad(e.target.value)} style={{ width: '100%', padding: '6px', marginTop: '5px' }} />}
            </div>
            
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Boleta Fiel Cumplimiento</label>
              <select value={reqFiel} onChange={e => { setReqFiel(e.target.value); if(e.target.value === 'No') setValFiel('No aplica'); else setValFiel(''); }} style={{ width: '100%', padding: '6px', marginTop: '5px' }}>
                <option value="No">No requiere</option><option value="Si">Sí requiere</option>
              </select>
              {reqFiel === 'Si' && <input placeholder="Ingrese monto..." value={valFiel} onChange={e => setValFiel(e.target.value)} style={{ width: '100%', padding: '6px', marginTop: '5px' }} />}
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Vigencia Boleta Fiel Cumplimiento</label>
              <select value={reqVigenciaFiel} onChange={e => { setReqVigenciaFiel(e.target.value); if(e.target.value === 'No') setValVigenciaFiel('No aplica'); else setValVigenciaFiel(''); }} style={{ width: '100%', padding: '6px', marginTop: '5px' }}>
                <option value="No">No requiere</option><option value="Si">Sí requiere</option>
              </select>
              {reqVigenciaFiel === 'Si' && <input placeholder="Ingrese vigencia..." value={valVigenciaFiel} onChange={e => setValVigenciaFiel(e.target.value)} style={{ width: '100%', padding: '6px', marginTop: '5px' }} />}
            </div>
          </div>
        </div>

        {/* 2. ALCANCE E IA CON CONEXIÓN ACTIVA OCULTA */}
        <div style={{ marginBottom: '25px', backgroundColor: '#eef2f7', padding: '15px', borderRadius: '6px', border: '1px solid #cce5ff' }}>
          <h3 style={{ fontSize: '16px', color: '#004A99', marginTop: 0 }}>2. Contexto para IA (Alcance)</h3>
          
          <p style={{ fontSize: '11px', color: '#555', marginBottom: '10px' }}>Ingresa detalles o adjunta antecedentes técnicos de referencia (PDF) para que Gemini redacte todo el alcance contextualizado.</p>
          <textarea rows="3" placeholder="Ej: Bases para sistema de seguridad. El proveedor debe instalar cámaras, capacitar al personal en el uso del software y realizar visitas mensuales..." value={contextoIA} onChange={e => setContextoIA(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', resize: 'vertical' }}></textarea>
          
          <div style={{ marginTop: '10px', padding: '12px', backgroundColor: 'white', borderRadius: '4px', border: '1px dashed #004A99' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#333', display: 'flex', alignItems: 'center', cursor: 'pointer', margin: 0 }}>
              <span style={{ backgroundColor: '#17a2b8', color: 'white', padding: '6px 10px', borderRadius: '4px', marginRight: '10px' }}>📎 Adjuntar Archivos</span>
              <span style={{ color: '#666', fontWeight: 'normal' }}>(Soporta PDF, TXT o Imágenes)</span>
              <input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv" onChange={manejarCargaArchivos} style={{ display: 'none' }} />
            </label>

            {archivosContexto.length > 0 && (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {archivosContexto.map((archivo, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f9fa', padding: '6px 10px', borderRadius: '4px', border: '1px solid #eee', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <span style={{ fontSize: '14px' }}>📄</span>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 'bold', color: '#333' }}>{archivo.name}</span>
                    </div>
                    <button onClick={() => eliminarArchivo(index)} style={{ background: 'none', border: 'none', color: '#EE2D24', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>✖</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={procesarConIA} disabled={cargandoIA} style={{ width: '100%', padding: '12px', marginTop: '15px', backgroundColor: cargandoIA ? '#ccc' : '#6f42c1', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: cargandoIA ? 'not-allowed' : 'pointer', transition: '0.3s' }}>
            {cargandoIA ? '⏳ Analizando y redactando...' : '✨ Redactar Alcance Contextualizado'}
          </button>
        </div>

        {/* 3. CALENDARIO */}
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ fontSize: '16px', color: '#333' }}>3. Calendario del Proceso</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div><label style={{ fontSize: '12px' }}>Liberación del Proceso</label><input type="date" value={calLiberacion} onChange={e => setCalLiberacion(e.target.value)} style={{ width: '100%', padding: '6px' }} /></div>
            <div><label style={{ fontSize: '12px' }}>Límite envío Consultas</label><input type="date" value={calLimiteConsultas} onChange={e => setCalLimiteConsultas(e.target.value)} style={{ width: '100%', padding: '6px' }} /></div>
            <div><label style={{ fontSize: '12px' }}>Entrega de Respuestas</label><input type="date" value={calRespuestas} onChange={e => setCalRespuestas(e.target.value)} style={{ width: '100%', padding: '6px' }} /></div>
            <div><label style={{ fontSize: '12px' }}>Envío de Ofertas</label><input type="date" value={calEnvioOfertas} onChange={e => setCalEnvioOfertas(e.target.value)} style={{ width: '100%', padding: '6px' }} /></div>
            <div><label style={{ fontSize: '12px' }}>Mes/Año Adjudicación</label><input type="month" value={calMesAdjudicacion} onChange={e => setCalMesAdjudicacion(e.target.value)} style={{ width: '100%', padding: '6px' }} /></div>
            <div><label style={{ fontSize: '12px' }}>Mes/Año Servicio</label><input type="month" value={calMesServicio} onChange={e => setCalMesServicio(e.target.value)} style={{ width: '100%', padding: '6px' }} /></div>
          </div>
        </div>

        {/* 4. CLÁUSULAS ESPECÍFICAS */}
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ fontSize: '16px', color: '#333' }}>4. Cláusulas Contractuales</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div><label style={{ fontSize: '12px' }}>Vigencia Acuerdo (Meses)</label><input type="number" value={vigenciaMeses} onChange={e => setVigenciaMeses(e.target.value)} style={{ width: '100%', padding: '6px' }} /></div>
            <div><label style={{ fontSize: '12px' }}>Subgerencia a Coordinar</label><input type="text" value={inicioSubgerencia} onChange={e => setInicioSubgerencia(e.target.value)} style={{ width: '100%', padding: '6px' }} /></div>
            <div><label style={{ fontSize: '12px' }}>Mes inicio servicio</label><input type="text" value={inicioMes} onChange={e => setInicioMes(e.target.value)} style={{ width: '100%', padding: '6px' }} /></div>
            <div><label style={{ fontSize: '12px' }}>Días Garantía Producto</label><input type="number" value={garantiaDias} onChange={e => setGarantiaDias(e.target.value)} style={{ width: '100%', padding: '6px' }} /></div>
          </div>
        </div>

        {/* 5. DESPACHO */}
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ fontSize: '16px', color: '#333' }}>5. Lugares de Despacho</h3>
          {lugaresDespacho.map((lugar) => (
            <div key={lugar.id} style={{ display: 'flex', gap: '5px', marginBottom: '10px', alignItems: 'center' }}>
              <input placeholder="Punto" value={lugar.punto} onChange={e => modificarLugar(lugar.id, 'punto', e.target.value)} style={{ flex: 1, padding: '6px', fontSize: '11px' }} />
              <input placeholder="Dirección" value={lugar.direccion} onChange={e => modificarLugar(lugar.id, 'direccion', e.target.value)} style={{ flex: 1.5, padding: '6px', fontSize: '11px' }} />
              <input placeholder="Comuna" value={lugar.comuna} onChange={e => modificarLugar(lugar.id, 'comuna', e.target.value)} style={{ flex: 1, padding: '6px', fontSize: '11px' }} />
              <button onClick={() => eliminarLugarDespacho(lugar.id)} style={{ padding: '6px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✖</button>
            </div>
          ))}
          <button onClick={agregarLugarDespacho} style={{ padding: '6px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>+ Agregar dirección</button>

          <h4 style={{ fontSize: '14px', color: '#555', marginTop: '20px', marginBottom: '10px' }}>Contacto para Entrega</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: '12px' }}>Cargo</label><input type="text" value={despachoCargo} onChange={e => setDespachoCargo(e.target.value)} style={{ width: '100%', padding: '6px' }} /></div>
            <div><label style={{ fontSize: '12px' }}>Nombre</label><input type="text" value={despachoNombre} onChange={e => setDespachoNombre(e.target.value)} style={{ width: '100%', padding: '6px' }} /></div>
            <div><label style={{ fontSize: '12px' }}>Email</label><input type="email" value={despachoEmail} onChange={e => setDespachoEmail(e.target.value)} style={{ width: '100%', padding: '6px' }} /></div>
          </div>
        </div>
      </div>

      {/* PANEL DERECHO: VISUALIZADOR INTEGRO Y ACCIONES DE EXPORTACIÓN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px', minWidth: 0 }}>
        
        {/* BARRA DE BOTONES: Ahora son más claros respecto a su función */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', backgroundColor: 'white', padding: '15px 20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <button onClick={generarWordFinal} style={{ padding: '8px 15px', backgroundColor: '#004A99', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>📄 Descargar Word Oficial (Texto Plano)</button>
          <button onClick={exportarPDF} style={{ padding: '8px 15px', backgroundColor: '#EE2D24', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>🖨️ Generar y Descargar PDF</button>
        </div>

        {/* VISUALIZADOR DEL DOCUMENTO */}
        <div style={{ flex: 1, backgroundColor: '#e5e5e5', padding: '20px', borderRadius: '8px', overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
          <div id="documento-rfp" style={{ backgroundColor: 'white', width: '21cm', minHeight: '29.7cm', padding: '2.5cm', boxShadow: '0 4px 10px rgba(0,0,0,0.15)', fontFamily: 'Arial, sans-serif', fontSize: '10pt', color: '#333', lineHeight: '1.5', textAlign: 'left', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
            
            <h1 style={{ textAlign: 'center', fontSize: '16pt', color: '#004A99', marginBottom: '20px' }}>Bases Proceso de Solicitud de Propuestas<br/>Condicionado Particular</h1>
            <p style={{ textAlign: 'justify', fontStyle: 'italic' }}>Este documento es propiedad del Titular del Proceso. El contenido de este documento está sujeto a reserva. Este documento no puede ser reproducido, ni en su totalidad ni parcialmente, ni mostrado a terceros que no tengan relación con el Proceso de Solicitud de Propuestas, ni utilizado con propósitos comerciales sin previa autorización escrita del Titular del Proceso.</p>

            <h3 style={{ fontSize: '12pt', borderBottom: '1px solid #ccc', paddingBottom: '5px', marginTop: '30px' }}>Unidades de Negocio</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '9pt' }}>
              <thead><tr style={{ backgroundColor: '#f0f0f0' }}><th style={{ border: '1px solid #ccc', padding: '5px' }}>País</th><th style={{ border: '1px solid #ccc', padding: '5px' }}>Nombre o Razón Social</th><th style={{ border: '1px solid #ccc', padding: '5px' }}>Rut o nro. De identificación fiscal</th></tr></thead>
              <tbody><tr><td style={{ border: '1px solid #ccc', padding: '5px' }}>Chile</td><td style={{ border: '1px solid #ccc', padding: '5px' }}>Sodimac S.A.</td><td style={{ border: '1px solid #ccc', padding: '5px' }}>96.792.430-K</td></tr></tbody>
            </table>

            <h3 style={{ fontSize: '12pt', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>Ficha Resumen</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', fontSize: '9pt' }}>
              <tbody>
                <tr><td style={{ border: '1px solid #ccc', padding: '5px', fontWeight: 'bold', width: '40%' }}>Administrador del Proceso</td><td style={{ border: '1px solid #ccc', padding: '5px' }}>{adminSeleccionado.nombre}</td><td style={{ border: '1px solid #ccc', padding: '5px' }}>{adminSeleccionado.email}</td></tr>
                <tr><td style={{ border: '1px solid #ccc', padding: '5px', fontWeight: 'bold' }}>Monto Boleta Garantía Seriedad</td><td style={{ border: '1px solid #ccc', padding: '5px' }} colSpan="2">{valSeriedad || '[Por definir]'}</td></tr>
                <tr><td style={{ border: '1px solid #ccc', padding: '5px', fontWeight: 'bold' }}>Monto Boleta Fiel Cumplimiento</td><td style={{ border: '1px solid #ccc', padding: '5px' }} colSpan="2">{valFiel || '[Por definir]'}</td></tr>
                <tr><td style={{ border: '1px solid #ccc', padding: '5px', fontWeight: 'bold' }}>Vigencia Boleta Fiel Cumplimiento</td><td style={{ border: '1px solid #ccc', padding: '5px' }} colSpan="2">{valVigenciaFiel || '[Por definir]'}</td></tr>
                <tr><td style={{ border: '1px solid #ccc', padding: '5px', fontWeight: 'bold' }}>Tipo de documento a suscribir tras adjudicación</td><td style={{ border: '1px solid #ccc', padding: '5px' }} colSpan="2">Acuerdo Comercial Según Aceptación de Bases Generales, Particulares y firma de Carta de Adjudicación</td></tr>
                <tr><td style={{ border: '1px solid #ccc', padding: '5px', fontWeight: 'bold' }}>Idioma del Contrato</td><td style={{ border: '1px solid #ccc', padding: '5px' }} colSpan="2">Idioma Español</td></tr>
                <tr><td style={{ border: '1px solid #ccc', padding: '5px', fontWeight: 'bold' }}>Moneda del Contrato</td><td style={{ border: '1px solid #ccc', padding: '5px' }} colSpan="2">CLP (pesos chilenos)</td></tr>
              </tbody>
            </table>

            <h3 style={{ fontSize: '12pt', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>DEFINICIONES</h3>
            <p style={{ textAlign: 'justify' }}>En estas Bases, las palabras y términos que se definen en esta cláusula, cuando ellos se escriban con mayúscula inicial según se hace en sus respectivas definiciones que siguen más adelante, fuere o no necesario conforme a las reglas ortográficas del uso de las mayúsculas, tendrán los significados que a cada una de dichas palabras o términos se les adscribe a continuación:</p>
            <ul style={{ textAlign: 'justify' }}>
              <li><strong>Contratante:</strong> significa SODIMAC, Sodimac Homecenter, Sodimac Constructor.</li>
              <li><strong>Adjudicatario o Prestador:</strong> Empresa que mediante proceso formal se ha adjudicado el servicio.</li>
              <li><strong>Proponente, Oferente o Participante:</strong> Persona Jurídica que se encuentra participando del proceso.</li>
              <li><strong>Especificaciones:</strong> Significa los requisitos mínimos requeridos por cada producto o servicio solicitado.</li>
              <li><strong>Moneda de Oferta:</strong> CLP (pesos chilenos)</li>
              <li><strong>Plataforma o Aplicativo Sistémico:</strong> http://www.coupa.com</li>
            </ul>

            <h3 style={{ fontSize: '12pt', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>OBJETIVOS</h3>
            <p style={{ textAlign: 'justify' }}>Por medio de este Proceso, la Titular pretende seleccionar una empresa para contratar el suministro y despacho de suministro o servicios para Sodimac, suscribir una carta de adjudicación y/o contrato para la entrega de suministros o servicios en los términos establecidos en esta base especial y base general.</p>

            {/* SECCIÓN DEL ALCANCE CON LA FUNCIÓN DE NEGRITAS INYECTADA */}
            <h3 style={{ fontSize: '12pt', borderBottom: '1px solid #ccc', paddingBottom: '5px', marginTop: '20px' }}>ALCANCE DEL PROCESO</h3>
            <div style={{ backgroundColor: '#fffbe6', padding: '15px', border: '1px dashed #ffd700', color: '#333', fontStyle: 'normal', marginBottom: '20px' }}>
              {renderTextoConNegritas(alcanceGenerado)}
            </div>

            <h3 style={{ fontSize: '12pt', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>CONSULTAS Y ACLARACIONES</h3>
            <p style={{ textAlign: 'justify' }}>Conforme a lo establecido en estas bases, el Proponente deberá contemplar las siguientes conditions generales: Todas las consultas, tanto las de carácter técnico como las de índole administrativas, que los Proponentes deseen formular en relación con la materia de este Proceso de Solicitud de Propuestas, deberán ser realizadas a través de la Plataforma.</p>

            <h3 style={{ fontSize: '12pt', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>PACTO DE INTEGRIDAD</h3>
            <p style={{ textAlign: 'justify' }}>Los Participantes declaran que, por el sólo hecho de participar en el presente proceso, acepta expresamente el presente pacto de integridad, obligándose a cumplir con todas y cada una de las estipulaciones contenidas en la misma. El oferente se obliga a no intentar ni efectuar acuerdos o realizar negociaciones, actos o conductas que tengan por objeto influir o afectar de cualquier forma la libre competencia.</p>

            <h3 style={{ fontSize: '12pt', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>CALENDARIO DEL PROCESO</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', fontSize: '9pt' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}><th style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'left' }}>ACTIVIDAD</th><th style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'left' }}>FECHA</th></tr>
              </thead>
              <tbody>
                <tr><td style={{ border: '1px solid #ccc', padding: '5px' }}>Liberación del Proceso</td><td style={{ border: '1px solid #ccc', padding: '5px' }}>{calLiberacion ? new Date(calLiberacion).toLocaleDateString('es-CL') : '[Sin Fecha]'}</td></tr>
                <tr><td style={{ border: '1px solid #ccc', padding: '5px' }}>Recepción de preguntas y consultas del Proceso</td><td style={{ border: '1px solid #ccc', padding: '5px' }}>Al inicio del Proceso</td></tr>
                <tr><td style={{ border: '1px solid #ccc', padding: '5px' }}>Fecha límite de envío de Consultas</td><td style={{ border: '1px solid #ccc', padding: '5px' }}>{calLimiteConsultas ? new Date(calLimiteConsultas).toLocaleDateString('es-CL') : '[Sin Fecha]'}</td></tr>
                <tr><td style={{ border: '1px solid #ccc', padding: '5px' }}>Entrega de respuestas a Proponentes</td><td style={{ border: '1px solid #ccc', padding: '5px' }}>{calRespuestas ? new Date(calRespuestas).toLocaleDateString('es-CL') : '[Sin Fecha]'}</td></tr>
                <tr><td style={{ border: '1px solid #ccc', padding: '5px' }}>Envío de ofertas</td><td style={{ border: '1px solid #ccc', padding: '5px' }}>{calEnvioOfertas ? new Date(calEnvioOfertas).toLocaleDateString('es-CL') : '[Sin Fecha]'}</td></tr>
                <tr><td style={{ border: '1px solid #ccc', padding: '5px' }}>Fecha estimada de adjudicación</td><td style={{ border: '1px solid #ccc', padding: '5px', textTransform: 'capitalize' }}>{formatearMesAno(calMesAdjudicacion)}</td></tr>
                <tr><td style={{ border: '1px solid #ccc', padding: '5px' }}>Fecha estimada de Servicio</td><td style={{ border: '1px solid #ccc', padding: '5px', textTransform: 'capitalize' }}>{formatearMesAno(calMesServicio)}</td></tr>
              </tbody>
            </table>

            <h3 style={{ fontSize: '12pt', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>VIGENCIA DEL ACUERDO</h3>
            <p style={{ textAlign: 'justify' }}>El precio adjudicado en el marco de la presente solicitud de propuestas tendrá una vigencia inicial de <strong>{vigenciaMeses || '[X]'} meses</strong>, contados desde la fecha de suscripción del contrato o emisión de la respectiva orden de compra, según corresponda. Dicho período podrá renovarse automáticamente por períodos sucesivos.</p>

            <h3 style={{ fontSize: '12pt', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>OBLIGACIONES LABORALES Y BOLETA DE GARANTÍA</h3>
            <p style={{ textAlign: 'justify' }}>El Adjudicatario será exclusivamente responsable del cumplimiento de todas las obligaciones laborales previsionales, asistenciales, tributarias y demás relacionadas a las personas que emplee para el cumplimiento del servicio. Asimismo, el Adjudicatario deberá entregar una Boleta de Garantía Bancaria emitida por una institución financiera legalmente constituida pagadera a la vista e irrevocable.</p>

            <h3 style={{ fontSize: '12pt', borderBottom: '1px solid #ccc', paddingBottom: '5px', marginTop: '20px' }}>INICIO DEL SERVICIO</h3>
            <p style={{ textAlign: 'justify' }}>Posterior a la adjudicación respectiva de los elementos requeridos por La Empresa, el adjudicatario deberá coordinar con el encargado respectivo de la Subgerencia de <strong>{inicioSubgerencia || '[Subgerencia]'}</strong> para dar inicio de los servicios requeridos.</p>
            <p style={{ textAlign: 'justify' }}>Se espera que los servicios puedan ser ejecutados en dependencias de Sodimac durante el mes de <strong>{inicioMes || '[Mes]'}</strong> o a coordinar con mandante.</p>

            <h3 style={{ fontSize: '12pt', borderBottom: '1px solid #ccc', paddingBottom: '5px', marginTop: '20px' }}>GARANTÍA DEL PRODUCTO</h3>
            <p style={{ textAlign: 'justify' }}>El adjudicatario deberá procurar, con el mayor esfuerzo posible, realizar todas las acciones necesarias para corregir las falencias detectadas en el producto terminado instalado. Además, se requiere que se garantice la "calidad" de el o los productos adjudicados a lo menos <strong>"{garantiaDias || '[X]'} días"</strong> desde la recepción del producto en tienda.</p>

            <h3 style={{ fontSize: '12pt', borderBottom: '1px solid #ccc', paddingBottom: '5px', marginTop: '20px' }}>DESPACHO</h3>
            <p style={{ textAlign: 'justify' }}>El Prestador deberá considerar el despacho de los elementos requeridos a la siguiente dirección definida por Contratante:</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '9pt' }}>
              <thead>
                <tr style={{ backgroundColor: '#004A99', color: 'white' }}>
                  <th style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'left' }}>Punto</th>
                  <th style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'left' }}>DIRECCIÓN</th>
                  <th style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'left' }}>COMUNA</th>
                </tr>
              </thead>
              <tbody>
                {lugaresDespacho.map((l, i) => (
                  <tr key={i}>
                    <td style={{ border: '1px solid #ccc', padding: '5px' }}>{l.punto}</td>
                    <td style={{ border: '1px solid #ccc', padding: '5px' }}>{l.direccion}</td>
                    <td style={{ border: '1px solid #ccc', padding: '5px' }}>{l.comuna}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ textAlign: 'justify' }}>Una vez que el Prestador se encuentre en condiciones de entrega deberá agendar una hora con la <strong>{despachoCargo || '[Cargo]'}</strong>, <strong>{despachoNombre || '[Nombre]'}</strong> (<strong>{despachoEmail || '[Email]'}</strong>) para posteriormente realizar la entrega física en cada una de las tiendas.</p>

            <h3 style={{ fontSize: '12pt', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>SANCIONES E INDEMNIZACIONES</h3>
            <p style={{ textAlign: 'justify' }}>El incumplimiento de estos requisitos y/o de obligaciones inherentes a los servicios, significará un incumplimiento grave de las obligaciones asumidas por el Adjudicatario y dará derecho a la Empresa, a declarar resuelto el contrato. El Adjudicatario indemnizará a La Empresa, por todas las pérdidas, daños, perjuicios, reclamaciones y costos sufridos como consecuencia directa del incumplimiento.</p>

            <h3 style={{ fontSize: '12pt', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>CUMPLIMIENTO DE LA LEY 20.393 Y SOSTENIBILIDAD</h3>
            <p style={{ textAlign: 'justify' }}>El Adjudicatario declara conocer y aceptar en todas sus partes la Declaración de Ética del Grupo Falabella y que ha dado estricto cumplimiento a las normas de la Ley 20.393. La Empresa propenderá y favorecerá que sus proveedores implementen políticas y prácticas de Sostenibilidad y/o Responsabilidad Social.</p>
            
            <h3 style={{ fontSize: '12pt', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>CELEBRACIÓN DEL CONTRATO Y ESTIPULACIONES OBLIGATORIAS</h3>
            <p style={{ textAlign: 'justify' }}>Por el hecho de adjudicarse el servicio, se entenderá que queda celebrado un Contrato de Abastecimiento o Suministro entre La Empresa y el Adjudicatario. Estas Bases, contienen todos los derechos y obligaciones de las partes, entendiéndose que forman parte integrante de las mismas además el documento que comunique la adjudicación.</p>

          </div>
        </div>
      </div>
    </div>
  );
}