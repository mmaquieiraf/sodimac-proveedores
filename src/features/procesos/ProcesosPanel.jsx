import React, { useState } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../auth/context/AuthContext';
import { sanitizarYCapitalizar, formatearMoneda, formatearFechaLocal, obtenerMesAno } from '../../utils/datosSodimac';

const coloresGrafico = ['#004A99', '#EE2D24', '#ffc107', '#28a745', '#17a2b8', '#6f42c1', '#e83e8c', '#fd7e14', '#20c997'];
const estadosProcesoOpciones = [
  "No Iniciado", "Estableciendo alcance, equipo y objetivos", "Desarrollando Bases", 
  "En Negociación y analisis de ofertas", "En Aprobación y Adjudicación", 
  "Gestión Contractual y/o Implementación", "Adjudicado", "Cancelado", "Desierto", "Acuerdo finalizado"
];

export default function ProcesosPanel({
  procesos = [],
  cargarProcesos,
  setProcesoActual,
  setModalProceso,
  editarProceso
}) {
  const { usuarioActual } = useAuth();

  // --- ESTADOS DE FILTROS ---
  const [filtroProcesosController, setFiltroProcesosController] = useState([]);
  const [filtroProcesosEstado, setFiltroProcesosEstado] = useState([]);
  const [filtroProcesosMesAno, setFiltroProcesosMesAno] = useState([]);
  const [filtroDocsEmitidos, setFiltroDocsEmitidos] = useState([]); 

  // --- LÓGICA DE OPERACIONES (Trasladada intacta desde App.jsx) ---
  const eliminarProceso = async (id) => {
    if(!window.confirm("¿Estás seguro de eliminar permanentemente este registro de proceso?")) return;
    const { error } = await supabase.from('procesos').delete().eq('id', id);
    if (!error) { alert("✅ Proceso eliminado."); cargarProcesos(); }
  };

  const marcarAcuerdoFinalizado = async (id) => {
    if(!window.confirm("¿Marcar este acuerdo como finalizado? Dejará de recibir alertas de término o renovación para este contrato.")) return;
    const { error } = await supabase.from('procesos').update({ estado_proceso: 'Acuerdo finalizado' }).eq('id', id);
    if (!error) { alert("✅ Acuerdo finalizado exitosamente."); cargarProcesos(); }
    else { alert("⚠️ Error al actualizar el estado en la base de datos."); }
  };

  // --- EXPORTAR Y CARGA MASIVA DE PROCESOS ---
  const descargarPlantillaProcesos = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFFNombre del Proceso,Clasificación,Subgerencia,Solicitante,Tipo de Proceso (RFI/Q/P),Tipo de Compra,Controller,Estado del proceso,Fecha de inicio (YYYY-MM-DD),Fecha de Término (YYYY-MM-DD),Baseline (Presupuesto Base $),Monto Final Adjudicado ($)\n";
    csvContent += "Licitación Aseo,Opex,Operaciones,Juan Perez,RFP,Anualizado,mmaquieira,En Aprobación y Adjudicación,2025-01-01,2025-02-15,10000000,9500000\n";
    const encodedUri = encodeURI(csvContent); const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", "Plantilla_Carga_Procesos.csv"); document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const manejarCargaMasivaProcesos = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const lines = event.target.result.split(/\r?\n/).filter(line => line.trim() !== "");
      if (lines.length <= 1) return alert("El archivo está vacío o solo contiene la cabecera.");
      const procesosNuevos = [];
      for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, '').trim());
        if (currentLine.length < 2) continue; 
        
        const baselineLimpio = currentLine[10] ? parseInt(currentLine[10].replace(/\D/g, '')) : null;
        const montoAdjLimpio = currentLine[11] ? parseInt(currentLine[11].replace(/\D/g, '')) : null;

        procesosNuevos.push({
          nombre: sanitizarYCapitalizar(currentLine[0]),
          clasificacion: currentLine[1] || 'Opex',
          subgerencia: currentLine[2] || 'Administración',
          solicitante: sanitizarYCapitalizar(currentLine[3]),
          tipo: currentLine[4] || 'RFP',
          tipo_compra: currentLine[5] || 'Spot',
          controller: currentLine[6] || usuarioActual.usuario,
          estado_proceso: currentLine[7] || 'Estableciendo alcance, equipo y objetivos',
          fecha_inicio: currentLine[8] || new Date().toISOString().split('T')[0],
          fecha_termino: currentLine[9] || new Date().toISOString().split('T')[0],
          baseline: isNaN(baselineLimpio) ? null : baselineLimpio,
          monto_adjudicado: isNaN(montoAdjLimpio) ? null : montoAdjLimpio,
          proveedores_invitados: '', proveedor_adjudicado: null, adjudicaciones_detalle: []
        });
      }
      if (procesosNuevos.length > 0) { 
        const { error } = await supabase.from('procesos').insert(procesosNuevos); 
        if (!error) { alert(`✅ ${procesosNuevos.length} procesos agregados masivamente.`); cargarProcesos(); }
        else { alert("⚠️ Error al importar procesos. Verifique formato de fechas (YYYY-MM-DD) y números."); }
      }
    };
    reader.readAsText(file, 'UTF-8'); e.target.value = null; 
  };

  // --- CÁLCULOS Y DERIVACIONES DE DATOS ---
  const controllersUnicos = [...new Set(procesos.map(p => p.controller).filter(Boolean))];
  const mesesAnosUnicos = [...new Set(procesos.map(p => obtenerMesAno(p.fecha_inicio)).filter(f => f !== 'Sin Fecha'))];

  const estadosExcluidosGlobal = ['Cancelado', 'Desierto', 'No Iniciado'];

  const procesosFiltradosDashboard = procesos.filter(p => {
    const estado = p.estado_proceso || '';
    if (estadosExcluidosGlobal.includes(estado) && !filtroProcesosEstado.includes(estado)) return false;

    const matchController = filtroProcesosController.length === 0 || filtroProcesosController.includes(p.controller);
    const matchEstado = filtroProcesosEstado.length === 0 || filtroProcesosEstado.includes(estado);
    const matchMesAno = filtroProcesosMesAno.length === 0 || filtroProcesosMesAno.includes(obtenerMesAno(p.fecha_inicio));
    
    let tieneCarta = false;
    let tieneContrato = false;
    if (p.adjudicaciones_detalle) {
      tieneCarta = p.adjudicaciones_detalle.some(d => d.carta_adjudicacion && d.carta_adjudicacion.trim() !== '');
      tieneContrato = p.adjudicaciones_detalle.some(d => d.aplica_contrato === 'si' && d.numero_contrato && d.numero_contrato.trim() !== '');
    }
    
    let matchDocs = true;
    if (filtroDocsEmitidos.length > 0) {
      const matchC = filtroDocsEmitidos.includes('Carta') ? tieneCarta : false;
      const matchCont = filtroDocsEmitidos.includes('Contrato') ? tieneContrato : false;
      matchDocs = matchC || matchCont; 
    }

    return matchController && matchEstado && matchMesAno && matchDocs;
  });

  const exportarProcesosExcel = () => {
    if (procesosFiltradosDashboard.length === 0) return alert("⚠️ No hay procesos para exportar con los filtros actuales.");
    let excelHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8" /><style>table { border-collapse: collapse; font-family: Arial, sans-serif; } th { background-color: #004A99; color: white; font-weight: bold; border: 1px solid #cccccc; padding: 10px; text-align: left; } td { border: 1px solid #cccccc; padding: 8px; font-size: 13px; } .title { font-size: 18px; font-weight: bold; color: #004A99; padding-bottom: 15px; }</style></head><body><div class="title">Base Oficial de Procesos - Sodimac S.A.</div><table><thead><tr><th>Nombre del Proceso</th><th>Clasificación</th><th>Subgerencia</th><th>Solicitante</th><th>Tipo de Proceso</th><th>Tipo de Compra</th><th>Controller</th><th>Estado del proceso</th><th>Fecha de inicio</th><th>Fecha de Término</th><th>Proveedores Invitados</th><th>Cantidad de Ofertas</th><th>Proveedor Adjudicado</th><th>Baseline ($)</th><th>Monto Adjudicado ($)</th><th>Ahorro ($)</th></tr></thead><tbody>`;
    procesosFiltradosDashboard.forEach(p => { 
      const ahorro = (p.baseline || 0) - (p.monto_adjudicado || 0);
      excelHtml += `<tr><td>${p.nombre || ''}</td><td>${p.clasificacion || ''}</td><td>${p.subgerencia || ''}</td><td>${p.solicitante || ''}</td><td>${p.tipo || ''}</td><td>${p.tipo_compra || ''}</td><td>${p.controller || ''}</td><td>${p.estado_proceso || ''}</td><td>${p.fecha_inicio || ''}</td><td>${p.fecha_termino || ''}</td><td>${p.proveedores_invitados || ''}</td><td>${p.cantidad_ofertas || ''}</td><td>${p.proveedor_adjudicado || ''}</td><td>${p.baseline || ''}</td><td>${p.monto_adjudicado || ''}</td><td>${ahorro}</td></tr>`; 
    });
    excelHtml += `</tbody></table></body></html>`;
    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' }); const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.setAttribute("download", "registro_procesos_sodimac.xls"); document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const totalBaselineProcesos = procesosFiltradosDashboard.reduce((acc, p) => acc + (p.baseline || 0), 0);
  const procesosRecuentoCount = procesosFiltradosDashboard.length; 
  const countSpot = procesosFiltradosDashboard.filter(p => p.tipo_compra === 'Spot').length;
  const countAnualizado = procesosFiltradosDashboard.filter(p => p.tipo_compra === 'Anualizado').length;

  const procesosParaAhorro = procesosFiltradosDashboard.filter(p => ['Gestión Contractual y/o Implementación', 'Adjudicado', 'Acuerdo finalizado'].includes(p.estado_proceso));
  const totalBaselineAhorro = procesosParaAhorro.reduce((acc, p) => acc + (p.baseline || 0), 0);
  const totalAdjudicadoAhorro = procesosParaAhorro.reduce((acc, p) => acc + (p.monto_adjudicado || 0), 0);
  const ahorroTotalProcesos = totalBaselineAhorro - totalAdjudicadoAhorro;
  const ahorroPorcentajeProcesos = totalBaselineAhorro > 0 ? ((ahorroTotalProcesos / totalBaselineAhorro) * 100).toFixed(1) : 0;

  const totalCartas = procesosFiltradosDashboard.reduce((acc, p) => acc + (p.adjudicaciones_detalle ? p.adjudicaciones_detalle.filter(d => d.carta_adjudicacion && d.carta_adjudicacion.trim() !== '').length : 0), 0);
  const totalContratos = procesosFiltradosDashboard.reduce((acc, p) => acc + (p.adjudicaciones_detalle ? p.adjudicaciones_detalle.filter(d => d.aplica_contrato === 'si' && d.numero_contrato && d.numero_contrato.trim() !== '').length : 0), 0);
  
  const chartWidthProc = 350; const chartHeightProc = 120; const maxPart = 100;
  const procesosOrdenados = [...procesos].filter(p => p.cantidad_ofertas !== null && p.proveedores_invitados).sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio));
  const stepXProc = procesosOrdenados.length > 1 ? (chartWidthProc - 40) / (procesosOrdenados.length - 1) : 0;
  const puntosTendencia = procesosOrdenados.map((p, i) => {
    const invitados = p.proveedores_invitados ? p.proveedores_invitados.split(',').length : 0;
    const ofertas = parseInt(p.cantidad_ofertas) || 0;
    const porcentaje = invitados > 0 ? (ofertas / invitados) * 100 : 0;
    return `${20 + i * stepXProc},${chartHeightProc - 20 - ((Math.min(porcentaje, 100) / maxPart) * (chartHeightProc - 40))}`;
  }).join(' ');

  const subgerenciasData = {};
  procesosFiltradosDashboard.forEach(p => { const sg = p.subgerencia || 'No Asignada'; subgerenciasData[sg] = (subgerenciasData[sg] || 0) + 1; });
  let cumPercentSg = 0;
  const pieSlicesSg = Object.entries(subgerenciasData).map(([key, val], i) => {
    const percent = procesosFiltradosDashboard.length > 0 ? (val / procesosFiltradosDashboard.length) * 100 : 0;
    const slice = `${coloresGrafico[i % coloresGrafico.length]} ${cumPercentSg}% ${cumPercentSg + percent}%`;
    cumPercentSg += percent;
    return { key, val, percent, color: coloresGrafico[i % coloresGrafico.length], slice };
  });
  const tortaGradientSg = procesosFiltradosDashboard.length > 0 ? `conic-gradient(${pieSlicesSg.map(s => s.slice).join(', ')})` : '#e0e0e0';

  // --- LÓGICA DE ALERTAS ---
  const hoyDate = new Date();
  hoyDate.setHours(0,0,0,0);
  
  const limite120Dias = new Date(hoyDate);
  limite120Dias.setDate(limite120Dias.getDate() + 120);

  const limite90Dias = new Date(hoyDate);
  limite90Dias.setDate(limite90Dias.getDate() + 90);

  const procesosConAlertaFinalizacion = procesos.filter(p => {
    if (!p.fecha_termino) return false;
    const fechaT = new Date(p.fecha_termino + 'T00:00:00');
    const estadosCerrados = ['Adjudicado', 'Cancelado', 'Desierto', 'Gestión Contractual y/o Implementación', 'Acuerdo finalizado'];
    return fechaT < hoyDate && !estadosCerrados.includes(p.estado_proceso);
  });

  const alertasContratos = [];
  const alertasRenovacion = [];

  procesos.forEach(p => {
    if (p.estado_proceso !== 'Cancelado' && p.estado_proceso !== 'Acuerdo finalizado' && p.adjudicaciones_detalle) {
      p.adjudicaciones_detalle.forEach(det => {
        if (det.aplica_contrato === 'si' && det.termino_contrato) {
          const fechaTerminoInicial = new Date(det.termino_contrato + 'T00:00:00');
          
          if (fechaTerminoInicial >= hoyDate && fechaTerminoInicial <= limite120Dias) {
            const diasRestantes = Math.ceil((fechaTerminoInicial - hoyDate) / (1000 * 60 * 60 * 24));
            alertasContratos.push({ ...p, proveedor_alerta: det.proveedor, fecha_vencimiento_real: fechaTerminoInicial, diasRestantes });
          } 
          else if (det.renovacion_automatica === 'Si' && det.meses_renovacion && fechaTerminoInicial < hoyDate) {
            let fechaRenovada = new Date(fechaTerminoInicial);
            const mesesAAgregar = parseInt(det.meses_renovacion);
            
            while (fechaRenovada < hoyDate) {
              fechaRenovada.setMonth(fechaRenovada.getMonth() + mesesAAgregar);
            }

            if (fechaRenovada >= hoyDate && fechaRenovada <= limite90Dias) {
              const diasRestantesRenovacion = Math.ceil((fechaRenovada - hoyDate) / (1000 * 60 * 60 * 24));
              alertasRenovacion.push({ ...p, proveedor_alerta: det.proveedor, fecha_vencimiento_real: fechaRenovada, diasRestantes: diasRestantesRenovacion });
            }
          }
        }
      });
    }
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: '0', color: '#333', fontSize: '18px' }}>Registro de Procesos y Adjudicaciones</h3>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={descargarPlantillaProcesos} style={{ padding: '6px 12px', backgroundColor: '#e2e8f0', color: '#333', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>📥 Plantilla CSV</button>
          
          <label style={{ padding: '6px 12px', backgroundColor: '#ffc107', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <input type="file" accept=".csv" onChange={manejarCargaMasivaProcesos} style={{ display: 'none' }} />
            ⬆️ Cargar Masiva
          </label>

          <button onClick={exportarProcesosExcel} style={{ padding: '6px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>⬇️ Exportar Base</button>

          <button onClick={() => {
            setProcesoActual({ id: null, nombre: '', tipo: 'RFI', fecha_inicio: '', fecha_termino: '', proveedores_invitados: [], cantidad_ofertas: '', proveedor_adjudicado: [], adjudicaciones_detalle: [], baseline: '', monto_adjudicado: '', controller: usuarioActual?.usuario || '', subgerencia: '', estado_proceso: 'Estableciendo alcance, equipo y objetivos', clasificacion: '', solicitante: '', tipo_compra: 'Spot' });
            setModalProceso(true);
          }} style={{ padding: '6px 15px', backgroundColor: '#004A99', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', marginLeft: '10px' }}>+ Crear Manual</button>
        </div>
      </div>

      {/* ALERTAS DEL SISTEMA */}
      {(procesosConAlertaFinalizacion.length > 0 || alertasContratos.length > 0 || alertasRenovacion.length > 0) && (
        <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {procesosConAlertaFinalizacion.map(proc => (
            <div key={`alerta-fin-${proc.id}`} style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '12px 15px', borderRadius: '4px', borderLeft: '5px solid #ffc107', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: '10px', fontSize: '16px' }}>⚠️</span>
                <span><strong>Recordatorio:</strong> Proceso "{proc.nombre}" ha finalizado su fecha programada. Actualice el estatus.</span>
              </div>
              <button onClick={() => marcarAcuerdoFinalizado(proc.id)} style={{ padding: '5px 12px', backgroundColor: '#856404', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>✓ Omitir</button>
            </div>
          ))}
          {alertasContratos.map(alerta => (
            <div key={`alerta-contrato-${alerta.id}-${alerta.proveedor_alerta}`} style={{ backgroundColor: '#e2e3e5', color: '#383d41', padding: '12px 15px', borderRadius: '4px', borderLeft: '5px solid #17a2b8', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: '10px', fontSize: '16px' }}>⏳</span>
                <span><strong>Alerta Contrato:</strong> El contrato asociado al proceso "{alerta.nombre}" ({alerta.proveedor_alerta}) vence en <strong>{alerta.diasRestantes} días</strong> ({alerta.fecha_vencimiento_real.toLocaleDateString('es-CL')}). Evalúe renovación o licitación.</span>
              </div>
              <button onClick={() => marcarAcuerdoFinalizado(alerta.id)} style={{ padding: '5px 12px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>✓ Acuerdo Finalizado</button>
            </div>
          ))}
          {alertasRenovacion.map(alertaR => (
            <div key={`alerta-renovacion-${alertaR.id}-${alertaR.proveedor_alerta}`} style={{ backgroundColor: '#e2e3e5', color: '#383d41', padding: '12px 15px', borderRadius: '4px', borderLeft: '5px solid #28a745', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: '10px', fontSize: '16px' }}>🔄</span>
                <span><strong>Alerta Renovación:</strong> La autorrenovación del contrato asociado al proceso "{alertaR.nombre}" ({alertaR.proveedor_alerta}) vence en <strong>{alertaR.diasRestantes} días</strong> ({alertaR.fecha_vencimiento_real.toLocaleDateString('es-CL')}). Evalúe renovación o licitación.</span>
              </div>
              <button onClick={() => marcarAcuerdoFinalizado(alertaR.id)} style={{ padding: '5px 12px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>✓ Acuerdo Finalizado</button>
            </div>
          ))}
        </div>
      )}

      {/* PANEL DE FILTROS PARA DASHBOARD DE PROCESOS */}
      <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <h4 style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#555' }}>Filtros Globales:</h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#666' }}>Controller:</label>
          <select style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px', minWidth: '150px' }} onChange={e => {
            const val = e.target.value; if (val && !filtroProcesosController.includes(val)) setFiltroProcesosController([...filtroProcesosController, val]); e.target.value = "";
          }}>
            <option value="">Añadir Controller...</option>
            {controllersUnicos.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', maxWidth: '200px' }}>
            {filtroProcesosController.map(c => (
              <span key={c} style={{ backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '12px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                {c} <button onClick={() => setFiltroProcesosController(filtroProcesosController.filter(x => x !== c))} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#dc3545', padding: 0 }}>x</button>
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#666' }}>Estado del Evento:</label>
          <select style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px', minWidth: '150px' }} onChange={e => {
            const val = e.target.value; if (val && !filtroProcesosEstado.includes(val)) setFiltroProcesosEstado([...filtroProcesosEstado, val]); e.target.value = "";
          }}>
            <option value="">Añadir Estado...</option>
            {estadosProcesoOpciones.map(est => <option key={est} value={est}>{est}</option>)}
          </select>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', maxWidth: '250px' }}>
            {filtroProcesosEstado.map(e => (
              <span key={e} style={{ backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '12px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                {e} <button onClick={() => setFiltroProcesosEstado(filtroProcesosEstado.filter(x => x !== e))} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#dc3545', padding: 0 }}>x</button>
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#666' }}>Mes y Año (Inicio):</label>
          <select style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px', minWidth: '150px' }} onChange={e => {
            const val = e.target.value; if (val && !filtroProcesosMesAno.includes(val)) setFiltroProcesosMesAno([...filtroProcesosMesAno, val]); e.target.value = "";
          }}>
            <option value="">Añadir Mes...</option>
            {mesesAnosUnicos.map(ma => <option key={ma} value={ma}>{ma}</option>)}
          </select>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', maxWidth: '200px' }}>
            {filtroProcesosMesAno.map(ma => (
              <span key={ma} style={{ backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '12px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                {ma} <button onClick={() => setFiltroProcesosMesAno(filtroProcesosMesAno.filter(x => x !== ma))} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#dc3545', padding: 0 }}>x</button>
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#666' }}>Documentos Emitidos:</label>
          <select style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px', minWidth: '150px' }} onChange={e => {
            const val = e.target.value; if (val && !filtroDocsEmitidos.includes(val)) setFiltroDocsEmitidos([...filtroDocsEmitidos, val]); e.target.value = "";
          }}>
            <option value="">Filtrar Emitidos...</option>
            <option value="Carta">Con Carta Adjudicación</option>
            <option value="Contrato">Con Contrato Vigente</option>
          </select>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', maxWidth: '200px' }}>
            {filtroDocsEmitidos.map(d => (
              <span key={d} style={{ backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '12px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                {d} <button onClick={() => setFiltroDocsEmitidos(filtroDocsEmitidos.filter(x => x !== d))} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#dc3545', padding: 0 }}>x</button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* DASHBOARD DE PROCESOS - FILA 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
        <div style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#555', textTransform: 'uppercase' }}>Participación Proveedores (%)</h4>
          {procesosOrdenados.length === 0 ? <p style={{ fontSize: '11px', color: '#999', textAlign: 'center', marginTop: '30px' }}>Sin datos suficientes</p> : (
            <div style={{ position: 'relative', width: '100%', height: `${chartHeightProc}px` }}>
              <svg width="100%" height="100%" viewBox={`0 0 ${chartWidthProc} ${chartHeightProc}`} preserveAspectRatio="none">
                <line x1="20" y1={chartHeightProc - 20} x2={chartWidthProc} y2={chartHeightProc - 20} stroke="#ccc" strokeWidth="1" />
                <line x1="20" y1="0" x2="20" y2={chartHeightProc - 20} stroke="#ccc" strokeWidth="1" />
                {procesosOrdenados.length > 1 && <polyline points={puntosTendencia} fill="none" stroke="#28a745" strokeWidth="2" />}
                {procesosOrdenados.map((p, i) => {
                  const invitados = p.proveedores_invitados ? p.proveedores_invitados.split(',').length : 0;
                  const ofertas = parseInt(p.cantidad_ofertas) || 0;
                  const porcentaje = invitados > 0 ? (ofertas / invitados) * 100 : 0;
                  const cx = 20 + i * stepXProc; const cy = chartHeightProc - 20 - ((Math.min(porcentaje, 100) / maxPart) * (chartHeightProc - 40));
                  return (
                    <g key={p.id}>
                      <circle cx={cx} cy={cy} r="4" fill="#004A99" />
                      <text x={cx} y={cy - 10} fontSize="10" fill="#333" textAnchor="middle">{porcentaje.toFixed(0)}%</text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
        </div>

        <div style={{ backgroundColor: '#17a2b8', color: 'white', padding: '15px', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h4 style={{ margin: '0 0 5px 0', fontSize: '12px', textTransform: 'uppercase', opacity: 0.9 }}>Recuento de Procesos</h4>
          <p style={{ margin: 0, fontSize: '26px', fontWeight: 'bold' }}>{procesosRecuentoCount}</p>
          <span style={{ fontSize: '11px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px', marginTop: '5px' }}>Según filtros activos</span>
        </div>

        <div style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#555', textTransform: 'uppercase', textAlign: 'center' }}>Spot vs Anualizado</h4>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flex: 1 }}>
            <div style={{ textAlign: 'center' }}><p style={{fontSize:'24px', fontWeight:'bold', color:'#004A99', margin:0}}>{countSpot}</p><span style={{fontSize:'11px', color:'#666', fontWeight: 'bold'}}>Spot</span></div>
            <div style={{ borderLeft: '1px solid #ddd', height: '40px' }}></div>
            <div style={{ textAlign: 'center' }}><p style={{fontSize:'24px', fontWeight:'bold', color:'#28a745', margin:0}}>{countAnualizado}</p><span style={{fontSize:'11px', color:'#666', fontWeight: 'bold'}}>Anualizado</span></div>
          </div>
        </div>

        <div style={{ backgroundColor: '#004A99', color: 'white', padding: '15px', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h4 style={{ margin: '0 0 5px 0', fontSize: '12px', textTransform: 'uppercase', opacity: 0.9 }}>Total Baseline (CLP)</h4>
          <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>{formatearMoneda(totalBaselineProcesos)}</p>
        </div>

        <div style={{ backgroundColor: '#28a745', color: 'white', padding: '15px', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h4 style={{ margin: '0 0 5px 0', fontSize: '12px', textTransform: 'uppercase', opacity: 0.9 }}>Ahorro (Solo Cerrados)</h4>
          <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>{formatearMoneda(ahorroTotalProcesos)}</p>
          <span style={{ fontSize: '11px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px', marginTop: '5px', textAlign: 'center' }}>{ahorroPorcentajeProcesos}% de ahorro sobre su base</span>
        </div>
      </div>

      {/* DASHBOARD DE PROCESOS - FILA 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
        <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#555', textTransform: 'uppercase' }}>Gestión Documental (Emitidos)</h4>
          <div style={{ display: 'flex', width: '100%', gap: '15px', justifyContent: 'space-around' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0', fontSize: '32px', fontWeight: 'bold', color: '#6f42c1' }}>{totalCartas}</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666', fontWeight: 'bold' }}>Cartas de Adjudicación</p>
            </div>
            <div style={{ borderLeft: '1px solid #ddd' }}></div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0', fontSize: '32px', fontWeight: 'bold', color: '#e83e8c' }}>{totalContratos}</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666', fontWeight: 'bold' }}>Contratos Firmados</p>
            </div>
          </div>
          <span style={{ fontSize: '11px', color: '#999', marginTop: '15px' }}>*Se actualiza según los filtros superiores aplicados</span>
        </div>

        <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#555', textTransform: 'uppercase' }}>Procesos por Subgerencia</h4>
          {procesosFiltradosDashboard.length === 0 ? <p style={{ textAlign: 'center', color: '#999', marginTop: '20px' }}>Sin datos con los filtros actuales</p> : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '30px' }}>
              <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: tortaGradientSg, boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}></div>
              <div style={{ maxHeight: '120px', overflowY: 'auto', flex: 1 }}>
                {pieSlicesSg.map(s => (
                  <div key={s.key} style={{ display: 'flex', alignItems: 'center', marginBottom: '6px', fontSize: '12px' }}>
                    <div style={{ width: '10px', height: '10px', backgroundColor: s.color, marginRight: '8px', borderRadius: '2px' }}></div>
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.key}</span>
                    <span style={{ fontWeight: 'bold' }}>{s.val} ({Math.round(s.percent)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid #ccc', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0', textAlign: 'left' }}>
              <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>Proceso / Subgerencia</th>
              <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>Estatus / Fechas</th>
              <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>Participación</th>
              <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>Montos</th>
              <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>Resolución y Docs</th>
              <th style={{ padding: '10px', borderBottom: '2px solid #ccc', textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {procesosFiltradosDashboard.length === 0 ? <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#777' }}>No hay resultados con los filtros activos.</td></tr> : 
            procesosFiltradosDashboard.map(proc => {
              const ahorro = (proc.baseline || 0) - (proc.monto_adjudicado || 0);
              const inv = proc.proveedores_invitados ? proc.proveedores_invitados.split(',').length : 0;
              return (
                <tr key={proc.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>
                    <strong style={{ fontSize: '14px', color: '#004A99' }}>{proc.nombre}</strong><br/>
                    <span style={{ backgroundColor: '#ffc107', color: '#333', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>{proc.tipo}</span> • <span style={{ color: '#666', fontWeight: 'bold' }}>{proc.subgerencia || 'S/A'}</span><br/>
                    <span style={{ backgroundColor: '#e2e8f0', color: '#555', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', display: 'inline-block', marginTop: '4px' }}>{proc.tipo_compra} - {proc.clasificacion || 'N/A'}</span><br/>
                    <span style={{ color: '#888', fontSize: '10px' }}>👤 {proc.controller}</span>
                  </td>
                  <td style={{ padding: '10px', color: '#555' }}>
                    <span style={{ color: '#004A99', fontWeight: 'bold' }}>{proc.estado_proceso}</span><br/>
                    <strong>Inicio:</strong> {formatearFechaLocal(proc.fecha_inicio)}<br/>
                    <strong>Fin:</strong> {formatearFechaLocal(proc.fecha_termino)}
                  </td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ color: '#555' }}>Invitados: <strong>{inv}</strong></span><br/>
                    <span style={{ color: '#555' }}>Ofertas: <strong>{proc.cantidad_ofertas || 0}</strong></span>
                  </td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ color: '#555' }}>Base: {formatearMoneda(proc.baseline)}</span><br/>
                    <span style={{ color: '#555' }}>Adj: {formatearMoneda(proc.monto_adjudicado)}</span><br/>
                    <strong style={{ color: ahorro > 0 ? '#28a745' : (ahorro < 0 ? '#dc3545' : '#666') }}>Ahorro: {formatearMoneda(ahorro)}</strong>
                  </td>
                  <td style={{ padding: '10px' }}>
                    {(!proc.adjudicaciones_detalle || proc.adjudicaciones_detalle.length === 0) && (
                      <span style={{ fontWeight: 'bold', color: proc.proveedor_adjudicado ? '#333' : '#999' }}>{proc.proveedor_adjudicado || 'Pendiente'}</span>
                    )}
                    {proc.adjudicaciones_detalle && proc.adjudicaciones_detalle.map(det => (
                      <div key={`doc-${proc.id}-${det.proveedor}`} style={{ marginTop: '5px', padding: '5px', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid #eee' }}>
                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#555' }}>{det.proveedor.substring(0, 15)}...</span>
                        {det.carta_adjudicacion && <span style={{ fontSize: '10px', color: '#6f42c1', display: 'block', marginTop: '4px' }}>✉️ C.Adj: {det.carta_adjudicacion}</span>}
                        {det.aplica_contrato === 'si' && det.numero_contrato && <span style={{ fontSize: '10px', color: '#e83e8c', display: 'block', marginTop: '2px' }}>📝 Contrato: {det.numero_contrato}</span>}
                      </div>
                    ))}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                      <button onClick={() => editarProceso(proc)} style={{ padding: '4px 8px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Editar</button>
                      <button onClick={() => eliminarProceso(proc.id)} style={{ padding: '4px 8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}