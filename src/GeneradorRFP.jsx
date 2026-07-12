import React, { useState } from 'react';

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

  // --- ESTADOS PARA ALCANCE E IA ---
  const [contextoIA, setContextoIA] = useState('');
  const [archivosContexto, setArchivosContexto] = useState([]);
  const [alcanceGenerado, setAlcanceGenerado] = useState('El alcance detallado será generado por la IA en base a los antecedentes proporcionados...');

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

  // Funciones manejadoras
  const handleAdminChange = (e) => {
    const admin = administradores.find(a => a.nombre === e.target.value);
    if(admin) setAdminSeleccionado(admin);
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

  const manejarCargaArchivos = (e) => {
    const nuevosArchivos = Array.from(e.target.files);
    setArchivosContexto([...archivosContexto, ...nuevosArchivos]);
    e.target.value = null; // Limpia el input para poder subir el mismo archivo si se borra
  };

  const eliminarArchivo = (index) => {
    setArchivosContexto(archivosContexto.filter((_, i) => i !== index));
  };

  const [cargandoIA, setCargandoIA] = useState(false);

  // --- FUNCIONES DE EXPORTACIÓN E IA ---
  const exportarWord = () => {
    const contenido = document.getElementById('documento-rfp').innerHTML;
    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Bases RFP</title></head>
      <body>${contenido}</body>
      </html>
    `;
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bases_RFP_${adminSeleccionado.nombre.replace(' ', '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportarPDF = () => {
    // Utiliza el motor nativo del navegador para guardar en PDF la vista actual
    window.print(); 
  };

  const procesarConIA = () => {
    setCargandoIA(true);
    // Aquí irá la llamada real a Gemini
    setTimeout(() => {
      alert("¡El botón ya está activo! En el próximo paso conectaremos la API de Gemini aquí.");
      setCargandoIA(false);
    }, 2000);
  };

  return (
    <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 100px)', padding: '20px', boxSizing: 'border-box', backgroundColor: '#f4f4f4' }}>
      
      {/* PANEL IZQUIERDO: FORMULARIO Y CONTROLES */}
      <div style={{ flex: '1', backgroundColor: 'white', padding: '25px', borderRadius: '8px', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
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
              {reqVigenciaFiel === 'Si' && <input placeholder="Ingrese vigencia (Ej: 60 días posteriores...)" value={valVigenciaFiel} onChange={e => setValVigenciaFiel(e.target.value)} style={{ width: '100%', padding: '6px', marginTop: '5px' }} />}
            </div>
          </div>
        </div>

        {/* 2. ALCANCE E IA */}
        <div style={{ marginBottom: '25px', backgroundColor: '#eef2f7', padding: '15px', borderRadius: '6px', border: '1px solid #cce5ff' }}>
          <h3 style={{ fontSize: '16px', color: '#004A99', marginTop: 0 }}>2. Contexto para IA (Alcance del Proyecto)</h3>
          <p style={{ fontSize: '11px', color: '#555', marginBottom: '10px' }}>Ingresa los detalles del servicio o adjunta bases técnicas de referencia (PDF, Word, Excel, etc).</p>
          
          <textarea rows="3" placeholder="Ej: Servicio de instalación de cámaras CCTV en 5 tiendas, basarse en el archivo adjunto..." value={contextoIA} onChange={e => setContextoIA(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', resize: 'vertical' }}></textarea>
          
          {/* ZONA DE ARCHIVOS ADJUNTOS EN MEMORIA */}
          <div style={{ marginTop: '10px', padding: '12px', backgroundColor: 'white', borderRadius: '4px', border: '1px dashed #004A99' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#333', display: 'flex', alignItems: 'center', cursor: 'pointer', margin: 0 }}>
              <span style={{ backgroundColor: '#17a2b8', color: 'white', padding: '6px 15px', borderRadius: '4px', marginRight: '10px', transition: '0.2s' }}>📎 Adjuntar Archivo Local</span>
              <span style={{ color: '#666', fontWeight: 'normal' }}>(Los archivos no se guardan, solo se procesan en esta sesión)</span>
              <input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv" onChange={manejarCargaArchivos} style={{ display: 'none' }} />
            </label>

            {archivosContexto.length > 0 && (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {archivosContexto.map((archivo, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f9fa', padding: '6px 10px', borderRadius: '4px', border: '1px solid #eee', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <span style={{ fontSize: '14px' }}>📄</span>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 'bold', color: '#333' }}>{archivo.name}</span>
                      <span style={{ color: '#999', fontSize: '10px' }}>({(archivo.size / 1024).toFixed(0)} KB)</span>
                    </div>
                    <button onClick={() => eliminarArchivo(index)} style={{ background: 'none', border: 'none', color: '#EE2D24', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', padding: '0 5px' }}>✖</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={procesarConIA} disabled={cargandoIA} style={{ width: '100%', padding: '12px', marginTop: '15px', backgroundColor: cargandoIA ? '#ccc' : '#6f42c1', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: cargandoIA ? 'not-allowed' : 'pointer', transition: '0.3s' }}>
            {cargandoIA ? '⏳ Analizando documentos y redactando...' : '✨ Generar Alcance con Gemini IA'}
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
            <div><label style={{ fontSize: '12px' }}>Mes inicio servicio (Ej: Junio)</label><input type="text" value={inicioMes} onChange={e => setInicioMes(e.target.value)} style={{ width: '100%', padding: '6px' }} /></div>
            <div><label style={{ fontSize: '12px' }}>Días Garantía Producto</label><input type="number" value={garantiaDias} onChange={e => setGarantiaDias(e.target.value)} style={{ width: '100%', padding: '6px' }} /></div>
          </div>
        </div>

        {/* 5. DESPACHO */}
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ fontSize: '16px', color: '#333' }}>5. Lugares de Despacho</h3>
          {lugaresDespacho.map((lugar, index) => (
            <div key={lugar.id} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
              <input placeholder="Punto (Tienda)" value={lugar.punto} onChange={e => modificarLugar(lugar.id, 'punto', e.target.value)} style={{ flex: 1, padding: '6px', fontSize: '12px' }} />
              <input placeholder="Dirección" value={lugar.direccion} onChange={e => modificarLugar(lugar.id, 'direccion', e.target.value)} style={{ flex: 1.5, padding: '6px', fontSize: '12px' }} />
              <input placeholder="Comuna" value={lugar.comuna} onChange={e => modificarLugar(lugar.id, 'comuna', e.target.value)} style={{ flex: 1, padding: '6px', fontSize: '12px' }} />
              <button onClick={() => eliminarLugarDespacho(lugar.id)} style={{ padding: '6px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✖</button>
            </div>
          ))}
          <button onClick={agregarLugarDespacho} style={{ padding: '6px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>+ Agregar otra dirección</button>

          <h4 style={{ fontSize: '14px', color: '#555', marginTop: '20px', marginBottom: '10px' }}>Contacto para Entrega</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: '12px' }}>Cargo Contacto</label><input type="text" value={despachoCargo} onChange={e => setDespachoCargo(e.target.value)} style={{ width: '100%', padding: '6px' }} /></div>
            <div><label style={{ fontSize: '12px' }}>Nombre Contacto</label><input type="text" value={despachoNombre} onChange={e => setDespachoNombre(e.target.value)} style={{ width: '100%', padding: '6px' }} /></div>
            <div><label style={{ fontSize: '12px' }}>Email Contacto</label><input type="email" value={despachoEmail} onChange={e => setDespachoEmail(e.target.value)} style={{ width: '100%', padding: '6px' }} /></div>
          </div>
        </div>

      </div>

      {/* PANEL DERECHO: VISUALIZADOR TIPO WORD */}
      <div style={{ flex: '1.2', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* BARRA DE HERRAMIENTAS: DESCARGAS */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', backgroundColor: 'white', padding: '15px 20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <button onClick={exportarWord} style={{ padding: '8px 15px', backgroundColor: '#004A99', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>📄 Descargar en Word</button>
          <button onClick={exportarPDF} style={{ padding: '8px 15px', backgroundColor: '#EE2D24', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>🖨️ Guardar como PDF</button>
        </div>

        {/* HOJA DEL DOCUMENTO */}
        <div style={{ backgroundColor: '#e5e5e5', padding: '20px', borderRadius: '8px', overflowY: 'auto', display: 'flex', justifyContent: 'center', flex: 1 }}>
          <div id="documento-rfp" style={{ backgroundColor: 'white', width: '21cm', minHeight: '29.7cm', padding: '2.5cm', boxShadow: '0 4px 10px rgba(0,0,0,0.15)', fontFamily: 'Arial, sans-serif', fontSize: '10pt', color: '#333', lineHeight: '1.5' }}>
          
          <h1 style={{ textAlign: 'center', fontSize: '16pt', color: '#004A99', marginBottom: '20px' }}>Bases Proceso de Solicitud de Propuestas<br/>Condicionado Particular</h1>
          <p style={{ textAlign: 'justify', fontSize: '9pt', color: '#666', fontStyle: 'italic' }}>Este documento es propiedad del Titular del Proceso. El contenido de este documento está sujeto a reserva...</p>

          <h3 style={{ fontSize: '12pt', borderBottom: '1px solid #ccc', paddingBottom: '5px', marginTop: '30px' }}>Unidades de Negocio</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '9pt' }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                <th style={{ border: '1px solid #ccc', padding: '5px' }}>País</th>
                <th style={{ border: '1px solid #ccc', padding: '5px' }}>Nombre o Razón Social</th>
                <th style={{ border: '1px solid #ccc', padding: '5px' }}>Rut</th>
              </tr>
            </thead>
            <tbody><tr><td style={{ border: '1px solid #ccc', padding: '5px' }}>Chile</td><td style={{ border: '1px solid #ccc', padding: '5px' }}>Sodimac S.A.</td><td style={{ border: '1px solid #ccc', padding: '5px' }}>96.792.430-K</td></tr></tbody>
          </table>

          <h3 style={{ fontSize: '12pt', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>Ficha Resumen</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', fontSize: '9pt' }}>
            <tbody>
              <tr><td style={{ border: '1px solid #ccc', padding: '5px', fontWeight: 'bold', width: '40%' }}>Administrador del Proceso</td><td style={{ border: '1px solid #ccc', padding: '5px' }}>{adminSeleccionado.nombre}</td><td style={{ border: '1px solid #ccc', padding: '5px' }}>{adminSeleccionado.email}</td></tr>
              <tr><td style={{ border: '1px solid #ccc', padding: '5px', fontWeight: 'bold' }}>Monto Boleta Garantía Seriedad</td><td style={{ border: '1px solid #ccc', padding: '5px' }} colSpan="2">{valSeriedad || '[Por definir]'}</td></tr>
              <tr><td style={{ border: '1px solid #ccc', padding: '5px', fontWeight: 'bold' }}>Monto Boleta Fiel Cumplimiento</td><td style={{ border: '1px solid #ccc', padding: '5px' }} colSpan="2">{valFiel || '[Por definir]'}</td></tr>
              <tr><td style={{ border: '1px solid #ccc', padding: '5px', fontWeight: 'bold' }}>Vigencia Boleta Fiel Cumplimiento</td><td style={{ border: '1px solid #ccc', padding: '5px' }} colSpan="2">{valVigenciaFiel || '[Por definir]'}</td></tr>
              <tr><td style={{ border: '1px solid #ccc', padding: '5px', fontWeight: 'bold' }}>Idioma del Contrato</td><td style={{ border: '1px solid #ccc', padding: '5px' }} colSpan="2">Idioma Español</td></tr>
              <tr><td style={{ border: '1px solid #ccc', padding: '5px', fontWeight: 'bold' }}>Moneda del Contrato</td><td style={{ border: '1px solid #ccc', padding: '5px' }} colSpan="2">CLP (pesos chilenos)</td></tr>
            </tbody>
          </table>

          <h3 style={{ fontSize: '12pt', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>ALCANCE DEL PROCESO</h3>
          <div style={{ backgroundColor: '#fffbe6', padding: '10px', border: '1px dashed #ffd700', color: '#856404', fontStyle: 'italic', marginBottom: '20px' }}>
            <strong>[ZONA DE IA]</strong><br/> {alcanceGenerado}
          </div>

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
          <p style={{ textAlign: 'justify' }}>El precio adjudicado en el marco de la presente solicitud de propuestas tendrá una vigencia inicial de <strong>{vigenciaMeses || '[X]'} meses</strong>, contados desde la fecha de suscripción del contrato o emisión de la respectiva orden de compra, según corresponda. Dicho período podrá renovarse automáticamente por períodos sucesivos...</p>

          <h3 style={{ fontSize: '12pt', borderBottom: '1px solid #ccc', paddingBottom: '5px', marginTop: '20px' }}>INICIO DEL SERVICIO</h3>
          <p style={{ textAlign: 'justify' }}>Posterior a la adjudicación respectiva de los elementos requeridos por La Empresa, el adjudicatario deberá coordinar con el encargado respectivo de la Subgerencia de <strong>{inicioSubgerencia || '[Subgerencia]'}</strong> para dar inicio de los servicios requeridos.</p>
          <p style={{ textAlign: 'justify' }}>Se espera que los servicios puedan ser ejecutados en dependencias de Sodimac durante el mes de <strong>{inicioMes || '[Mes]'}</strong> o a coordinar con mandante.</p>

          <h3 style={{ fontSize: '12pt', borderBottom: '1px solid #ccc', paddingBottom: '5px', marginTop: '20px' }}>GARANTÍA DEL PRODUCTO</h3>
          <p style={{ textAlign: 'justify' }}>El adjudicatario deberá procurar, con el mayor esfuerzo posible, realizar todas las acciones necesarias para corregir las falencias detectadas... Además, se requiere que en las propuestas económicas del Prestador seleccionado se garantice la "calidad" de el o los productos adjudicados e instalados a lo menos <strong>"{garantiaDias || '[X]'} días"</strong> desde la recepción del producto en tienda.</p>

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
 </div>
        </div>
      </div>
    </div>
  );
}