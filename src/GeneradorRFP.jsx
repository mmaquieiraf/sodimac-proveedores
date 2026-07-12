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
  // --- ESTADOS COMPLETOS ---
  const [adminSeleccionado, setAdminSeleccionado] = useState(administradores[0]);
  const [reqSeriedad, setReqSeriedad] = useState('No');
  const [valSeriedad, setValSeriedad] = useState('No aplica');
  const [reqFiel, setReqFiel] = useState('No');
  const [valFiel, setValFiel] = useState('No aplica');
  const [reqVigenciaFiel, setReqVigenciaFiel] = useState('No');
  const [valVigenciaFiel, setValVigenciaFiel] = useState('No aplica');
  const [contextoIA, setContextoIA] = useState('');
  const [archivosContexto, setArchivosContexto] = useState([]);
  const [alcanceIA, setAlcanceIA] = useState('El alcance detallado será generado por la IA...');
  const [cargandoIA, setCargandoIA] = useState(false);
  
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

  // --- FUNCIONES ---
  const formatearMesAno = (valorMes) => {
    if(!valorMes) return '[Mes y Año]';
    const [year, month] = valorMes.split('-');
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${meses[parseInt(month)-1]} ${year}`;
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
        cal_liberacion: calLiberacion ? new Date(calLiberacion).toLocaleDateString('es-CL') : '[Fecha]',
        cal_consultas: calLimiteConsultas ? new Date(calLimiteConsultas).toLocaleDateString('es-CL') : '[Fecha]',
        cal_respuestas: calRespuestas ? new Date(calRespuestas).toLocaleDateString('es-CL') : '[Fecha]',
        cal_ofertas: calEnvioOfertas ? new Date(calEnvioOfertas).toLocaleDateString('es-CL') : '[Fecha]',
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
      alert("Error al generar. Revisa que las llaves del Word coincidan exactamente.");
    }
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: 'calc(100vh - 100px)', gap: '20px', padding: '15px', backgroundColor: '#f4f4f4' }}>
      
      {/* PANEL IZQUIERDO: FORMULARIO */}
      <div style={{ width: '450px', flexShrink: 0, backgroundColor: 'white', padding: '20px', borderRadius: '8px', overflowY: 'auto' }}>
        <h2 style={{ color: '#004A99' }}>Configuración</h2>
        <label>Administrador</label>
        <select onChange={(e) => setAdminSeleccionado(administradores.find(a => a.nombre === e.target.value))} style={{ width: '100%', marginBottom: '10px' }}>
            {administradores.map(a => <option key={a.nombre} value={a.nombre}>{a.nombre}</option>)}
        </select>
        
        <label>Contexto IA</label>
        <textarea rows="3" value={contextoIA} onChange={e => setContextoIA(e.target.value)} style={{ width: '100%' }} />
        <button onClick={() => setCargandoIA(true)} style={{ width: '100%', marginTop: '5px' }}>{cargandoIA ? 'Generando...' : 'Generar Alcance IA'}</button>

        {/* ... AQUÍ DEBES AGREGAR EL RESTO DE TUS INPUTS (Lugares despacho, fechas, etc) ... */}
        {/* Como el formulario es largo, puedes simplemente copiar tus estados y inputs previos aquí dentro. */}
        <p style={{marginTop: '20px', fontSize: '12px', color: '#666'}}>*El resto de tus campos de formulario van aquí.</p>
      </div>

      {/* PANEL DERECHO: VISUALIZADOR */}
      <div style={{ flex: 1, backgroundColor: '#e5e5e5', padding: '20px', overflowY: 'auto' }}>
        <div style={{ marginBottom: '10px', textAlign: 'right' }}>
           <button onClick={generarWordFinal} style={{ padding: '10px 20px', backgroundColor: '#004A99', color: 'white', border: 'none', borderRadius: '4px' }}>⬇️ Descargar Bases Finales (Word)</button>
        </div>
        <div id="documento-rfp" style={{ backgroundColor: 'white', width: '21cm', minHeight: '29.7cm', padding: '2.5cm', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontSize: '11pt' }}>
           <h1>Vista Previa</h1>
           <p><strong>Administrador:</strong> {adminSeleccionado.nombre}</p>
           <p><strong>Alcance:</strong> {alcanceIA}</p>
           {/* Aquí puedes poner la estructura de tu documento para ver los cambios en tiempo real */}
        </div>
      </div>
    </div>
  );
}