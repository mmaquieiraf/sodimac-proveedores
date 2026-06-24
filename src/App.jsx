import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { categoriasSodimac as catSodimacOriginal, formatearRUT, validarRUT } from './datosSodimac';

// Consolidación de categorías iniciales con las nuevas incluidas
const categoriasDefault = JSON.parse(JSON.stringify(catSodimacOriginal));
const nuevasSubcategorias = {
  'Equipamiento': ['Mobiliario de Oficina', 'Maquinaria'],
  'Materiales': ['Gráfica Publicitaria', 'Repuestos de maquinaria', 'Uniformes corporativos', 'Elementos de protección personal', 'Sellos de seguridad', 'Agua embotellada'],
  'Servicios': ['Arriendo e insumos cafeteria', 'Mantención de maquinaria', 'Control de plagas', 'Higiene', 'Maquina dispensadoras de alimentos', 'Gestión de residuos', 'Arriendo de dispensadores de agua', 'Higienicos (bactereostatico, aromatización, riles, contenedores femeninos)', 'Acustico, música']
};
Object.keys(nuevasSubcategorias).forEach(cat => {
  if (!categoriasDefault[cat]) categoriasDefault[cat] = [];
  nuevasSubcategorias[cat].forEach(sub => { if (!categoriasDefault[cat].includes(sub)) categoriasDefault[cat].push(sub); });
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
  return textoSeguro.split(/\s+/).map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1)).join(' ');
};

