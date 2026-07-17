import React, { useState } from 'react';

export default function GestionPanel({
  proveedores = [],
  categoriasDinamicas = {},
  cargarLogsAuditoriaProv,
  setMostrarModalAuditoria,
  cargarProveedores,
  abrirEditorProveedor,
  revocarProveedor,
  rechazarProveedor
}) {
  const [filtroGestionNombre, setFiltroGestionNombre] = useState('');
  const [filtroGestionCat, setFiltroGestionCat] = useState('');
  const [filtroGestionSub, setFiltroGestionSub] = useState('');
  const [filtroGestionZona, setFiltroGestionZona] = useState('');

  const proveedoresGestionFiltrados = proveedores.filter(p => {
    if (p.estado !== 'Aprobado') return false;
    const matchNombre = p.nombre_fantasia.toLowerCase().includes(filtroGestionNombre.toLowerCase()) || p.razon_social.toLowerCase().includes(filtroGestionNombre.toLowerCase());
    const matchCat = filtroGestionCat === '' || p.categoria === filtroGestionCat;
    const matchSub = filtroGestionSub === '' || p.subcategoria === filtroGestionSub;
    const matchZona = p.zonas_cobertura ? p.zonas_cobertura.toLowerCase().includes(filtroGestionZona.toLowerCase()) : true;
    return matchNombre && matchCat && matchSub && matchZona;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: '0', color: '#333', fontSize: '18px' }}>Gestión de Proveedores Aprobados</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => {cargarLogsAuditoriaProv(); setMostrarModalAuditoria(true);}} style={{ padding: '6px 15px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>🔍 Auditoría de Cambios</button>
          <button onClick={cargarProveedores} style={{ padding: '6px 15px', backgroundColor: '#004A99', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>🔄 Actualizar Registros</button>
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0', textAlign: 'left' }}>
              <th style={{ padding: '8px', borderBottom: '2px solid #ccc', verticalAlign: 'top', width: '10%' }}>
                <div style={{ marginBottom: '4px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Fecha Aprobación</div>
              </th>
              <th style={{ padding: '8px', borderBottom: '2px solid #ccc', verticalAlign: 'top', width: '22%' }}>
                <div style={{ marginBottom: '4px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Razón Social / RUT</div>
                <input type="text" placeholder="Filtrar Proveedor..." value={filtroGestionNombre} onChange={e => setFiltroGestionNombre(e.target.value)} style={{ width: '100%', maxWidth: '160px', padding: '4px', fontSize: '11px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', outline: 'none' }} />
              </th>
              <th style={{ padding: '8px', borderBottom: '2px solid #ccc', verticalAlign: 'top', width: '22%' }}>
                <div style={{ marginBottom: '4px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Categoría / Subcategoría</div>
                <div style={{ display: 'flex', gap: '4px', maxWidth: '200px' }}>
                  <select value={filtroGestionCat} onChange={e => {setFiltroGestionCat(e.target.value); setFiltroGestionSub('');}} style={{ width: '50%', padding: '4px', fontSize: '11px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', outline: 'none' }}>
                    <option value="">Categoría...</option>
                    {Object.keys(categoriasDinamicas).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  <select disabled={!filtroGestionCat} value={filtroGestionSub} onChange={e => setFiltroGestionSub(e.target.value)} style={{ width: '50%', padding: '4px', fontSize: '11px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', outline: 'none' }}>
                    <option value="">Subcat...</option>
                    {filtroGestionCat && categoriasDinamicas[filtroGestionCat]?.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                </div>
              </th>
              <th style={{ padding: '8px', borderBottom: '2px solid #ccc', verticalAlign: 'top', width: '12%' }}>
                <div style={{ marginBottom: '4px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Cobertura</div>
                <input type="text" placeholder="Filtrar Zona..." value={filtroGestionZona} onChange={e => setFiltroGestionZona(e.target.value)} style={{ width: '100%', maxWidth: '110px', padding: '4px', fontSize: '11px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', outline: 'none' }} />
              </th>
              <th style={{ padding: '8px', borderBottom: '2px solid #ccc', verticalAlign: 'top', width: '16%' }}>
                <div style={{ fontWeight: 'bold', marginTop: '1px' }}>Contacto</div>
              </th>
              <th style={{ padding: '8px', borderBottom: '2px solid #ccc', verticalAlign: 'top', textAlign: 'center', width: '8%' }}>
                <div style={{ fontWeight: 'bold', marginTop: '1px' }}>Auditoría</div>
              </th>
              <th style={{ padding: '8px', borderBottom: '2px solid #ccc', verticalAlign: 'top', textAlign: 'center', width: '10%' }}>
                <div style={{ fontWeight: 'bold', marginTop: '1px' }}>Acciones</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {proveedoresGestionFiltrados.length === 0 ? <tr><td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: '#777' }}>No se encontraron proveedores con los filtros aplicados.</td></tr> : 
            proveedoresGestionFiltrados.map(prov => (
              <tr key={prov.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '8px', color: '#666', fontSize: '11px' }}>
                  {prov.fecha_aprobacion ? new Date(prov.fecha_aprobacion).toLocaleDateString('es-CL') : 'Antiguo'}
                </td>
                <td style={{ padding: '8px' }}><strong>{prov.razon_social}</strong><br /><span style={{ color: '#666' }}>{prov.rut}</span></td>
                <td style={{ padding: '8px' }}>{prov.categoria}<br /><span style={{ color: '#666', fontSize: '11px' }}>{prov.subcategoria}</span></td>
                <td style={{ padding: '8px', maxWidth: '140px' }}><span style={{ fontSize: '11px', color: '#555', display: 'block', maxHeight: '40px', overflowY: 'auto' }}>{prov.zonas_cobertura || 'No especificada'}</span></td>
                <td style={{ padding: '8px' }}>
                  {prov.nombre_contacto}<br />
                  <a href={`mailto:${prov.email_principal}`} style={{ color: '#004A99', textDecoration: 'none' }}>{prov.email_principal}</a><br />
                  <span style={{ color: '#666', fontSize: '11px' }}>Tel: {prov.telefono || 'N/A'}</span><br />
                  {prov.website && prov.website !== 'No posee' && (
                    <a href={prov.website.startsWith('http') ? prov.website : `https://${prov.website}`} target="_blank" rel="noopener noreferrer" style={{ color: '#17a2b8', fontSize: '11px', textDecoration: 'none', fontWeight: 'bold' }}>🌐 {prov.website}</a>
                  )}
                </td>
                <td style={{ padding: '8px', textAlign: 'center' }}>{prov.aprobado_por ? <div style={{ fontSize: '11px', color: '#004A99', fontWeight: 'bold' }}>✓ Por:<br/>{prov.aprobado_por}</div> : <span style={{ color: '#999', fontSize: '11px', display: 'block', textAlign: 'center' }}>No registrado</span>}</td>
                <td style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center' }}>
                  <button onClick={() => abrirEditorProveedor(prov)} style={{ width: '80px', padding: '6px 0', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Editar</button>
                  <button onClick={() => revocarProveedor(prov)} style={{ width: '80px', padding: '6px 0', backgroundColor: '#ffc107', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>A Pendiente</button>
                  <button onClick={() => rechazarProveedor(prov)} style={{ width: '80px', padding: '6px 0', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}