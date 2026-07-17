import React from 'react';
import { estadosProcesoOpciones, coloresGrafico } from '../../utils/constantes';
import { formatearMoneda, formatearFechaLocal } from '../../utils/formato';
import DashboardAlertas from './DashboardAlertas';
import ChartParticipacion from '../../components/charts/ChartParticipacion';

export default function PanelProcesos({
  procesos, procesosFiltradosDashboard, usuarioActual,
  descargarPlantillaProcesos, manejarCargaMasivaProcesos, exportarProcesosExcel,
  setProcesoActual, setModalProceso, marcarAcuerdoFinalizado,
  procesosConAlertaFinalizacion, alertasContratos, alertasRenovacion,
  filtroProcesosController, setFiltroProcesosController, controllersUnicos,
  filtroProcesosEstado, setFiltroProcesosEstado,
  filtroProcesosMesAno, setFiltroProcesosMesAno, mesesAnosUnicos,
  filtroDocsEmitidos, setFiltroDocsEmitidos,
  procesosRecuentoCount, countSpot, countAnualizado, totalBaselineProcesos,
  ahorroTotalProcesos, ahorroPorcentajeProcesos, editarProceso, eliminarProceso
}) {

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

      <DashboardAlertas procesosConAlertaFinalizacion={procesosConAlertaFinalizacion} alertasContratos={alertasContratos} alertasRenovacion={alertasRenovacion} marcarAcuerdoFinalizado={marcarAcuerdoFinalizado} />

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

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
        <div style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#555', textTransform: 'uppercase' }}>Participación Proveedores (%)</h4>
          {procesosOrdenados.length === 0 ? <p style={{ fontSize: '11px', color: '#999', textAlign: 'center', marginTop: '30px' }}>Sin datos suficientes</p> : (
            <ChartParticipacion chartWidthProc={chartWidthProc} chartHeightProc={chartHeightProc} procesosOrdenados={procesosOrdenados} puntosTendencia={puntosTendencia} stepXProc={stepXProc} maxPart={maxPart} />
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