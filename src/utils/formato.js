export const sanitizarYCapitalizar = (texto) => {
  if (!texto) return '';
  const textoSeguro = texto.replace(/[<>]/g, '').toLowerCase().trim();
  return textoSeguro.split(/\s+/).map(palabra => 
    palabra.charAt(0).toUpperCase() + palabra.slice(1)
  ).join(' ');
};

export const formatearMoneda = (val) => {
  if (val === '' || val === null || val === undefined) return '';
  const num = val.toString().replace(/\D/g, '');
  if (!num) return '';
  return '$' + parseInt(num, 10).toLocaleString('es-CL');
};

export const formatearFechaLocal = (fechaString) => {
  if (!fechaString) return 'N/A';
  const partes = fechaString.split('-');
  if (partes.length !== 3) return fechaString;
  return `${partes[2]}-${partes[1]}-${partes[0]}`; 
};

export const obtenerMesAno = (fechaString) => {
  if (!fechaString) return 'Sin Fecha';
  const partes = fechaString.split('-');
  if (partes.length !== 3) return 'Sin Fecha';
  const meses = { '01':'Enero', '02':'Febrero', '03':'Marzo', '04':'Abril', '05':'Mayo', '06':'Junio', '07':'Julio', '08':'Agosto', '09':'Septiembre', '10':'Octubre', '11':'Noviembre', '12':'Diciembre' };
  return `${meses[partes[1]]} ${partes[0]}`;
};