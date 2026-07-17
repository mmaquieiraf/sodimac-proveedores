const catSodimacOriginal = {
  "Construcción": ["Obras Civiles", "Eléctrico", "Climatización", "Control Centralizado", "Detección Y Extinción", "Gerenciamiento E Inspección Técnica De Obras", "Proyectista De Arquitectura", "Proyectista De Calculo", "Proyectista Topografo", "Proyectista Mecanica De Suelo", "Proyectista Electrico", "Proyectista Iluminación", "Proyectista Climatización", "Proyectista Extinción Y Detección De Incendios", "Proyectista Sanitario", "Línea De Vida", "Letreros Y Totem Corporativo", "Mano De Obra Pintura"],
  "Seguridad": ["CCTV - Intrusión", "Control De Acceso", "Key Master", "Alarmas Antihurto (Desactivadores Y EAS)", "Barreras De Seguridad"],
  "Sistemas": ["Corrientes Débiles", "Programación", "Software", "Hardware"],
  "Equipamiento": ["Racks", "Góndolas Y Hi Cube", "Accesorios Metálicos", "Puertas Automáticas", "Portillones De Acceso", "Pernos, Golillas Y Fijaciones", "UPS Trifásica", "UPS Monofásica", "Transformadores Y Grupo Generadores", "Docklever", "Luminarias LED", "Servidores, Cámaras Y Productos", "Plotter, Impresoras", "Gastronómico", "Ascensores, Montacarga Y Rampas", "Herramientas"],
  "Materiales": ["Insumos Médicos", "Insumos De Embalaje", "Químicos", "Insumos Tecnológicos", "Papelería", "Premios Para Colaboradores", "Placas De Madera, MDF, Terciado", "Pinturas", "Elemento De Estiba"],
  "Servicios": ["Guardias", "Carreros", "Outsourcing Y Personal Tercero", "Parking", "Profesionales De RRHH", "Licenciamiento", "Carro Bomba Y Brigadista", "Diseñador Layout", "Montaje De Equipamiento", "Jardinería", "Casino De Alimentación", "Hotelería", "Transporte De Mercadería", "Transporte De Personal", "Arriendo De Maquinaria"]
};

export const nuevasSubcategorias = {
  'Equipamiento': ['Mobiliario de Oficina', 'Maquinaria'],
  'Materiales': ['Gráfica Publicitaria', 'Repuestos de maquinaria', 'Uniformes corporativos', 'Elementos de protección personal', 'Sellos de seguridad', 'Agua embotellada'],
  'Servicios': ['Arriendo e insumos cafeteria', 'Mantención de maquinaria', 'Control de plagas', 'Higiene', 'Maquina dispensadoras de alimentos', 'Gestión de residuos', 'Arriendo de dispensadores de agua', 'Higienicos (bactereostatico, aromatización, riles, contenedores femeninos)', 'Acustico, música']
};

const compilarCategorias = () => {
  const categoriasSodimac = JSON.parse(JSON.stringify(catSodimacOriginal));
  Object.keys(nuevasSubcategorias).forEach(cat => {
    if (!categoriasSodimac[cat]) categoriasSodimac[cat] = [];
    nuevasSubcategorias[cat].forEach(sub => {
      if (!categoriasSodimac[cat].includes(sub)) categoriasSodimac[cat].push(sub);
    });
  });
  return categoriasSodimac;
};

export const categoriasSodimacCompiladas = compilarCategorias();

export const zonasOpciones = [
  "Todo el País", "Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", 
  "Coquimbo", "Valparaíso", "Metropolitana de Santiago", "O'Higgins", "Maule", 
  "Ñuble", "Biobío", "La Araucanía", "Los Ríos", "Los Lagos", "Aysén", 
  "Magallanes y de la Antártica Chilena"
];

export const macroZonas = {
  "Norte": ["Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo"],
  "Centro": ["Valparaíso", "Metropolitana de Santiago", "O'Higgins", "Maule", "Ñuble"],
  "Sur": ["Biobío", "La Araucanía", "Los Ríos", "Los Lagos"],
  "Austral": ["Aysén", "Magallanes y de la Antártica Chilena"]
};

export const subgerenciasOpciones = ["Sistemas", "Prevención", "Recursos humanos", "Operaciones", "Logistica", "Administración", "Comercial"];
export const clasificacionOpciones = ["Capex", "Opex"];
export const tipoCompraOpciones = ["Spot", "Anualizado"];
export const vigenciaOpciones = ["12 meses", "24 meses", "36 meses", "48 meses", "60 meses"];
export const mesesRenovacionOpciones = ["3", "6", "12", "18", "24"];
export const estadosProcesoOpciones = ["No Iniciado", "Estableciendo alcance, equipo y objetivos", "Desarrollando Bases", "En Negociación y analisis de ofertas", "En Aprobación y Adjudicación", "Gestión Contractual y/o Implementación", "Adjudicado", "Cancelado", "Desierto", "Acuerdo finalizado"];
export const estadosExcluidosGlobal = ['Cancelado', 'Desierto', 'No Iniciado'];
export const coloresGrafico = ['#004A99', '#EE2D24', '#ffc107', '#28a745', '#17a2b8', '#6f42c1', '#e83e8c', '#fd7e14', '#20c997'];