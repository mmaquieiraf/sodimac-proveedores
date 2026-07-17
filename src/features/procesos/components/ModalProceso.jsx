import React from 'react';
import { formatearMoneda } from '../../../utils/datosSodimac'; // Asegurar que esta utilidad exista en el archivo de utilidades

const subgerenciasOpciones = ["Sistemas", "Prevención", "Recursos humanos", "Operaciones", "Logistica", "Administración", "Comercial"];
const clasificacionOpciones = ["Capex", "Opex"];
const tipoCompraOpciones = ["Spot", "Anualizado"];
const vigenciaOpciones = ["12 meses", "24 meses", "36 meses", "48 meses", "60 meses"];
const mesesRenovacionOpciones = ["3", "6", "12", "18", "24"];

export default function ModalProceso({
  modalProceso,
  setModalProceso,
  procesoActual,
  setProcesoActual,
  guardarProceso,
  proveedoresAprobados,
  removerProveedorInvitado,
  agregarProveedorInvitado,
  removerProveedorAdjudicado,
  agregarProveedorAdjudicado,
  handleDetalleAdjudicacionChange
}) {
  if (!modalProceso) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px', boxSizing: 'border-box' }}>
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', maxWidth: '1000px', width: '100%', maxHeight: '95vh', overflowY: 'auto', position: 'relative' }}>
        <button onClick={() => setModalProceso(false)} style={{ position: 'absolute', top: '15px', right: '20px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#EE2D24', fontWeight: 'bold' }}>&times;</button>
        <h2 style={{ color: '#004A99', marginTop: 0, borderBottom: '2px solid #eee', paddingBottom: '10px' }}>{procesoActual.id ? 'Editar Proceso' : 'Nuevo Proceso'}</h2>
        
        <form onSubmit={guardarProceso} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px' }}>
          
          <div style={{ gridColumn: '1 / span 2' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Nombre del Proceso *</label>
            <input required value={procesoActual.nombre} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setProcesoActual({...procesoActual, nombre: e.target.value})} />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Clasificación *</label>
            <select required value={procesoActual.clasificacion} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setProcesoActual({...procesoActual, clasificacion: e.target.value})}>
              <option value="">Seleccione...</option>
              {clasificacionOpciones.map(op => <option key={op} value={op}>{op}</option>)}
            </select>
          </div>
          
          <div>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Subgerencia *</label>
            <select required value={procesoActual.subgerencia} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setProcesoActual({...procesoActual, subgerencia: e.target.value})}>
              <option value="">Seleccione...</option>
              {subgerenciasOpciones.map(sg => <option key={sg} value={sg}>{sg}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Solicitante *</label>
            <input required value={procesoActual.solicitante} placeholder="Nombre Solicitante" style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setProcesoActual({...procesoActual, solicitante: e.target.value})} />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Tipo de Proceso (RFI/Q/P) *</label>
            <select required value={procesoActual.tipo} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setProcesoActual({...procesoActual, tipo: e.target.value})}>
              <option value="RFI">RFI</option><option value="RFQ">RFQ</option><option value="RFP">RFP</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Tipo de Compra *</label>
            <select required value={procesoActual.tipo_compra} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setProcesoActual({...procesoActual, tipo_compra: e.target.value})}>
              {tipoCompraOpciones.map(tc => <option key={tc} value={tc}>{tc}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Controller *</label>
            <input required readOnly value={procesoActual.controller} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#e9ecef', color: '#495057' }} />
          </div>

          <div style={{ gridColumn: '1 / span 4', borderTop: '1px solid #eee', margin: '5px 0' }}></div>

          <div style={{ gridColumn: '1 / span 2' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Estado del Proceso *</label>
            <select required value={procesoActual.estado_proceso} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', fontWeight: 'bold', color: '#004A99' }} onChange={e => setProcesoActual({...procesoActual, estado_proceso: e.target.value})}>
              <optgroup label="No Iniciado"><option value="No Iniciado">No Iniciado</option></optgroup>
              <optgroup label="En Curso">
                <option value="Estableciendo alcance, equipo y objetivos">Estableciendo alcance, equipo y objetivos</option>
                <option value="Desarrollando Bases">Desarrollando Bases</option>
                <option value="En Negociación y analisis de ofertas">En Negociación y análisis de ofertas</option>
                <option value="En Aprobación y Adjudicación">En Aprobación y Adjudicación</option>
              </optgroup>
              <optgroup label="Adjudicados">
                <option value="Gestión Contractual y/o Implementación">Gestión Contractual y/o Implementación</option>
                <option value="Adjudicado">Adjudicado</option>
              </optgroup>
              <optgroup label="Ignorados / Anulados"><option value="Cancelado">Cancelado</option><option value="Desierto">Desierto</option><option value="Acuerdo finalizado">Acuerdo finalizado</option></optgroup>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Fecha de Inicio *</label>
            <input type="date" required value={procesoActual.fecha_inicio} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setProcesoActual({...procesoActual, fecha_inicio: e.target.value})} />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Fecha de Término *</label>
            <input type="date" required value={procesoActual.fecha_termino} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setProcesoActual({...procesoActual, fecha_termino: e.target.value})} />
          </div>

          <div style={{ gridColumn: '1 / span 4' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Proveedores Invitados al Proceso</label>
            <div style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#f8f9fa', minHeight: '45px', fontSize: '12px' }}>
              {procesoActual.proveedores_invitados.length > 0 ? procesoActual.proveedores_invitados.map(p => (
                <span key={p} style={{display: 'inline-flex', alignItems: 'center', backgroundColor: '#004A99', color: 'white', padding: '4px 10px', borderRadius: '15px', marginRight: '8px', marginBottom: '8px'}}>
                  {p}
                  <button type="button" onClick={() => removerProveedorInvitado(p)} style={{ marginLeft: '8px', background: 'none', border: 'none', color: '#ffb3b3', cursor: 'pointer', fontSize: '12px', padding: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✖</button>
                </span>
              )) : <span style={{ color: '#999', display: 'block', padding: '5px 0' }}>Ningún proveedor seleccionado todavía.</span>}
            </div>
            <select onChange={(e) => agregarProveedorInvitado(e.target.value)} value="" style={{ width: '100%', padding: '8px', marginTop: '8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #28a745', color: '#28a745', fontWeight: 'bold', cursor: 'pointer', outline: 'none' }}>
              <option value="">+ Añadir otro proveedor de la base aprobada al proceso...</option>
              {proveedoresAprobados.filter(p => !procesoActual.proveedores_invitados.includes(p.nombre_fantasia)).map(p => <option key={p.id} value={p.nombre_fantasia}>{p.nombre_fantasia} ({p.categoria})</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Ofertas Recibidas</label>
            <input type="number" min="0" value={procesoActual.cantidad_ofertas} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setProcesoActual({...procesoActual, cantidad_ofertas: e.target.value})} placeholder="Se recibe al final" />
          </div>

          <div style={{ gridColumn: 'span 3' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Proveedor(es) Adjudicado(s)</label>
            <div style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: procesoActual.proveedor_adjudicado.length > 0 ? '#d4edda' : '#f8f9fa', minHeight: '45px', fontSize: '12px' }}>
              {procesoActual.proveedor_adjudicado.length > 0 ? procesoActual.proveedor_adjudicado.map(p => (
                <span key={`adj-${p}`} style={{display: 'inline-flex', alignItems: 'center', backgroundColor: '#28a745', color: 'white', padding: '4px 10px', borderRadius: '15px', marginRight: '8px', marginBottom: '8px'}}>
                  {p}
                  <button type="button" onClick={() => removerProveedorAdjudicado(p)} style={{ marginLeft: '8px', background: 'none', border: 'none', color: '#e8ecef', cursor: 'pointer', fontSize: '12px', padding: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✖</button>
                </span>
              )) : <span style={{ color: '#999', display: 'block', padding: '5px 0' }}>Pendiente de resolución...</span>}
            </div>
            <select 
              onChange={(e) => agregarProveedorAdjudicado(e.target.value)} value=""
              style={{ width: '100%', padding: '8px', marginTop: '8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #004A99', color: '#004A99', fontWeight: 'bold', cursor: 'pointer', outline: 'none' }}
            >
              <option value="">+ Seleccionar proveedor adjudicado...</option>
              {procesoActual.proveedores_invitados
                .filter(p => !procesoActual.proveedor_adjudicado.includes(p))
                .map(p => (
                  <option key={`opt-adj-${p}`} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: '1 / span 4', borderTop: '2px dashed #eee', margin: '5px 0' }}></div>

          <div style={{ gridColumn: '1 / span 2' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Baseline (Presupuesto Base $)</label>
            <input type="text" value={procesoActual.baseline} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setProcesoActual({...procesoActual, baseline: formatearMoneda(e.target.value)})} placeholder="Ej: $5.555.555" />
          </div>

          <div style={{ gridColumn: '3 / span 2' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Monto Final Adjudicado ($)</label>
            <input type="text" value={procesoActual.monto_adjudicado} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setProcesoActual({...procesoActual, monto_adjudicado: formatearMoneda(e.target.value)})} placeholder="Ej: $5.555.555" />
          </div>
          
          <div style={{ gridColumn: '1 / span 4', borderTop: '2px dashed #eee', margin: '5px 0' }}></div>

          {procesoActual.adjudicaciones_detalle && procesoActual.adjudicaciones_detalle.length > 0 && (
            <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
              <h4 style={{ color: '#004A99', fontSize: '15px', borderBottom: '2px solid #eee', paddingBottom: '5px', marginBottom: '15px' }}>Documentos y Contratos por Proveedor</h4>
              {procesoActual.adjudicaciones_detalle.map((det, index) => (
                <div key={`det-${det.proveedor}`} style={{ backgroundColor: '#f8f9fa', border: '1px solid #ddd', borderRadius: '6px', padding: '15px', marginBottom: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <strong style={{ fontSize: '14px', color: '#28a745' }}>{index + 1}. {det.proveedor}</strong>
                  </div>
                  
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Nº Carta Adjudicación</label>
                    <input type="text" value={det.carta_adjudicacion || ''} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => handleDetalleAdjudicacionChange(det.proveedor, 'carta_adjudicacion', e.target.value)} placeholder="Opcional..." />
                  </div>
                  
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Término Carta Adj.</label>
                    <input type="date" value={det.termino_carta || ''} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => handleDetalleAdjudicacionChange(det.proveedor, 'termino_carta', e.target.value)} />
                  </div>

                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>¿Aplica Contrato?</label>
                    <select value={det.aplica_contrato || 'no'} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => {
                      handleDetalleAdjudicacionChange(det.proveedor, 'aplica_contrato', e.target.value);
                      if(e.target.value === 'no') handleDetalleAdjudicacionChange(det.proveedor, 'numero_contrato', '');
                    }}>
                      <option value="no">No Aplica</option><option value="si">Sí Aplica</option>
                    </select>
                  </div>

                  {det.aplica_contrato === 'si' ? (
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Nº de Contrato</label>
                      <input type="text" value={det.numero_contrato || ''} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => handleDetalleAdjudicacionChange(det.proveedor, 'numero_contrato', e.target.value)} placeholder="Ingrese Número..." />
                    </div>
                  ) : <div></div>}

                  {det.aplica_contrato === 'si' && (
                    <>
                      <div>
                        <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Término Contrato *</label>
                        <input type="date" required value={det.termino_contrato || ''} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => handleDetalleAdjudicacionChange(det.proveedor, 'termino_contrato', e.target.value)} />
                      </div>
                      <div>
                        <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Vigencia Contrato</label>
                        <select value={det.vigencia_contrato || ''} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => handleDetalleAdjudicacionChange(det.proveedor, 'vigencia_contrato', e.target.value)}>
                          <option value="">Seleccione...</option>{vigenciaOpciones.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Renovación Automática</label>
                        <select value={det.renovacion_automatica || 'No'} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => handleDetalleAdjudicacionChange(det.proveedor, 'renovacion_automatica', e.target.value)}>
                          <option value="No">No</option><option value="Si">Sí</option>
                        </select>
                      </div>
                      {det.renovacion_automatica === 'Si' ? (
                        <div>
                          <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Meses de Renovación *</label>
                          <select required value={det.meses_renovacion || ''} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => handleDetalleAdjudicacionChange(det.proveedor, 'meses_renovacion', e.target.value)}>
                            <option value="">Seleccione...</option>{mesesRenovacionOpciones.map(m => <option key={m} value={m}>{m} meses</option>)}
                          </select>
                        </div>
                      ) : <div></div>}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          <button type="submit" style={{ gridColumn: '1 / -1', padding: '15px', marginTop: '15px', backgroundColor: '#004A99', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer', fontSize: '15px' }}>GUARDAR CAMBIOS DEL PROCESO</button>
        </form>
      </div>
    </div>
  );
}