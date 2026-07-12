import React, { useState } from 'react';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';

const URL_PLANTILLA = "https://zpxptembhqlmpkbctvml.supabase.co/storage/v1/object/public/plantillas/plantilla-rfp-sodimac.docx";

export default function GeneradorRFP() {
  // --- ESTADOS (Mismos que ya tenías) ---
  const [adminSeleccionado, setAdminSeleccionado] = useState({ nombre: 'Matías Maquieira', email: 'mmaquieiraf@sodimac.cl' });
  const [valSeriedad, setValSeriedad] = useState('No aplica');
  const [valFiel, setValFiel] = useState('No aplica');
  const [valVigenciaFiel, setValVigenciaFiel] = useState('No aplica');
  const [vigenciaMeses, setVigenciaMeses] = useState('3');
  const [inicioSubgerencia, setInicioSubgerencia] = useState('Prevención');
  const [inicioMes, setInicioMes] = useState('junio');
  const [garantiaDias, setGarantiaDias] = useState('30');
  const [lugaresDespacho, setLugaresDespacho] = useState([{ punto: 'HC Quinta Vergara', direccion: 'Av. Valparaíso 1070', comuna: 'Viña del Mar' }]);
  const [despachoCargo, setDespachoCargo] = useState('Jefa de Seguridad Electrónica');
  const [despachoNombre, setDespachoNombre] = useState('Cristian Reyes');
  const [despachoEmail, setDespachoEmail] = useState('creyesb@sodimac.cl');
  const [alcanceIA, setAlcanceIA] = useState('Alcance generado por IA...');

  // --- LÓGICA DE FUSIÓN (El corazón del generador) ---
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
        lugaresDespacho: lugaresDespacho
      });

      doc.render();
      const out = doc.getZip().generate({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      saveAs(out, `Bases_RFP_${adminSeleccionado.nombre}.docx`);
    } catch (error) {
      console.error("Error al generar el documento:", error);
      alert("Hubo un error al generar el archivo. Asegúrate de que las llaves en el Word coincidan con el código.");
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Generador de Bases RFP</h1>
      <p>Configura los datos a la izquierda y descarga tu documento corporativo.</p>
      
      {/* Botón de descarga oficial */}
      <button 
        onClick={generarWordFinal} 
        style={{ padding: '15px 30px', backgroundColor: '#004A99', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}
      >
        ⬇️ Descargar Bases Finales (Word)
      </button>
    </div>
  );
}