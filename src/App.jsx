import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { categoriasSodimac as catSodimacOriginal, formatearRUT, validarRUT } from './datosSodimac';

const categoriasSodimac = JSON.parse(JSON.stringify(catSodimacOriginal));

const nuevasSubcategorias = {
  'Equipamiento': ['Mobiliario de Oficina', 'Maquinaria'],
  'Materiales': ['Gráfica Publicitaria', 'Repuestos de maquinaria', 'Uniformes corporativos', 'Elementos de protección personal', 'Sellos de seguridad', 'Agua embotellada'],
  'Servicios': ['Arriendo e insumos cafeteria', 'Mantención de maquinaria', 'Control de plagas', 'Higiene', 'Maquina dispensadoras de alimentos', 'Gestión de residuos', 'Arriendo de dispensadores de agua', 'Higienicos (bactereostatico, aromatización, riles, contenedores femeninos)', 'Acustico, música']
};

Object.keys(nuevasSubcategorias).forEach(cat => {
  if (!categoriasSodimac[cat]) categoriasSodimac[cat] = [];
  nuevasSubcategorias[cat].forEach(sub => {
    if (!categoriasSodimac[cat].includes(sub)) categoriasSodimac[cat].push(sub);
  });
});

const zonasOpciones = [
  "Todo el País", "Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", 
  "Coquimbo", "Valparaíso", "Metropolitana de Santiago", "O'Higgins", "Maule", 
  "Ñuble", "Biobío", "La Araucanía", "Los Ríos", "Los Lagos", "Aysén", 
  "Magallanes y de la Antártica Chilena"
];

const macroZonas = {
  "Norte": ["Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo"],
  "Centro": ["Valparaíso", "Metropolitana de Santiago", "O'Higgins", "Maule", "Ñuble"],
  "Sur": ["Biobío", "La Araucanía", "Los Ríos", "Los Lagos"],
  "Austral": ["Aysén", "Magallanes y de la Antártica Chilena"]
};

const sanitizarYCapitalizar = (texto) => {
  if (!texto) return '';
  const textoSeguro = texto.replace(/[<>]/g, '').toLowerCase().trim();
  return textoSeguro.split(/\s+/).map(palabra => 
    palabra.charAt(0).toUpperCase() + palabra.slice(1)
  ).join(' ');
};

const cargarCategoriasDinamicas = () => {
  const guardadas = localStorage.getItem('sodimac_categorias_dinamicas');
  if (guardadas) return JSON.parse(guardadas);
  return categoriasSodimac;
};

