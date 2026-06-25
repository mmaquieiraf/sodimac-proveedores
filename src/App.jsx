import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { categoriasSodimac as catSodimacOriginal, formatearRUT, validarRUT } from './datosSodimac';

// --- INYECCIÓN DINÁMICA DE NUEVAS SUBCATEGORÍAS ---
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

// --- LISTA DE ZONAS Y MACROZONAS ---
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

// SANITIZACIÓN Y CAPITALIZACIÓN
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

  // --- FILTROS DE GESTIÓN ---
  const [filtroGestionNombre, setFiltroGestionNombre] = useState('');
  const [filtroGestionCat, setFiltroGestionCat] = useState('');
  const [filtroGestionSub, setFiltroGestionSub] = useState('');
  const [filtroGestionZona, setFiltroGestionZona] = useState('');

  // --- BARRERA DE SEGURIDAD 2: ANTI-FUERZA BRUTA CON MEMORIA (24 HORAS) ---
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
    if (tabAdmin === 'auditoria' && usuarioActual?.usuario === 'mmaquieira') {
      cargarLogsAuditoria();
    }
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
  const [filtroRut, setFiltroRut] = useState(''); const [filtroNombre, setFiltroNombre] = useState(''); const [filtroCategoria, setFiltroCategoria] = useState(''); const [filtroSubcategoria, setFiltroSubcategoria] = useState(''); const [seleccionados, setSeleccionados] = useState([]);
  const proveedoresAprobados = proveedores.filter(p => p.estado === 'Aprobado');
  const proveedoresFiltrados = proveedoresAprobados.filter(p => p.rut.toLowerCase().includes(filtroRut.toLowerCase()) && p.nombre_fantasia.toLowerCase().includes(filtroNombre.toLowerCase()) && (filtroCategoria === '' || p.categoria === filtroCategoria) && (filtroSubcategoria === '' || p.subcategoria === filtroSubcategoria));
  const toggleSeleccion = (id) => setSeleccionados(seleccionados.includes(id) ? seleccionados.filter(i => i !== id) : [...seleccionados, id]);
  const toggleSeleccionarTodo = (e) => setSeleccionados(e.target.checked ? proveedoresFiltrados.map(p => p.id) : []);
  
  const exportarCSV = () => {
    if (seleccionados.length === 0) return alert("⚠️ Seleccione al menos un proveedor.");
    const dataAExportar = proveedoresFiltrados.filter(p => seleccionados.includes(p.id));
    let csvC = "data:text/csv;charset=utf-8,\uFEFFId,Nombre de la empresa*,Nombre del contacto,Correo electrónico*,Código del idioma,Código de Región\n";
    dataAExportar.forEach(p => { 
      csvC += `,${p.nombre_fantasia.replace(/"/g, '').replace(/,/g, ' ')},${p.nombre_contacto.replace(/"/g, '').replace(/,/g, ' ')},${p.email_principal.replace(/"/g, '').replace(/,/g, ' ')},,\n`; 
    });
    const link = document.createElement("a"); link.setAttribute("href", encodeURI(csvC)); link.setAttribute("download", "proveedores_clean.csv"); document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const exportarExcel = () => {
    if (seleccionados.length === 0) return alert("⚠️ Seleccione al menos un proveedor para exportar.");
    const dataAExportar = proveedoresFiltrados.filter(p => seleccionados.includes(p.id));
    let excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8" /><style>table { border-collapse: collapse; font-family: Arial, sans-serif; } th { background-color: #004A99; color: white; font-weight: bold; border: 1px solid #cccccc; padding: 10px; text-align: left; } td { border: 1px solid #cccccc; padding: 8px; font-size: 13px; } .title { font-size: 18px; font-weight: bold; color: #004A99; padding-bottom: 15px; }</style></head>
      <body><div class="title">Base Oficial de Proveedores Aprobados - Sodimac S.A.</div><table><thead><tr><th>RUT Empresa</th><th>Razón Social</th><th>Nombre Fantasía</th><th>Categoría</th><th>Subcategoría</th><th>Zonas de Cobertura</th><th>Email Principal</th><th>Nombre de Contacto</th><th>Cargo</th><th>Teléfono</th><th>Website</th><th>Fecha Registro</th><th>Aprobado Por</th></tr></thead><tbody>
    `;
    dataAExportar.forEach(p => {
      excelHtml += `<tr><td>${p.rut || ''}</td><td>${p.razon_social || ''}</td><td>${p.nombre_fantasia || ''}</td><td>${p.categoria || ''}</td><td>${p.subcategoria || ''}</td><td>${p.zonas_cobertura || ''}</td><td>${p.email_principal || ''}</td><td>${p.nombre_contacto || ''}</td><td>${p.cargo || ''}</td><td>${p.telefono || ''}</td><td>${p.website || ''}</td><td>${p.fecha_registro ? new Date(p.fecha_registro).toLocaleDateString('es-CL') : ''}</td><td>${p.aprobado_por || ''}</td></tr>`;
    });
    excelHtml += `</tbody></table></body></html>`;
    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' }); const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.setAttribute("download", "proveedores_aprobados_sodimac.xls"); document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const [resetStep, setResetStep] = useState(1); const [resetData, setResetData] = useState({ correo: '', nuevaPass: '', nuevoPin: '', idUsuario: null });
  const buscarCorreo = async (e) => {
    e.preventDefault();
    if (bloqueoSeguridad) return alert("Sistema bloqueado.");
    const { data, error } = await supabase.from('administradores').select('id').eq('correo', resetData.correo.replace(/[<>]/g, '').toLowerCase().trim()).maybeSingle();
    if (error || !data) {
      await registrarAuditoria(resetData.correo, 'Fallido', 'Recuperar Pass');
      const fueBloqueado = registrarIntentoFallido();
      if (!fueBloqueado) alert("No se encontró administrador con este correo.");
    } else { setResetData({ ...resetData, idUsuario: data.id }); setResetStep(2); setIntentosFallidos(0); }
  };
  const actualizarPassword = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('administradores').update({ password: resetData.nuevaPass.replace(/[<>]/g, ''), pin: resetData.nuevoPin.replace(/[<>]/g, '') }).eq('id', resetData.idUsuario);
    if (error) alert("⚠️ Error."); else { alert("✅ Actualizado."); setVista('login'); setResetStep(1); setResetData({ correo: '', nuevaPass: '', nuevoPin: '', idUsuario: null }); }
  };

  const proveedoresGestionFiltrados = proveedores.filter(p => {
    if (p.estado !== 'Aprobado') return false;
    const matchNombre = p.nombre_fantasia.toLowerCase().includes(filtroGestionNombre.toLowerCase()) || p.razon_social.toLowerCase().includes(filtroGestionNombre.toLowerCase());
    const matchCat = filtroGestionCat === '' || p.categoria === filtroGestionCat;
    const matchSub = filtroGestionSub === '' || p.subcategoria === filtroGestionSub;
    const matchZona = p.zonas_cobertura ? p.zonas_cobertura.toLowerCase().includes(filtroGestionZona.toLowerCase()) : true;
    return matchNombre && matchCat && matchSub && matchZona;
  });

  const [tipoGraficoTorta, setTipoGraficoTorta] = useState('categoria');
  const [filtroTortaCat, setFiltroTortaCat] = useState('');
  const [filtroTortaSub, setFiltroTortaSub] = useState([]);
  const [filtroTendenciaCat, setFiltroTendenciaCat] = useState('');
  const [filtroTendenciaSub, setFiltroTendenciaSub] = useState('');
  const [filtroTendenciaTiempo, setFiltroTendenciaTiempo] = useState('30'); 

  const statsDashboard = () => {
    const total = proveedores.length; let fechasOrdenadas = []; const fechasRaw = {}; const renovaciones = [];
    const hace90Dias = new Date(); hace90Dias.setDate(hace90Dias.getDate() - 90);

    let fechaLimite = new Date();
    if (filtroTendenciaTiempo !== 'all') {
      const dias = parseInt(filtroTendenciaTiempo);
      for (let i = dias - 1; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const ds = d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
        fechasOrdenadas.push(ds); fechasRaw[ds] = 0; 
      }
      fechaLimite.setDate(fechaLimite.getDate() - dias);
    }

    const proveedoresTendencia = proveedores.filter(p => {
      return (filtroTendenciaCat === '' || p.categoria === filtroTendenciaCat) && 
             (filtroTendenciaSub === '' || p.subcategoria === filtroTendenciaSub) && 
             (filtroTendenciaTiempo === 'all' || new Date(p.fecha_registro) >= fechaLimite);
    });

    proveedoresTendencia.forEach(p => {
      const fechaCorta = new Date(p.fecha_registro).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
      if (filtroTendenciaTiempo !== 'all') { if (fechasRaw[fechaCorta] !== undefined) fechasRaw[fechaCorta]++; } 
      else { fechasRaw[fechaCorta] = (fechasRaw[fechaCorta] || 0) + 1; }
    });

    if (filtroTendenciaTiempo === 'all') fechasOrdenadas = Object.keys(fechasRaw).sort((a,b) => new Date(`${a.split('-')[2]}-${a.split('-')[1]}-${a.split('-')[0]}`) - new Date(`${b.split('-')[2]}-${b.split('-')[1]}-${b.split('-')[0]}`));
    proveedores.forEach(p => { if(new Date(p.fecha_registro) < hace90Dias) renovaciones.push(p); });

    return { total, fechasRaw, fechasOrdenadas, renovaciones };
  };
  const stats = statsDashboard();

  const chartWidth = 800; const chartHeight = 250; const padX = 40; const padY = 30;
  const maxReg = Math.max(...stats.fechasOrdenadas.map(f => stats.fechasRaw[f]), 1);
  const stepX = stats.fechasOrdenadas.length > 1 ? (chartWidth - 2 * padX) / (stats.fechasOrdenadas.length - 1) : 0;
  const puntosLinea = stats.fechasOrdenadas.map((f, i) => `${padX + i * stepX},${chartHeight - padY - ((stats.fechasRaw[f] / maxReg) * (chartHeight - 2 * padY))}`).join(' ');

  const enviarRecordatorio = (prov) => {
    const destinatarios = prov.email_secundario ? `${prov.email_principal},${prov.email_secundario}` : prov.email_principal;
    const asunto = encodeURIComponent("Actualización de Datos - Portal Proveedores Sodimac");
    const cuerpo = encodeURIComponent(`Estimado(a) proveedor ${prov.razon_social},\n\nPor favor actualizar sus datos de contacto en el portal.\n\nSaludos cordiales,\nSodimac S.A.`);
    window.location.href = `mailto:${destinatarios}?subject=${asunto}&body=${cuerpo}`;
  };

  const coloresGrafico = ['#004A99', '#EE2D24', '#ffc107', '#28a745', '#17a2b8', '#6f42c1', '#e83e8c', '#fd7e14', '#20c997'];
  const proveedoresParaTorta = proveedoresAprobados.filter(p => {
    return (filtroTortaCat === '' || p.categoria === filtroTortaCat) && (filtroTortaSub.length === 0 || filtroTortaSub.includes(p.subcategoria));
  });

  const tortaData = {};
  proveedoresParaTorta.forEach(p => {
    const clave = tipoGraficoTorta === 'categoria' ? p.categoria : p.subcategoria;
    tortaData[clave] = (tortaData[clave] || 0) + 1;
  });
  let cumulativePercent = 0;
  const pieSlices = Object.entries(tortaData).map(([key, val], i) => {
    const percent = proveedoresParaTorta.length > 0 ? (val / proveedoresParaTorta.length) * 100 : 0;
    const slice = `${coloresGrafico[i % coloresGrafico.length]} ${cumulativePercent}% ${cumulativePercent + percent}%`;
    cumulativePercent += percent;
    return { key, val, percent, color: coloresGrafico[i % coloresGrafico.length], slice };
  });
  const tortaGradient = proveedoresParaTorta.length > 0 ? `conic-gradient(${pieSlices.map(s => s.slice).join(', ')})` : '#e0e0e0';

  const [filtroMapaCat, setFiltroMapaCat] = useState(''); const [filtroMapaSub, setFiltroMapaSub] = useState(''); const [filtroMapaZona, setFiltroMapaZona] = useState('');
  const statsMapa = () => {
    const conteo = {}; zonasOpciones.filter(z => z !== "Todo el País").forEach(z => conteo[z] = 0);
    const filtradosMapa = proveedoresAprobados.filter(p => {
      let zonaMatch = true;
      if (filtroMapaZona !== '') {
        const zProv = p.zonas_cobertura ? p.zonas_cobertura.split(',').map(z => z.trim()) : [];
        zonaMatch = zProv.includes('Todo el País') || zProv.includes(filtroMapaZona);
      }
      return (filtroMapaCat === '' || p.categoria === filtroMapaCat) && (filtroMapaSub === '' || p.subcategoria === filtroMapaSub) && zonaMatch;
    });
    filtradosMapa.forEach(p => {
      if (!p.zonas_cobertura) return;
      const zP = p.zonas_cobertura.split(',').map(z => z.trim());
      if (zP.includes('Todo el País')) Object.keys(conteo).forEach(z => conteo[z]++); else zP.forEach(z => { if (conteo[z] !== undefined) conteo[z]++; });
    });
    return { conteo, maxMapa: Math.max(...Object.values(conteo), 1), totalMapeados: filtradosMapa.length };
  };
  const mapStats = statsMapa();

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#f4f4f4', minHeight: '100vh', padding: '20px' }}>
      
      {/* NAVBAR */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#004A99', padding: '15px 20px', borderRadius: '8px', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/logo.png" alt="Sodimac" style={{ height: '50px', objectFit: 'contain', transform: 'scale(2.8)', transformOrigin: 'left center', marginLeft: '5px' }} />
          <span style={{ fontSize: '22px', fontWeight: '600', letterSpacing: '0.5px', zIndex: 10, marginLeft: '4cm' }}>Portal de Proveedores</span>
        </div>
        <div style={{ zIndex: 10, display: 'flex', alignItems: 'center', gap: '15px' }}>
          {usuarioActual && <span style={{ fontSize: '14px', color: '#cce5ff', borderRight: '1px solid rgba(255,255,255,0.3)', paddingRight: '15px' }}>👤 {usuarioActual.usuario}</span>}
          {['login', 'pre_login', 'recuperar'].includes(vista) && <button onClick={() => setVista('registro')} style={{ background: 'none', border: '1px solid white', color: 'white', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>Ir a Registro</button>}
          {vista === 'registro' && <button onClick={() => setVista('pre_login')} style={{ background: 'none', border: '1px solid white', color: 'white', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>Acceso Interno</button>}
          {vista === 'panel' && <button onClick={() => {setUsuarioActual(null); setVista('registro'); setTabAdmin('dashboard');}} style={{ background: '#EE2D24', border: 'none', color: 'white', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>Cerrar Sesión</button>}
        </div>
      </div>

      {/* MODAL EDICIÓN PROVEEDOR */}
      {proveedorEditando && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={() => setProveedorEditando(null)} style={{ position: 'absolute', top: '15px', right: '20px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#EE2D24', fontWeight: 'bold' }}>&times;</button>
            <h2 style={{ color: '#004A99', marginTop: 0, borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Editar Datos del Proveedor</h2>
            <form onSubmit={guardarEdicionProveedor}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Razón Social *</label><input required value={proveedorEditando.razon_social} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setProveedorEditando({...proveedorEditando, razon_social: e.target.value})} /></div>
                <div><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Nombre de Fantasía *</label><input required value={proveedorEditando.nombre_fantasia} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setProveedorEditando({...proveedorEditando, nombre_fantasia: e.target.value})} /></div>
                <div><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>RUT Empresa *</label><input required value={proveedorEditando.rut} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setProveedorEditando({...proveedorEditando, rut: formatearRUT(e.target.value)})} /></div>
                <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Domicilio Comercial *</label><input required value={proveedorEditando.domicilio_comercial} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setProveedorEditando({...proveedorEditando, domicilio_comercial: e.target.value})} /></div>
                
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Website Proveedor</label>
                  <input type="text" value={proveedorEditando.website || ''} placeholder="Ej: https://www.tuempresa.cl (Dejar en 'No posee' si no tiene)" style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setProveedorEditando({...proveedorEditando, website: e.target.value})} />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Categoría *</label>
                  <select required value={proveedorEditando.categoria} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setProveedorEditando({...proveedorEditando, categoria: e.target.value, subcategoria: ''})}>
                    <option value="">Seleccione...</option>
                    {Object.keys(categoriasDinamicas).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Subcategoría *</label>
                  <select required value={proveedorEditando.subcategoria} disabled={!proveedorEditando.categoria} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setProveedorEditando({...proveedorEditando, subcategoria: e.target.value})}>
                    <option value="">Seleccione...</option>
                    {proveedorEditando.categoria && categoriasDinamicas[proveedorEditando.categoria]?.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Zona(s) de Cobertura *</label>
                  <div style={{ marginTop: '5px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', maxHeight: '120px', overflowY: 'auto', backgroundColor: '#fafafa', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {zonasOpciones.map(zona => (
                      <label key={zona} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={proveedorEditando.zonas_cobertura_arr.includes(zona)} onChange={(e) => manejarCambioZona(zona, e.target.checked, true)} /> {zona}
                      </label>
                    ))}
                  </div>
                </div>
                <div><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Email Principal *</label><input type="email" required value={proveedorEditando.email_principal} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setProveedorEditando({...proveedorEditando, email_principal: e.target.value})} /></div>
                <div><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Email Secundario</label><input type="email" value={proveedorEditando.email_secundario || ''} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setProveedorEditando({...proveedorEditando, email_secundario: e.target.value})} /></div>
                <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Contacto *</label><input required value={proveedorEditando.nombre_contacto} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setProveedorEditando({...proveedorEditando, nombre_contacto: e.target.value})} /></div>
                <div><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Cargo *</label><input required value={proveedorEditando.cargo} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setProveedorEditando({...proveedorEditando, cargo: e.target.value})} /></div>
                <div><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Teléfono *</label><input required value={proveedorEditando.telefono} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setProveedorEditando({...proveedorEditando, telefono: e.target.value})} /></div>
              </div>
              <button type="submit" disabled={bloqueoSeguridad} style={{ width: '100%', padding: '12px', marginTop: '20px', backgroundColor: bloqueoSeguridad ? '#ccc' : '#004A99', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: bloqueoSeguridad ? 'not-allowed' : 'pointer' }}>GUARDAR CAMBIOS</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDICIÓN ADMIN */}
      {adminEditando && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', maxWidth: '500px', width: '100%', position: 'relative' }}>
            <button onClick={() => setAdminEditando(null)} style={{ position: 'absolute', top: '15px', right: '20px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#EE2D24', fontWeight: 'bold' }}>&times;</button>
            <h2 style={{ color: '#004A99', marginTop: 0, borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Editar Administrador</h2>
            <form onSubmit={guardarEdicionAdmin} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
              <div><label style={{ fontSize: '13px', fontWeight: 'bold' }}>Nombre Completo</label><input required value={adminEditando.nombre_completo} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setAdminEditando({...adminEditando, nombre_completo: e.target.value})} /></div>
              <div><label style={{ fontSize: '13px', fontWeight: 'bold' }}>Usuario</label><input required value={adminEditando.usuario} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setAdminEditando({...adminEditando, usuario: e.target.value})} /></div>
              <div><label style={{ fontSize: '13px', fontWeight: 'bold' }}>Correo</label><input required type="email" value={adminEditando.correo} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setAdminEditando({...adminEditando, correo: e.target.value})} /></div>
              <div><label style={{ fontSize: '13px', fontWeight: 'bold' }}>Contraseña</label><input required type="text" value={adminEditando.password} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setAdminEditando({...adminEditando, password: e.target.value})} /></div>
              <div><label style={{ fontSize: '13px', fontWeight: 'bold' }}>PIN (6 dígitos)</label><input required type="text" maxLength="6" value={adminEditando.pin} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setAdminEditando({...adminEditando, pin: e.target.value})} /></div>
              <button type="submit" disabled={bloqueoSeguridad} style={{ padding: '12px', marginTop: '10px', backgroundColor: bloqueoSeguridad ? '#ccc' : '#004A99', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: bloqueoSeguridad ? 'not-allowed' : 'pointer' }}>GUARDAR USUARIO</button>
            </form>
          </div>
        </div>
      )}

      {/* REGISTRO PÚBLICO */}
      {vista === 'registro' && (
        <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#333', fontSize: '22px', borderBottom: '3px solid #EE2D24', paddingBottom: '10px', marginBottom: '20px' }}>Registro de Nuevos Proveedores</h2>
          <form onSubmit={manejarEnvioRegistro}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Razón Social *</label><input required style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setFormData({...formData, razonSocial: e.target.value})} /></div>
              <div><label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Nombre de Fantasía *</label><input required style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setFormData({...formData, nombreFantasia: e.target.value})} /></div>
              <div><label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>RUT Empresa *</label><input required placeholder="12345678-9" value={formData.rut} style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setFormData({...formData, rut: formatearRUT(e.target.value)})} /></div>
              <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Domicilio Comercial *</label><input required style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setFormData({...formData, domicilio: e.target.value})} /></div>
              
              <div style={{ gridColumn: '1 / -1', padding: '15px', backgroundColor: '#f0f8ff', border: '1px solid #cce5ff', borderRadius: '4px' }}>
                <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#004A99' }}>Website Proveedor</label>
                <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                  <label style={{ fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <input type="radio" name="website_option" checked={formData.poseeWebsite === 'si'} onChange={() => setFormData({...formData, poseeWebsite: 'si'})} /> Poseo Website
                  </label>
                  <label style={{ fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <input type="radio" name="website_option" checked={formData.poseeWebsite === 'no'} onChange={() => setFormData({...formData, poseeWebsite: 'no', websiteUrl: ''})} /> No poseo website
                  </label>
                </div>
                {formData.poseeWebsite === 'si' && (
                  <input type="url" placeholder="https://www.tuempresa.cl" required value={formData.websiteUrl} style={{ width: '100%', padding: '10px', marginTop: '10px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setFormData({...formData, websiteUrl: e.target.value})} />
                )}
              </div>
              
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Categoría(s) *</label>
                <div style={{ marginTop: '5px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', maxHeight: '160px', overflowY: 'auto', backgroundColor: '#fafafa', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {Object.keys(categoriasDinamicas).map(cat => (
                    <label key={cat} style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={formData.categoria.includes(cat)} onChange={(e) => manejarCambioCategoria(cat, e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} /> {cat}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Subcategoría(s) *</label>
                <div style={{ marginTop: '5px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', maxHeight: '200px', overflowY: 'auto', backgroundColor: '#fafafa' }}>
                  {formData.categoria.length === 0 ? (
                    <span style={{ fontSize: '13px', color: '#999' }}>Seleccione una categoría para ver las opciones...</span>
                  ) : (
                    formData.categoria.map(cat => (
                      <div key={cat} style={{ marginBottom: '15px' }}>
                        <strong style={{ fontSize: '13px', color: '#004A99', display: 'block', marginBottom: '8px', borderBottom: '1px solid #ddd', paddingBottom: '4px' }}>{cat}</strong>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          {categoriasDinamicas[cat]?.map(sub => (
                            <label key={sub} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                              <input type="checkbox" checked={formData.subcategoria.includes(sub)} onChange={(e) => manejarCambioSubcategoria(sub, e.target.checked)} style={{ width: '14px', height: '14px', cursor: 'pointer' }} /> {sub}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Zona(s) de Cobertura *</label>
                <div style={{ marginTop: '5px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', maxHeight: '160px', overflowY: 'auto', backgroundColor: '#fafafa', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {zonasOpciones.map(zona => (
                    <label key={zona} style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={formData.zonasCobertura.includes(zona)} onChange={(e) => manejarCambioZona(zona, e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} /> {zona}
                    </label>
                  ))}
                </div>
              </div>

              <div><label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Email Principal *</label><input type="email" required style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setFormData({...formData, emailPrincipal: e.target.value})} /></div>
              <div><label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Email Secundario</label><input type="email" style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setFormData({...formData, emailSecundario: e.target.value})} /></div>
              <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Nombre Contacto *</label><input required style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setFormData({...formData, contacto: e.target.value})} /></div>
              <div><label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Cargo *</label><input required style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setFormData({...formData, cargo: e.target.value})} /></div>
              <div><label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Teléfono *</label><input required style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setFormData({...formData, telefono: e.target.value})} /></div>
            </div>
            
            <div style={{ marginTop: '25px', padding: '15px', backgroundColor: '#f9f9f9', border: '1px solid #ddd', borderRadius: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
                <input type="checkbox" required onChange={e => setFormData({...formData, terminos: e.target.checked})} style={{ width: '18px', height: '18px' }} />
                <span>He leído y acepto los <strong onClick={(e) => {e.preventDefault(); e.stopPropagation(); setMostrarTerminos(true);}} style={{ color: '#004A99', textDecoration: 'underline', cursor: 'pointer' }}>Términos y Condiciones</strong> de Sodimac.</span>
              </label>
            </div>
            <button type="submit" disabled={bloqueoSeguridad} style={{ width: '100%', padding: '15px', marginTop: '25px', backgroundColor: bloqueoSeguridad ? '#ccc' : '#EE2D24', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: bloqueoSeguridad ? 'not-allowed' : 'pointer', borderRadius: '4px' }}>ENVIAR REGISTRO</button>
          </form>
        </div>
      )}

      {/* LOGIN PIN Y MODAL T&C */}
      {vista === 'pre_login' && (
        <div style={{ maxWidth: '400px', margin: '50px auto', backgroundColor: 'white', padding: '40px 30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h2 style={{ textAlign: 'center', color: '#004A99', marginBottom: '10px', fontSize: '24px' }}>Seguridad de Acceso</h2>
          <form onSubmit={manejarPreLogin}>
            <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'center' }}>
              <input required type="password" maxLength="6" placeholder="******" value={preLoginPin} onChange={e => setPreLoginPin(e.target.value)} style={{ width: '100%', maxWidth: '250px', padding: '15px', border: '2px solid #ccc', borderRadius: '8px', letterSpacing: '15px', textAlign: 'center', fontSize: '28px', outline: 'none', fontWeight: 'bold', color: '#004A99' }} />
            </div>
            <button type="submit" disabled={bloqueoSeguridad} style={{ width: '100%', padding: '14px', backgroundColor: bloqueoSeguridad ? '#ccc' : '#004A99', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '14px', borderRadius: '4px', cursor: bloqueoSeguridad ? 'not-allowed' : 'pointer' }}>VALIDAR ACCESO</button>
            <button type="button" onClick={() => setVista('registro')} style={{ width: '100%', padding: '14px', marginTop: '10px', backgroundColor: 'transparent', border: '1px solid #ccc', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>VOLVER</button>
          </form>
        </div>
      )}

      {vista === 'login' && (
        <div style={{ maxWidth: '400px', margin: '50px auto', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h2 style={{ textAlign: 'center', color: '#004A99', marginBottom: '25px' }}>Ingreso de Administrador</h2>
          <form onSubmit={manejarLogin}>
            <div style={{ marginBottom: '15px' }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>Usuario</label><input required style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setCredenciales({...credenciales, usuario: e.target.value})} /></div>
            <div style={{ marginBottom: '15px' }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>Contraseña</label><input required type="password" style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setCredenciales({...credenciales, password: e.target.value})} /></div>
            <div style={{ marginBottom: '25px' }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>PIN Interno</label><input required type="password" maxLength="6" style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', letterSpacing: '3px' }} onChange={e => setCredenciales({...credenciales, pin: e.target.value})} /></div>
            <button type="submit" disabled={bloqueoSeguridad} style={{ width: '100%', padding: '12px', backgroundColor: bloqueoSeguridad ? '#ccc' : '#004A99', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: bloqueoSeguridad ? 'not-allowed' : 'pointer' }}>INGRESAR AL PANEL</button>
            <div style={{ textAlign: 'center', marginTop: '15px' }}><button type="button" onClick={() => setVista('recuperar')} style={{ background: 'none', border: 'none', color: '#004A99', textDecoration: 'underline', fontSize: '12px', cursor: 'pointer' }}>¿Olvidaste tu contraseña?</button></div>
          </form>
        </div>
      )}

      {vista === 'recuperar' && (
        <div style={{ maxWidth: '400px', margin: '50px auto', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h2 style={{ textAlign: 'center', color: '#004A99', marginBottom: '10px' }}>Recuperar Acceso</h2>
          {resetStep === 1 ? (
            <form onSubmit={buscarCorreo}>
              <div style={{ marginBottom: '20px' }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>Correo Registrado</label><input required type="email" style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setResetData({...resetData, correo: e.target.value})} /></div>
              <button type="submit" disabled={bloqueoSeguridad} style={{ width: '100%', padding: '12px', backgroundColor: bloqueoSeguridad ? '#ccc' : '#004A99', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: bloqueoSeguridad ? 'not-allowed' : 'pointer' }}>VERIFICAR</button>
            </form>
          ) : (
            <form onSubmit={actualizarPassword}>
              <div style={{ marginBottom: '15px' }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>Nueva Contraseña</label><input required type="password" style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setResetData({...resetData, nuevaPass: e.target.value})} /></div>
              <div style={{ marginBottom: '25px' }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>Nuevo PIN</label><input required type="password" maxLength="6" style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setResetData({...resetData, nuevoPin: e.target.value})} /></div>
              <button type="submit" disabled={bloqueoSeguridad} style={{ width: '100%', padding: '12px', backgroundColor: bloqueoSeguridad ? '#ccc' : '#28a745', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: bloqueoSeguridad ? 'not-allowed' : 'pointer' }}>GUARDAR</button>
            </form>
          )}
        </div>
      )}

      {mostrarTerminos && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={() => setMostrarTerminos(false)} style={{ position: 'absolute', top: '15px', right: '20px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#EE2D24', fontWeight: 'bold' }}>&times;</button>
            <h2 style={{ color: '#004A99', marginTop: 0, borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Términos y condiciones</h2>
            <div style={{ fontSize: '13px', color: '#444', lineHeight: '1.6' }}>
              <p>Al completar y enviar el formulario de registro de proveedores, el postulante declara y acepta expresamente que la información proporcionada podrá ser utilizada por Sodimac S.A. para fines de evaluación, contacto, validación, precalificación y eventual incorporación como proveedor en procesos de negociación, cotización, homologación, compra o contratación.</p>
              <strong>1. Información recopilada</strong><p>Sodimac podrá recopilar, almacenar, organizar, revisar y tratar información de carácter empresarial y de contacto.</p>
              <strong>2. Finalidad del tratamiento</strong><p>Los datos serán tratados con la exclusiva finalidad de: gestionar el registro, evaluar idoneidad, contactar, administrar procesos y mantener historial.</p>
              <strong>3. Aceptación expresa</strong><p>El proveedor declara que ha leído y comprendido estos términos, autoriza el tratamiento y entiende que no garantiza adjudicación.</p>
              <strong>4. Declaración sobre la información entregada</strong><p>El proveedor declara que la información proporcionada es veraz, actualizada y suficiente.</p>
              <strong>5. Conservación de la información</strong><p>Sodimac podrá conservar la información por el tiempo necesario.</p>
              <strong>6. Encargados y acceso</strong><p>El acceso quedará restringido a personal autorizado.</p>
              <strong>7. Modificaciones</strong><p>Sodimac podrá modificar estos términos publicando la versión actualizada.</p>
              <strong>8. Aceptación final</strong><p>Al enviar este formulario, acepto estos Términos y autorizo a Sodimac S.A. a tratar mis datos.</p>
            </div>
            <button onClick={() => setMostrarTerminos(false)} style={{ width: '100%', padding: '12px', marginTop: '15px', backgroundColor: '#004A99', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>CERRAR</button>
          </div>
        </div>
      )}

      {/* PANEL ADMINISTRATIVO PRINCIPAL */}
      {vista === 'panel' && (
        <div style={{ maxWidth: '1200px', margin: '0 auto', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          
          <div style={{ display: 'flex', borderBottom: '3px solid #EE2D24', paddingBottom: '10px', marginBottom: '20px', gap: '20px', overflowX: 'auto' }}>
            <h2 onClick={() => setTabAdmin('dashboard')} style={{ color: tabAdmin === 'dashboard' ? '#004A99' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>Dashboard</h2>
            <h2 onClick={() => setTabAdmin('pendientes')} style={{ color: tabAdmin === 'pendientes' ? '#004A99' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>Pendientes</h2>
            <h2 onClick={() => setTabAdmin('gestion')} style={{ color: tabAdmin === 'gestion' ? '#004A99' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>Gestión</h2>
            <h2 onClick={() => setTabAdmin('actualizacion_form')} style={{ color: tabAdmin === 'actualizacion_form' ? '#004A99' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>Actualización Formulario</h2>
            <h2 onClick={() => {setTabAdmin('exportar'); setSeleccionados([]);}} style={{ color: tabAdmin === 'exportar' ? '#28a745' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>Exportar Aprobados</h2>
            <h2 onClick={() => setTabAdmin('crear_admin')} style={{ color: tabAdmin === 'crear_admin' ? '#004A99' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>Admin / Roles</h2>
            {usuarioActual?.usuario === 'mmaquieira' && (
              <h2 onClick={() => { setTabAdmin('auditoria'); cargarLogsAuditoria(); }} style={{ color: tabAdmin === 'auditoria' ? '#004A99' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap', borderLeft: '2px solid #ccc', paddingLeft: '20px' }}>🛡️ Auditoría</h2>
            )}
          </div>
          
          {tabAdmin === 'dashboard' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                <div style={{ backgroundColor: '#004A99', color: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase' }}>Total Proveedores</h3>
                  <p style={{ margin: '10px 0 0 0', fontSize: '36px', fontWeight: 'bold' }}>{proveedores.length}</p>
                </div>
                <div style={{ backgroundColor: '#EE2D24', color: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase' }}>Aprobados en Base</h3>
                  <p style={{ margin: '10px 0 0 0', fontSize: '36px', fontWeight: 'bold' }}>{proveedoresAprobados.length}</p>
                </div>
                <div style={{ backgroundColor: '#ffc107', color: '#333', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase' }}>Requieren Actualización (>90 días)</h3>
                  <p style={{ margin: '10px 0 0 0', fontSize: '36px', fontWeight: 'bold' }}>{stats.renovaciones.length}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px', marginBottom: '30px' }}>
                <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px', backgroundColor: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0, color: '#333', fontSize: '16px' }}>Distribución Aprobados</h3>
                    <select style={{ padding: '5px', fontSize: '12px', borderRadius: '4px', border: '1px solid #ccc' }} onChange={e => setTipoGraficoTorta(e.target.value)} value={tipoGraficoTorta}>
                      <option value="categoria">Ver por Categoría</option>
                      <option value="subcategoria">Ver por Subcategoría</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '20px', backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}>
                    <select style={{ padding: '6px', fontSize: '11px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '130px' }} onChange={e => {setFiltroTortaCat(e.target.value); setFiltroTortaSub([]);}} value={filtroTortaCat}>
                      <option value="">Todas las Categorías</option>
                      {Object.keys(categoriasDinamicas).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    
                    <div style={{ flex: 1, padding: '5px', border: '1px solid #ccc', borderRadius: '4px', maxHeight: '55px', overflowY: 'auto', backgroundColor: '#fff', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {filtroTortaCat === '' ? <span style={{ fontSize: '11px', color: '#999', padding: '2px' }}>Seleccione una categoría para filtrar subcategorías...</span> : 
                        categoriasDinamicas[filtroTortaCat]?.map(sub => (
                          <label key={sub} style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', backgroundColor: '#f0f0f0', padding: '2px 6px', border: '1px solid #ccc', borderRadius: '12px' }}>
                            <input type="checkbox" checked={filtroTortaSub.includes(sub)} onChange={(e) => {
                              if (e.target.checked) setFiltroTortaSub([...filtroTortaSub, sub]);
                              else setFiltroTortaSub(filtroTortaSub.filter(s => s !== sub));
                            }} style={{ margin: 0, cursor: 'pointer' }} /> {sub}
                          </label>
                        ))
                      }
                    </div>
                  </div>

                  {proveedoresParaTorta.length === 0 ? <p style={{ textAlign: 'center', color: '#999', marginTop: '50px' }}>No hay aprobados con estos filtros</p> : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '200px', height: '200px', borderRadius: '50%', background: tortaGradient, marginBottom: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}></div>
                      <div style={{ width: '100%', maxHeight: '150px', overflowY: 'auto' }}>
                        {pieSlices.map(s => (
                          <div key={s.key} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', fontSize: '12px' }}>
                            <div style={{ width: '12px', height: '12px', backgroundColor: s.color, marginRight: '10px', borderRadius: '2px' }}></div>
                            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.key}</span>
                            <span style={{ fontWeight: 'bold' }}>{s.val} ({Math.round(s.percent)}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px', backgroundColor: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 5px 0', color: '#333', fontSize: '16px' }}>Tendencia de Registros</h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <select style={{ padding: '5px', fontSize: '11px', borderRadius: '4px', border: '1px solid #ccc', maxWidth: '140px' }} onChange={e => {setFiltroTendenciaCat(e.target.value); setFiltroTendenciaSub('');}} value={filtroTendenciaCat}>
                        <option value="">Categoría (Todas)</option>
                        {Object.keys(categoriasDinamicas).map(cat => <option key={cat} value={cat}>{cat.substring(0,20)}...</option>)}
                      </select>
                      <select disabled={!filtroTendenciaCat} style={{ padding: '5px', fontSize: '11px', borderRadius: '4px', border: '1px solid #ccc', maxWidth: '140px' }} onChange={e => setFiltroTendenciaSub(e.target.value)} value={filtroTendenciaSub}>
                        <option value="">Subcat (Todas)</option>
                        {filtroTendenciaCat && categoriasDinamicas[filtroTendenciaCat]?.map(sub => <option key={sub} value={sub}>{sub.substring(0,20)}...</option>)}
                      </select>
                      <select style={{ padding: '5px', fontSize: '11px', borderRadius: '4px', border: '1px solid #ccc', fontWeight: 'bold' }} onChange={e => setFiltroTendenciaTiempo(e.target.value)} value={filtroTendenciaTiempo}>
                        <option value="7">Últimos 7 días</option><option value="15">Últimos 15 días</option><option value="30">Últimos 30 días</option><option value="all">Histórico completo</option>
                      </select>
                    </div>
                  </div>
                  {stats.fechasOrdenadas.length === 0 ? <p style={{ textAlign: 'center', color: '#999', marginTop: '50px' }}>No hay registros para graficar</p> : (
                    <div style={{ position: 'relative', width: '100%', height: '210px' }}>
                      <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
                        <line x1={padX} y1={chartHeight - padY} x2={chartWidth} y2={chartHeight - padY} stroke="#ccc" strokeWidth="2" />
                        <line x1={padX} y1="0" x2={padX} y2={chartHeight - padY} stroke="#ccc" strokeWidth="2" />
                        {stats.fechasOrdenadas.length > 1 && <polyline points={puntosLinea} fill="none" stroke="#004A99" strokeWidth="3" />}
                        {stats.fechasOrdenadas.map((f, i) => {
                          const cx = padX + i * stepX; const cy = chartHeight - padY - ((stats.fechasRaw[f] / maxReg) * (chartHeight - 2 * padY));
                          return (
                            <g key={f}>
                              <circle cx={cx} cy={cy} r="5" fill="#EE2D24" />
                              {stats.fechasRaw[f] > 0 && <text x={cx} y={cy - 10} fontSize="12" fill="#333" textAnchor="middle">{stats.fechasRaw[f]}</text>}
                              {i % Math.ceil(stats.fechasOrdenadas.length / 5) === 0 && <text x={cx} y={chartHeight - 10} fontSize="11" fill="#666" textAnchor="middle">{f.substring(0, 5)}</text>}
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px', backgroundColor: '#fff', marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', color: '#333', fontSize: '16px' }}>Mapa de Cobertura Regional (Aprobados)</h3>
                    <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>Visualización térmica de proveedores según filtros aplicados.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <select style={{ padding: '8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #ccc' }} onChange={e => {setFiltroMapaCat(e.target.value); setFiltroMapaSub('');}} value={filtroMapaCat}>
                      <option value="">Todas las Categorías</option>
                      {Object.keys(categoriasDinamicas).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <select disabled={!filtroMapaCat} style={{ padding: '8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #ccc' }} onChange={e => setFiltroMapaSub(e.target.value)} value={filtroMapaSub}>
                      <option value="">Todas las Subcategorías</option>
                      {filtroMapaCat && categoriasDinamicas[filtroMapaCat]?.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                    </select>
                    <select style={{ padding: '8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #ccc' }} onChange={e => setFiltroMapaZona(e.target.value)} value={filtroMapaZona}>
                      <option value="">Cualquier Zona</option>
                      {zonasOpciones.filter(z => z !== 'Todo el País').map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                  {Object.entries(macroZonas).map(([macro, regiones]) => (
                    <div key={macro} style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '15px', backgroundColor: '#fafafa' }}>
                      <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#004A99', borderBottom: '2px solid #EE2D24', paddingBottom: '5px' }}>Zona {macro}</h4>
                      {regiones.map(reg => {
                        const cantidad = mapStats.conteo[reg] || 0;
                        const intensidad = mapStats.maxMapa > 0 ? cantidad / mapStats.maxMapa : 0;
                        const bgColor = cantidad > 0 ? `rgba(238, 45, 36, ${0.15 + (intensidad * 0.85)})` : '#ffffff';
                        const txtColor = cantidad > 0 ? (intensidad > 0.5 ? '#ffffff' : '#333333') : '#999999';
                        return (
                          <div key={reg} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '12px', padding: '8px 10px', backgroundColor: bgColor, color: txtColor, borderRadius: '4px', border: '1px solid #eee', transition: 'all 0.3s' }}>
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80%' }} title={reg}>{reg}</span>
                            <span style={{ fontWeight: 'bold' }}>{cantidad}</span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tabAdmin === 'pendientes' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, color: '#333', fontSize: '18px' }}>Proveedores Pendientes</h3>
                <button onClick={cargarProveedores} style={{ padding: '6px 15px', backgroundColor: '#004A99', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>🔄 Actualizar Registros</button>
              </div>
              <div style={{ overflowX: 'auto' }}>
               <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f0f0f0', textAlign: 'left' }}>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ccc', verticalAlign: 'top', width: '25%', minWidth: '220px' }}>
                        <div style={{ marginBottom: '6px', fontWeight: 'bold' }}>Razón Social / RUT</div>
                        <input type="text" placeholder="Filtrar Proveedor..." value={filtroGestionNombre} onChange={e => setFiltroGestionNombre(e.target.value)} style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', outline: 'none' }} />
                      </th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ccc', verticalAlign: 'top', width: '25%', minWidth: '260px' }}>
                        <div style={{ marginBottom: '6px', fontWeight: 'bold' }}>Categoría / Subcategoría</div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <select value={filtroGestionCat} onChange={e => {setFiltroGestionCat(e.target.value); setFiltroGestionSub('');}} style={{ width: '50%', padding: '6px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', outline: 'none' }}>
                            <option value="">Categoría...</option>
                            {Object.keys(categoriasDinamicas).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                          <select disabled={!filtroGestionCat} value={filtroGestionSub} onChange={e => setFiltroGestionSub(e.target.value)} style={{ width: '50%', padding: '6px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', outline: 'none' }}>
                            <option value="">Subcat...</option>
                            {filtroGestionCat && categoriasDinamicas[filtroGestionCat]?.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                          </select>
                        </div>
                      </th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ccc', verticalAlign: 'top', width: '15%', minWidth: '130px' }}>
                        <div style={{ marginBottom: '6px', fontWeight: 'bold' }}>Cobertura</div>
                        <input type="text" placeholder="Filtrar Zona..." value={filtroGestionZona} onChange={e => setFiltroGestionZona(e.target.value)} style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', outline: 'none' }} />
                      </th>
                      <th style={{
                        padding: '12px',
                        borderBottom: '2px solid #ccc',
                        verticalAlign: 'top',
                        width: '25%',
                        minWidth: '250px'
                      }}>
                        <div style={{ fontWeight: 'bold' }}>Contacto</div>
                      </th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ccc', verticalAlign: 'top', textAlign: 'center', width: '100px', minWidth: '100px' }}>
                        <div style={{ fontWeight: 'bold' }}>Auditoría</div>
                      </th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ccc', verticalAlign: 'top', textAlign: 'center', width: '100px', minWidth: '100px' }}>
                        <div style={{ fontWeight: 'bold' }}>Acciones</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {proveedoresGestionFiltrados.length === 0 ? <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#777' }}>No se encontraron proveedores con los filtros aplicados.</td></tr> : 
                    proveedoresGestionFiltrados.map(prov => (
                      <tr key={prov.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px' }}><strong>{prov.razon_social}</strong><br /><span style={{ color: '#666' }}>{prov.rut}</span></td>
                        <td style={{ padding: '12px' }}>{prov.categoria}<br /><span style={{ color: '#666', fontSize: '11px' }}>{prov.subcategoria}</span></td>
                        <td style={{ padding: '12px', maxWidth: '150px' }}><span style={{ fontSize: '11px', color: '#555', display: 'block', maxHeight: '40px', overflowY: 'auto' }}>{prov.zonas_cobertura || 'No especificada'}</span></td>
                        <td style={{
                          padding: '12px',
                          width: '25%',
                          minWidth: '250px'
                        }}>
                          {prov.nombre_contacto}<br />
                          <a href={`mailto:${prov.email_principal}`} style={{ color: '#004A99', textDecoration: 'none' }}>{prov.email_principal}</a><br />
                          <span style={{ color: '#666', fontSize: '11px' }}>Tel: {prov.telefono || 'N/A'}</span><br />
                          {prov.website && prov.website !== 'No posee' && (
                            <a href={prov.website.startsWith('http') ? prov.website : `https://${prov.website}`} target="_blank" rel="noopener noreferrer" style={{ color: '#17a2b8', fontSize: '11px', textDecoration: 'none', fontWeight: 'bold' }}>🌐 {prov.website}</a>
                          )}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>{prov.aprobado_por ? <div style={{ fontSize: '11px', color: '#004A99', fontWeight: 'bold' }}>✓ Por:<br/>{prov.aprobado_por}</div> : <span style={{ color: '#999', fontSize: '11px', display: 'block', textAlign: 'center' }}>No registrado</span>}</td>
                        <td style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center' }}>
                          <button onClick={() => abrirEditorProveedor(prov)} style={{ width: '80px', padding: '6px 0', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Editar</button>
                          <button onClick={() => revocarProveedor(prov.id)} style={{ width: '80px', padding: '6px 0', backgroundColor: '#ffc107', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>A Pendiente</button>
                          <button onClick={() => rechazarProveedor(prov.id)} style={{ width: '80px', padding: '6px 0', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tabAdmin === 'actualizacion_form' && (
            <div>
              <h3 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '18px', borderBottom: '2px solid #EE2D24', paddingBottom: '10px' }}>Actualización de Formulario Dinámico</h3>
              <p style={{ fontSize: '14px', color: '#555', marginBottom: '20px' }}>Añade o elimina Categorías y Subcategorías. Los cambios se reflejarán instantáneamente en el formulario público.</p>
              
              <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#f9f9f9', border: '1px solid #ddd', borderRadius: '8px' }}>
                <form onSubmit={handleAgregarCategoria} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input required placeholder="Escriba nueva Categoría Maestra..." value={nuevaCatInput} onChange={e => setNuevaCatInput(e.target.value)} style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
                  <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>+ Agregar Categoría</button>
                </form>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {Object.keys(categoriasDinamicas).map(cat => (
                  <div key={cat} style={{ border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ backgroundColor: '#004A99', color: 'white', padding: '10px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, fontSize: '15px' }}>{cat}</h4>
                      <button onClick={() => handleEliminarCategoria(cat)} style={{ background: 'none', border: 'none', color: '#ffb3b3', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Eliminar Categoría</button>
                    </div>
                    <div style={{ padding: '15px', backgroundColor: '#fff' }}>
                      <form onSubmit={(e) => handleAgregarSubcategoria(e, cat)} style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                        <input required placeholder="Nueva subcategoría..." value={nuevasSubInputs[cat] || ''} onChange={e => setNuevasSubInputs({...nuevasSubInputs, [cat]: e.target.value})} style={{ flex: 1, padding: '6px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }} />
                        <button type="submit" style={{ padding: '6px 12px', backgroundColor: '#17a2b8', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Añadir</button>
                      </form>
                      <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                        {categoriasDinamicas[cat].length === 0 ? <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>No hay subcategorías.</p> : 
                          categoriasDinamicas[cat].map(sub => (
                            <div key={sub} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #eee', fontSize: '13px' }}>
                              <span>{sub}</span>
                              <button onClick={() => handleEliminarSubcategoria(cat, sub)} style={{ background: 'none', border: 'none', color: '#EE2D24', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>Borrar</button>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tabAdmin === 'exportar' && (
            <div>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>Filtra y selecciona los proveedores aprobados para generar un archivo compatible con los sistemas internos.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px', marginBottom: '20px', backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
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

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#004A99' }}>Seleccionados: {seleccionados.length} de {proveedoresFiltrados.length}</span>
                <div style={{ display: 'flex', gap: '10px' }}>
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
          )}

          {tabAdmin === 'crear_admin' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '40px' }}>
              <div>
                <h3 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '18px', borderBottom: '2px solid #EE2D24', paddingBottom: '10px' }}>Registrar Nuevo Administrador</h3>
                <form onSubmit={crearAdministrador} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Nombre</label><input required value={nuevoAdmin.nombre} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setNuevoAdmin({...nuevoAdmin, nombre: e.target.value})} /></div>
                  <div><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Apellido</label><input required value={nuevoAdmin.apellido} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setNuevoAdmin({...nuevoAdmin, apellido: e.target.value})} /></div>
                  <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Usuario</label><input required value={nuevoAdmin.usuario} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setNuevoAdmin({...nuevoAdmin, usuario: e.target.value})} /></div>
                  <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Correo</label><input required type="email" value={nuevoAdmin.correo} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setNuevoAdmin({...nuevoAdmin, correo: e.target.value})} /></div>
                  <div><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Contraseña</label><input required type="password" value={nuevoAdmin.password} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setNuevoAdmin({...nuevoAdmin, password: e.target.value})} /></div>
                  <div><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>PIN (6 dígitos)</label><input required type="password" maxLength="6" value={nuevoAdmin.pin} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', letterSpacing: '3px' }} onChange={e => setNuevoAdmin({...nuevoAdmin, pin: e.target.value})} /></div>
                  <button type="submit" disabled={bloqueoSeguridad} style={{ gridColumn: '1 / -1', padding: '12px', marginTop: '10px', backgroundColor: bloqueoSeguridad ? '#ccc' : '#004A99', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: bloqueoSeguridad ? 'not-allowed' : 'pointer' }}>CREAR USUARIO</button>
                </form>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #004A99', paddingBottom: '10px', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, color: '#333', fontSize: '18px' }}>Gestión de Usuarios</h3>
                  {usuarioActual?.usuario === 'mmaquieira' && <span style={{ fontSize: '11px', backgroundColor: '#EE2D24', color: 'white', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold' }}>👑 Modo SuperAdmin Activo</span>}
                </div>
                
                <div style={{ overflowX: 'auto', border: '1px solid #eee', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f0f0f0', textAlign: 'left' }}>
                        <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Nombre</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Usuario</th>
                        {usuarioActual?.usuario === 'mmaquieira' && <th style={{ padding: '12px', borderBottom: '2px solid #ccc', textAlign: 'right' }}>Acciones</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {administradoresDb.map(admin => (
                        <tr key={admin.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '12px' }}>
                            <strong>{admin.nombre_completo}</strong><br/>
                            <a href={`mailto:${admin.correo}`} style={{ color: '#004A99', textDecoration: 'none', fontSize: '11px' }}>{admin.correo}</a>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ backgroundColor: '#e2e8f0', padding: '3px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>{admin.usuario}</span>
                          </td>
                          {usuarioActual?.usuario === 'mmaquieira' && (
                            <td style={{ padding: '12px', textAlign: 'right' }}>
                              <button onClick={() => setAdminEditando(admin)} style={{ padding: '4px 8px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', marginRight: '5px' }}>Editar</button>
                              {admin.usuario !== 'mmaquieira' && (
                                <button onClick={() => eliminarAdmin(admin.id, admin.usuario)} style={{ padding: '4px 8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Eliminar</button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {usuarioActual?.usuario !== 'mmaquieira' && (
                  <p style={{ fontSize: '12px', color: '#888', marginTop: '15px', textAlign: 'center' }}>Solo el usuario principal puede editar o eliminar accesos.</p>
                )}
              </div>
            </div>
          )}

          {/* 🛡️ PESTAÑA DE AUDITORÍA SOLO PARA MMAQUIEIRA */}
          {tabAdmin === 'auditoria' && usuarioActual?.usuario === 'mmaquieira' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #EE2D24', paddingBottom: '10px' }}>
                <h3 style={{ margin: '0', color: '#333', fontSize: '18px' }}>Registro de Auditoría de Accesos</h3>
                <button onClick={cargarLogsAuditoria} style={{ padding: '6px 15px', backgroundColor: '#004A99', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Actualizar Registros</button>
              </div>
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>Historial de intentos de conexión a la plataforma administrativa. Muestra accesos exitosos y bloqueos de seguridad de cualquier usuario.</p>
              
              <div style={{ overflowX: 'auto', border: '1px solid #ccc', borderRadius: '8px', maxHeight: '500px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr style={{ backgroundColor: '#f0f0f0', textAlign: 'left' }}>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Fecha y Hora</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Tipo de Evento</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Usuario / Input</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logsAuditoria.length === 0 ? <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#777' }}>No hay registros de auditoría aún.</td></tr> : 
                    logsAuditoria.map(log => (
                      <tr key={log.id} style={{ borderBottom: '1px solid #eee', backgroundColor: log.estado === 'Fallido' ? '#fff5f5' : 'white' }}>
                        <td style={{ padding: '12px' }}>{new Date(log.created_at).toLocaleString('es-CL')}</td>
                        <td style={{ padding: '12px', fontWeight: 'bold', color: '#004A99' }}>{log.tipo}</td>
                        <td style={{ padding: '12px', fontFamily: 'monospace' }}>{log.usuario_intentado}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', backgroundColor: log.estado === 'Éxito' ? '#d4edda' : '#f8d7da', color: log.estado === 'Éxito' ? '#155724' : '#721c24' }}>
                            {log.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}