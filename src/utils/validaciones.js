// src/utils/validaciones.js

export const categoriasSodimacSeed = {
  "Construcción": ["Obras Civiles", "Eléctrico", "Climatización", "Control Centralizado", "Detección Y Extinción", "Gerenciamiento E Inspección Técnica De Obras", "Proyectista De Arquitectura", "Proyectista De Calculo", "Proyectista Topografo", "Proyectista Mecanica De Suelo", "Proyectista Electrico", "Proyectista Iluminación", "Proyectista Climatización", "Proyectista Extinción Y Detección De Incendios", "Proyectista Sanitario", "Línea De Vida", "Letreros Y Totem Corporativo", "Mano De Obra Pintura"],
  "Seguridad": ["CCTV - Intrusión", "Control De Acceso", "Key Master", "Alarmas Antihurto (Desactivadores Y EAS)", "Barreras De Seguridad"],
  "Sistemas": ["Corrientes Débiles", "Programación", "Software", "Hardware"],
  "Equipamiento": ["Racks", "Góndolas Y Hi Cube", "Accesorios Metálicos", "Puertas Automáticas", "Portillones De Acceso", "Pernos, Golillas Y Fijaciones", "UPS Trifásica", "UPS Monofásica", "Transformadores Y Grupo Generadores", "Docklever", "Luminarias LED", "Servidores, Cámaras Y Productos", "Plotter, Impresoras", "Gastronómico", "Ascensores, Montacarga Y Rampas", "Herramientas"],
  "Materiales": ["Insumos Médicos", "Insumos De Embalaje", "Químicos", "Insumos Tecnológicos", "Papelería", "Premios Para Colaboradores", "Placas De Madera, MDF, Terciado", "Pinturas", "Elemento De Estiba"],
  "Servicios": ["Guardias", "Carreros", "Outsourcing Y Personal Tercero", "Parking", "Profesionales De RRHH", "Licenciamiento", "Carro Bomba Y Brigadista", "Diseñador Layout", "Montaje De Equipamiento", "Jardinería", "Casino De Alimentación", "Hotelería", "Transporte De Mercadería", "Transporte De Personal", "Arriendo De Maquinaria"]
};

export const formatearRUT = (rut) => {
  if (!rut) return '';
  let limpio = String(rut).replace(/[^0-9kK]/g, '').toUpperCase();
  if (limpio.length <= 1) return limpio;
  let cuerpo = limpio.slice(0, -1);
  let dv = limpio.slice(-1);
  return `${cuerpo}-${dv}`;
};

export const validarRUT = (rut) => {
  if (!rut || !/^[0-9]+-[0-9K]$/.test(rut)) return false;
  let [cuerpo, dv] = rut.split('-');
  let suma = 0;
  let multiplo = 2;
  for (let i = 1; i <= cuerpo.length; i++) {
    suma += multiplo * parseInt(cuerpo.charAt(cuerpo.length - i));
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }
  let dvEsperado = 11 - (suma % 11);
  let dvFinal = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();
  return dvFinal === dv;
};