export default function App() {
  const [vista, setVista] = useState('registro'); 
  const [tabAdmin, setTabAdmin] = useState('dashboard');
  const [mostrarTerminos, setMostrarTerminos] = useState(false);
  const [usuarioActual, setUsuarioActual] = useState(null);

  const [categoriasDinamicas, setCategoriasDinamicas] = useState(cargarCategoriasDinamicas());
  const [nuevaCatInput, setNuevaCatInput] = useState('');
  const [nuevasSubInputs, setNuevasSubInputs] = useState({});

  useEffect(() => {
    localStorage.setItem('sodimac_categorias_dinamicas', JSON.stringify(categoriasDinamicas));
  }, [categoriasDinamicas]);

  const [filtroGestionNombre, setFiltroGestionNombre] = useState('');
  const [filtroGestionCat, setFiltroGestionCat] = useState('');
  const [filtroGestionSub, setFiltroGestionSub] = useState('');
  const [filtroGestionZona, setFiltroGestionZona] = useState('');

  const [intentosFallidos, setIntentosFallidos] = useState(0);
  const [bloqueoSeguridad, setBloqueoSeguridad] = useState(false);

  useEffect(() => {
    const tiempoBloqueo = localStorage.getItem('sodimac_bloqueo_seguridad');
    if (tiempoBloqueo) {
      const tiempoRestante = parseInt(tiempoBloqueo) - Date.now();
      if (tiempoRestante > 0) {
        setBloqueoSeguridad(true);
        setTimeout(() => {
          setBloqueoSeguridad(false);
          localStorage.removeItem('sodimac_bloqueo_seguridad');
          setIntentosFallidos(0);
        }, tiempoRestante);
      } else {
        localStorage.removeItem('sodimac_bloqueo_seguridad');
      }
    }
  }, []);

  const registrarIntentoFallido = () => {
    const nuevosIntentos = intentosFallidos + 1;
    setIntentosFallidos(nuevosIntentos);
    if (nuevosIntentos >= 3) {
      setBloqueoSeguridad(true);
      const veinticuatroHorasMs = 86400000; 
      localStorage.setItem('sodimac_bloqueo_seguridad', Date.now() + veinticuatroHorasMs);
      alert("⚠️ ALERTA DE SEGURIDAD EXTREMA: 3 intentos fallidos. Sistema bloqueado automáticamente por 24 HORAS.");
      setTimeout(() => {
        setBloqueoSeguridad(false);
        localStorage.removeItem('sodimac_bloqueo_seguridad');
        setIntentosFallidos(0);
      }, veinticuatroHorasMs);
      return true; 
    }
    return false; 
  };

  const registrarAuditoria = async (usuario, estado, tipo) => {
    try {
      const { error } = await supabase.from('auditoria_logins').insert([{
        usuario_intentado: usuario, estado: estado, tipo: tipo
      }]);
      if (error) console.error("Error de auditoría:", error);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (tabAdmin === 'auditoria' && usuarioActual?.usuario === 'mmaquieira') cargarLogsAuditoria();
  }, [tabAdmin, usuarioActual]);

  const [formData, setFormData] = useState({
    razonSocial: '', nombreFantasia: '', rut: '', domicilio: '',
    categoria: [], subcategoria: [], emailPrincipal: '', emailSecundario: '',
    contacto: '', cargo: '', telefono: '', zonasCobertura: [], terminos: false,
    poseeWebsite: 'no', websiteUrl: ''
  });

  const manejarCambioZona = (zona, checked, isEdit = false) => {
    if (isEdit) {
      let nuevasZonas = [...proveedorEditando.zonas_cobertura_arr];
      if (checked) nuevasZonas.push(zona);
      else nuevasZonas = nuevasZonas.filter(z => z !== zona);
      setProveedorEditando({ ...proveedorEditando, zonas_cobertura_arr: nuevasZonas });
    } else {
      let nuevasZonas = [...formData.zonasCobertura];
      if (checked) nuevasZonas.push(zona);
      else nuevasZonas = nuevasZonas.filter(z => z !== zona);
      setFormData({ ...formData, zonasCobertura: nuevasZonas });
    }
  };

  const manejarCambioCategoria = (cat, checked) => {
    let nuevasCat = [...formData.categoria];
    let nuevasSub = [...formData.subcategoria];
    if (checked) nuevasCat.push(cat);
    else {
      nuevasCat = nuevasCat.filter(c => c !== cat);
      const subsParaRemover = categoriasDinamicas[cat] || [];
      nuevasSub = nuevasSub.filter(s => !subsParaRemover.includes(s));
    }
    setFormData({ ...formData, categoria: nuevasCat, subcategoria: nuevasSub });
  };

  const manejarCambioSubcategoria = (sub, checked) => {
    let nuevasSub = [...formData.subcategoria];
    if (checked) nuevasSub.push(sub);
    else nuevasSub = nuevasSub.filter(s => s !== sub);
    setFormData({ ...formData, subcategoria: nuevasSub });
  };

  const manejarEnvioRegistro = async (e) => {
    e.preventDefault();
    if (!validarRUT(formData.rut)) return alert("El RUT ingresado no es válido.");
    if (formData.categoria.length === 0) return alert("Debe seleccionar al menos una Categoría.");
    if (formData.subcategoria.length === 0) return alert("Debe seleccionar al menos una Subcategoría.");
    if (formData.zonasCobertura.length === 0) return alert("Debe seleccionar al menos una Zona de Cobertura.");

    let zonasFinales = formData.zonasCobertura;
    if (zonasFinales.includes("Todo el País")) zonasFinales = ["Todo el País"];

    const rutLimpio = formData.rut.replace(/[<>]/g, '');

    const { data: existentes, error: errExistentes } = await supabase
      .from('proveedores')
      .select('categoria, subcategoria')
      .eq('rut', rutLimpio);

    const websiteFinal = formData.poseeWebsite === 'si' && formData.websiteUrl.trim() !== '' 
      ? formData.websiteUrl.replace(/[<>]/g, '').trim().toLowerCase() 
      : 'No posee';

    const registrosAInsertar = [];
    const duplicadosEncontrados = [];

    formData.subcategoria.forEach(sub => {
      const catAsociada = Object.keys(categoriasDinamicas).find(key => categoriasDinamicas[key].includes(sub));
      const yaExiste = existentes?.some(ex => ex.categoria === catAsociada && ex.subcategoria === sub);
      
      if (yaExiste) {
        duplicadosEncontrados.push(`${catAsociada} -> ${sub}`);
      } else {
        registrosAInsertar.push({
          razon_social: sanitizarYCapitalizar(formData.razonSocial), 
          nombre_fantasia: sanitizarYCapitalizar(formData.nombreFantasia),
          rut: rutLimpio, 
          domicilio_comercial: sanitizarYCapitalizar(formData.domicilio),
          categoria: catAsociada, 
          subcategoria: sub,      
          email_principal: formData.emailPrincipal.replace(/[<>]/g, '').toLowerCase().trim(), 
          email_secundario: formData.emailSecundario ? formData.emailSecundario.replace(/[<>]/g, '').toLowerCase().trim() : '',
          nombre_contacto: sanitizarYCapitalizar(formData.contacto), 
          cargo: sanitizarYCapitalizar(formData.cargo),
          telefono: formData.telefono.replace(/[<>]/g, '').trim(), 
          zonas_cobertura: zonasFinales.join(', '), 
          website: websiteFinal,
          terminos_aceptados: formData.terminos,
          estado: 'Pendiente'
        });
      }
    });

    if (duplicadosEncontrados.length > 0) {
      alert(`❌ ATENCIÓN: El RUT ${rutLimpio} ya se encuentra registrado en el sistema para:\n\n${duplicadosEncontrados.join('\n')}\n\nPor favor, desmárquelas para continuar.`);
      return; 
    }

    if (registrosAInsertar.length > 0) {
      const { error } = await supabase.from('proveedores').insert(registrosAInsertar);
      if (error) { console.error(error); alert("⚠️ Error de sistema. Posible falla de conexión."); }
      else { alert(`✅ Registro enviado con éxito. Se generaron ${registrosAInsertar.length} postulaciones.`); window.location.reload(); }
    }
  };

  const [preLoginPin, setPreLoginPin] = useState('');
  const manejarPreLogin = async (e) => {
    e.preventDefault();
    if (bloqueoSeguridad) return alert("❌ Sistema bloqueado por 24 horas.");
    
    if (preLoginPin === '171819') { 
      await registrarAuditoria('Anónimo', 'Éxito', 'Acceso a PIN Público');
      setVista('login'); setPreLoginPin(''); setIntentosFallidos(0); 
    } else { 
      await registrarAuditoria('Anónimo', 'Fallido', 'Acceso a PIN Público');
      const fueBloqueado = registrarIntentoFallido();
      if (!fueBloqueado) alert(`⚠️ Código incorrecto. Intentos restantes: ${3 - (intentosFallidos + 1)}`); 
      setPreLoginPin(''); 
    }
  };

  const [credenciales, setCredenciales] = useState({ usuario: '', password: '', pin: '' });
  const [proveedores, setProveedores] = useState([]);
  const [administradoresDb, setAdministradoresDb] = useState([]);
  const [logsAuditoria, setLogsAuditoria] = useState([]);
  const [nuevoAdmin, setNuevoAdmin] = useState({ nombre: '', apellido: '', usuario: '', correo: '', password: '', pin: '' });

  const manejarLogin = async (e) => {
    e.preventDefault();
    if (bloqueoSeguridad) return alert("❌ Sistema bloqueado temporalmente por 24 horas.");
    const intentoUsuario = credenciales.usuario.replace(/[<>]/g, '').trim();
    const { data, error } = await supabase.from('administradores').select('*')
      .eq('usuario', intentoUsuario).eq('password', credenciales.password.replace(/[<>]/g, ''))
      .eq('pin', credenciales.pin.replace(/[<>]/g, '')).maybeSingle();

    if (error) return alert("⚠️ Error de conexión seguro.");
    if (!data) {
      await registrarAuditoria(intentoUsuario || 'Desconocido', 'Fallido', 'Login Panel Admin');
      const fueBloqueado = registrarIntentoFallido();
      if (!fueBloqueado) alert(`🔍 Credenciales incorrectas. Intentos restantes: ${3 - (intentosFallidos + 1)}`);
      return;
    }

    await registrarAuditoria(data.usuario, 'Éxito', 'Login Panel Admin');
    setIntentosFallidos(0); setUsuarioActual(data); setVista('panel');
    cargarProveedores(); cargarAdministradores();
  };

  const cargarProveedores = async () => {
    const { data, error } = await supabase.from('proveedores').select('*').order('fecha_registro', { ascending: false });
    if (!error && data) {
      const uniqueMap = new Map();
      const idsToDelete = [];
      const dataLimpia = [];

      const dataOrdenada = [...data].sort((a, b) => {
        if (a.estado === 'Aprobado' && b.estado !== 'Aprobado') return -1;
        if (b.estado === 'Aprobado' && a.estado !== 'Aprobado') return 1;
        return 0; 
      });

      dataOrdenada.forEach(prov => {
        const key = `${prov.rut}_${prov.categoria}_${prov.subcategoria}`;
        if (uniqueMap.has(key)) {
          idsToDelete.push(prov.id); 
        } else {
          uniqueMap.set(key, true);
          dataLimpia.push(prov); 
        }
      });

      if (idsToDelete.length > 0) {
        for (let i = 0; i < idsToDelete.length; i += 100) {
          const chunk = idsToDelete.slice(i, i + 100);
          await supabase.from('proveedores').delete().in('id', chunk);
        }
      }

      dataLimpia.sort((a, b) => new Date(b.fecha_registro) - new Date(a.fecha_registro));
      setProveedores(dataLimpia);
    }
  };

  const cargarAdministradores = async () => {
    const { data, error } = await supabase.from('administradores').select('*').order('id', { ascending: true });
    if (!error && data) setAdministradoresDb(data);
  };

  const cargarLogsAuditoria = async () => {
    const { data, error } = await supabase.from('auditoria_logins').select('*').order('created_at', { ascending: false }).limit(300);
    if (!error && data) setLogsAuditoria(data);
  };

  const aprobarProveedor = async (id) => {
    if(!window.confirm("¿Aprobar este proveedor?")) return;
    const { error } = await supabase.from('proveedores').update({ estado: 'Aprobado', aprobado_por: usuarioActual.usuario }).eq('id', id);
    if (!error) cargarProveedores();
  };

  const revocarProveedor = async (id) => {
    if(!window.confirm("¿Cambiar el estado de este proveedor a Pendiente?")) return;
    const { error } = await supabase.from('proveedores').update({ estado: 'Pendiente', aprobado_por: null }).eq('id', id);
    if (!error) cargarProveedores();
  };

  const rechazarProveedor = async (id) => {
    if(!window.confirm("¿Rechazar y ELIMINAR definitivamente a este proveedor?")) return;
    const { error } = await supabase.from('proveedores').delete().eq('id', id);
    if (!error) cargarProveedores();
  };

  const [proveedorEditando, setProveedorEditando] = useState(null);
  const abrirEditorProveedor = (prov) => {
    const zonasArr = prov.zonas_cobertura ? prov.zonas_cobertura.split(',').map(z => z.trim()) : [];
    setProveedorEditando({ ...prov, zonas_cobertura_arr: zonasArr, website: prov.website || 'No posee' });
  };

  const guardarEdicionProveedor = async (e) => {
    e.preventDefault();
    if (!validarRUT(proveedorEditando.rut)) return alert("El RUT no es válido.");
    if (proveedorEditando.zonas_cobertura_arr.length === 0) return alert("Seleccione al menos una Zona.");

    let zonasFinales = proveedorEditando.zonas_cobertura_arr;
    if (zonasFinales.includes("Todo el País")) zonasFinales = ["Todo el País"];

    const { error } = await supabase.from('proveedores').update({
      razon_social: sanitizarYCapitalizar(proveedorEditando.razon_social),
      nombre_fantasia: sanitizarYCapitalizar(proveedorEditando.nombre_fantasia),
      rut: proveedorEditando.rut.replace(/[<>]/g, ''),
      domicilio_comercial: sanitizarYCapitalizar(proveedorEditando.domicilio_comercial),
      categoria: proveedorEditando.categoria,
      subcategoria: proveedorEditando.subcategoria,
      email_principal: proveedorEditando.email_principal.replace(/[<>]/g, '').toLowerCase().trim(),
      email_secundario: proveedorEditando.email_secundario ? proveedorEditando.email_secundario.replace(/[<>]/g, '').toLowerCase().trim() : '',
      nombre_contacto: sanitizarYCapitalizar(proveedorEditando.nombre_contacto),
      cargo: sanitizarYCapitalizar(proveedorEditando.cargo),
      telefono: proveedorEditando.telefono.replace(/[<>]/g, '').trim(),
      zonas_cobertura: zonasFinales.join(', '),
      website: proveedorEditando.website.replace(/[<>]/g, '').trim()
    }).eq('id', proveedorEditando.id);

    if (error) { console.error(error); alert("⚠️ Error al actualizar."); }
    else { alert("✅ Proveedor actualizado."); setProveedorEditando(null); cargarProveedores(); }
  };

  const descargarPlantillaCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "Razon Social,Nombre de Fantasia,RUT,Domicilio Comercial,Categoria,Subcategoria,Zonas de Cobertura (Separadas por guion -),Email Principal,Email Secundario,Nombre Contacto,Cargo,Telefono\n";
    csvContent += "Empresa Ejemplo SpA,Ejemplo,12345678-9,Av. Siempre Viva 123,Seguridad,Barreras De Seguridad,Metropolitana de Santiago - Valparaíso,contacto@ejemplo.cl,,Juan Perez,Gerente General,+56912345678\n";
    const encodedUri = encodeURI(csvContent); const link = document.createElement("a"); link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Plantilla_Carga_Masiva_Sodimac.csv"); document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const manejarCargaMasiva = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const lines = event.target.result.split(/\r?\n/).filter(line => line.trim() !== "");
      if (lines.length <= 1) return alert("El archivo está vacío.");
      const proveedoresNuevos = [];
      for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, '').trim());
        if (currentLine.length < 12) continue;
        const rutLimpio = formatearRUT(currentLine[2].replace(/[<>]/g, ''));
        if (!rutLimpio) continue;

        let zonasArr = currentLine[6].split('-').map(z => sanitizarYCapitalizar(z.trim())).filter(z => z !== '');
        if (zonasArr.includes("Todo El Pais") || zonasArr.includes("Todo el País")) zonasArr = ["Todo el País"];

        proveedoresNuevos.push({
          razon_social: sanitizarYCapitalizar(currentLine[0]), nombre_fantasia: sanitizarYCapitalizar(currentLine[1]), rut: rutLimpio,
          domicilio_comercial: sanitizarYCapitalizar(currentLine[3]), categoria: sanitizarYCapitalizar(currentLine[4]), subcategoria: sanitizarYCapitalizar(currentLine[5]),
          zonas_cobertura: zonasArr.join(', '), email_principal: currentLine[7].replace(/[<>]/g, '').toLowerCase(), email_secundario: currentLine[8] ? currentLine[8].replace(/[<>]/g, '').toLowerCase() : '',
          nombre_contacto: sanitizarYCapitalizar(currentLine[9]), cargo: sanitizarYCapitalizar(currentLine[10]), telefono: currentLine[11].replace(/[<>]/g, ''), estado: 'Pendiente', terminos_aceptados: true
        });
      }
      if (proveedoresNuevos.length > 0) {
        const { error } = await supabase.from('proveedores').insert(proveedoresNuevos);
        if (error) alert("⚠️ Error de seguridad en base."); else { alert(`✅ ${proveedoresNuevos.length} proveedores agregados.`); cargarProveedores(); setTabAdmin('pendientes'); }
      }
    };
    reader.readAsText(file, 'UTF-8'); e.target.value = null; 
  };

  const crearAdministrador = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('administradores').insert([{
      usuario: nuevoAdmin.usuario.replace(/[<>]/g, '').trim(), password: nuevoAdmin.password.replace(/[<>]/g, ''), pin: nuevoAdmin.pin.replace(/[<>]/g, ''),
      nombre_completo: sanitizarYCapitalizar(`${nuevoAdmin.nombre} ${nuevoAdmin.apellido}`), correo: nuevoAdmin.correo.replace(/[<>]/g, '').toLowerCase().trim()
    }]);
    if (error) alert("⚠️ Error. Verifique que el correo o usuario no existan ya."); else { alert("✅ Usuario creado."); setNuevoAdmin({ nombre: '', apellido: '', usuario: '', correo: '', password: '', pin: '' }); cargarAdministradores(); }
  };

  const eliminarAdmin = async (id, usuario) => {
    if(usuarioActual.usuario !== 'mmaquieira') return alert("No tienes permisos.");
    if(usuario === 'mmaquieira') return alert("No puedes eliminar al usuario principal.");
    if(!window.confirm(`¿Seguro de eliminar a ${usuario}?`)) return;
    const { error } = await supabase.from('administradores').delete().eq('id', id); if (!error) cargarAdministradores();
  };

  const [adminEditando, setAdminEditando] = useState(null);
  const guardarEdicionAdmin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('administradores').update({
      nombre_completo: sanitizarYCapitalizar(adminEditando.nombre_completo), usuario: adminEditando.usuario.replace(/[<>]/g, '').trim(),
      correo: adminEditando.correo.replace(/[<>]/g, '').toLowerCase().trim(), password: adminEditando.password.replace(/[<>]/g, ''), pin: adminEditando.pin.replace(/[<>]/g, '')
    }).eq('id', adminEditando.id);
    if (error) alert("⚠️ Error al actualizar."); else { alert("✅ Usuario actualizado."); setAdminEditando(null); cargarAdministradores(); }
  };

  const handleAgregarCategoria = (e) => {
    e.preventDefault();
    const cat = sanitizarYCapitalizar(nuevaCatInput);
    if(!cat) return;
    if(categoriasDinamicas[cat]) return alert("La categoría ya existe");
    setCategoriasDinamicas({...categoriasDinamicas, [cat]: []});
    setNuevaCatInput('');
  };

  const handleEliminarCategoria = (cat) => {
    if(!window.confirm(`¿Seguro de eliminar la categoría "${cat}" y todas sus subcategorías?`)) return;
    const copia = {...categoriasDinamicas};
    delete copia[cat];
    setCategoriasDinamicas(copia);
  };

  const handleAgregarSubcategoria = (e, cat) => {
    e.preventDefault();
    const sub = sanitizarYCapitalizar(nuevasSubInputs[cat]);
    if(!sub) return;
    if(categoriasDinamicas[cat].includes(sub)) return alert("La subcategoría ya existe");
    setCategoriasDinamicas({ ...categoriasDinamicas, [cat]: [...categoriasDinamicas[cat], sub] });
    setNuevasSubInputs({...nuevasSubInputs, [cat]: ''});
  };

  const handleEliminarSubcategoria = (cat, sub) => {
    if(!window.confirm(`¿Seguro de eliminar la subcategoría "${sub}"?`)) return;
    setCategoriasDinamicas({ ...categoriasDinamicas, [cat]: categoriasDinamicas[cat].filter(s => s !== sub) });
  };
  import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { categoriasSodimac as catSodimacOriginal, formatearRUT, validarRUT } from './datosSodimac';