export default function App() {
  const [vista, setVista] = useState('registro'); 
  const [tabAdmin, setTabAdmin] = useState('dashboard');
  const [mostrarTerminos, setMostrarTerminos] = useState(false);
  const [usuarioActual, setUsuarioActual] = useState(null);

  // --- CATEGORÍAS DINÁMICAS (TIEMPO REAL) ---
  const [categoriasMenu, setCategoriasMenu] = useState(categoriasDefault);
  
  const cargarCategoriasDB = async () => {
    try {
      const { data, error } = await supabase.from('categorias_form').select('datos').eq('id', 1).maybeSingle();
      if (data && data.datos && Object.keys(data.datos).length > 0) {
        setCategoriasMenu(data.datos);
      } else {
        guardarCategoriasDB(categoriasDefault); 
      }
    } catch (e) { console.error("Usando cat default local"); }
  };

  const guardarCategoriasDB = async (nuevasCat) => {
    setCategoriasMenu(nuevasCat);
    await supabase.from('categorias_form').upsert({ id: 1, datos: nuevasCat });
  };

  useEffect(() => { cargarCategoriasDB(); }, []);

  // Filtros de Cabecera para Pestaña GESTIÓN
  const [filtroGestionNombre, setFiltroGestionNombre] = useState('');
  const [filtroGestionCat, setFiltroGestionCat] = useState('');
  const [filtroGestionSub, setFiltroGestionSub] = useState('');
  const [filtroGestionZona, setFiltroGestionZona] = useState('');

  // Bloqueo 24 Horas
  const [intentosFallidos, setIntentosFallidos] = useState(0);
  const [bloqueoSeguridad, setBloqueoSeguridad] = useState(false);

  useEffect(() => {
    const tiempoBloqueo = localStorage.getItem('sodimac_bloqueo_seguridad');
    if (tiempoBloqueo) {
      const tiempoRestante = parseInt(tiempoBloqueo) - Date.now();
      if (tiempoRestante > 0) {
        setBloqueoSeguridad(true);
        setTimeout(() => { setBloqueoSeguridad(false); localStorage.removeItem('sodimac_bloqueo_seguridad'); setIntentosFallidos(0); }, tiempoRestante);
      } else { localStorage.removeItem('sodimac_bloqueo_seguridad'); }
    }
  }, []);

  const registrarIntentoFallido = () => {
    const nuevosIntentos = intentosFallidos + 1;
    setIntentosFallidos(nuevosIntentos);
    if (nuevosIntentos >= 3) {
      setBloqueoSeguridad(true);
      const ms24h = 86400000; 
      localStorage.setItem('sodimac_bloqueo_seguridad', Date.now() + ms24h);
      alert("⚠️ ALERTA DE SEGURIDAD EXTREMA: 3 intentos fallidos. Sistema bloqueado automáticamente por 24 HORAS.");
      setTimeout(() => { setBloqueoSeguridad(false); localStorage.removeItem('sodimac_bloqueo_seguridad'); setIntentosFallidos(0); }, ms24h);
      return true; 
    }
    return false; 
  };

  const registrarAuditoria = async (usuario, estado, tipo) => {
    try { await supabase.from('auditoria_logins').insert([{ usuario_intentado: usuario, estado: estado, tipo: tipo }]); } 
    catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (tabAdmin === 'auditoria' && usuarioActual?.usuario === 'mmaquieira') cargarLogsAuditoria();
  }, [tabAdmin, usuarioActual]);

  // --- FORMULARIO PÚBLICO (CON WEBSITE) ---
  const [formData, setFormData] = useState({
    razonSocial: '', nombreFantasia: '', rut: '', domicilio: '', poseeWebsite: 'no', websiteUrl: '',
    categoria: [], subcategoria: [], emailPrincipal: '', emailSecundario: '', contacto: '', cargo: '', telefono: '', zonasCobertura: [], terminos: false
  });

  const manejarCambioZona = (zona, checked, isEdit = false) => {
    if (isEdit) {
      let nuevasZonas = [...proveedorEditando.zonas_cobertura_arr];
      if (checked) nuevasZonas.push(zona); else nuevasZonas = nuevasZonas.filter(z => z !== zona);
      setProveedorEditando({ ...proveedorEditando, zonas_cobertura_arr: nuevasZonas });
    } else {
      let nuevasZonas = [...formData.zonasCobertura];
      if (checked) nuevasZonas.push(zona); else nuevasZonas = nuevasZonas.filter(z => z !== zona);
      setFormData({ ...formData, zonasCobertura: nuevasZonas });
    }
  };

  const manejarCambioCategoria = (cat, checked) => {
    let nuevasCat = [...formData.categoria]; let nuevasSub = [...formData.subcategoria];
    if (checked) nuevasCat.push(cat);
    else {
      nuevasCat = nuevasCat.filter(c => c !== cat);
      const subsParaRemover = categoriasMenu[cat] || [];
      nuevasSub = nuevasSub.filter(s => !subsParaRemover.includes(s));
    }
    setFormData({ ...formData, categoria: nuevasCat, subcategoria: nuevasSub });
  };

  const manejarCambioSubcategoria = (sub, checked) => {
    let nuevasSub = [...formData.subcategoria];
    if (checked) nuevasSub.push(sub); else nuevasSub = nuevasSub.filter(s => s !== sub);
    setFormData({ ...formData, subcategoria: nuevasSub });
  };

  const manejarEnvioRegistro = async (e) => {
    e.preventDefault();
    if (!validarRUT(formData.rut)) return alert("El RUT ingresado no es válido.");
    if (formData.categoria.length === 0) return alert("Seleccione al menos una Categoría.");
    if (formData.subcategoria.length === 0) return alert("Seleccione al menos una Subcategoría.");
    if (formData.zonasCobertura.length === 0) return alert("Seleccione al menos una Zona de Cobertura.");

    let zonasFinales = formData.zonasCobertura;
    if (zonasFinales.includes("Todo el País")) zonasFinales = ["Todo el País"];
    
    const enlaceFinal = formData.poseeWebsite === 'si' && formData.websiteUrl.trim() !== '' ? formData.websiteUrl.trim() : 'No posee';

    const registrosAInsertar = formData.subcategoria.map(sub => {
      const catAsociada = Object.keys(categoriasMenu).find(key => categoriasMenu[key].includes(sub));
      return {
        razon_social: sanitizarYCapitalizar(formData.razonSocial), nombre_fantasia: sanitizarYCapitalizar(formData.nombreFantasia),
        rut: formData.rut.replace(/[<>]/g, ''), domicilio_comercial: sanitizarYCapitalizar(formData.domicilio), website: enlaceFinal,
        categoria: catAsociada, subcategoria: sub, email_principal: formData.emailPrincipal.replace(/[<>]/g, '').toLowerCase().trim(), 
        email_secundario: formData.emailSecundario ? formData.emailSecundario.replace(/[<>]/g, '').toLowerCase().trim() : '',
        nombre_contacto: sanitizarYCapitalizar(formData.contacto), cargo: sanitizarYCapitalizar(formData.cargo),
        telefono: formData.telefono.replace(/[<>]/g, '').trim(), zonas_cobertura: zonasFinales.join(', '), 
        terminos_aceptados: formData.terminos, estado: 'Pendiente'
      };
    });

    const { error } = await supabase.from('proveedores').insert(registrosAInsertar);
    if (error) { console.error(error); alert("⚠️ Error de sistema al guardar."); }
    else { alert(`✅ Registro enviado. Se generaron ${registrosAInsertar.length} postulaciones.`); window.location.reload(); }
  };

  const [preLoginPin, setPreLoginPin] = useState('');
  const manejarPreLogin = async (e) => {
    e.preventDefault();
    if (bloqueoSeguridad) return alert("❌ Sistema bloqueado por 24 horas.");
    if (preLoginPin === '171819') { 
      await registrarAuditoria('Anónimo', 'Éxito', 'Acceso a PIN Público'); setVista('login'); setPreLoginPin(''); setIntentosFallidos(0); 
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
    if (!error && data) setProveedores(data);
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
    setProveedorEditando({ ...prov, zonas_cobertura_arr: zonasArr });
  };

  const guardarEdicionProveedor = async (e) => {
    e.preventDefault();
    if (!validarRUT(proveedorEditando.rut)) return alert("El RUT no es válido.");
    if (proveedorEditando.zonas_cobertura_arr.length === 0) return alert("Seleccione al menos una Zona.");

    let zonasFinales = proveedorEditando.zonas_cobertura_arr;
    if (zonasFinales.includes("Todo el País")) zonasFinales = ["Todo el País"];

    const { error } = await supabase.from('proveedores').update({
      razon_social: sanitizarYCapitalizar(proveedorEditando.razon_social), nombre_fantasia: sanitizarYCapitalizar(proveedorEditando.nombre_fantasia),
      rut: proveedorEditando.rut.replace(/[<>]/g, ''), domicilio_comercial: sanitizarYCapitalizar(proveedorEditando.domicilio_comercial),
      website: proveedorEditando.website || 'No posee',
      categoria: proveedorEditando.categoria, subcategoria: proveedorEditando.subcategoria,
      email_principal: proveedorEditando.email_principal.replace(/[<>]/g, '').toLowerCase().trim(),
      email_secundario: proveedorEditando.email_secundario ? proveedorEditando.email_secundario.replace(/[<>]/g, '').toLowerCase().trim() : '',
      nombre_contacto: sanitizarYCapitalizar(proveedorEditando.nombre_contacto), cargo: sanitizarYCapitalizar(proveedorEditando.cargo),
      telefono: proveedorEditando.telefono.replace(/[<>]/g, '').trim(), zonas_cobertura: zonasFinales.join(', ')
    }).eq('id', proveedorEditando.id);

    if (error) { console.error(error); alert("⚠️ Error al actualizar."); }
    else { alert("✅ Proveedor actualizado."); setProveedorEditando(null); cargarProveedores(); }
  };

  // --- LÓGICA: ACTUALIZACIÓN DE FORMULARIO DINÁMICO ---
  const [nuevaCatInput, setNuevaCatInput] = useState('');
  const [editorCatSelec, setEditorCatSelec] = useState('');
  const [nuevaSubInput, setNuevaSubInput] = useState('');

  const agCat = async () => {
    if(!nuevaCatInput.trim()) return;
    const catL = sanitizarYCapitalizar(nuevaCatInput);
    if(categoriasMenu[catL]) return alert("Categoría ya existe.");
    const nc = { ...categoriasMenu, [catL]: [] };
    await guardarCategoriasDB(nc);
    setNuevaCatInput(''); alert("Categoría añadida.");
  };
  const elimCat = async (cat) => {
    if(!window.confirm(`¿Eliminar ${cat} y todas sus subcategorías? Esto no afectará a los proveedores ya registrados, pero sí al formulario.`)) return;
    const nc = { ...categoriasMenu }; delete nc[cat];
    if(editorCatSelec === cat) setEditorCatSelec('');
    await guardarCategoriasDB(nc);
  };
  const agSub = async () => {
    if(!editorCatSelec || !nuevaSubInput.trim()) return;
    const subL = sanitizarYCapitalizar(nuevaSubInput);
    if(categoriasMenu[editorCatSelec].includes(subL)) return alert("Subcategoría ya existe.");
    const nc = { ...categoriasMenu }; nc[editorCatSelec] = [...nc[editorCatSelec], subL];
    await guardarCategoriasDB(nc); setNuevaSubInput(''); alert("Subcategoría añadida.");
  };
  const elimSub = async (cat, sub) => {
    if(!window.confirm(`¿Eliminar subcategoría ${sub}?`)) return;
    const nc = { ...categoriasMenu }; nc[cat] = nc[cat].filter(s => s !== sub);
    await guardarCategoriasDB(nc);
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

  const [filtroRut, setFiltroRut] = useState(''); const [filtroNombre, setFiltroNombre] = useState(''); const [filtroCategoria, setFiltroCategoria] = useState(''); const [filtroSubcategoria, setFiltroSubcategoria] = useState(''); const [seleccionados, setSeleccionados] = useState([]);
  const proveedoresAprobados = proveedores.filter(p => p.estado === 'Aprobado');
  const proveedoresFiltrados = proveedoresAprobados.filter(p => p.rut.toLowerCase().includes(filtroRut.toLowerCase()) && p.nombre_fantasia.toLowerCase().includes(filtroNombre.toLowerCase()) && (filtroCategoria === '' || p.categoria === filtroCategoria) && (filtroSubcategoria === '' || p.subcategoria === filtroSubcategoria));
  const toggleSeleccion = (id) => setSeleccionados(seleccionados.includes(id) ? seleccionados.filter(i => i !== id) : [...seleccionados, id]);
  const toggleSeleccionarTodo = (e) => setSeleccionados(e.target.checked ? proveedoresFiltrados.map(p => p.id) : []);

  const exportarCSV = () => {
    if (seleccionados.length === 0) return alert("⚠️ Seleccione al menos un proveedor.");
    let csvC = "data:text/csv;charset=utf-8,\uFEFFId,Nombre de la empresa*,Nombre del contacto,Correo electrónico*,Código del idioma,Código de Región,Website\n";
    proveedoresFiltrados.filter(p => seleccionados.includes(p.id)).forEach(p => { csvC += `,${p.nombre_fantasia.replace(/"/g, '').replace(/,/g, ' ')},${p.nombre_contacto.replace(/"/g, '').replace(/,/g, ' ')},${p.email_principal.replace(/"/g, '').replace(/,/g, ' ')},,,${p.website || 'No posee'}\n`; });
    const link = document.createElement("a"); link.setAttribute("href", encodeURI(csvC)); link.setAttribute("download", "proveedores_sodimac.csv"); document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };
  const exportarExcel = () => {
    if (seleccionados.length === 0) return alert("⚠️ Seleccione al menos un proveedor.");
    const dataAExportar = proveedoresFiltrados.filter(p => seleccionados.includes(p.id));
    let excelHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8" /><style>table { border-collapse: collapse; font-family: Arial; } th { background-color: #004A99; color: white; border: 1px solid #ccc; padding: 10px; } td { border: 1px solid #ccc; padding: 8px; }</style></head><body><h3>Base Oficial Proveedores - Sodimac S.A.</h3><table><thead><tr><th>RUT</th><th>Razón Social</th><th>Nombre Fantasía</th><th>Categoría</th><th>Subcategoría</th><th>Cobertura</th><th>Email</th><th>Contacto</th><th>Teléfono</th><th>Website</th><th>Aprobado Por</th></tr></thead><tbody>`;
    dataAExportar.forEach(p => { excelHtml += `<tr><td>${p.rut||''}</td><td>${p.razon_social||''}</td><td>${p.nombre_fantasia||''}</td><td>${p.categoria||''}</td><td>${p.subcategoria||''}</td><td>${p.zonas_cobertura||''}</td><td>${p.email_principal||''}</td><td>${p.nombre_contacto||''}</td><td>${p.telefono||''}</td><td>${p.website||'No posee'}</td><td>${p.aprobado_por||''}</td></tr>`; });
    excelHtml += `</tbody></table></body></html>`;
    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.setAttribute("download", "proveedores_sodimac.xls"); document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const proveedoresGestionFiltrados = proveedores.filter(p => {
    if (p.estado !== 'Aprobado') return false;
    const matchN = p.nombre_fantasia.toLowerCase().includes(filtroGestionNombre.toLowerCase()) || p.razon_social.toLowerCase().includes(filtroGestionNombre.toLowerCase());
    const matchC = p.categoria.toLowerCase().includes(filtroGestionCat.toLowerCase());
    const matchS = p.subcategoria.toLowerCase().includes(filtroGestionSub.toLowerCase());
    const matchZ = p.zonas_cobertura ? p.zonas_cobertura.toLowerCase().includes(filtroGestionZona.toLowerCase()) : true;
    return matchN && matchC && matchS && matchZ;
  });
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
    const catMatch = filtroTortaCat === '' || p.categoria === filtroTortaCat;
    const subMatch = filtroTortaSub.length === 0 || filtroTortaSub.includes(p.subcategoria);
    return catMatch && subMatch;
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
          {usuarioActual && <span style={{ fontSize: '13px', color: '#cce5ff', borderRight: '1px solid rgba(255,255,255,0.3)', paddingRight: '15px' }}>👤 {usuarioActual.usuario}</span>}
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
                  <input type="text" placeholder="https://www..." value={proveedorEditando.website !== 'No posee' ? proveedorEditando.website : ''} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setProveedorEditando({...proveedorEditando, website: e.target.value})} />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Categoría *</label>
                  <select required value={proveedorEditando.categoria} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setProveedorEditando({...proveedorEditando, categoria: e.target.value, subcategoria: ''})}>
                    <option value="">Seleccione...</option>
                    {Object.keys(categoriasMenu).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Subcategoría *</label>
                  <select required value={proveedorEditando.subcategoria} disabled={!proveedorEditando.categoria} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setProveedorEditando({...proveedorEditando, subcategoria: e.target.value})}>
                    <option value="">Seleccione...</option>
                    {proveedorEditando.categoria && categoriasMenu[proveedorEditando.categoria]?.map(sub => <option key={sub} value={sub}>{sub}</option>)}
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
              
              {/* NUEVO CAMPO: WEBSITE */}
              <div style={{ gridColumn: '1 / -1', backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '4px', border: '1px solid #eee' }}>
                <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>¿Posee Website de Empresa? *</label>
                <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                  <label style={{ cursor: 'pointer' }}><input type="radio" name="web" checked={formData.poseeWebsite === 'si'} onChange={() => setFormData({...formData, poseeWebsite: 'si'})} /> Sí poseo</label>
                  <label style={{ cursor: 'pointer' }}><input type="radio" name="web" checked={formData.poseeWebsite === 'no'} onChange={() => setFormData({...formData, poseeWebsite: 'no'})} /> No poseo</label>
                </div>
                {formData.poseeWebsite === 'si' && (
                  <div style={{ marginTop: '10px' }}>
                    <input required type="url" placeholder="https://www.tuempresa.cl" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setFormData({...formData, websiteUrl: e.target.value})} />
                  </div>
                )}
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Categoría(s) *</label>
                <div style={{ marginTop: '5px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', maxHeight: '160px', overflowY: 'auto', backgroundColor: '#fafafa', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {Object.keys(categoriasMenu).map(cat => (
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
                          {categoriasMenu[cat]?.map(sub => (
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
                <span>He leído y acepto los <strong onClick={(e) => {e.preventDefault(); setMostrarTerminos(true);}} style={{ color: '#004A99', textDecoration: 'underline', cursor: 'pointer' }}>Términos y Condiciones</strong> de Sodimac.</span>
              </label>
            </div>
            <button type="submit" disabled={bloqueoSeguridad} style={{ width: '100%', padding: '15px', marginTop: '25px', backgroundColor: bloqueoSeguridad ? '#ccc' : '#EE2D24', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: bloqueoSeguridad ? 'not-allowed' : 'pointer', borderRadius: '4px' }}>ENVIAR REGISTRO</button>
          </form>
        </div>
      )}

      {/* LOGIN PIN */}
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

      {/* PANEL ADMINISTRATIVO PRINCIPAL */}
      {vista === 'panel' && (
        <div style={{ maxWidth: '1200px', margin: '0 auto', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          
          <div style={{ display: 'flex', borderBottom: '3px solid #EE2D24', paddingBottom: '10px', marginBottom: '20px', gap: '20px', overflowX: 'auto' }}>
            <h2 onClick={() => setTabAdmin('dashboard')} style={{ color: tabAdmin === 'dashboard' ? '#004A99' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>Dashboard</h2>
            <h2 onClick={() => setTabAdmin('pendientes')} style={{ color: tabAdmin === 'pendientes' ? '#004A99' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>Pendientes</h2>
            <h2 onClick={() => setTabAdmin('gestion')} style={{ color: tabAdmin === 'gestion' ? '#004A99' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>Gestión</h2>
            
            {/* NUEVO MÓDULO: ACT. FORMULARIO */}
            <h2 onClick={() => setTabAdmin('act_formulario')} style={{ color: tabAdmin === 'act_formulario' ? '#004A99' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Act. Formulario</h2>
            
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
                      {Object.keys(categoriasMenu).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    
                    <div style={{ flex: 1, padding: '5px', border: '1px solid #ccc', borderRadius: '4px', maxHeight: '55px', overflowY: 'auto', backgroundColor: '#fff', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {filtroTortaCat === '' ? <span style={{ fontSize: '11px', color: '#999', padding: '2px' }}>Seleccione una categoría para filtrar...</span> : 
                        categoriasMenu[filtroTortaCat]?.map(sub => (
                          <label key={sub} style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', backgroundColor: '#f0f0f0', padding: '2px 6px', border: '1px solid #ccc', borderRadius: '12px' }}>
                            <input type="checkbox" checked={filtroTortaSub.includes(sub)} onChange={(e) => {
                              if (e.target.checked) setFiltroTortaSub([...filtroTortaSub, sub]);
                              else setFiltroTortaSub(filtroTortaSub.filter(s => s !== sub));
                            }} style={{ margin: 0 }} /> {sub}
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
                        {Object.keys(categoriasMenu).map(cat => <option key={cat} value={cat}>{cat.substring(0,20)}...</option>)}
                      </select>
                      <select disabled={!filtroTendenciaCat} style={{ padding: '5px', fontSize: '11px', borderRadius: '4px', border: '1px solid #ccc', maxWidth: '140px' }} onChange={e => setFiltroTendenciaSub(e.target.value)} value={filtroTendenciaSub}>
                        <option value="">Subcat (Todas)</option>
                        {filtroTendenciaCat && categoriasMenu[filtroTendenciaCat].map(sub => <option key={sub} value={sub}>{sub.substring(0,20)}...</option>)}
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
            </div>
          )}

          {/* PESTAÑA PENDIENTES CON VISUALIZACIÓN DE WEBSITE */}
          {tabAdmin === 'pendientes' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, color: '#333', fontSize: '18px' }}>Proveedores Pendientes</h3>
                <button onClick={cargarProveedores} style={{ padding: '6px 15px', backgroundColor: '#004A99', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>🔄 Actualizar Registros</button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f0f0f0', textAlign: 'left' }}>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Razón Social / RUT</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Categoría / Sub</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Cobertura</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Contacto / Website</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proveedores.filter(p => p.estado === 'Pendiente').length === 0 ? <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#777' }}>No hay proveedores pendientes.</td></tr> : 
                    proveedores.filter(p => p.estado === 'Pendiente').map(prov => (
                      <tr key={prov.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px' }}><strong>{prov.razon_social}</strong><br /><span style={{ color: '#666' }}>{prov.rut}</span></td>
                        <td style={{ padding: '12px' }}>{prov.categoria}<br /><span style={{ color: '#666', fontSize: '11px' }}>{prov.subcategoria}</span></td>
                        <td style={{ padding: '12px', maxWidth: '150px' }}><span style={{ fontSize: '11px', color: '#555', display: 'block', maxHeight: '40px', overflowY: 'auto' }}>{prov.zonas_cobertura || 'No especificada'}</span></td>
                        <td style={{ padding: '12px' }}>
                          {prov.nombre_contacto}<br />
                          <a href={`mailto:${prov.email_principal}`} style={{ color: '#004A99', textDecoration: 'none' }}>{prov.email_principal}</a><br />
                          <span style={{ color: '#666', fontSize: '11px' }}>Tel: {prov.telefono || 'N/A'}</span><br/>
                          <span style={{ color: '#004A99', fontSize: '11px', fontWeight: 'bold' }}>
                            {prov.website && prov.website !== 'No posee' ? <a href={prov.website} target="_blank" rel="noopener noreferrer" style={{color: '#28a745'}}>🌐 Ver Website</a> : '🚫 Sin website'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <button onClick={() => aprobarProveedor(prov.id)} style={{ padding: '6px 10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Aprobar</button>
                          <button onClick={() => abrirEditorProveedor(prov)} style={{ padding: '6px 10px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Editar</button>
                          <button onClick={() => rechazarProveedor(prov.id)} style={{ padding: '6px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PESTAÑA: GESTIÓN CON FILTROS EN ENCABEZADOS Y WEBSITE */}
          {tabAdmin === 'gestion' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, color: '#333', fontSize: '18px' }}>Gestión de Proveedores Aprobados</h3>
                <button onClick={cargarProveedores} style={{ padding: '6px 15px', backgroundColor: '#004A99', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>🔄 Actualizar Registros</button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f0f0f0', textAlign: 'left' }}>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>
                        Razón Social / RUT <br />
                        <input type="text" placeholder="Filtrar Proveedor..." value={filtroGestionNombre} onChange={e => setFiltroGestionNombre(e.target.value)} style={{ width: '90%', padding: '4px', marginTop: '6px', fontSize: '11px', border: '1px solid #ccc', borderRadius: '4px', outline: 'none' }} />
                      </th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>
                        Categoría / Subcategoría <br />
                        <input type="text" placeholder="Filtrar Categoria..." value={filtroGestionCat} onChange={e => setFiltroGestionCat(e.target.value)} style={{ width: '90%', padding: '4px', marginTop: '6px', fontSize: '11px', border: '1px solid #ccc', borderRadius: '4px', display: 'block', marginBottom: '4px', outline: 'none' }} />
                        <input type="text" placeholder="Filtrar Subcategoria..." value={filtroGestionSub} onChange={e => setFiltroGestionSub(e.target.value)} style={{ width: '90%', padding: '4px', fontSize: '11px', border: '1px solid #ccc', borderRadius: '4px', display: 'block', outline: 'none' }} />
                      </th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>
                        Cobertura <br />
                        <input type="text" placeholder="Filtrar Zona..." value={filtroGestionZona} onChange={e => setFiltroGestionZona(e.target.value)} style={{ width: '90%', padding: '4px', marginTop: '6px', fontSize: '11px', border: '1px solid #ccc', borderRadius: '4px', outline: 'none' }} />
                      </th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ccc', verticalAlign: 'top', paddingTop: '15px' }}>Contacto / Website</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ccc', verticalAlign: 'top', paddingTop: '15px' }}>Auditoría</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ccc', verticalAlign: 'top', paddingTop: '15px' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proveedoresGestionFiltrados.length === 0 ? <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#777' }}>No se encontraron proveedores con los filtros aplicados.</td></tr> : 
                    proveedoresGestionFiltrados.map(prov => (
                      <tr key={prov.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px' }}><strong>{prov.razon_social}</strong><br /><span style={{ color: '#666' }}>{prov.rut}</span></td>
                        <td style={{ padding: '12px' }}>{prov.categoria}<br /><span style={{ color: '#666', fontSize: '11px' }}>{prov.subcategoria}</span></td>
                        <td style={{ padding: '12px', maxWidth: '150px' }}><span style={{ fontSize: '11px', color: '#555', display: 'block', maxHeight: '40px', overflowY: 'auto' }}>{prov.zonas_cobertura || 'No especificada'}</span></td>
                        <td style={{ padding: '12px' }}>
                          {prov.nombre_contacto}<br />
                          <a href={`mailto:${prov.email_principal}`} style={{ color: '#004A99', textDecoration: 'none' }}>{prov.email_principal}</a><br />
                          <span style={{ color: '#666', fontSize: '11px' }}>Tel: {prov.telefono || 'N/A'}</span><br/>
                          <span style={{ color: '#004A99', fontSize: '11px', fontWeight: 'bold' }}>
                            {prov.website && prov.website !== 'No posee' ? <a href={prov.website} target="_blank" rel="noopener noreferrer" style={{color: '#28a745'}}>🌐 Ver Website</a> : '🚫 Sin website'}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>{prov.aprobado_por ? <div style={{ fontSize: '11px', color: '#004A99', fontWeight: 'bold' }}>✓ Por: {prov.aprobado_por}</div> : <span style={{ color: '#999', fontSize: '11px' }}>No registrado</span>}</td>
                        <td style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <button onClick={() => abrirEditorProveedor(prov)} style={{ padding: '6px 10px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Editar</button>
                          <button onClick={() => revocarProveedor(prov.id)} style={{ padding: '6px 10px', backgroundColor: '#ffc107', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>A Pendiente</button>
                          <button onClick={() => rechazarProveedor(prov.id)} style={{ padding: '6px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* NUEVO MÓDULO: ACTUALIZACIÓN DE FORMULARIO (REEMPLAZA CARGA MASIVA) */}
          {tabAdmin === 'act_formulario' && (
            <div>
              <h3 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '18px', borderBottom: '2px solid #EE2D24', paddingBottom: '10px' }}>Actualización de Categorías y Subcategorías</h3>
              <p style={{ fontSize: '14px', color: '#555', marginBottom: '20px' }}>Agrega o elimina elementos del menú desplegable del formulario público en tiempo real.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px' }}>
                {/* Panel Nueva Categoría */}
                <div style={{ backgroundColor: '#f9f9f9', border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#004A99' }}>Gestión de Categorías</h4>
                  
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <input type="text" placeholder="Nueva Categoría..." value={nuevaCatInput} onChange={e => setNuevaCatInput(e.target.value)} style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    <button onClick={agCat} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Añadir</button>
                  </div>

                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {Object.keys(categoriasMenu).map(cat => (
                      <div key={cat} onClick={() => setEditorCatSelec(cat)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #eee', backgroundColor: editorCatSelec === cat ? '#e6f2ff' : 'white', cursor: 'pointer' }}>
                        <strong style={{ fontSize: '13px', color: editorCatSelec === cat ? '#004A99' : '#333' }}>{cat}</strong>
                        <button onClick={(e) => { e.stopPropagation(); elimCat(cat); }} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Borrar</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Panel Nueva Subcategoría */}
                <div style={{ backgroundColor: '#f0f8ff', border: '1px solid #cce5ff', padding: '20px', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#004A99' }}>Subcategorías de: {editorCatSelec || <span style={{color: '#999'}}>(Selecciona una Categoría)</span>}</h4>
                  
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <input disabled={!editorCatSelec} type="text" placeholder="Nueva Subcategoría..." value={nuevaSubInput} onChange={e => setNuevaSubInput(e.target.value)} style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    <button disabled={!editorCatSelec} onClick={agSub} style={{ backgroundColor: editorCatSelec ? '#28a745' : '#ccc', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: editorCatSelec ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>Añadir</button>
                  </div>

                  {editorCatSelec && (
                    <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {categoriasMenu[editorCatSelec]?.length === 0 ? <p style={{ fontSize: '12px', color: '#777' }}>No hay subcategorías.</p> : 
                        categoriasMenu[editorCatSelec]?.map(sub => (
                          <div key={sub} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', border: '1px solid #eee', backgroundColor: 'white', borderRadius: '4px' }}>
                            <span style={{ fontSize: '12px' }}>{sub}</span>
                            <button onClick={() => elimSub(editorCatSelec, sub)} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '3px 6px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}>X</button>
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>
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
                    {Object.keys(categoriasMenu).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Subcategoría</label>
                  <select disabled={!filtroCategoria} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setFiltroSubcategoria(e.target.value)}>
                    <option value="">Todas</option>
                    {filtroCategoria && categoriasMenu[filtroCategoria]?.map(sub => <option key={sub} value={sub}>{sub}</option>)}
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