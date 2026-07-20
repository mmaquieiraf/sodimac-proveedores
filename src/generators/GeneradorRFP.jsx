import React, { useState } from 'react';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import { procesarConGeminiService } from '../services/ia/geminiService';
import { supabase } from '../supabase';

const URL_PLANTILLA = "https://zpxptembhqlmpkbctvml.supabase.co/storage/v1/object/public/plantillas/plantilla-rfp-sodimac.docx";
const administradores = [
  { nombre: 'Matías Maquieira', email: 'mmaquieiraf@sodimac.cl' },
  { nombre: 'Ignacio Pizarro', email: 'ipizarro@sodimac.cl' },
  { nombre: 'Macarena Valenzuela', email: 'mvalenzuelam@sodimac.cl' },
  { nombre: 'Jorge Alarcon', email: 'jaalarconal@Sodimac.cl' }
];

export default function GeneradorRFP() {
  const [adminSeleccionado, setAdminSeleccionado] = useState(administradores[0]);
  const [reqSeriedad, setReqSeriedad] = useState('No');
  const [valSeriedad, setValSeriedad] = useState('No aplica');
  const [reqFiel, setReqFiel] = useState('No');
  const [valFiel, setValFiel] = useState('No aplica');
  const [reqVigenciaFiel, setReqVigenciaFiel] = useState('No');
  const [valVigenciaFiel, setValVigenciaFiel] = useState('No aplica');
  const [contextoIA, setContextoIA] = useState('');
  const [archivosContexto, setArchivosContexto] = useState([]);
  const [alcanceGenerado, setAlcanceGenerado] = useState('El alcance detallado será generado por la IA integrando los aspectos técnicos de sus anexos...');
  const [cargandoIA, setCargandoIA] = useState(false);
  const [calLiberacion, setCalLiberacion] = useState('');
  const [calLimiteConsultas, setCalLimiteConsultas] = useState('');
  const [calRespuestas, setCalRespuestas] = useState('');
  const [calEnvioOfertas, setCalEnvioOfertas] = useState('');
  const [calMesAdjudicacion, setCalMesAdjudicacion] = useState('');
  const [calMesServicio, setCalMesServicio] = useState('');
  const [vigenciaAcuerdo, setVigenciaAcuerdo] = useState('3 meses');
  const [inicioSubgerencia, setInicioSubgerencia] = useState('Prevención');
  const [inicioMes, setInicioMes] = useState('junio');
  const [garantiaProducto, setGarantiaProducto] = useState('30 días');
  const [lugaresDespacho, setLugaresDespacho] = useState([{ id: 1, punto: 'HC Quinta Vergara', direccion: 'Av. Valparaíso 1070', comuna: 'Viña del Mar' }]);
  const [despachoCargo, setDespachoCargo] = useState('Jefa de Seguridad Electrónica');
  const [despachoNombre, setDespachoNombre] = useState('Cristian Reyes');
  const [despachoEmail, setDespachoEmail] = useState('creyesb@sodimac.cl');

  const handleAdminChange = (e) => {
    const admin = administradores.find(a => a.nombre === e.target.value);
    if(admin) setAdminSeleccionado(admin);
  };

  const manejarCargaArchivos = (e) => {
    const nuevosArchivos = Array.from(e.target.files);
    setArchivosContexto([...archivosContexto, ...nuevosArchivos]);
    e.target.value = null; 
  };
  const eliminarArchivo = (index) => setArchivosContexto(archivosContexto.filter((_, i) => i !== index));

  const agregarLugarDespacho = () => setLugaresDespacho([...lugaresDespacho, { id: Date.now(), punto: '', direccion: '', comuna: '' }]);
  const eliminarLugarDespacho = (id) => setLugaresDespacho(lugaresDespacho.filter(l => l.id !== id));
  const modificarLugar = (id, campo, valor) => setLugaresDespacho(lugaresDespacho.map(l => l.id === id ? { ...l, [campo]: valor } : l));

  const formatearMesAno = (valorMes) => {
    if(!valorMes) return '[Mes y Año]';
    const [year, month] = valorMes.split('-');
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${meses[parseInt(month)-1]} ${year}`;
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
    const elemento = document.getElementById('documento-rfp');
    const opciones = {
      margin: [15, 15, 15, 15], 
      filename: `Bases_RFP_${adminSeleccionado.nombre.replace(' ', '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true }, 
      jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
    };
    window.html2pdf().set(opciones).from(elemento).save();
  };

  const procesarConIA = async () => {
    setCargandoIA(true);

    try {
      const archivosValidos = archivosContexto.filter(f => f.type === 'application/pdf' || f.type.startsWith('image/') || f.type.startsWith('text/'));
      
      // BODEGA DE TRÁNSITO: Subida temporal a Supabase para evitar restricción de 4MB de Vercel
      const partesDocumentos = await Promise.all(archivosValidos.map(async (archivo) => {
        const nombreUnico = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const { error } = await supabase.storage.from('archivos_ia').upload(nombreUnico, archivo);
        if (error) throw new Error("Fallo al subir el archivo a la bodega temporal de tránsito.");
        
        return { storagePath: nombreUnico, mimeType: archivo.type };
      }));

      const instruccionesSistema = "Eres un ingeniero experto en adquisiciones para Sodimac. Tu tarea es redactar el 'ALCANCE DEL PROCESO'. REGLA ABSOLUTA DE CUMPLIMIENTO: Los primeros 3 párrafos introductorios y el punto 3.7 son TEXTOS LEGALES INMUTABLES. Debes copiarlos exactamente palabra por palabra de la estructura que te doy. Tu libertad creativa y técnica aplica ÚNICAMENTE a los puntos 3.2, 3.3, 3.4, 3.5 y 3.6 según el contexto del usuario.\n\nFORMATO OBLIGATORIO: Todos los listados generados en los puntos 3.2, 3.3, 3.4, 3.5 y 3.6 DEBEN usar siempre el formato alfabético (a), b), c), etc.) y poner en negrita hasta los dos puntos. Separa TODO párrafo o viñeta con un doble salto de línea.";
      const promptEstructurado = `
      Redacta el ALCANCE DEL PROCESO adaptando el contexto técnico. DEBES COPIAR EXACTAMENTE EL TEXTO FUERA DE LOS CORCHETES Y SOLO GENERAR EL CONTENIDO DENTRO DE LOS CORCHETES [ ].

      --- ESTRUCTURA DE CUMPLIMIENTO OBLIGATORIO ---

      ALCANCE DEL PROCESO
      
      El presente Proceso de Licitación tiene por objeto la contratación de los servicios de **[INSERTA AQUÍ EL SERVICIO DEL CONTEXTO]**, a ejecutarse en **[INSERTA AQUÍ LA UBICACIÓN DEL CONTEXTO]**, conforme a los requerimientos establecidos en las presentes Bases Administrativas, Bases Técnicas, Anexos, Especificaciones Técnicas y demás antecedentes que forman parte integrante del proceso.
      
      La prestación requerida comprenderá la totalidad de las actividades, recursos, suministros, medios humanos, equipos, herramientas, materiales, transportes, coordinaciones, permisos, documentación y demás elementos necesarios para la correcta, completa y oportuna ejecución del servicio, aun cuando éstos no se encuentren expresamente señalados en los documentos del proceso, pero resulten razonablemente necesarios para el cumplimiento de su objeto.
      
      La sola presentación de una oferta implicará que el oferente declara conocer y aceptar íntegramente las condiciones del proceso, habiendo considerado en su propuesta todos los recursos, riesgos, costos directos e indirectos, obligaciones y exigencias necesarias para la ejecución del servicio.

      **3.2 Alcance de los Servicios**
      [Adapta y redacta técnicamente las labores usando el formato a), b), c)... basándote en el contexto]

      **3.3 Alcances Complementarios**
      Sin perjuicio de las actividades específicas descritas en los antecedentes técnicos, el adjudicatario deberá considerar dentro del alcance del servicio todas aquellas labores que resulten necesarias para:

      [Genera aquí el listado de puntos técnicos complementarios basándote en el contexto. Usa OBLIGATORIAMENTE el formato a), b), c)...]

      La Contratante no reconocerá costos adicionales derivados de actividades que, aun cuando no hayan sido expresamente mencionadas en las Bases, sean inherentes, complementarias o necesarias para la correcta ejecución del servicio.

      **3.4 Condiciones de Ejecución**
      Los servicios deberán ejecutarse en estricto cumplimiento de las disposiciones contenidas en las presentes Bases, los antecedentes técnicos del proceso, la oferta adjudicada, la normativa legal vigente y las instrucciones impartidas por la Contratante.
      
      El adjudicatario será responsable de proporcionar la totalidad de los recursos requeridos para la ejecución del servicio, incluyendo, entre otros:

      [Genera aquí el listado de puntos con los recursos requeridos basándote en el contexto. Usa OBLIGATORIAMENTE el formato a), b), c)...]

      Toda coordinación operacional deberá realizarse con la contraparte designada por la Contratante, respetando las restricciones de acceso, horarios, condiciones de operación y medidas de seguridad definidas para cada instalación.

      **3.5 Obligaciones del Adjudicatario**
      Serán obligaciones esenciales del proveedor adjudicado, entre otras:

      [Genera aquí el listado técnico de obligaciones basándote en el contexto. Usa OBLIGATORIAMENTE el formato a), b), c)...]

      **3.6 Entregables**
      El adjudicatario deberá proporcionar todos los antecedentes de respaldo requeridos para acreditar la correcta ejecución de los servicios, incluyendo, cuando corresponda:

      [Genera aquí el listado de puntos con los entregables basándote en el contexto. Usa OBLIGATORIAMENTE el formato a), b), c)...]

      **3.7 Interpretación del Alcance**
      El alcance definido en las presentes Bases deberá interpretarse de manera amplia y suficiente para cumplir íntegramente el objeto de la contratación.

      En consecuencia, se entenderán incorporadas al servicio todas aquellas actividades, recursos, materiales, equipos, medios auxiliares y acciones que, aun cuando no se encuentren expresamente indicados en los documentos del proceso, resulten necesarios para la correcta, segura, completa y oportuna ejecución de los trabajos.

      La eventual omisión de alguna actividad en la oferta del adjudicatario no lo eximirá de su obligación de ejecutarla cuando ésta resulte indispensable para el cumplimiento del objeto contractual, sin que ello genere derecho a cobros, compensaciones o reajustes adicionales para la Contratante.
      
      --- CONTEXTO TÉCNICO A ANALIZAR ---
      ${contextoIA}
      `;

      const payload = {
        contents: [{ parts: [{ text: promptEstructurado }, ...partesDocumentos] }],
        systemInstruction: { parts: [{ text: instruccionesSistema }] }
      };

      const textoGenerado = await procesarConGeminiService(payload);
      setAlcanceGenerado(textoGenerado);

    } catch (error) {
      alert(`⚠️ Fallo de IA: ${error.message}`);
    } finally {
      setCargandoIA(false);
    }
  };

  const generarWordFinal = async () => {
    try {
      const response = await fetch(URL_PLANTILLA);
      const content = await response.arrayBuffer();
      const zip = new PizZip(content);
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

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
        vigencia_meses: vigenciaAcuerdo || '[Indicar vigencia]',
        inicio_subgerencia: inicioSubgerencia,
        inicio_mes: inicioMes,
        garantia_dias: garantiaProducto || '[Indicar garantía]',
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

  const renderTextoConNegritas = (texto) => {
    if (!texto) return null;
    return texto.split(/(\*\*.*?\*\*)/g).map((parte, index) => {
      if (parte.startsWith('**') && parte.endsWith('**')) return <strong key={index}>{parte.slice(2, -2)}</strong>;
      return <span key={index}>{parte}</span>;
    });
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: 'calc(100vh - 100px)', gap: '20px', padding: '15px', boxSizing: 'border-box', backgroundColor: '#f4f4f4', overflow: 'hidden' }}>
      <div style={{ width: '450px', flexShrink: 0, backgroundColor: 'white', padding: '25px', borderRadius: '8px', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#004A99', marginTop: 0, borderBottom: '2px solid #EE2D24', paddingBottom: '10px' }}>Configuración de Bases RFP</h2>
        
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

        <div style={{ marginBottom: '25px', backgroundColor: '#eef2f7', padding: '15px', borderRadius: '6px', border: '1px solid #cce5ff' }}>
          <h3 style={{ fontSize: '16px', color: '#004A99', marginTop: 0 }}>2. Contexto para IA (Alcance)</h3>
          <p style={{ fontSize: '11px', color: '#555', marginBottom: '10px' }}>Ingresa detalles o adjunta antecedentes técnicos de referencia (PDF) para que Gemini redacte.</p>
          <textarea rows="3" placeholder="Ej: Servicio de mantenimiento correctivo..." value={contextoIA} onChange={e => setContextoIA(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', resize: 'vertical' }}></textarea>
          
          <div style={{ marginTop: '10px', padding: '12px', backgroundColor: 'white', borderRadius: '4px', border: '1px dashed #004A99' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#333', display: 'flex', alignItems: 'center', cursor: 'pointer', margin: 0 }}>
              <span style={{ backgroundColor: '#17a2b8', color: 'white', padding: '6px 10px', borderRadius: '4px', marginRight: '10px' }}>📎 Adjuntar Archivo</span>
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
            {cargandoIA ? '⏳ Conectando y redactando con Gemini...' : '✨ Generar Alcance con Gemini IA'}
          </button>
        </div>

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

        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ fontSize: '16px', color: '#333' }}>4. Cláusulas Contractuales</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div><label style={{ fontSize: '12px' }}>Vigencia Acuerdo</label><input type="text" placeholder="Ej: 3 meses o 15 días" value={vigenciaAcuerdo} onChange={e => setVigenciaAcuerdo(e.target.value)} style={{ width: '100%', padding: '6px' }} /></div>
            <div><label style={{ fontSize: '12px' }}>Subgerencia a Coordinar</label><input type="text" value={inicioSubgerencia} onChange={e => setInicioSubgerencia(e.target.value)} style={{ width: '100%', padding: '6px' }} /></div>
            <div><label style={{ fontSize: '12px' }}>Mes inicio servicio</label><input type="text" value={inicioMes} onChange={e => setInicioMes(e.target.value)} style={{ width: '100%', padding: '6px' }} /></div>
            <div><label style={{ fontSize: '12px' }}>Garantía Producto</label><input type="text" placeholder="Ej: 30 días" value={garantiaProducto} onChange={e => setGarantiaProducto(e.target.value)} style={{ width: '100%', padding: '6px' }} /></div>
          </div>
        </div>

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

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px', minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', backgroundColor: 'white', padding: '15px 20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <button onClick={generarWordFinal} disabled={cargandoIA} style={{ padding: '8px 15px', backgroundColor: cargandoIA ? '#ccc' : '#004A99', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: cargandoIA ? 'not-allowed' : 'pointer' }}>📄 Descargar en Word Oficial</button>
          <button onClick={exportarPDF} disabled={cargandoIA} style={{ padding: '8px 15px', backgroundColor: cargandoIA ? '#ccc' : '#EE2D24', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: cargandoIA ? 'not-allowed' : 'pointer' }}>🖨️ Descargar Vista como PDF</button>
        </div>

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

            <h3 style={{ fontSize: '12pt', borderBottom: '1px solid #ccc', paddingBottom: '5px', marginTop: '20px' }}>ALCANCE DEL PROCESO</h3>
            <div style={{ backgroundColor: '#fffbe6', padding: '15px', border: '1px dashed #ffd700', color: '#333', fontStyle: 'normal', marginBottom: '20px' }}>
              {renderTextoConNegritas(alcanceGenerado)}
            </div>

            <h3 style={{ fontSize: '12pt', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>CONSULTAS Y ACLARACIONES</h3>
            <p style={{ textAlign: 'justify' }}>Conforme a lo establecido en estas bases, el Proponente deberá contemplar las siguientes condiciones generales: Todas las consultas, tanto las de carácter técnico como las de índole administrativas, que los Proponentes deseen formular en relación con la materia de este Proceso de Solicitud de Propuestas, deberán ser realizadas a través de la Plataforma.</p>

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
            <p style={{ textAlign: 'justify' }}>El precio adjudicado en el marco de la presente solicitud de propuestas tendrá una vigencia inicial de <strong>{vigenciaAcuerdo || '[Indicar vigencia]'}</strong>, contados desde la fecha de suscripción del contrato o emisión de la respectiva orden de compra, según corresponda. Dicho período podrá renovarse automáticamente por períodos sucesivos.</p>

            <h3 style={{ fontSize: '12pt', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>OBLIGACIONES LABORALES Y BOLETA DE GARANTÍA</h3>
            <p style={{ textAlign: 'justify' }}>El Adjudicatario será exclusivamente responsable del cumplimiento de todas las obligaciones laborales previsionales, asistenciales, tributarias y demás relacionadas a las personas que emplee para el cumplimiento del servicio. Asimismo, el Adjudicatario deberá entregar una Boleta de Garantía Bancaria emitida por una institución financiera legalmente constituida pagadera a la vista e irrevocable.</p>

            <h3 style={{ fontSize: '12pt', borderBottom: '1px solid #ccc', paddingBottom: '5px', marginTop: '20px' }}>INICIO DEL SERVICIO</h3>
            <p style={{ textAlign: 'justify' }}>Posterior a la adjudicación respectiva de los elementos requeridos por La Empresa, el adjudicatario deberá coordinar con el encargado respectivo de la Subgerencia de <strong>{inicioSubgerencia || '[Subgerencia]'}</strong> para dar inicio de los servicios requeridos.</p>
            <p style={{ textAlign: 'justify' }}>Se espera que los servicios puedan ser ejecutados en dependencias de Sodimac durante el mes de <strong>{inicioMes || '[Mes]'}</strong> o a coordinar con mandante.</p>

            <h3 style={{ fontSize: '12pt', borderBottom: '1px solid #ccc', paddingBottom: '5px', marginTop: '20px' }}>GARANTÍA DEL PRODUCTO</h3>
            <p style={{ textAlign: 'justify' }}>El adjudicatario deberá procurar, con el mayor esfuerzo posible, realizar todas las acciones necesarias para corregir las falencias detectadas en el producto terminado instalado. Además, se requiere que se garantice la "calidad" de el o los productos adjudicados a lo menos <strong>{garantiaProducto || '[Indicar garantía]'}</strong> desde la recepción del producto en tienda.</p>

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