const categoriasSodimac = JSON.parse(JSON.stringify(catSodimacOriginal));

const nuevasSubcategorias = {
  'Equipamiento': ['Mobiliario de Oficina', 'Maquinaria'],
  'Materiales': ['Gráfica Publicitaria', 'Repuestos de maquinaria', 'Uniformes corporativos', 'Elementos de protección personal', 'Sellos de seguridad', 'Agua embotellada'],
  'Servicios': ['Arriendo e insumos cafeteria', 'Mantención de maquinaria', 'Control de plagas', 'Higiene', 'Maquina dispensadoras de alimentos', 'Gestión de residuos', 'Arriendo de dispensadores de agua', 'Higienicos (bactereostatico, aromatización, riles, contenedores femeninos)', 'Acustico, música']
};

Object.keys(nuevasSubcategorias).forEach(cat => {
  if (!categoriasSodimac[cat]) categoriasSodimac[cat] = [];
  nuevasSubcategorias[cat].forEach(sub => {
    if (!categoriasSodimac[cat].includes(sub)) categoriasSodimac[cat].push(sub);
  });
});

const zonasOpciones = [
  "Todo el País", "Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", 
  "Coquimbo", "Valparaíso", "Metropolitana de Santiago", "O'Higgins", "Maule", 
  "Ñuble", "Biobío", "La Araucanía", "Los Ríos", "Los Lagos", "Aysén", 
  "Magallanes y de la Antártica Chilena"
];

