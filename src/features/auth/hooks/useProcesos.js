import { useState } from 'react';
import { cargarProcesosService, guardarProcesoService, eliminarProcesoService, actualizarEstadoProcesoService, insertarProcesosMasivoService } from '../../../services/supabase/procesosService';
import { sanitizarYCapitalizar, formatearMoneda, obtenerMesAno } from '../../../utils/formato';
import { estadosExcluidosGlobal } from '../../../utils/constantes';

export const useProcesos = (usuarioActual, proveedoresFiltrados, seleccionados, setTabAdmin) => {
  const [procesos, setProcesos] = useState([]);
  const [modalProceso, setModalProceso] = useState(false);
  const [procesoActual, setProcesoActual] = useState({
    id: null, nombre: '', tipo: 'RFI', fecha_inicio: '', fecha_termino: '',
    proveedores_invitados: [], cantidad_ofertas: '', proveedor_adjudicado: [],
    adjudicaciones_detalle: [], baseline: '', monto_adjudicado: '', controller: '',
    subgerencia: '', estado_proceso: 'Estableciendo alcance, equipo y objetivos',
    clasificacion: '', solicitante: '', tipo_compra: 'Spot'
  });

  const [filtroProcesosController, setFiltroProcesosController] = useState([]);
  const [filtroProcesosEstado, setFiltroProcesosEstado] = useState([]);
  const [filtroProcesosMesAno, setFiltroProcesosMesAno] = useState([]);
  const [filtroDocsEmitidos, setFiltroDocsEmitidos] = useState([]); 

  const cargarProcesos = async () => {
    const todosLosProcesos = await cargarProcesosService();
    setProcesos(todosLosProcesos);
  };

  const guardarProceso = async (e) => {
    e.preventDefault();
    const { error } = await guardarProcesoService(procesoActual);
    if(error) alert("⚠️ Error al guardar el proceso."); else { alert("✅ Proceso guardado exitosamente."); setModalProceso(false); cargarProcesos(); }
  };

  const eliminarProceso = async (id) => {
    if(!window.confirm("¿Estás seguro de eliminar permanentemente este registro de proceso?")) return;
    const { error } = await eliminarProcesoService(id);
    if (!error) { alert("✅ Proceso eliminado."); cargarProcesos(); }
  };

  const marcarAcuerdoFinalizado = async (id) => {
    if(!window.confirm("¿Marcar este acuerdo como finalizado? Dejará de recibir alertas de término o renovación para este contrato.")) return;
    const { error } = await actualizarEstadoProcesoService(id, 'Acuerdo finalizado');
    if (!error) { alert("✅ Acuerdo finalizado exitosamente."); cargarProcesos(); }
    else { alert("⚠️ Error al actualizar el estado en la base de datos."); }
  };

  const abrirNuevoProcesoConSeleccionados = () => {
    if (seleccionados.length === 0) return alert("⚠️ Seleccione al menos un proveedor de la tabla para invitarlo al proceso.");
    const provsNombres = proveedoresFiltrados.filter(p => seleccionados.includes(p.id)).map(p => p.nombre_fantasia);
    setProcesoActual({
      id: null, nombre: '', tipo: 'RFI', fecha_inicio: '', fecha_termino: '',
      proveedores_invitados: provsNombres, cantidad_ofertas: '', proveedor_adjudicado: [],
      adjudicaciones_detalle: [], baseline: '', monto_adjudicado: '', controller: usuarioActual?.usuario || '',
      subgerencia: '', estado_proceso: 'Estableciendo alcance, equipo y objetivos',
      clasificacion: '', solicitante: '', tipo_compra: 'Spot'
    });
    setModalProceso(true);
    setTabAdmin('procesos');
  };

  const editarProceso = (proc) => {
    setProcesoActual({
      ...proc,
      proveedores_invitados: proc.proveedores_invitados ? proc.proveedores_invitados.split(', ') : [],
      proveedor_adjudicado: proc.proveedor_adjudicado ? proc.proveedor_adjudicado.split(', ') : [],
      adjudicaciones_detalle: proc.adjudicaciones_detalle || [],
      baseline: formatearMoneda(proc.baseline || ''),
      monto_adjudicado: formatearMoneda(proc.monto_adjudicado || '')
    });
    setModalProceso(true);
  };

  const removerProveedorInvitado = (nombreProv) => {
    const nuevosInvitados = procesoActual.proveedores_invitados.filter(p => p !== nombreProv);
    const nuevosAdjudicados = procesoActual.proveedor_adjudicado.filter(p => p !== nombreProv);
    const nuevosDetalles = (procesoActual.adjudicaciones_detalle || []).filter(d => d.proveedor !== nombreProv);
    setProcesoActual({ ...procesoActual, proveedores_invitados: nuevosInvitados, proveedor_adjudicado: nuevosAdjudicados, adjudicaciones_detalle: nuevosDetalles });
  };
  const agregarProveedorInvitado = (nombreProv) => {
    if (!nombreProv) return;
    setProcesoActual({ ...procesoActual, proveedores_invitados: [...procesoActual.proveedores_invitados, nombreProv] });
  };
  const removerProveedorAdjudicado = (nombreProv) => {
    const nuevosAdjudicados = procesoActual.proveedor_adjudicado.filter(p => p !== nombreProv);
    const nuevosDetalles = (procesoActual.adjudicaciones_detalle || []).filter(d => d.proveedor !== nombreProv);
    setProcesoActual({ ...procesoActual, proveedor_adjudicado: nuevosAdjudicados, adjudicaciones_detalle: nuevosDetalles });
  };
  const agregarProveedorAdjudicado = (nombreProv) => {
    if (!nombreProv) return;
    if (!procesoActual.proveedor_adjudicado.includes(nombreProv)) {
      setProcesoActual({ 
        ...procesoActual, 
        proveedor_adjudicado: [...procesoActual.proveedor_adjudicado, nombreProv],
        adjudicaciones_detalle: [...(procesoActual.adjudicaciones_detalle || []), {
          proveedor: nombreProv, carta_adjudicacion: '', termino_carta: '', aplica_contrato: 'no', 
          numero_contrato: '', termino_contrato: '', vigencia_contrato: '', renovacion_automatica: 'No', meses_renovacion: ''
        }]
      });
    }
  };
  const handleDetalleAdjudicacionChange = (proveedor, campo, valor) => {
    const nuevosDetalles = (procesoActual.adjudicaciones_detalle || []).map(det => {
      if (det.proveedor === proveedor) return { ...det, [campo]: valor };
      return det;
    });
    setProcesoActual({ ...procesoActual, adjudicaciones_detalle: nuevosDetalles });
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
          nombre: sanitizarYCapitalizar(currentLine[0]), clasificacion: currentLine[1] || 'Opex',
          subgerencia: currentLine[2] || 'Administración', solicitante: sanitizarYCapitalizar(currentLine[3]),
          tipo: currentLine[4] || 'RFP', tipo_compra: currentLine[5] || 'Spot',
          controller: currentLine[6] || usuarioActual?.usuario, estado_proceso: currentLine[7] || 'Estableciendo alcance, equipo y objetivos',
          fecha_inicio: currentLine[8] || new Date().toISOString().split('T')[0], fecha_termino: currentLine[9] || new Date().toISOString().split('T')[0],
          baseline: isNaN(baselineLimpio) ? null : baselineLimpio, monto_adjudicado: isNaN(montoAdjLimpio) ? null : montoAdjLimpio,
          proveedores_invitados: '', proveedor_adjudicado: null, adjudicaciones_detalle: []
        });
      }
      if (procesosNuevos.length > 0) { 
        const { error } = await insertarProcesosMasivoService(procesosNuevos); 
        if (!error) { alert(`✅ ${procesosNuevos.length} procesos agregados masivamente.`); cargarProcesos(); }
        else { alert("⚠️ Error al importar procesos. Verifique formato de fechas (YYYY-MM-DD) y números."); }
      }
    };
    reader.readAsText(file, 'UTF-8'); e.target.value = null; 
  };

  const controllersUnicos = [...new Set(procesos.map(p => p.controller).filter(Boolean))];
  const mesesAnosUnicos = [...new Set(procesos.map(p => obtenerMesAno(p.fecha_inicio)).filter(f => f !== 'Sin Fecha'))];

  const procesosFiltradosDashboard = procesos.filter(p => {
    const estado = p.estado_proceso || '';
    if (estadosExcluidosGlobal.includes(estado) && !filtroProcesosEstado.includes(estado)) return false;
    const matchController = filtroProcesosController.length === 0 || filtroProcesosController.includes(p.controller);
    const matchEstado = filtroProcesosEstado.length === 0 || filtroProcesosEstado.includes(estado);
    const matchMesAno = filtroProcesosMesAno.length === 0 || filtroProcesosMesAno.includes(obtenerMesAno(p.fecha_inicio));
    
    let tieneCarta = false; let tieneContrato = false;
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

  const totalBaselineProcesos = procesosFiltradosDashboard.reduce((acc, p) => acc + (p.baseline || 0), 0);
  const procesosRecuentoCount = procesosFiltradosDashboard.length; 
  const countSpot = procesosFiltradosDashboard.filter(p => p.tipo_compra === 'Spot').length;
  const countAnualizado = procesosFiltradosDashboard.filter(p => p.tipo_compra === 'Anualizado').length;

  const procesosParaAhorro = procesosFiltradosDashboard.filter(p => ['Gestión Contractual y/o Implementación', 'Adjudicado', 'Acuerdo finalizado'].includes(p.estado_proceso));
  const totalBaselineAhorro = procesosParaAhorro.reduce((acc, p) => acc + (p.baseline || 0), 0);
  const totalAdjudicadoAhorro = procesosParaAhorro.reduce((acc, p) => acc + (p.monto_adjudicado || 0), 0);
  const ahorroTotalProcesos = totalBaselineAhorro - totalAdjudicadoAhorro;
  const ahorroPorcentajeProcesos = totalBaselineAhorro > 0 ? ((ahorroTotalProcesos / totalBaselineAhorro) * 100).toFixed(1) : 0;

  const hoyDate = new Date(); hoyDate.setHours(0,0,0,0);
  const limite120Dias = new Date(hoyDate); limite120Dias.setDate(limite120Dias.getDate() + 120);
  const limite90Dias = new Date(hoyDate); limite90Dias.setDate(limite90Dias.getDate() + 90);

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
          } else if (det.renovacion_automatica === 'Si' && det.meses_renovacion && fechaTerminoInicial < hoyDate) {
            let fechaRenovada = new Date(fechaTerminoInicial);
            const mesesAAgregar = parseInt(det.meses_renovacion);
            while (fechaRenovada < hoyDate) { fechaRenovada.setMonth(fechaRenovada.getMonth() + mesesAAgregar); }
            if (fechaRenovada >= hoyDate && fechaRenovada <= limite90Dias) {
              const diasRestantesRenovacion = Math.ceil((fechaRenovada - hoyDate) / (1000 * 60 * 60 * 24));
              alertasRenovacion.push({ ...p, proveedor_alerta: det.proveedor, fecha_vencimiento_real: fechaRenovada, diasRestantes: diasRestantesRenovacion });
            }
          }
        }
      });
    }
  });

  return {
    procesos, cargarProcesos, modalProceso, setModalProceso, procesoActual, setProcesoActual,
    filtroProcesosController, setFiltroProcesosController, filtroProcesosEstado, setFiltroProcesosEstado,
    filtroProcesosMesAno, setFiltroProcesosMesAno, filtroDocsEmitidos, setFiltroDocsEmitidos,
    guardarProceso, eliminarProceso, marcarAcuerdoFinalizado, abrirNuevoProcesoConSeleccionados,
    editarProceso, removerProveedorInvitado, agregarProveedorInvitado, removerProveedorAdjudicado,
    agregarProveedorAdjudicado, handleDetalleAdjudicacionChange, manejarCargaMasivaProcesos,
    controllersUnicos, mesesAnosUnicos, procesosFiltradosDashboard, totalBaselineProcesos,
    procesosRecuentoCount, countSpot, countAnualizado, ahorroTotalProcesos, ahorroPorcentajeProcesos,
    procesosConAlertaFinalizacion, alertasContratos, alertasRenovacion
  };
};