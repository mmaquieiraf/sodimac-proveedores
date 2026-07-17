import React from 'react';

export default function PendientesPanel({
  proveedores = [],
  cargarProveedores,
  aprobarProveedor,
  abrirEditorProveedor,
  rechazarProveedor
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#333', fontSize: '18px' }}>Proveedores Pendientes</h3>
        <button onClick={cargarProveedores} style={{ padding: '6px 15px', backgroundColor: '#004A99', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>🔄 Actualizar Registros</button>
      </div>
      <div style={{ overflowX: 'auto', border: '1px solid #ccc', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0', textAlign: 'left' }}>
              <th style={{ padding: '10px 8px', borderBottom: '2px solid #ccc', width: '10%' }}>Fecha Registro</th>
              <th style={{ padding: '10px 8px', borderBottom: '2px solid #ccc', width: '22%' }}>Razón Social / RUT</th>
              <th style={{ padding: '10px 8px', borderBottom: '2px solid #ccc', width: '20%' }}>Categoría / Subcategoría</th>
              <th style={{ padding: '10px 8px', borderBottom: '2px solid #ccc', width: '14%' }}>Cobertura</th>
              <th style={{ padding: '10px 8px', borderBottom: '2px solid #ccc', width: '22%' }}>Contacto</th>
              <th style={{ padding: '10px 8px', borderBottom: '2px solid #ccc', width: '12%', textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {proveedores.filter(p => p.estado === 'Pendiente').length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#777' }}>
                  No hay proveedores pendientes.
                </td>
              </tr>
            ) : (
              proveedores.filter(p => p.estado === 'Pendiente').map(prov => (
                <tr key={prov.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px', color: '#666', fontSize: '11px', verticalAlign: 'middle' }}>
                    {new Date(prov.fecha_registro).toLocaleDateString('es-CL')}
                  </td>
                  <td style={{ padding: '8px', verticalAlign: 'middle', wordWrap: 'break-word' }}>
                    <strong style={{ fontSize: '12px' }}>{prov.razon_social}</strong><br />
                    <span style={{ color: '#666', fontSize: '11px' }}>{prov.rut}</span>
                  </td>
                  <td style={{ padding: '8px', verticalAlign: 'middle', wordWrap: 'break-word' }}>
                    <span style={{ fontSize: '12px' }}>{prov.categoria}</span><br />
                    <span style={{ color: '#666', fontSize: '11px' }}>{prov.subcategoria}</span>
                  </td>
                  <td style={{ padding: '8px', verticalAlign: 'middle', wordWrap: 'break-word' }}>
                    <span style={{ fontSize: '11px', color: '#555', display: 'block', maxHeight: '40px', overflowY: 'auto' }}>
                      {prov.zonas_cobertura || 'No especificada'}
                    </span>
                  </td>
                  <td style={{ padding: '8px', verticalAlign: 'middle', wordWrap: 'break-word' }}>
                    <span style={{ fontSize: '12px' }}>{prov.nombre_contacto}</span><br />
                    <a href={`mailto:${prov.email_principal}`} style={{ color: '#004A99', textDecoration: 'none', fontSize: '11px', wordBreak: 'break-all' }}>{prov.email_principal}</a><br />
                    <span style={{ color: '#666', fontSize: '11px' }}>Tel: {prov.telefono || 'N/A'}</span>
                  </td>
                  <td style={{ padding: '8px', verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center' }}>
                      <button onClick={() => aprobarProveedor(prov)} style={{ width: '100%', maxWidth: '80px', padding: '5px 0', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>Aprobar</button>
                      <button onClick={() => abrirEditorProveedor(prov)} style={{ width: '100%', maxWidth: '80px', padding: '5px 0', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Editar</button>
                      <button onClick={() => rechazarProveedor(prov)} style={{ width: '100%', maxWidth: '80px', padding: '5px 0', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}