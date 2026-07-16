import React from 'react';

export default function ExportarPanel({ proveedores = [] }) {

  // 1. Capa de Seguridad contra CSV/Formula Injection
  const prevenirCSVInjection = (texto) => {
    if (!texto) return '';
    const textoString = String(texto);
    // Si el texto empieza con =, +, -, o @, Excel lo evalúa como fórmula. Le añadimos una comilla simple.
    if (/^[=+\-@]/.test(textoString)) {
      return `'${textoString}`;
    }
    // Escapar comillas dobles para que no rompan el CSV
    return textoString.replace(/"/g, '""');
  };

  // 2. Lógica de Exportación a CSV
  const exportarCSV = () => {
    const aprobados = proveedores.filter(p => p.estado === 'Aprobado');
    if (aprobados.length === 0) return alert("No hay proveedores aprobados para exportar.");

    // Definición de cabeceras seguras
    const cabeceras = ['RUT', 'Razón Social', 'Nombre Fantasía', 'Categoría', 'Subcategoría', 'Zonas de Cobertura', 'Contacto', 'Cargo', 'Email Principal', 'Teléfono', 'Website', 'Fecha Aprobación', 'Aprobado Por'];
    
    // Mapeo y sanitización de datos
    const filas = aprobados.map(p => [
      prevenirCSVInjection(p.rut),
      prevenirCSVInjection(p.razon_social),
      prevenirCSVInjection(p.nombre_fantasia),
      prevenirCSVInjection(p.categoria),
      prevenirCSVInjection(p.subcategoria),
      prevenirCSVInjection(p.zonas_cobertura),
      prevenirCSVInjection(p.nombre_contacto),
      prevenirCSVInjection(p.cargo),
      prevenirCSVInjection(p.email_principal),
      prevenirCSVInjection(p.telefono),
      prevenirCSVInjection(p.website),
      prevenirCSVInjection(p.fecha_aprobacion ? new Date(p.fecha_aprobacion).toLocaleDateString('es-CL') : 'N/A'),
      prevenirCSVInjection(p.aprobado_por || 'N/A')
    ]);

    // Construcción del archivo con BOM para caracteres latinos (UTF-8)
    const contenidoCSV = [cabeceras.join(';')].concat(filas.map(fila => `"${fila.join('";"')}"`)).join('\n');
    const blob = new Blob(['\uFEFF' + contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    
    // Disparo de descarga
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Proveedores_Aprobados_Sodimac_${new Date().toLocaleDateString('es-CL')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 3. Lógica de Exportación a Formato XLS (HTML Table Hack)
  const exportarXLS = () => {
    const aprobados = proveedores.filter(p => p.estado === 'Aprobado');
    if (aprobados.length === 0) return alert("No hay proveedores aprobados para exportar.");

    // Construcción de tabla HTML compatible con Excel, aplicando la misma sanitización
    let tablaHTML = '<table border="1"><thead><tr>';
    const cabeceras = ['RUT', 'Razón Social', 'Nombre Fantasía', 'Categoría', 'Subcategoría', 'Zonas de Cobertura', 'Contacto', 'Cargo', 'Email Principal', 'Teléfono', 'Website', 'Fecha Aprobación', 'Aprobado Por'];
    cabeceras.forEach(c => tablaHTML += `<th style="background-color:#004A99; color:white;">${c}</th>`);
    tablaHTML += '</tr></thead><tbody>';

    aprobados.forEach(p => {
      tablaHTML += '<tr>';
      tablaHTML += `<td>${prevenirCSVInjection(p.rut)}</td>`;
      tablaHTML += `<td>${prevenirCSVInjection(p.razon_social)}</td>`;
      tablaHTML += `<td>${prevenirCSVInjection(p.nombre_fantasia)}</td>`;
      tablaHTML += `<td>${prevenirCSVInjection(p.categoria)}</td>`;
      tablaHTML += `<td>${prevenirCSVInjection(p.subcategoria)}</td>`;
      tablaHTML += `<td>${prevenirCSVInjection(p.zonas_cobertura)}</td>`;
      tablaHTML += `<td>${prevenirCSVInjection(p.nombre_contacto)}</td>`;
      tablaHTML += `<td>${prevenirCSVInjection(p.cargo)}</td>`;
      tablaHTML += `<td>${prevenirCSVInjection(p.email_principal)}</td>`;
      tablaHTML += `<td>${prevenirCSVInjection(p.telefono)}</td>`;
      tablaHTML += `<td>${prevenirCSVInjection(p.website)}</td>`;
      tablaHTML += `<td>${prevenirCSVInjection(p.fecha_aprobacion ? new Date(p.fecha_aprobacion).toLocaleDateString('es-CL') : 'N/A')}</td>`;
      tablaHTML += `<td>${prevenirCSVInjection(p.aprobado_por || 'N/A')}</td>`;
      tablaHTML += '</tr>';
    });
    tablaHTML += '</tbody></table>';

    // Disparo de descarga formato XLS
    const blob = new Blob(['\uFEFF' + tablaHTML], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Proveedores_Aprobados_Sodimac_${new Date().toLocaleDateString('es-CL')}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 4. Renderizado Visual 100% Fiel
  return (
    <div>
      <h3 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '18px', borderBottom: '2px solid #EE2D24', paddingBottom: '10px' }}>
        Exportar Base de Datos (Aprobados)
      </h3>
      <p style={{ fontSize: '14px', color: '#555', marginBottom: '20px' }}>
        Descargue la lista completa de proveedores aprobados para uso en sistemas externos o cruce de datos. Seleccione el formato deseado.
      </p>
      
      <div style={{ display: 'flex', gap: '15px' }}>
        <button 
          onClick={exportarCSV} 
          style={{ padding: '12px 25px', backgroundColor: '#17a2b8', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}
        >
          <span>📄</span> Descargar Formato CSV
        </button>
        <button 
          onClick={exportarXLS} 
          style={{ padding: '12px 25px', backgroundColor: '#28a745', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}
        >
          <span>📊</span> Descargar Formato Excel (.xls)
        </button>
      </div>
    </div>
  );
}