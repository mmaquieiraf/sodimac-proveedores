import React, { useState } from 'react';

export default function ExportarPanel({
  proveedores = [],
  categoriasDinamicas = {},
  zonasOpciones = [],
  abrirNuevoProcesoConSeleccionados
}) {
  const [filtroRut, setFiltroRut] = useState(''); 
  const [filtroNombre, setFiltroNombre] = useState(''); 
  const [filtroCategoria, setFiltroCategoria] = useState(''); 
  const [filtroSubcategoria, setFiltroSubcategoria] = useState(''); 
  const [filtroExportarZona, setFiltroExportarZona] = useState([]); 
  const [seleccionados, setSeleccionados] = useState([]);

  const proveedoresAprobados = proveedores.filter(p => p.estado === 'Aprobado');
  
  const proveedoresFiltrados = proveedoresAprobados.filter(p => {
    const matchRut = p.rut.toLowerCase().includes(filtroRut.toLowerCase());
    const matchNombre = p.nombre_fantasia.toLowerCase().includes(filtroNombre.toLowerCase());
    const matchCat = filtroCategoria === '' || p.categoria === filtroCategoria;
    const matchSub = filtroSubcategoria === '' || p.subcategoria === filtroSubcategoria;
    let matchZona = true;
    if (filtroExportarZona.length > 0) {
      const zProv = p.zonas_cobertura ? p.zonas_cobertura.split(',').map(z => z.trim()) : [];
      matchZona = filtroExportarZona.some(fz => zProv.includes(fz) || zProv.includes('Todo el País'));
    }
    return matchRut && matchNombre && matchCat && matchSub && matchZona;
  });

  const toggleSeleccion = (id) => setSeleccionados(seleccionados.includes(id) ? seleccionados.filter(i => i !== id) : [...seleccionados, id]);
  const toggleSeleccionarTodo = (e) => setSeleccionados(e.target.checked ? proveedoresFiltrados.map(p => p.id) : []);
  
  const exportarCSV = () => {
    if (seleccionados.length === 0) return alert("⚠️ Seleccione al menos un proveedor.");
    const dataAExportar = proveedoresFiltrados.filter(p => seleccionados.includes(p.id));
    let csvC = "data:text/csv;charset=utf-8,\uFEFFId,Nombre de la empresa*,Nombre del contacto,Correo electrónico*,Código del idioma,Código de Región\n";
    dataAExportar.forEach(p => { csvC += `,${p.nombre_fantasia.replace(/"/g, '').replace(/,/g, ' ')},${p.nombre_contacto.replace(/"/g, '').replace(/,/g, ' ')},${p.email_principal.replace(/"/g, '').replace(/,/g, ' ')},,\n`; });
    const link = document.createElement("a"); link.setAttribute("href", encodeURI(csvC)); link.setAttribute("download", "proveedores_clean.csv"); document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const exportarExcel = () => {
    if (seleccionados.length === 0) return alert("⚠️ Seleccione al menos un proveedor.");
    const dataAExportar = proveedoresFiltrados.filter(p => seleccionados.includes(p.id));
    let excelHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8" /><style>table { border-collapse: collapse; font-family: Arial, sans-serif; } th { background-color: #004A99; color: white; font-weight: bold; border: 1px solid #cccccc; padding: 10px; text-align: left; } td { border: 1px solid #cccccc; padding: 8px; font-size: 13px; } .title { font-size: 18px; font-weight: bold; color: #004A99; padding-bottom: 15px; }</style></head><body><div class="title">Base Oficial de Proveedores Aprobados - Sodimac S.A.</div><table><thead><tr><th>RUT Empresa</th><th>Razón Social</th><th>Nombre Fantasía</th><th>Categoría</th><th>Subcategoría</th><th>Zonas de Cobertura</th><th>Email Principal</th><th>Nombre de Contacto</th><th>Cargo</th><th>Teléfono</th><th>Website</th><th>Fecha Registro</th><th>Aprobado Por</th></tr></thead><tbody>`;
    dataAExportar.forEach(p => { excelHtml += `<tr><td>${p.rut || ''}</td><td>${p.razon_social || ''}</td><td>${p.nombre_fantasia || ''}</td><td>${p.categoria || ''}</td><td>${p.subcategoria || ''}</td><td>${p.zonas_cobertura || ''}</td><td>${p.email_principal || ''}</td><td>${p.nombre_contacto || ''}</td><td>${p.cargo || ''}</td><td>${p.telefono || ''}</td><td>${p.website || ''}</td><td>${p.fecha_registro ? new Date(p.fecha_registro).toLocaleDateString('es-CL') : ''}</td><td>${p.aprobado_por || ''}</td></tr>`; });
    excelHtml += `</tbody></table></body></html>`;
    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' }); const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.setAttribute("download", "proveedores_aprobados.xls"); document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  // Re-empaquetamos la selección para enviarla al orquestador padre respetando la arquitectura original
  const handleAbrirProceso = () => {
    if (seleccionados.length === 0) return alert("⚠️ Seleccione al menos un proveedor de la tabla para invitarlo al proceso.");
    const provsNombres = proveedoresFiltrados.filter(p => seleccionados.includes(p.id)).map(p => p.nombre_fantasia);
    abrirNuevoProcesoConSeleccionados(provsNombres);
  };

  return (
    <div>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>Filtra y selecciona los proveedores aprobados para generar un archivo compatible o crear un nuevo proceso.</p>
      
      <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div><label style={{ fontSize: '12px', fontWeight: 'bold' }}>Buscar por RUT</label><input placeholder="Ej: 12345678-9" style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setFiltroRut(e.target.value)} /></div>
          <div><label style={{ fontSize: '12px', fontWeight: 'bold' }}>Nombre de Fantasía</label><input placeholder="Buscar empresa..." style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setFiltroNombre(e.target.value)} /></div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Categoría</label>
            <select style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => {setFiltroCategoria(e.target.value); setFiltroSubcategoria('');}}>
              <option value="">Todas</option>
              {Object.keys(categoriasDinamicas).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Subcategoría</label>
            <select disabled={!filtroCategoria} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setFiltroSubcategoria(e.target.value)}>
              <option value="">Todas</option>
              {filtroCategoria && categoriasDinamicas[filtroCategoria]?.map(sub => <option key={sub} value={sub}>{sub}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Zonas de Cobertura</label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginTop: '5px' }}>
            <select style={{ padding: '8px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px', minWidth: '180px', outline: 'none' }} onChange={e => {
              const val = e.target.value;
              if (val && !filtroExportarZona.includes(val)) setFiltroExportarZona([...filtroExportarZona, val]);
              e.target.value = ""; 
            }}>
              <option value="">Seleccionar zona...</option>
              {zonasOpciones.map(zona => <option key={zona} value={zona}>{zona}</option>)}
            </select>
            
            <div style={{ flex: 1, padding: '5px', border: '1px solid #ccc', borderRadius: '4px', minHeight: '33px', maxHeight: '60px', overflowY: 'auto', backgroundColor: '#fff', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {filtroExportarZona.length === 0 ? <span style={{ fontSize: '12px', color: '#999', padding: '2px' }}>Todas las zonas...</span> : 
                filtroExportarZona.map(z => (
                  <label key={z} style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', backgroundColor: '#f0f0f0', padding: '2px 6px', border: '1px solid #ccc', borderRadius: '12px' }}>
                    <input type="checkbox" checked={true} onChange={() => setFiltroExportarZona(filtroExportarZona.filter(s => s !== z))} style={{ margin: 0, cursor: 'pointer' }} /> {z}
                  </label>
                ))
              }
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#004A99' }}>Seleccionados: {seleccionados.length} de {proveedoresFiltrados.length}</span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleAbrirProceso} style={{ padding: '10px 20px', backgroundColor: '#ffc107', color: '#333', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>+ Nuevo Proceso</button>
          <button onClick={exportarCSV} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>Descargar CSV Clean</button>
          <button onClick={exportarExcel} style={{ padding: '10px 20px', backgroundColor: '#004A99', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>Descargar Excel (.xls)</button>
        </div>
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid #ccc', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0', textAlign: 'left' }}>
              <th style={{ padding: '12px', borderBottom: '2px solid #ccc', width: '40px', textAlign: 'center' }}><input type="checkbox" onChange={toggleSeleccionarTodo} checked={seleccionados.length === proveedoresFiltrados.length && proveedoresFiltrados.length > 0} /></th>
              <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>RUT</th>
              <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Nombre Fantasía (Empresa)</th>
              <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Categoría / Sub</th>
              <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Nombre Contacto</th>
              <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Correo Electrónico</th>
            </tr>
          </thead>
          <tbody>
            {proveedoresFiltrados.length === 0 ? <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#777' }}>No hay resultados con estos filtros.</td></tr> : 
            proveedoresFiltrados.map(prov => (
              <tr key={prov.id} style={{ borderBottom: '1px solid #eee', backgroundColor: seleccionados.includes(prov.id) ? '#f0f8ff' : 'white' }}>
                <td style={{ padding: '12px', textAlign: 'center' }}><input type="checkbox" checked={seleccionados.includes(prov.id)} onChange={() => toggleSeleccion(prov.id)} /></td>
                <td style={{ padding: '12px' }}>{prov.rut}</td>
                <td style={{ padding: '12px' }}><strong>{prov.nombre_fantasia}</strong></td>
                <td style={{ padding: '12px' }}>{prov.categoria} <br/><span style={{ color: '#666', fontSize: '11px' }}>{prov.subcategoria}</span></td>
                <td style={{ padding: '12px' }}>{prov.nombre_contacto}</td>
                <td style={{ padding: '12px' }}>{prov.email_principal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}