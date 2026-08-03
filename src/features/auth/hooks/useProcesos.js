import { useState } from 'react';
import { cargarProcesosService, guardarProcesoService, eliminarProcesoService, actualizarEstadoProcesoService, insertarProcesosMasivoService } from '../../../services/supabase/procesosService';
import { sanitizarYCapitalizar, formatearMoneda, obtenerMesAno } from '../../../utils/formato';
import { estadosExcluidosGlobal } from '../../../utils/constantes';
import * as XLSX from 'xlsx';

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

  // --- LECTORA DE EXCEL INTEGRADA (CON LIMPIEZA DE TILDES Y ANTI-DUPLICADOS) ---
  const manejarCargaMasivaProcesos = (e) => {
    const file = e.target.files[0]; 
    if (!file) return;

    const reader = new FileReader();
    
    // Función para manejar las fechas de Excel
    const parseFechaSegura = (valorExcel, defaultValue) => {
      if (!valorExcel || valorExcel.toString().trim() === '' || valorExcel.toString().toUpperCase() === 'N/A') return defaultValue;
      if (!isNaN(valorExcel) && typeof valorExcel === 'number') {
        const date = new Date(Math.round((valorExcel - 25569) * 86400 * 1000));
        return date.toISOString().split('T')[0];
      }
      const regex = /^\d{4}-\d{2}-\d{2}$/;
      return regex.test(valorExcel.toString().trim()) ? valorExcel.toString().trim() : defaultValue;
    };

    // NUEVA FUNCIÓN: Elimina tildes y caracteres raros
    const estandarizarTexto = (texto) => {
      if (!texto) return '';
      return texto.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, "").trim();
    };

    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const excelJson = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (excelJson.length <= 1) return alert("El archivo está vacío o solo contiene la cabecera.");
        
        const procesosNuevos = [];
        const duplicadosOmitidos = []; 
        const nombresEnArchivoActual = new Set(); 

        const defaultDate = `${new Date().getFullYear()}-01-01`;

        for (let i = 1; i < excelJson.length; i++) {
          const row = excelJson[i];
          if (!row || row.length === 0 || !row[0]) continue; 

          // Estandarizamos el nombre quitando tildes y capitalizando
          const nombreLimpio = sanitizarYCapitalizar(estandarizarTexto(row[0]));
          
          // REGLA ANTI-DUPLICADOS INTELIGENTE (Compara versiones sin tildes)
          const existeEnBD = procesos.some(p => estandarizarTexto(p.nombre).toLowerCase() === nombreLimpio.toLowerCase());
          const existeEnArchivo = nombresEnArchivoActual.has(nombreLimpio.toLowerCase());

          if (existeEnBD || existeEnArchivo) {
            duplicadosOmitidos.push(nombreLimpio);
            continue; 
          }

          nombresEnArchivoActual.add(nombreLimpio.toLowerCase());

          const baselineLimpio = row[10] && row[10].toString().toUpperCase() !== 'N/A' ? parseInt(row[10].toString().replace(/\D/g, '')) : 0;
          const montoAdjLimpio = row[11] && row[11].toString().toUpperCase() !== 'N/A' ? parseInt(row[11].toString().replace(/\D/g, '')) : 0;
          
          const fechaInicioLimpia = parseFechaSegura(row[8], defaultDate);
          const fechaTerminoLimpia = parseFechaSegura(row[9], fechaInicioLimpia);

          procesosNuevos.push({
            nombre: nombreLimpio, 
            clasificacion: estandarizarTexto(row[1]) || 'Opex',
            subgerencia: estandarizarTexto(row[2]) || 'Administracion', 
            solicitante: sanitizarYCapitalizar(estandarizarTexto(row[3])),
            tipo: estandarizarTexto(row[4]) || 'RFP', 
            tipo_compra: estandarizarTexto(row[5]) || 'Spot',
            controller: row[6]?.toString().trim() || usuarioActual?.usuario, 
            estado_proceso: row[7]?.toString().trim() || 'Estableciendo alcance, equipo y objetivos', // Protegido para no romper los filtros
            fecha_inicio: fechaInicioLimpia, 
            fecha_termino: fechaTerminoLimpia,
            baseline: isNaN(baselineLimpio) ? 0 : baselineLimpio, 
            monto_adjudicado: isNaN(montoAdjLimpio) ? 0 : montoAdjLimpio,
            proveedores_invitados: '', 
            proveedor_adjudicado: null, 
            adjudicaciones_detalle: []
          });
        }
        
        if (procesosNuevos.length > 0) { 
          const { error } = await insertarProcesosMasivoService(procesosNuevos); 
          if (!error) { 
            let mensaje = `✅ ${procesosNuevos.length} procesos nuevos agregados desde Excel.`;
            if (duplicadosOmitidos.length > 0) {
              mensaje += `\n\n⚠️ Se omitieron ${duplicadosOmitidos.length} procesos que ya existían.`;
            }
            alert(mensaje); 
            cargarProcesos(); 
          }
          else { alert("⚠️ Ocurrió un error en la base de datos al importar."); console.error(error); }
        } else if (duplicadosOmitidos.length > 0) {
          alert(`⚠️ No se cargó ningún proceso nuevo. Los ${duplicadosOmitidos.length} procesos en el archivo ya estaban registrados en el sistema.`);
        }

      } catch (error) {
        console.error("Error procesando Excel:", error);
        alert("⚠️ Hubo un error al leer el archivo Excel. Asegúrese de que el formato sea correcto.");
      }
    };
    
    reader.readAsArrayBuffer(file); 
    e.target.value = null; 
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