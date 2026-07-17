export const sanitizarYCapitalizar = (texto) => {
  if (!texto) return '';
  const textoSeguro = texto.replace(/[<>]/g, '').toLowerCase().trim();
  return textoSeguro.split(/\s+/).map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1)).join(' ');
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

export const formatearRUT = (rut) => {
  let limpio = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (limpio.length <= 1) return limpio;
  let cuerpo = limpio.slice(0, -1);
  let dv = limpio.slice(-1);
  return `${cuerpo}-${dv}`;
};

export const validarRUT = (rut) => {
  if (!/^[0-9]+-[0-9K]$/.test(rut)) return false;
  let [cuerpo, dv] = rut.split('-');
  let suma = 0; let multiplo = 2;
  for (let i = 1; i <= cuerpo.length; i++) {
    suma += multiplo * parseInt(cuerpo.charAt(cuerpo.length - i));
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }
  let dvEsperado = 11 - (suma % 11);
  let dvFinal = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();
  return dvFinal === dv;
};