const macroZonas = {
  "Norte": ["Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo"],
  "Centro": ["Valparaíso", "Metropolitana de Santiago", "O'Higgins", "Maule", "Ñuble"],
  "Sur": ["Biobío", "La Araucanía", "Los Ríos", "Los Lagos"],
  "Austral": ["Aysén", "Magallanes y de la Antártica Chilena"]
};

const sanitizarYCapitalizar = (texto) => {
  if (!texto) return '';
  const textoSeguro = texto.replace(/[<>]/g, '').toLowerCase().trim();
  return textoSeguro.split(/\s+/).map(palabra => 
    palabra.charAt(0).toUpperCase() + palabra.slice(1)
  ).join(' ');
};

const cargarCategoriasDinamicas = () => {
  const guardadas = localStorage.getItem('sodimac_categorias_dinamicas');
  if (guardadas) return JSON.parse(guardadas);
  return categoriasSodimac;
};

export default function App() {
  const [vista, setVista] = useState('registro'); 
  const [tabAdmin, setTabAdmin] = useState('dashboard');
  const [mostrarTerminos, setMostrarTerminos] = useState(false);
  const [usuarioActual, setUsuarioActual] = useState(null);

  const [categoriasDinamicas, setCategoriasDinamicas] = useState(cargarCategoriasDinamicas());
  const [nuevaCatInput, setNuevaCatInput] = useState('');
  const [nuevasSubInputs, setNuevasSubInputs] = useState({});

  useEffect(() => {
    localStorage.setItem('sodimac_categorias_dinamicas', JSON.stringify(categoriasDinamicas));
  }, [categoriasDinamicas]);

  const [filtroGestionNombre, setFiltroGestionNombre] = useState('');
  const [filtroGestionCat, setFiltroGestionCat] = useState('');
  const [filtroGestionSub, setFiltroGestionSub] = useState('');
  const [filtroGestionZona, setFiltroGestionZona] = useState('');

  const [intentosFallidos, setIntentosFallidos] = useState(0);
  const [bloqueoSeguridad, setBloqueoSeguridad] = useState(false);

  useEffect(() => {
    const tiempoBloqueo = localStorage.getItem('sodimac_bloqueo_seguridad');
    if (tiempoBloqueo) {
      const tiempoRestante = parseInt(tiempoBloqueo) - Date.now();
      if (tiempoRestante > 0) {
        setBloqueoSeguridad(true);
        setTimeout(() => {
          setBloqueoSeguridad(false);
          localStorage.removeItem('sodimac_bloqueo_seguridad');
          setIntentosFallidos(0);
        }, tiempoRestante);
      } else {
        localStorage.removeItem('sodimac_bloqueo_seguridad');
      }
    }
  }, []);

  const registrarIntentoFallido = () => {
    const nuevosIntentos = intentosFallidos + 1;
    setIntentosFallidos(nuevosIntentos);
    if (nuevosIntentos >= 3) {
      setBloqueoSeguridad(true);
      const veinticuatroHorasMs = 86400000; 
      localStorage.setItem('sodimac_bloqueo_seguridad', Date.now() + veinticuatroHorasMs);
      alert("⚠️ ALERTA DE SEGURIDAD EXTREMA: 3 intentos fallidos. Sistema bloqueado automáticamente por 24 HORAS.");
      setTimeout(() => {
        setBloqueoSeguridad(false);
        localStorage.removeItem('sodimac_bloqueo_seguridad');
        setIntentosFallidos(0);
      }, veinticuatroHorasMs);
      return true; 
    }
    return false; 
  };

  const registrarAuditoria = async (usuario, estado, tipo) => {
    try {
      const { error } = await supabase.from('auditoria_logins').insert([{
        usuario_intentado: usuario, estado: estado, tipo: tipo
      }]);
      if (error) console.error("Error de auditoría:", error);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (tabAdmin === 'auditoria' && usuarioActual?.usuario === 'mmaquieira') cargarLogsAuditoria();
  }, [tabAdmin, usuarioActual]);

  const [formData, setFormData] = useState({
    razonSocial: '', nombreFantasia: '', rut: '', domicilio: '',
    categoria: [], subcategoria: [], emailPrincipal: '', emailSecundario: '',
    contacto: '', cargo: '', telefono: '', zonasCobertura: [], terminos: false,
    poseeWebsite: 'no', websiteUrl: ''
  });

  const manejarCambioZona = (zona, checked, isEdit = false) => {
    if (isEdit) {
      let nuevasZonas = [...proveedorEditando.zonas_cobertura_arr];
      if (checked) nuevasZonas.push(zona);
      else nuevasZonas = nuevasZonas.filter(z => z !== zona);
      setProveedorEditando({ ...proveedorEditando, zonas_cobertura_arr: nuevasZonas });
    } else {
      let nuevasZonas = [...formData.zonasCobertura];
      if (checked) nuevasZonas.push(zona);
      else nuevasZonas = nuevasZonas.filter(z => z !== zona);
      setFormData({ ...formData, zonasCobertura: nuevasZonas });
    }
  };

  const manejarCambioCategoria = (cat, checked) => {
    let nuevasCat = [...formData.categoria];
    let nuevasSub = [...formData.subcategoria];
    if (checked) nuevasCat.push(cat);
    else {
      nuevasCat = nuevasCat.filter(c => c !== cat);
      const subsParaRemover = categoriasDinamicas[cat] || [];
      nuevasSub = nuevasSub.filter(s => !subsParaRemover.includes(s));
    }
    setFormData({ ...formData, categoria: nuevasCat, subcategoria: nuevasSub });
  };

  const manejarCambioSubcategoria = (sub, checked) => {
    let nuevasSub = [...formData.subcategoria];
    if (checked) nuevasSub.push(sub);
    else nuevasSub = nuevasSub.filter(s => s !== sub);
    setFormData({ ...formData, subcategoria: nuevasSub });
  };

  const manejarEnvioRegistro = async (e) => {
    e.preventDefault();
    if (!validarRUT(formData.rut)) return alert("El RUT ingresado no es válido.");
    if (formData.categoria.length === 0) return alert("Debe seleccionar al menos una Categoría.");
    if (formData.subcategoria.length === 0) return alert("Debe seleccionar al menos una Subcategoría.");
    if (formData.zonasCobertura.length === 0) return alert("Debe seleccionar al menos una Zona de Cobertura.");

    let zonasFinales = formData.zonasCobertura;
    if (zonasFinales.includes("Todo el País")) zonasFinales = ["Todo el País"];

    const rutLimpio = formData.rut.replace(/[<>]/g, '');

    const { data: existentes, error: errExistentes } = await supabase
      .from('proveedores')
      .select('categoria, subcategoria')
      .eq('rut', rutLimpio);

    const websiteFinal = formData.poseeWebsite === 'si' && formData.websiteUrl.trim() !== '' 
      ? formData.websiteUrl.replace(/[<>]/g, '').trim().toLowerCase() 
      : 'No posee';

    const registrosAInsertar = [];
    const duplicadosEncontrados = [];

    formData.subcategoria.forEach(sub => {
      const catAsociada = Object.keys(categoriasDinamicas).find(key => categoriasDinamicas[key].includes(sub));
      const yaExiste = existentes?.some(ex => ex.categoria === catAsociada && ex.subcategoria === sub);
      
      if (yaExiste) {
        duplicadosEncontrados.push(`${catAsociada} -> ${sub}`);
      } else {
        registrosAInsertar.push({
          razon_social: sanitizarYCapitalizar(formData.razonSocial), 
          nombre_fantasia: sanitizarYCapitalizar(formData.nombreFantasia),
          rut: rutLimpio, 
          domicilio_comercial: sanitizarYCapitalizar(formData.domicilio),
          categoria: catAsociada, 
          subcategoria: sub,      
          email_principal: formData.emailPrincipal.replace(/[<>]/g, '').toLowerCase().trim(), 
          email_secundario: formData.emailSecundario ? formData.emailSecundario.replace(/[<>]/g, '').toLowerCase().trim() : '',
          nombre_contacto: sanitizarYCapitalizar(formData.contacto), 
          cargo: sanitizarYCapitalizar(formData.cargo),
          telefono: formData.telefono.replace(/[<>]/g, '').trim(), 
          zonas_cobertura: zonasFinales.join(', '), 
          website: websiteFinal,
          terminos_aceptados: formData.terminos,
          estado: 'Pendiente'
        });
      }
    });

    if (duplicadosEncontrados.length > 0) {
      alert(`❌ ATENCIÓN: El RUT ${rutLimpio} ya se encuentra registrado en el sistema para:\n\n${duplicadosEncontrados.join('\n')}\n\nPor favor, desmárquelas para continuar.`);
      return; 
    }

    if (registrosAInsertar.length > 0) {
      const { error } = await supabase.from('proveedores').insert(registrosAInsertar);
      if (error) { console.error(error); alert("⚠️ Error de sistema. Posible falla de conexión."); }
      else { alert(`✅ Registro enviado con éxito. Se generaron ${registrosAInsertar.length} postulaciones.`); window.location.reload(); }
    }
  };

  const [preLoginPin, setPreLoginPin] = useState('');
  const manejarPreLogin = async (e) => {
    e.preventDefault();
    if (bloqueoSeguridad) return alert("❌ Sistema bloqueado por 24 horas.");
    
    if (preLoginPin === '171819') { 
      await registrarAuditoria('Anónimo', 'Éxito', 'Acceso a PIN Público');
      setVista('login'); setPreLoginPin(''); setIntentosFallidos(0); 
    } else { 
      await registrarAuditoria('Anónimo', 'Fallido', 'Acceso a PIN Público');
      const fueBloqueado = registrarIntentoFallido();
      if (!fueBloqueado) alert(`⚠️ Código incorrecto. Intentos restantes: ${3 - (intentosFallidos + 1)}`); 
      setPreLoginPin(''); 
    }
  };

  const [credenciales, setCredenciales] = useState({ usuario: '', password: '', pin: '' });
  const [proveedores, setProveedores] = useState([]);
  const [administradoresDb, setAdministradoresDb] = useState([]);
  const [logsAuditoria, setLogsAuditoria] = useState([]);
  const [nuevoAdmin, setNuevoAdmin] = useState({ nombre: '', apellido: '', usuario: '', correo: '', password: '', pin: '' });

  const manejarLogin = async (e) => {
    e.preventDefault();
    if (bloqueoSeguridad) return alert("❌ Sistema bloqueado temporalmente por 24 horas.");
    const intentoUsuario = credenciales.usuario.replace(/[<>]/g, '').trim();
    const { data, error } = await supabase.from('administradores').select('*')
      .eq('usuario', intentoUsuario).eq('password', credenciales.password.replace(/[<>]/g, ''))
      .eq('pin', credenciales.pin.replace(/[<>]/g, '')).maybeSingle();

    if (error) return alert("⚠️ Error de conexión seguro.");
    if (!data) {
      await registrarAuditoria(intentoUsuario || 'Desconocido', 'Fallido', 'Login Panel Admin');
      const fueBloqueado = registrarIntentoFallido();
      if (!fueBloqueado) alert(`🔍 Credenciales incorrectas. Intentos restantes: ${3 - (intentosFallidos + 1)}`);
      return;
    }

    await registrarAuditoria(data.usuario, 'Éxito', 'Login Panel Admin');
    setIntentosFallidos(0); setUsuarioActual(data); setVista('panel');
    cargarProveedores(); cargarAdministradores();
  };

  const cargarProveedores = async () => {
    const { data, error } = await supabase.from('proveedores').select('*').order('fecha_registro', { ascending: false });
    if (!error && data) {
      const uniqueMap = new Map();
      const idsToDelete = [];
      const dataLimpia = [];

      const dataOrdenada = [...data].sort((a, b) => {
        if (a.estado === 'Aprobado' && b.estado !== 'Aprobado') return -1;
        if (b.estado === 'Aprobado' && a.estado !== 'Aprobado') return 1;
        return 0; 
      });

      dataOrdenada.forEach(prov => {
        const key = `${prov.rut}_${prov.categoria}_${prov.subcategoria}`;
        if (uniqueMap.has(key)) {
          idsToDelete.push(prov.id); 
        } else {
          uniqueMap.set(key, true);
          dataLimpia.push(prov); 
        }
      });

      if (idsToDelete.length > 0) {
        for (let i = 0; i < idsToDelete.length; i += 100) {
          const chunk = idsToDelete.slice(i, i + 100);
          await supabase.from('proveedores').delete().in('id', chunk);
        }
      }

      dataLimpia.sort((a, b) => new Date(b.fecha_registro) - new Date(a.fecha_registro));
      setProveedores(dataLimpia);
    }
  };

  const cargarAdministradores = async () => {
    const { data, error } = await supabase.from('administradores').select('*').order('id', { ascending: true });
    if (!error && data) setAdministradoresDb(data);
  };

  const cargarLogsAuditoria = async () => {
    const { data, error } = await supabase.from('auditoria_logins').select('*').order('created_at', { ascending: false }).limit(300);
    if (!error && data) setLogsAuditoria(data);
  };

  const aprobarProveedor = async (id) => {
    if(!window.confirm("¿Aprobar este proveedor?")) return;
    const { error } = await supabase.from('proveedores').update({ estado: 'Aprobado', aprobado_por: usuarioActual.usuario }).eq('id', id);
    if (!error) cargarProveedores();
  };

  const revocarProveedor = async (id) => {
    if(!window.confirm("¿Cambiar el estado de este proveedor a Pendiente?")) return;
    const { error } = await supabase.from('proveedores').update({ estado: 'Pendiente', aprobado_por: null }).eq('id', id);
    if (!error) cargarProveedores();
  };

  const rechazarProveedor = async (id) => {
    if(!window.confirm("¿Rechazar y ELIMINAR definitivamente a este proveedor?")) return;
    const { error } = await supabase.from('proveedores').delete().eq('id', id);
    if (!error) cargarProveedores();
  };

  const [proveedorEditando, setProveedorEditando] = useState(null);
  const abrirEditorProveedor = (prov) => {
    const zonasArr = prov.zonas_cobertura ? prov.zonas_cobertura.split(',').map(z => z.trim()) : [];
    setProveedorEditando({ ...prov, zonas_cobertura_arr: zonasArr, website: prov.website || 'No posee' });
  };

  const guardarEdicionProveedor = async (e) => {
    e.preventDefault();
    if (!validarRUT(proveedorEditando.rut)) return alert("El RUT no es válido.");
    if (proveedorEditando.zonas_cobertura_arr.length === 0) return alert("Seleccione al menos una Zona.");

    let zonasFinales = proveedorEditando.zonas_cobertura_arr;
    if (zonasFinales.includes("Todo el País")) zonasFinales = ["Todo el País"];

    const { error } = await supabase.from('proveedores').update({
      razon_social: sanitizarYCapitalizar(proveedorEditando.razon_social),
      nombre_fantasia: sanitizarYCapitalizar(proveedorEditando.nombre_fantasia),
      rut: proveedorEditando.rut.replace(/[<>]/g, ''),
      domicilio_comercial: sanitizarYCapitalizar(proveedorEditando.domicilio_comercial),
      categoria: proveedorEditando.categoria,
      subcategoria: proveedorEditando.subcategoria,
      email_principal: proveedorEditando.email_principal.replace(/[<>]/g, '').toLowerCase().trim(),
      email_secundario: proveedorEditando.email_secundario ? proveedorEditando.email_secundario.replace(/[<>]/g, '').toLowerCase().trim() : '',
      nombre_contacto: sanitizarYCapitalizar(proveedorEditando.nombre_contacto),
      cargo: sanitizarYCapitalizar(proveedorEditando.cargo),
      telefono: proveedorEditando.telefono.replace(/[<>]/g, '').trim(),
      zonas_cobertura: zonasFinales.join(', '),
      website: proveedorEditando.website.replace(/[<>]/g, '').trim()
    }).eq('id', proveedorEditando.id);

    if (error) { console.error(error); alert("⚠️ Error al actualizar."); }
    else { alert("✅ Proveedor actualizado."); setProveedorEditando(null); cargarProveedores(); }
  };

  const descargarPlantillaCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "Razon Social,Nombre de Fantasia,RUT,Domicilio Comercial,Categoria,Subcategoria,Zonas de Cobertura (Separadas por guion -),Email Principal,Email Secundario,Nombre Contacto,Cargo,Telefono\n";
    csvContent += "Empresa Ejemplo SpA,Ejemplo,12345678-9,Av. Siempre Viva 123,Seguridad,Barreras De Seguridad,Metropolitana de Santiago - Valparaíso,contacto@ejemplo.cl,,Juan Perez,Gerente General,+56912345678\n";
    const encodedUri = encodeURI(csvContent); const link = document.createElement("a"); link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Plantilla_Carga_Masiva_Sodimac.csv"); document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const manejarCargaMasiva = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const lines = event.target.result.split(/\r?\n/).filter(line => line.trim() !== "");
      if (lines.length <= 1) return alert("El archivo está vacío.");
      const proveedoresNuevos = [];
      for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, '').trim());
        if (currentLine.length < 12) continue;
        const rutLimpio = formatearRUT(currentLine[2].replace(/[<>]/g, ''));
        if (!rutLimpio) continue;

        let zonasArr = currentLine[6].split('-').map(z => sanitizarYCapitalizar(z.trim())).filter(z => z !== '');
        if (zonasArr.includes("Todo El Pais") || zonasArr.includes("Todo el País")) zonasArr = ["Todo el País"];

        proveedoresNuevos.push({
          razon_social: sanitizarYCapitalizar(currentLine[0]), nombre_fantasia: sanitizarYCapitalizar(currentLine[1]), rut: rutLimpio,
          domicilio_comercial: sanitizarYCapitalizar(currentLine[3]), categoria: sanitizarYCapitalizar(currentLine[4]), subcategoria: sanitizarYCapitalizar(currentLine[5]),
          zonas_cobertura: zonasArr.join(', '), email_principal: currentLine[7].replace(/[<>]/g, '').toLowerCase(), email_secundario: currentLine[8] ? currentLine[8].replace(/[<>]/g, '').toLowerCase() : '',
          nombre_contacto: sanitizarYCapitalizar(currentLine[9]), cargo: sanitizarYCapitalizar(currentLine[10]), telefono: currentLine[11].replace(/[<>]/g, ''), estado: 'Pendiente', terminos_aceptados: true
        });
      }
      if (proveedoresNuevos.length > 0) {
        const { error } = await supabase.from('proveedores').insert(proveedoresNuevos);
        if (error) alert("⚠️ Error de seguridad en base."); else { alert(`✅ ${proveedoresNuevos.length} proveedores agregados.`); cargarProveedores(); setTabAdmin('pendientes'); }
      }
    };
    reader.readAsText(file, 'UTF-8'); e.target.value = null; 
  };

  const crearAdministrador = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('administradores').insert([{
      usuario: nuevoAdmin.usuario.replace(/[<>]/g, '').trim(), password: nuevoAdmin.password.replace(/[<>]/g, ''), pin: nuevoAdmin.pin.replace(/[<>]/g, ''),
      nombre_completo: sanitizarYCapitalizar(`${nuevoAdmin.nombre} ${nuevoAdmin.apellido}`), correo: nuevoAdmin.correo.replace(/[<>]/g, '').toLowerCase().trim()
    }]);
    if (error) alert("⚠️ Error. Verifique que el correo o usuario no existan ya."); else { alert("✅ Usuario creado."); setNuevoAdmin({ nombre: '', apellido: '', usuario: '', correo: '', password: '', pin: '' }); cargarAdministradores(); }
  };

  const eliminarAdmin = async (id, usuario) => {
    if(usuarioActual.usuario !== 'mmaquieira') return alert("No tienes permisos.");
    if(usuario === 'mmaquieira') return alert("No puedes eliminar al usuario principal.");
    if(!window.confirm(`¿Seguro de eliminar a ${usuario}?`)) return;
    const { error } = await supabase.from('administradores').delete().eq('id', id); if (!error) cargarAdministradores();
  };

  const [adminEditando, setAdminEditando] = useState(null);
  const guardarEdicionAdmin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('administradores').update({
      nombre_completo: sanitizarYCapitalizar(adminEditando.nombre_completo), usuario: adminEditando.usuario.replace(/[<>]/g, '').trim(),
      correo: adminEditando.correo.replace(/[<>]/g, '').toLowerCase().trim(), password: adminEditando.password.replace(/[<>]/g, ''), pin: adminEditando.pin.replace(/[<>]/g, '')
    }).eq('id', adminEditando.id);
    if (error) alert("⚠️ Error al actualizar."); else { alert("✅ Usuario actualizado."); setAdminEditando(null); cargarAdministradores(); }
  };

  const handleAgregarCategoria = (e) => {
    e.preventDefault();
    const cat = sanitizarYCapitalizar(nuevaCatInput);
    if(!cat) return;
    if(categoriasDinamicas[cat]) return alert("La categoría ya existe");
    setCategoriasDinamicas({...categoriasDinamicas, [cat]: []});
    setNuevaCatInput('');
  };

  const handleEliminarCategoria = (cat) => {
    if(!window.confirm(`¿Seguro de eliminar la categoría "${cat}" y todas sus subcategorías?`)) return;
    const copia = {...categoriasDinamicas};
    delete copia[cat];
    setCategoriasDinamicas(copia);
  };

  const handleAgregarSubcategoria = (e, cat) => {
    e.preventDefault();
    const sub = sanitizarYCapitalizar(nuevasSubInputs[cat]);
    if(!sub) return;
    if(categoriasDinamicas[cat].includes(sub)) return alert("La subcategoría ya existe");
    setCategoriasDinamicas({ ...categoriasDinamicas, [cat]: [...categoriasDinamicas[cat], sub] });
    setNuevasSubInputs({...nuevasSubInputs, [cat]: ''});
  };

  const handleEliminarSubcategoria = (cat, sub) => {
    if(!window.confirm(`¿Seguro de eliminar la subcategoría "${sub}"?`)) return;
    setCategoriasDinamicas({ ...categoriasDinamicas, [cat]: categoriasDinamicas[cat].filter(s => s !== sub) });
  };  