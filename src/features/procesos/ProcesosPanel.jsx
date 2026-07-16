import React, { useState, useMemo, useRef } from 'react';
import { supabase } from '../../supabase';

export default function ProcesosPanel({ 
  procesos = [], 
  cargarProcesos, 
  abrirEditorProceso, 
  eliminarProceso,
  gestionarArchivosProceso
}) {
  // 1. Estados de la Interfaz
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [mostrarFormManual, setMostrarFormManual] = useState(false);
  const [procesandoCSV, setProcesandoCSV] = useState(false);
  
  // Ref para el input de archivo oculto
  const fileInputRef = useRef(null);

  // Estado para el formulario manual
  const [formData, setFormData] = useState({
    numero_contrato: '', nombre_licitacion: '', tipo_documento: 'RFP',
    baseline: '', valor_adjudicado: '', fecha_inicio: '', fecha_cierre: '', estado: 'Pendiente'
  });

  // 2. Seguridad: Sanitizadores
  const sanitizarString = (str) => str ? String(str).replace(/[<>]/g, '').trim() : '';
  const prevenirCSVInjection = (str) => {
    const limpio = sanitizarString(str);
    return /^[=+\-@]/.test(limpio) ? `'${limpio}` : limpio.replace(/"/g, '""');
  };

  // 3. Motor Matemático y Dashboard (Optimizado)
  const metricas = useMemo(() => {
    let activos = 0; let completados = 0; let ahorroTotal = 0; const alertas = [];
    const hoy = new Date();

    procesos.forEach(proc => {
      if (proc.estado === 'En Curso' || proc.estado === 'Pendiente') activos++;
      if (proc.estado === 'Completado' || proc.estado === 'Adjudicado') completados++;

      if (proc.baseline && proc.valor_adjudicado) {
        const ahorro = parseFloat(proc.baseline) - parseFloat(proc.valor_adjudicado);
        if (ahorro > 0) ahorroTotal += ahorro;
      }

      if (proc.fecha_cierre && (proc.estado === 'En Curso' || proc.estado === 'Pendiente')) {
        const fCierre = new Date(proc.fecha_cierre);
        const diasRestantes = Math.ceil((fCierre - hoy) / (1000 * 60 * 60 * 24));
        
        if (diasRestantes <= 7 && diasRestantes >= 0) alertas.push({ tipo: 'warning', msg: `⏳ "${proc.nombre_licitacion}" vence en ${diasRestantes} días.` });
        else if (diasRestantes < 0) alertas.push({ tipo: 'danger', msg: `🚨 "${proc.nombre_licitacion}" está VENCIDO.` });
      }
      if (!proc.documento_url && proc.estado === 'Adjudicado') {
        alertas.push({ tipo: 'danger', msg: `📄 Contrato Adjudicado "${proc.numero_contrato || proc.nombre_licitacion}" sin archivo adjunto.` });
      }
    });
    return { activos, completados, ahorroTotal, alertas, total: procesos.length };
  }, [procesos]);

  const procesosFiltrados = useMemo(() => {
    return procesos.filter(p => {
      const txt = filtroTexto.toLowerCase();
      const matchTxt = (p.nombre_licitacion || '').toLowerCase().includes(txt) || (p.numero_contrato || '').toLowerCase().includes(txt);
      const matchEst = filtroEstado === '' || p.estado === filtroEstado;
      return matchTxt && matchEst;
    });
  }, [procesos, filtroTexto, filtroEstado]);

  const formatoDinero = (monto) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(monto || 0);

  // ==========================================
  // OPERACIONES DE ESCRITURA Y EXPORTACIÓN
  // ==========================================

  const handleCreacionManual = async (e) => {
    e.preventDefault();
    const payload = {
      numero_contrato: sanitizarString(formData.numero_contrato),
      nombre_licitacion: sanitizarString(formData.nombre_licitacion),
      tipo_documento: sanitizarString(formData.tipo_documento),
      baseline: formData.baseline ? parseFloat(formData.baseline) : null,
      valor_adjudicado: formData.valor_adjudicado ? parseFloat(formData.valor_adjudicado) : null,
      fecha_inicio: formData.fecha_inicio || null,
      fecha_cierre: formData.fecha_cierre || null,
      estado: sanitizarString(formData.estado)
    };

    const { error } = await supabase.from('procesos').insert([payload]);
    if (error) return alert("⚠️ Error al crear proceso. Revise la conexión.");
    alert("✅ Proceso creado exitosamente.");
    setMostrarFormManual(false);
    cargarProcesos(); 
  };

  const descargarPlantillaCSV = () => {
    const cabeceras = "Numero Contrato,Licitacion,Tipo Documento,Baseline,Fecha Inicio(YYYY-MM-DD),Fecha Cierre(YYYY-MM-DD),Estado\n";
    const ejemplo = "CT-1001,Servicio de Limpieza,RFP,5000000,2026-08-01,2026-12-31,Pendiente\n";
    const blob = new Blob(['\uFEFF' + cabeceras + ejemplo], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob);
    link.download = "Plantilla_Carga_Procesos.csv"; link.click();
  };

  const exportarBaseCSV = () => {
    if (procesos.length === 0) return alert("No hay procesos para exportar.");
    const cabeceras = ['N Contrato', 'Licitacion', 'Tipo', 'Baseline', 'Adjudicado', 'F.Inicio', 'F.Cierre', 'Estado'];
    const filas = procesos.map(p => [
      prevenirCSVInjection(p.numero_contrato), prevenirCSVInjection(p.nombre_licitacion), prevenirCSVInjection(p.tipo_documento),
      p.baseline || 0, p.valor_adjudicado || 0, p.fecha_inicio || '', p.fecha_cierre || '', prevenirCSVInjection(p.estado)
    ]);
    const csvContent = [cabeceras.join(';')].concat(filas.map(f => `"${f.join('";"')}"`)).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob);
    link.download = `Base_Procesos_${new Date().toLocaleDateString('es-CL')}.csv`; link.click();
  };

  const handleCargaMasivaCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validaciones Estrictas de Seguridad
    if (file.size > 5 * 1024 * 1024) return alert("❌ Seguridad: Archivo excede límite de 5MB.");
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') return alert("❌ Seguridad: Formato inválido. Solo .csv admitido.");

    setProcesandoCSV(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        // Parseo básico por saltos de línea y comas, ignorando primera fila (cabeceras)
        const lineas = text.split('\n').filter(l => l.trim().length > 0);
        const payloadInsert = [];
        
        for (let i = 1; i < lineas.length; i++) {
          const celdas = lineas[i].split(',').map(c => sanitizarString(c.replace(/"/g, '')));
          if (celdas.length >= 7) {
            payloadInsert.push({
              numero_contrato: celdas[0], nombre_licitacion: celdas[1], tipo_documento: celdas[2] || 'RFP',
              baseline: parseFloat(celdas[3]) || null, fecha_inicio: celdas[4] || null, fecha_cierre: celdas[5] || null,
              estado: celdas[6] || 'Pendiente'
            });
          }
        }

        if (payloadInsert.length === 0) throw new Error("CSV vacío o mal formateado.");
        
        const { error } = await supabase.from('procesos').insert(payloadInsert);
        if (error) throw error;
        
        alert(`✅ Éxito: ${payloadInsert.length} procesos cargados de forma masiva.`);
        cargarProcesos();
      } catch (err) {
        console.error(err); alert("⚠️ Error al procesar CSV. Verifique que use el formato de la plantilla.");
      } finally {
        setProcesandoCSV(false); e.target.value = ''; // Limpiar input
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  return (
    <div>
      {/* 1. BARRA DE ACCIONES PRINCIPALES Y CABECERA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ margin: '0', color: '#333', fontSize: '18px' }}>Gestión de Procesos y Contratos</h3>
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => setMostrarFormManual(!mostrarFormManual)} style={{ padding: '6px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
            {mostrarFormManual ? 'Ocultar Formulario' : '➕ Nuevo Proceso'}
          </button>
          
          <input type="file" accept=".csv" ref={fileInputRef} onChange={handleCargaMasivaCSV} style={{ display: 'none' }} />
          <button onClick={() => fileInputRef.current.click()} disabled={procesandoCSV} style={{ padding: '6px 12px', backgroundColor: '#ffc107', color: '#333', border: 'none', borderRadius: '4px', cursor: procesandoCSV ? 'wait' : 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
            {procesandoCSV ? '⏳ Cargando...' : '📁 Carga Masiva (CSV)'}
          </button>
          
          <button onClick={descargarPlantillaCSV} style={{ padding: '6px 12px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
            Descargar Plantilla
          </button>
          <button onClick={exportarBaseCSV} style={{ padding: '6px 12px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
            Exportar Datos
          </button>
          <button onClick={cargarProcesos} style={{ padding: '6px 12px', backgroundColor: '#004A99', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* 2. FORMULARIO DE CREACIÓN MANUAL (Desplegable) */}
      {mostrarFormManual && (
        <div style={{ padding: '20px', backgroundColor: '#f4f4f4', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#004A99' }}>Registrar Nuevo Proceso</h4>
          <form onSubmit={handleCreacionManual} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div><label style={{ fontSize: '12px', fontWeight: 'bold' }}>N° Contrato / ID</label><input required style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setFormData({...formData, numero_contrato: e.target.value})} /></div>
            <div><label style={{ fontSize: '12px', fontWeight: 'bold' }}>Nombre de Licitación *</label><input required style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setFormData({...formData, nombre_licitacion: e.target.value})} /></div>
            <div><label style={{ fontSize: '12px', fontWeight: 'bold' }}>Tipo de Documento</label><select style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setFormData({...formData, tipo_documento: e.target.value})}><option>RFP</option><option>RFQ</option><option>FT</option><option>Contrato</option></select></div>
            <div><label style={{ fontSize: '12px', fontWeight: 'bold' }}>Baseline (Presupuesto Base)</label><input type="number" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setFormData({...formData, baseline: e.target.value})} /></div>
            <div><label style={{ fontSize: '12px', fontWeight: 'bold' }}>Fecha de Inicio</label><input type="date" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setFormData({...formData, fecha_inicio: e.target.value})} /></div>
            <div><label style={{ fontSize: '12px', fontWeight: 'bold' }}>Fecha de Cierre</label><input type="date" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setFormData({...formData, fecha_cierre: e.target.value})} /></div>
            <div><label style={{ fontSize: '12px', fontWeight: 'bold' }}>Estado Inicial</label><select style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setFormData({...formData, estado: e.target.value})}><option>Pendiente</option><option>En Curso</option><option>Adjudicado</option><option>Completado</option></select></div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}><button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#EE2D24', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Guardar Proceso</button></div>
          </form>
        </div>
      )}

      {/* 3. DASHBOARD INTERNO (Métricas) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: '#fff', border: '1px solid #ddd', borderLeft: '4px solid #004A99', padding: '15px', borderRadius: '4px' }}><p style={{ margin: 0, fontSize: '12px', color: '#666' }}>TOTAL PROCESOS</p><h4 style={{ margin: '5px 0 0 0', fontSize: '24px' }}>{metricas.total}</h4></div>
        <div style={{ backgroundColor: '#fff', border: '1px solid #ddd', borderLeft: '4px solid #ffc107', padding: '15px', borderRadius: '4px' }}><p style={{ margin: 0, fontSize: '12px', color: '#666' }}>EN CURSO</p><h4 style={{ margin: '5px 0 0 0', fontSize: '24px' }}>{metricas.activos}</h4></div>
        <div style={{ backgroundColor: '#fff', border: '1px solid #ddd', borderLeft: '4px solid #28a745', padding: '15px', borderRadius: '4px' }}><p style={{ margin: 0, fontSize: '12px', color: '#666' }}>COMPLETADOS</p><h4 style={{ margin: '5px 0 0 0', fontSize: '24px' }}>{metricas.completados}</h4></div>
        <div style={{ backgroundColor: '#fff', border: '1px solid #ddd', borderLeft: '4px solid #17a2b8', padding: '15px', borderRadius: '4px' }}><p style={{ margin: 0, fontSize: '12px', color: '#666' }}>AHORRO ESTIMADO</p><h4 style={{ margin: '5px 0 0 0', fontSize: '20px' }}>{formatoDinero(metricas.ahorroTotal)}</h4></div>
      </div>

      {/* 4. ALERTAS */}
      {metricas.alertas.length > 0 && (
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fff3cd', border: '1px solid #ffeeba', borderRadius: '4px' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#856404', fontSize: '14px' }}>⚠️ Alertas del Sistema</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px' }}>
            {metricas.alertas.map((a, i) => <li key={i} style={{ color: a.tipo === 'danger' ? '#721c24' : '#856404', fontWeight: a.tipo === 'danger' ? 'bold' : 'normal' }}>{a.msg}</li>)}
          </ul>
        </div>
      )}

      {/* 5. FILTROS Y TABLA */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', border: '1px solid #eee', borderRadius: '4px' }}>
        <input type="text" placeholder="Filtrar por Nombre o Contrato..." value={filtroTexto} onChange={e => setFiltroTexto(e.target.value)} style={{ flex: 1, padding: '10px', fontSize: '13px', border: '1px solid #ccc', borderRadius: '4px' }} />
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={{ width: '200px', padding: '10px', fontSize: '13px', border: '1px solid #ccc', borderRadius: '4px' }}>
          <option value="">Todos los Estados</option><option value="Pendiente">Pendiente</option><option value="En Curso">En Curso</option><option value="Adjudicado">Adjudicado</option><option value="Completado">Completado</option><option value="Cancelado">Cancelado</option>
        </select>
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ backgroundColor: '#004A99', color: 'white', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>N° Contrato</th><th style={{ padding: '12px' }}>Licitación / Tipo</th>
              <th style={{ padding: '12px' }}>Baseline / Adj</th><th style={{ padding: '12px' }}>Fechas</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Estado</th><th style={{ padding: '12px', textAlign: 'center' }}>Docs</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {procesosFiltrados.length === 0 ? (<tr><td colSpan="7" style={{ padding: '30px', textAlign: 'center' }}>No hay resultados.</td></tr>) : (
              procesosFiltrados.map(proc => {
                let colorEstado = '#6c757d'; 
                if (proc.estado === 'En Curso') colorEstado = '#004A99'; 
                if (proc.estado === 'Adjudicado' || proc.estado === 'Completado') colorEstado = '#28a745'; 
                if (proc.estado === 'Pendiente') colorEstado = '#ffc107'; 
                if (proc.estado === 'Cancelado') colorEstado = '#dc3545';
                
                return (
                  <tr key={proc.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{proc.numero_contrato || 'S/N'}</td>
                    <td style={{ padding: '12px' }}><strong>{proc.nombre_licitacion}</strong><br/><span style={{ color: '#888', fontSize: '11px' }}>{proc.tipo_documento}</span></td>
                    <td style={{ padding: '12px' }}><span style={{ color: '#666', fontSize: '11px', display: 'block' }}>Base: {formatoDinero(proc.baseline)}</span><strong style={{ color: '#004A99' }}>Adj: {formatoDinero(proc.valor_adjudicado)}</strong></td>
                    <td style={{ padding: '12px', color: '#666', fontSize: '11px' }}>I: {proc.fecha_inicio || 'N/D'}<br/>C: {proc.fecha_cierre || 'N/D'}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}><span style={{ backgroundColor: colorEstado, color: proc.estado === 'Pendiente' ? '#333' : 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}>{proc.estado}</span></td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {proc.documento_url ? (
                        <button onClick={() => gestionarArchivosProceso(proc, 'descargar')} style={{ background: 'none', border: 'none', color: '#17a2b8', cursor: 'pointer', fontSize: '18px' }} title="Descargar">📄</button>
                      ) : (
                        <button onClick={() => gestionarArchivosProceso(proc, 'subir')} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '18px' }} title="Adjuntar">📎</button>
                      )}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button onClick={() => abrirEditorProceso(proc)} style={{ padding: '4px 8px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', marginRight: '5px' }}>Editar</button>
                      <button onClick={() => eliminarProceso(proc.id)} style={{ padding: '4px 8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Borrar</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}