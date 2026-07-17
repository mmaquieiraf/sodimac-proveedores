import React from 'react';

export default function DashboardAlertas({ procesosConAlertaFinalizacion, alertasContratos, alertasRenovacion, marcarAcuerdoFinalizado }) {
  if (procesosConAlertaFinalizacion.length === 0 && alertasContratos.length === 0 && alertasRenovacion.length === 0) return null;

  return (
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
  );
}