import React, { useState } from 'react';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';

const URL_PLANTILLA = "https://zpxptembhqlmpkbctvml.supabase.co/storage/v1/object/public/plantillas/plantilla-rfp-sodimac.docx";

const administradores = [
  { nombre: 'Matías Maquieira', email: 'mmaquieiraf@sodimac.cl' },
  { nombre: 'Ignacio Pizarro', email: 'ipizarro@sodimac.cl' },
  { nombre: 'Macarena Valenzuela', email: 'mvalenzuelam@sodimac.cl' },
  { nombre: 'Jorge Alarcon', email: 'jaalarconal@Sodimac.cl' }
];

export default function GeneradorRFP() {
  // --- ESTADOS DE CAMPOS ---
  const [adminSeleccionado, setAdminSeleccionado] = useState(administradores[0]);
  const [valSeriedad, setValSeriedad] = useState('No aplica');
  const [valFiel, setValFiel] = useState('No aplica');
  const [valVigenciaFiel, setValVigenciaFiel] = useState('No aplica');
  const [contextoIA, setContextoIA] = useState('');
  const [archivosContexto, setArchivosContexto] = useState([]);
  const [cargandoIA, setCargandoIA] = useState(false);
  const [alcanceIA, setAlcanceIA] = useState('Alcance pendiente de generar...');
  
  const [calLiberacion, setCalLiberacion] = useState('');
  const [calLimiteConsultas, setCalLimiteConsultas] = useState('');
  const [calRespuestas, setCalRespuestas] = useState('');
  const [calEnvioOfertas, setCalEnvioOfertas] = useState('');
  const [calMesAdjudicacion, setCalMesAdjudicacion] = useState('');
  const [calMesServicio, setCalMesServicio] = useState('');

  const [vigenciaMeses, setVigenciaMeses] = useState('3');
  const [inicioSubgerencia, setInicioSubgerencia] = useState('Prevención');
  const [inicioMes, setInicioMes] = useState('junio');
  const [garantiaDias, setGarantiaDias] = useState('30');
  
  const [lugaresDespacho, setLugaresDespacho] = useState([{ id: 1, punto: 'HC Quinta Vergara', direccion: 'Av. Valparaíso 1070', comuna: 'Viña del Mar' }]);
  const [despachoCargo, setDespachoCargo] = useState('Jefa de Seguridad Electrónica');
  const [despachoNombre, setDespachoNombre] = useState('Cristian Reyes');
  const [despachoEmail, setDespachoEmail] = useState('creyesb@sodimac.cl');

  // --- LÓGICA DE HERRAMIENTAS ---
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

  const procesarConIA = () => {
    setCargandoIA(true);
    setTimeout(() => {
      setAlcanceIA("El servicio consiste en la instalación integral de cámaras de seguridad CCTV en 5 sucursales, incluyendo cableado, configuración de software de gestión y capacitación del personal.");
      setCargandoIA(false);
    }, 2000);
  };

  const generarWordFinal = async () => {
    try {
      const response = await fetch(URL_PLANTILLA);
      const content = await response.arrayBuffer();
      const zip = new PizZip(content);
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

      doc.setData({
        administrador_nombre: adminSeleccionado.nombre,
        administrador_email: adminSeleccionado.email,
        val_seriedad: valSeriedad,
        val_fiel: valFiel,
        val_vigencia_fiel: valVigenciaFiel,
        alcance_ia: alcanceIA,
        vigencia_meses: vigenciaMeses,
        inicio_subgerencia: inicioSubgerencia,
        inicio_mes: inicioMes,
        garantia_dias: garantiaDias,
        despacho_cargo: despachoCargo,
        despacho_nombre: despachoNombre,
        despacho_email: despachoEmail,
        lugaresDespacho: lugaresDespacho,
        cal_liberacion: calLiberacion,
        cal_consultas: calLimiteConsultas,
        cal_respuestas: calRespuestas,
        cal_ofertas: calEnvioOfertas,
        cal_adjudicacion: formatearMesAno(calMesAdjudicacion),
        cal_servicio: formatearMesAno(calMesServicio)
      });

      doc.render();
      const out = doc.getZip().generate({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      saveAs(out, `Bases_RFP_${adminSeleccionado.nombre.replace(' ','_')}.docx`);
    } catch (error) { console.error(error); alert("Error al generar Word. Verifica las llaves en la plantilla."); }
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: 'calc(100vh - 100px)', gap: '20px', padding: '15px', boxSizing: 'border-box', backgroundColor: '#f4f4f4', overflow: 'hidden' }}>
      
      {/* PANEL IZQUIERDO: FORMULARIO */}
      <div style={{ width: '450px', flexShrink: 0, backgroundColor: 'white', padding: '20px', borderRadius: '8px', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#004A99', marginTop: 0 }}>Configuración de Bases</h2>
        
        {/* Aquí van tus inputs de Ficha, IA, Calendario, etc... */}
        <label>Administrador:</label>
        <select onChange={e => setAdminSeleccionado(administradores.find(a => a.nombre === e.target.value))} style={{width:'100%', padding:'8px', marginBottom:'10px'}}>
           {administradores.map(a => <option key={a.nombre} value={a.nombre}>{a.nombre}</option>)}
        </select>
        
        <div style={{marginTop:'20px', padding:'15px', backgroundColor:'#f0f8ff', borderRadius:'5px'}}>
            <label>Contexto IA:</label>
            <textarea style={{width:'100%'}} onChange={e => setContextoIA(e.target.value)} />
            <input type="file" multiple onChange={manejarCargaArchivos} style={{marginTop:'10px'}}/>
            <button onClick={procesarConIA} disabled={cargandoIA} style={{width:'100%', marginTop:'10px'}}>{cargandoIA ? 'Procesando...' : '✨ Generar Alcance IA'}</button>
        </div>
        
        {/* (Aquí puedes agregar el resto de tus inputs de calendario y cláusulas igual a como los tenías) */}
      </div>

      {/* PANEL DERECHO: VISUALIZADOR */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', backgroundColor: 'white', padding: '10px', borderRadius: '8px' }}>
          <button onClick={generarWordFinal} style={{ padding: '10px 20px', backgroundColor: '#004A99', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>⬇️ Descargar Word Final</button>
        </div>
        
        <div style={{ flex: 1, backgroundColor: '#e5e5e5', padding: '20px', borderRadius: '8px', overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
          <div id="documento-rfp" style={{ backgroundColor: 'white', width: '21cm', minHeight: '29.7cm', padding: '2.5cm', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
             {/* Aquí pones tu texto previo para visualización, similar a lo que tenías antes */}
             <h1>Vista Previa</h1>
             <p>{alcanceIA}</p>
          </div>
        </div>
      </div>
    </div>
  );
}