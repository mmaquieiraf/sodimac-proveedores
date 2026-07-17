import React, { useState } from 'react';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import { procesarConGeminiService } from '../services/ia/geminiService';

const URL_PLANTILLA_RFQ = "[https://zpxptembhqlmpkbctvml.supabase.co/storage/v1/object/public/plantillas/plantilla-rfq.docx](https://zpxptembhqlmpkbctvml.supabase.co/storage/v1/object/public/plantillas/plantilla-rfq.docx)";
const administradores = [
  { nombre: 'Matías Maquieira', email: 'mmaquieiraf@sodimac.cl' },
  { nombre: 'Ignacio Pizarro', email: 'ipizarro@sodimac.cl' },
  { nombre: 'Macarena Valenzuela', email: 'mvalenzuelam@sodimac.cl' },
  { nombre: 'Jorge Alarcon', email: 'jaalarconal@Sodimac.cl' }
];

export default function GeneradorRFQ() {
  const [adminSeleccionado, setAdminSeleccionado] = useState(administradores[0]);
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
  const [productos, setProductos] = useState([{ id: 1, descripcion: '', cantidad: '' }]);
  const [garantiaProducto, setGarantiaProducto] = useState('12 meses');
  const [lugaresDespacho, setLugaresDespacho] = useState([{ id: 1, punto: 'HC Quinta Vergara', direccion: 'Av. Valparaíso 1070', comuna: 'Viña del Mar' }]);

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

  const agregarProducto = () => setProductos([...productos, { id: Date.now(), descripcion: '', cantidad: '' }]);
  const eliminarProducto = (id) => setProductos(productos.filter(p => p.id !== id));
  const modificarProducto = (id, campo, valor) => setProductos(productos.map(p => p.id === id ? { ...p, [campo]: valor } : p));

  const agregarLugarDespacho = () => setLugaresDespacho([...lugaresDespacho, { id: Date.now(), punto: '', direccion: '', comuna: '' }]);
  const eliminarLugarDespacho = (id) => setLugaresDespacho(lugaresDespacho.filter(l => l.id !== id));
  const modificarLugar = (id, campo, valor) => setLugaresDespacho(lugaresDespacho.map(l => l.id === id ? { ...l, [campo]: valor } : l));

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

  const exportarPDF = async () => {
    if (!window.html2pdf) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '[https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js](https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js)';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    const elemento = document.getElementById('documento-rfq');
    const opciones = {
      margin: [15, 15, 15, 15], 
      filename: `Bases_RFQ_${adminSeleccionado.nombre.replace(' ', '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true }, 
      jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
    };
    window.html2pdf().set(opciones).from(elemento).save();
  };

  const procesarConIA = async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) return alert("❌ Error: Vercel no está leyendo la API Key.");
    
    setCargandoIA(true);
    try {
      const archivosValidos = archivosContexto.filter(f => f.type === 'application/pdf' || f.type.startsWith('image/') || f.type.startsWith('text/'));
      const partesDocumentos = await Promise.all(archivosValidos.map(async (archivo) => {
        const base64Data = await transformarArchivoBase64(archivo);
        return { inlineData: { mimeType: archivo.type, data: base64Data } };
      }));

      const instruccionesSistema = "Eres un ingeniero experto en adquisiciones para Sodimac. Tu tarea es redactar el 'ALCANCE DEL PROCESO' para la compra de bienes o productos (RFQ). REGLA ABSOLUTA DE CUMPLIMIENTO: Debes utilizar y COPIAR EXACTAMENTE la estructura de los 4 párrafos que te doy. Solo debes reemplazar y adaptar la información que se encuentra dentro de los corchetes [ ] utilizando el contexto técnico del usuario. No agregues viñetas ni títulos nuevos. Separa cada párrafo con un doble salto de línea. Usa **asteriscos dobles** para resaltar información clave si lo consideras necesario.";
      const promptEstructurado = `
      Redacta el ALCANCE DEL PROCESO adaptando el contexto técnico. DEBES COPIAR EXACTAMENTE EL TEXTO FUERA DE LOS CORCHETES Y SOLO GENERAR EL CONTENIDO DENTRO DE LOS CORCHETES [ ].

      --- ESTRUCTURA DE CUMPLIMIENTO OBLIGATORIO ---

      El presente proceso de licitación tiene por objeto la recepción, evaluación y comparación de propuestas técnicas y económicas para el suministro de **[INSERTA AQUÍ LOS BIENES A ADQUIRIR. Ej: dos (2) aspiradoras industriales destinadas al dimensionado de polvo de madera]**, equipos que deberán contar con **[INSERTA AQUÍ CAPACIDADES O ESPECIFICACIONES. Ej: alta capacidad de almacenamiento y potencia de succión, con una capacidad aproximada de 80 litros]**. Se considerará especialmente **[INSERTA AQUÍ CARACTERÍSTICAS ESPECIALES. Ej: aquella alternativa que incorpore filtro desechable...]**. Para efectos meramente referenciales, podrá considerarse como modelo de comparación **[INSERTA AQUÍ MODELO DE REFERENCIA SI EL CONTEXTO LO INDICA, SINO OMITE ESTA FRASE]**.
      
      El suministro deberá contemplar el despacho a las siguientes dependencias: **[INSERTA AQUÍ LAS TIENDAS O LUGARES DE DESPACHO MENCIONADOS EN EL CONTEXTO]**. Asimismo, el proveedor deberá considerar todos los costos asociados al despacho, embalaje, etiquetado y demás prestaciones necesarias para la correcta entrega de los bienes, incluyendo, cuando corresponda, la instalación y/o puesta en marcha en el lugar de destino que determine la Contratante. La Contratante evaluará y seleccionará la oferta que estime más conveniente conforme a los requerimientos técnicos, operacionales y económicos establecidos en las presentes bases.
      
      Para efectos de valorización, el Oferente deberá completar el Anexo III – Tarifario, indicando los precios unitarios de los productos. En caso de que los servicios de despacho y/o instalación no se encuentren incluidos dentro del precio ofertado de los productos, deberán informarse de manera separada en el mismo Anexo III, conforme a las casillas habilitadas para ello.
      
      En caso de que mandante requiera comprar más unidades con despacho o sin este en caso de ser un insumo o material, proveedor deberá respetar los precios por al menos 30 días corridos.

      --- CONTEXTO TÉCNICO A ANALIZAR ---
      ${contextoIA}
      `;

      const payload = {
        contents: [{ parts: [{ text: promptEstructurado }, ...partesDocumentos] }],
        systemInstruction: { parts: [{ text: instruccionesSistema }] }
      };

      const textoGenerado = await procesarConGeminiService(payload, apiKey);
      setAlcanceGenerado(textoGenerado);

    } catch (error) {
      alert(`⚠️ Fallo de IA: ${error.message}`);
    } finally {
      setCargandoIA(false);
    }
  };

  const generarWordFinal = async () => {
    try {
      const response = await fetch(URL_PLANTILLA_RFQ);
      const content = await response.arrayBuffer();
      const zip = new PizZip(content);

      let docXml = zip.file("word/document.xml").asText();
      if (docXml.includes('{@alcance_ia}')) {
        docXml = docXml.replace('{@alcance_ia}', '{alcance_ia}');
        zip.file("word/document.xml", docXml);
      }

      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
      const alcanceLimpioParaWord = alcanceGenerado.replace(/\*\*/g, '');

      doc.setData({
        administrador_nombre: adminSeleccionado.nombre,
        administrador_email: adminSeleccionado.email,
        alcance_ia: alcanceLimpioParaWord,
        cal_liberacion: calLiberacion ? new Date(calLiberacion).toLocaleDateString('es-CL') : '[Sin Fecha]',
        cal_consultas: calLimiteConsultas ? new Date(calLimiteConsultas).toLocaleDateString('es-CL') : '[Sin Fecha]',
        cal_respuestas: calRespuestas ? new Date(calRespuestas).toLocaleDateString('es-CL') : '[Sin Fecha]',
        cal_ofertas: calEnvioOfertas ? new Date(calEnvioOfertas).toLocaleDateString('es-CL') : '[Sin Fecha]',
        cal_adjudicacion: formatearMesAno(calMesAdjudicacion),
        cal_servicio: formatearMesAno(calMesServicio),
        productos: productos, 
        garantia_producto: garantiaProducto || '[Indicar garantía]',
        lugaresDespacho: lugaresDespacho
      });

      doc.render();
      const out = doc.getZip().generate({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      saveAs(out, `Bases_RFQ_${adminSeleccionado.nombre.replace(' ', '_')}.docx`);
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
        <h2 style={{ color: '#EE2D24', marginTop: 0, borderBottom: '2px solid #004A99', paddingBottom: '10px' }}>Configuración Bases RFQ (Bienes)</h2>
        
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ fontSize: '16px', color: '#333' }}>1. Ficha Resumen</h3>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Administrador del Proceso</label>
          <select value={adminSeleccionado.nombre} onChange={handleAdminChange} style={{ width: '100%', padding: '8px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '4px' }}>
            {administradores.map(a => <option key={a.nombre} value={a.nombre}>{a.nombre}</option>)}
          </select>
          <input disabled value={adminSeleccionado.email} style={{ width: '100%', padding: '8px', marginBottom: '15px', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px' }} />
        </div>

        <div style={{ marginBottom: '25px', backgroundColor: '#fff3f3', padding: '15px', borderRadius: '6px', border: '1px solid #ffcccc' }}>
          <h3 style={{ fontSize: '16px', color: '#EE2D24', marginTop: 0 }}>2. Contexto para IA (Alcance RFQ)</h3>
          
          <p style={{ fontSize: '11px', color: '#555', marginBottom: '10px' }}>Ingresa detalles de los bienes a adquirir (Ej: Cantidad, modelo, características).</p>
          <textarea rows="3" placeholder="Ej: Suministro de 2 aspiradoras industriales de 80 lts..." value={contextoIA} onChange={e => setContextoIA(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', resize: 'vertical' }}></textarea>
          
          <div style={{ marginTop: '10px', padding: '12px', backgroundColor: 'white', borderRadius: '4px', border: '1px dashed #EE2D24' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#333', display: 'flex', alignItems: 'center', cursor: 'pointer', margin: 0 }}>
              <span style={{ backgroundColor: '#EE2D24', color: 'white', padding: '6px 10px', borderRadius: '4px', marginRight: '10px' }}>📎 Adjuntar Ficha Técnica</span>
              <input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv" onChange={manejarCargaArchivos} style={{ display: 'none' }} />
            </label>

            {archivosContexto.length > 0 && (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {archivosContexto.map((archivo, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f9fa', padding: '6px 10px', borderRadius: '4px', border: '1px solid #eee', fontSize: '12px' }}>
                    <span>📄 <strong>{archivo.name}</strong></span>
                    <button onClick={() => eliminarArchivo(index)} style={{ background: 'none', border: 'none', color: '#EE2D24', cursor: 'pointer' }}>✖</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={procesarConIA} disabled={cargandoIA} style={{ width: '100%', padding: '12px', marginTop: '15px', backgroundColor: cargandoIA ? '#ccc' : '#EE2D24', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: cargandoIA ? 'not-allowed' : 'pointer' }}>
            {cargandoIA ? '⏳ Redactando...' : '✨ Redactar Alcance RFQ'}
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
            <div><label style={{ fontSize: '12px' }}>Mes/Año Entrega Suministro</label><input type="month" value={calMesServicio} onChange={e => setCalMesServicio(e.target.value)} style={{ width: '100%', padding: '6px' }} /></div>
          </div>
        </div>

        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ fontSize: '16px', color: '#333' }}>4. Especificación de Productos</h3>
          {productos.map((prod) => (
            <div key={prod.id} style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
              <input placeholder="Descripción (Ej: Aspiradora Industrial)" value={prod.descripcion} onChange={e => modificarProducto(prod.id, 'descripcion', e.target.value)} style={{ flex: 2, padding: '6px', fontSize: '11px' }} />
              <input placeholder="Cant." value={prod.cantidad} onChange={e => modificarProducto(prod.id, 'cantidad', e.target.value)} style={{ flex: 0.5, padding: '6px', fontSize: '11px' }} />
              <button onClick={() => eliminarProducto(prod.id)} style={{ padding: '6px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✖</button>
            </div>
          ))}
          <button onClick={agregarProducto} style={{ padding: '6px 15px', backgroundColor: '#004A99', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>+ Agregar Producto</button>
          
          <div style={{ marginTop: '15px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Garantía Requerida</label>
            <input type="text" placeholder="Ej: 12 meses o 30 días" value={garantiaProducto} onChange={e => setGarantiaProducto(e.target.value)} style={{ width: '100%', padding: '6px', marginTop: '5px' }} />
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
          <button onClick={agregarLugarDespacho} style={{ padding: '6px 15px', backgroundColor: '#004A99', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>+ Agregar Tienda</button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px', minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', backgroundColor: 'white', padding: '15px 20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <button onClick={generarWordFinal} disabled={cargandoIA} style={{ padding: '8px 15px', backgroundColor: '#004A99', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: cargandoIA ? 'not-allowed' : 'pointer' }}>📄 Descargar RFQ en Word</button>
          <button onClick={exportarPDF} disabled={cargandoIA} style={{ padding: '8px 15px', backgroundColor: '#EE2D24', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: cargandoIA ? 'not-allowed' : 'pointer' }}>🖨️ Descargar RFQ en PDF</button>
        </div>

        <div style={{ flex: 1, backgroundColor: '#e5e5e5', padding: '20px', borderRadius: '8px', overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
          <div id="documento-rfq" style={{ backgroundColor: 'white', width: '21cm', minHeight: '29.7cm', padding: '2.5cm', boxShadow: '0 4px 10px rgba(0,0,0,0.15)', fontFamily: 'Arial, sans-serif', fontSize: '10pt', color: '#333', lineHeight: '1.5', textAlign: 'left', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
            
            <h1 style={{ textAlign: 'center', fontSize: '16pt', color: '#004A99', marginBottom: '20px' }}>Bases Proceso de Solicitud de Propuestas<br/>Condicionado Particular</h1>
            <p style={{ textAlign: 'justify', fontStyle: 'italic' }}>Este documento es propiedad del Titular del Proceso. El contenido de este documento está sujeto a reserva...</p>

            <h3 style={{ fontSize: '12pt', borderBottom: '1px solid #ccc', paddingBottom: '5px', marginTop: '30px' }}>Ficha Resumen</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', fontSize: '9pt' }}>
              <tbody>
                <tr><td style={{ border: '1px solid #ccc', padding: '5px', fontWeight: 'bold', width: '40%' }}>Administrador del Proceso</td><td style={{ border: '1px solid #ccc', padding: '5px' }}>{adminSeleccionado.nombre}</td><td style={{ border: '1px solid #ccc', padding: '5px' }}>{adminSeleccionado.email}</td></tr>
                <tr><td style={{ border: '1px solid #ccc', padding: '5px', fontWeight: 'bold' }}>Monto Boleta Garantía Seriedad</td><td style={{ border: '1px solid #ccc', padding: '5px' }} colSpan="2">No aplica</td></tr>
                <tr><td style={{ border: '1px solid #ccc', padding: '5px', fontWeight: 'bold' }}>Monto Boleta Fiel Cumplimiento</td><td style={{ border: '1px solid #ccc', padding: '5px' }} colSpan="2">No aplica</td></tr>
                <tr><td style={{ border: '1px solid #ccc', padding: '5px', fontWeight: 'bold' }}>Tipo de documento a suscribir tras adjudicación</td><td style={{ border: '1px solid #ccc', padding: '5px' }} colSpan="2">Acuerdo Comercial Según Aceptación de Bases Generales, Particulares y firma de Carta de Adjudicación</td></tr>
              </tbody>
            </table>

            <h3 style={{ fontSize: '12pt', borderBottom: '1px solid #ccc', paddingBottom: '5px', marginTop: '20px' }}>ALCANCE DEL PROCESO</h3>
            <div style={{ backgroundColor: '#fffbe6', padding: '15px', border: '1px dashed #ffd700', color: '#333', fontStyle: 'normal', marginBottom: '20px' }}>
              {renderTextoConNegritas(alcanceGenerado)}
            </div>

            <h3 style={{ fontSize: '12pt', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>CALENDARIO DEL PROCESO</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', fontSize: '9pt' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}><th style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'left' }}>ACTIVIDAD</th><th style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'left' }}>FECHA</th></tr>
              </thead>
              <tbody>
                <tr><td style={{ border: '1px solid #ccc', padding: '5px' }}>Liberación del Proceso</td><td style={{ border: '1px solid #ccc', padding: '5px' }}>{calLiberacion ? new Date(calLiberacion).toLocaleDateString('es-CL') : '[Sin Fecha]'}</td></tr>
                <tr><td style={{ border: '1px solid #ccc', padding: '5px' }}>Límite de Consultas</td><td style={{ border: '1px solid #ccc', padding: '5px' }}>{calLimiteConsultas ? new Date(calLimiteConsultas).toLocaleDateString('es-CL') : '[Sin Fecha]'}</td></tr>
                <tr><td style={{ border: '1px solid #ccc', padding: '5px' }}>Entrega de Respuestas</td><td style={{ border: '1px solid #ccc', padding: '5px' }}>{calRespuestas ? new Date(calRespuestas).toLocaleDateString('es-CL') : '[Sin Fecha]'}</td></tr>
                <tr><td style={{ border: '1px solid #ccc', padding: '5px' }}>Envío de ofertas</td><td style={{ border: '1px solid #ccc', padding: '5px' }}>{calEnvioOfertas ? new Date(calEnvioOfertas).toLocaleDateString('es-CL') : '[Sin Fecha]'}</td></tr>
                <tr><td style={{ border: '1px solid #ccc', padding: '5px' }}>Fecha estimada de adjudicación</td><td style={{ border: '1px solid #ccc', padding: '5px', textTransform: 'capitalize' }}>{formatearMesAno(calMesAdjudicacion)}</td></tr>
                <tr><td style={{ border: '1px solid #ccc', padding: '5px' }}>Fecha de entrega de Suministro</td><td style={{ border: '1px solid #ccc', padding: '5px', textTransform: 'capitalize' }}>{formatearMesAno(calMesServicio)}</td></tr>
              </tbody>
            </table>

            <h3 style={{ fontSize: '12pt', borderBottom: '1px solid #ccc', paddingBottom: '5px', marginTop: '20px' }}>CANTIDAD Y ESPECIFICACIÓN DEL PRODUCTO</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '9pt' }}>
              <thead>
                <tr style={{ backgroundColor: '#004A99', color: 'white' }}>
                  <th style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'left' }}>DESCRIPCIÓN</th>
                  <th style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'center' }}>CANTIDAD</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p, i) => (
                  <tr key={i}>
                    <td style={{ border: '1px solid #ccc', padding: '5px' }}>{p.descripcion}</td>
                    <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'center' }}>{p.cantidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 style={{ fontSize: '12pt', borderBottom: '1px solid #ccc', paddingBottom: '5px', marginTop: '20px' }}>GARANTÍA DEL PRODUCTO</h3>
            <p style={{ textAlign: 'justify' }}>El adjudicatario deberá garantizar que los equipos suministrados son nuevos, originales y cumplen con las especificaciones técnicas licitadas. Ante fallas o defectos atribuibles a fabricación/origen dentro del periodo de garantía, el proveedor deberá reparar o reemplazar el equipo sin costo para la Contratante.</p>
            <p style={{ textAlign: 'justify' }}>Se requiere que la oferta contemple una garantía mínima de <strong>{garantiaProducto || '[Indicar garantía]'}</strong> desde la recepción conforme.</p>

            <h3 style={{ fontSize: '12pt', borderBottom: '1px solid #ccc', paddingBottom: '5px', marginTop: '20px' }}>DESPACHO</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '9pt' }}>
              <thead>
                <tr style={{ backgroundColor: '#004A99', color: 'white' }}>
                  <th style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'left' }}>TIENDA</th>
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

          </div>
        </div>
      </div>
    </div>
  );
}