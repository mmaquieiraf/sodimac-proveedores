import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { categoriasSodimac as catSodimacOriginal, formatearRUT, validarRUT } from './datosSodimac';

// --- MÓDULOS DE ARQUITECTURA ---
import Navbar from './components/Navbar';
import ModalAuditoriaProv from './features/proveedores/components/ModalAuditoriaProv';
import ModalEdicionProveedor from './features/proveedores/components/ModalEdicionProveedor';
import ModalProceso from './features/procesos/components/ModalProceso';
import RegistroView from './views/public/RegistroView';
import PreLoginView from './views/auth/PreLoginView';
import LoginView from './views/auth/LoginView';
import RecuperarView from './views/auth/RecuperarView';
import PanelView from './views/admin/PanelView';

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

const formatearMoneda = (val) => {
  if (val === '' || val === null || val === undefined) return '';
  const num = val.toString().replace(/\D/g, '');
  if (!num) return '';
  return '$' + parseInt(num, 10).toLocaleString('es-CL');
};

export default function App() {
  // --- ESTADOS GLOBALES ORQUESTADORES ---
  const [vista, setVista] = useState('registro'); 
  const [tabAdmin, setTabAdmin] = useState('dashboard');
  const [usuarioActual, setUsuarioActual] = useState(null);

  const [categoriasDinamicas, setCategoriasDinamicas] = useState(cargarCategoriasDinamicas());
  const [mostrarModalAuditoria, setMostrarModalAuditoria] = useState(false);
  const [logsAuditoriaProv, setLogsAuditoriaProv] = useState([]);

  const [procesos, setProcesos] = useState([]);
  const [modalProceso, setModalProceso] = useState(false);
  const [procesoActual, setProcesoActual] = useState({
    id: null, nombre: '', tipo: 'RFI', fecha_inicio: '', fecha_termino: '',
    proveedores_invitados: [], cantidad_ofertas: '', proveedor_adjudicado: [],
    adjudicaciones_detalle: [],
    baseline: '', monto_adjudicado: '', controller: '',
    subgerencia: '', estado_proceso: 'Estableciendo alcance, equipo y objetivos',
    clasificacion: '', solicitante: '', tipo_compra: 'Spot'
  });

  const [proveedores, setProveedores] = useState([]);
  const [administradoresDb, setAdministradoresDb] = useState([]);
  const [logsAuditoria, setLogsAuditoria] = useState([]);
  
  const [intentosFallidos, setIntentosFallidos] = useState(0);
  const [bloqueoSeguridad, setBloqueoSeguridad] = useState(false);
  
  const [proveedorEditando, setProveedorEditando] = useState(null);

  // --- EFECTOS Y CANDADOS DE SEGURIDAD ---
  useEffect(() => {
    localStorage.setItem('sodimac_categorias_dinamicas', JSON.stringify(categoriasDinamicas));
  }, [categoriasDinamicas]);

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

  useEffect(() => {
    if (tabAdmin === 'auditoria' && usuarioActual?.usuario === 'mmaquieiraf@sodimac.cl') cargarLogsAuditoria();
  }, [tabAdmin, usuarioActual]);

  useEffect(() => {
    let temporizadorInactividad;
    const resetearTemporizador = () => {
      clearTimeout(temporizadorInactividad);
      if (usuarioActual) {
        temporizadorInactividad = setTimeout(async () => {
          await supabase.auth.signOut();
          setUsuarioActual(null);
          setVista('login');
          alert("🔒 Por tu seguridad, la sesión se ha cerrado automáticamente tras 20 minutos de inactividad.");
        }, 1200000); 
      }
    };
    window.addEventListener('mousemove', resetearTemporizador);
    window.addEventListener('keypress', resetearTemporizador);
    window.addEventListener('click', resetearTemporizador);
    window.addEventListener('scroll', resetearTemporizador);
    resetearTemporizador(); 
    return () => {
      clearTimeout(temporizadorInactividad);
      window.removeEventListener('mousemove', resetearTemporizador);
      window.removeEventListener('keypress', resetearTemporizador);
      window.removeEventListener('click', resetearTemporizador);
      window.removeEventListener('scroll', resetearTemporizador);
    };
  }, [usuarioActual]);

  // --- FUNCIONES CORE Y API ---
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
    try { await supabase.from('auditoria_logins').insert([{ usuario_intentado: usuario, estado: estado, tipo: tipo }]); } 
    catch (err) { console.error(err); }
  };

  const registrarAuditoriaProv = async (rut, nombre, accion, detalles, usuario) => {
    try {
      await supabase.from('auditoria_proveedores').insert([{
        proveedor_rut: rut, proveedor_nombre: nombre, accion: accion,
        detalles: detalles, usuario: usuario || 'Sistema'
      }]);
    } catch (err) { console.error(err); }
  };

  const cargarLogsAuditoriaProv = async () => {
    const { data, error } = await supabase.from('auditoria_proveedores').select('*').order('created_at', { ascending: false }).limit(200);
    if (!error && data) setLogsAuditoriaProv(data);
  };

  const cargarLogsAuditoria = async () => {
    const { data } = await supabase.from('auditoria_logins').select('*').order('created_at', { ascending: false }).limit(300);
    if (data) setLogsAuditoria(data);
  };

  const cargarAdministradores = async () => {
    const { data } = await supabase.from('administradores').select('*').order('id', { ascending: true });
    if (data) setAdministradoresDb(data);
  };

  const cargarProveedores = async () => {
    let todosLosProveedores = [];
    let desde = 0; let hasta = 999; let seguirCargando = true;
    while (seguirCargando) {
      const { data, error } = await supabase.from('proveedores').select('*').range(desde, hasta).order('fecha_registro', { ascending: false });
      if (error) { console.error("Error al cargar proveedores:", error); break; }
      if (data && data.length > 0) {
        todosLosProveedores = [...todosLosProveedores, ...data];
        if (data.length < 1000) seguirCargando = false; 
        else { desde += 1000; hasta += 1000; }
      } else seguirCargando = false;
    }
    setProveedores(todosLosProveedores);
  };

  const cargarProcesos = async () => {
    let todosLosProcesos = [];
    let desde = 0; let hasta = 999; let seguirCargando = true;
    while (seguirCargando) {
      const { data, error } = await supabase.from('procesos').select('*').range(desde, hasta).order('created_at', { ascending: false });
      if (error) { console.error("Error al cargar procesos:", error); break; }
      if (data && data.length > 0) {
        todosLosProcesos = [...todosLosProcesos, ...data];
        if (data.length < 1000) seguirCargando = false;
        else { desde += 1000; hasta += 1000; }
      } else seguirCargando = false;
    }
    setProcesos(todosLosProcesos);
  };

  const aprobarProveedor = async (prov) => {
    if(!window.confirm("¿Aprobar este proveedor?")) return;
    const { error } = await supabase.from('proveedores').update({ estado: 'Aprobado', aprobado_por: usuarioActual.usuario, fecha_aprobacion: new Date().toISOString()}).eq('id', prov.id);
    if (!error) { await registrarAuditoriaProv(prov.rut, prov.razon_social, 'Aprobación', `Aprobado para ${prov.categoria} -> ${prov.subcategoria}`, usuarioActual.usuario); cargarProveedores(); }
  };

  const revocarProveedor = async (prov) => {
    if(!window.confirm("¿Cambiar el estado de este proveedor a Pendiente?")) return;
    const { error } = await supabase.from('proveedores').update({ estado: 'Pendiente', aprobado_por: null }).eq('id', prov.id);
    if (!error) { await registrarAuditoriaProv(prov.rut, prov.razon_social, 'Revocación', `Devuelto a pendientes`, usuarioActual.usuario); cargarProveedores(); }
  };

  const rechazarProveedor = async (prov) => {
    if(!window.confirm("¿Rechazar y ELIMINAR a este proveedor?")) return;
    const { error } = await supabase.from('proveedores').delete().eq('id', prov.id);
    if (!error) { await registrarAuditoriaProv(prov.rut, prov.razon_social, 'Eliminación', `Proveedor eliminado del sistema`, usuarioActual.usuario); cargarProveedores(); }
  };

  const abrirEditorProveedor = (prov) => {
    const zonasArr = prov.zonas_cobertura ? prov.zonas_cobertura.split(',').map(z => z.trim()) : [];
    setProveedorEditando({ ...prov, zonas_cobertura_arr: zonasArr, website: prov.website || 'No posee' });
  };

  const manejarCambioZona = (zona, checked, isEdit = true) => {
    if (proveedorEditando) {
      let nuevasZonas = [...proveedorEditando.zonas_cobertura_arr];
      if (checked) nuevasZonas.push(zona); else nuevasZonas = nuevasZonas.filter(z => z !== zona);
      setProveedorEditando({ ...proveedorEditando, zonas_cobertura_arr: nuevasZonas });
    }
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
      categoria: proveedorEditando.categoria, subcategoria: proveedorEditando.subcategoria,
      email_principal: proveedorEditando.email_principal.replace(/[<>]/g, '').toLowerCase().trim(), email_secundario: proveedorEditando.email_secundario ? proveedorEditando.email_secundario.replace(/[<>]/g, '').toLowerCase().trim() : '',
      nombre_contacto: sanitizarYCapitalizar(proveedorEditando.nombre_contacto), cargo: sanitizarYCapitalizar(proveedorEditando.cargo),
      telefono: proveedorEditando.telefono.replace(/[<>]/g, '').trim(), zonas_cobertura: zonasFinales.join(', '), website: proveedorEditando.website.replace(/[<>]/g, '').trim()
    }).eq('id', proveedorEditando.id);

    if (!error) { await registrarAuditoriaProv(proveedorEditando.rut, proveedorEditando.razon_social, 'Edición', `Ficha editada`, usuarioActual.usuario); alert("✅ Actualizado."); setProveedorEditando(null); cargarProveedores(); }
  };

  const abrirNuevoProcesoConSeleccionados = (provsNombres) => {
    setProcesoActual({
      id: null, nombre: '', tipo: 'RFI', fecha_inicio: '', fecha_termino: '',
      proveedores_invitados: provsNombres, cantidad_ofertas: '', proveedor_adjudicado: [],
      adjudicaciones_detalle: [],
      baseline: '', monto_adjudicado: '', controller: usuarioActual?.usuario || '',
      subgerencia: '', estado_proceso: 'Estableciendo alcance, equipo y objetivos',
      clasificacion: '', solicitante: '', tipo_compra: 'Spot'
    });
    setModalProceso(true);
    setTabAdmin('procesos');
  };

  const editarProceso = (proc) => {
    setProcesoActual({
      ...proc,
      proveedores_invitados: proc.proveedores_invitados ? proc.proveedores_invitados.split(', ') : [],
      proveedor_adjudicado: proc.proveedor_adjudicado ? proc.proveedor_adjudicado.split(', ') : [],
      adjudicaciones_detalle: proc.adjudicaciones_detalle || [],
      baseline: formatearMoneda(proc.baseline || ''),
      monto_adjudicado: formatearMoneda(proc.monto_adjudicado || '')
    });
    setModalProceso(true);
  };

  const guardarProceso = async (e) => {
    e.preventDefault();
    const payload = {
      nombre: procesoActual.nombre.trim(),
      tipo: procesoActual.tipo,
      fecha_inicio: procesoActual.fecha_inicio,
      fecha_termino: procesoActual.fecha_termino,
      proveedores_invitados: Array.isArray(procesoActual.proveedores_invitados) ? procesoActual.proveedores_invitados.join(', ') : procesoActual.proveedores_invitados,
      cantidad_ofertas: procesoActual.cantidad_ofertas || null,
      proveedor_adjudicado: Array.isArray(procesoActual.proveedor_adjudicado) && procesoActual.proveedor_adjudicado.length > 0 ? procesoActual.proveedor_adjudicado.join(', ') : null,
      adjudicaciones_detalle: procesoActual.adjudicaciones_detalle || [],
      baseline: procesoActual.baseline ? parseInt(procesoActual.baseline.toString().replace(/\D/g, '')) : null,
      monto_adjudicado: procesoActual.monto_adjudicado ? parseInt(procesoActual.monto_adjudicado.toString().replace(/\D/g, '')) : null,
      controller: procesoActual.controller,
      subgerencia: procesoActual.subgerencia,
      estado_proceso: procesoActual.estado_proceso,
      clasificacion: procesoActual.clasificacion,
      solicitante: sanitizarYCapitalizar(procesoActual.solicitante),
      tipo_compra: procesoActual.tipo_compra
    };

    if (procesoActual.id) {
      const { error } = await supabase.from('procesos').update(payload).eq('id', procesoActual.id);
      if(error) alert("⚠️ Error al actualizar el proceso."); else { alert("✅ Proceso actualizado."); setModalProceso(false); cargarProcesos(); }
    } else {
      const { error } = await supabase.from('procesos').insert([payload]);
      if(error) alert("⚠️ Error al crear el proceso."); else { alert("✅ Proceso creado."); setModalProceso(false); cargarProcesos(); }
    }
  };

  const removerProveedorInvitado = (nombreProv) => {
    const nuevosInvitados = procesoActual.proveedores_invitados.filter(p => p !== nombreProv);
    const nuevosAdjudicados = procesoActual.proveedor_adjudicado.filter(p => p !== nombreProv);
    const nuevosDetalles = (procesoActual.adjudicaciones_detalle || []).filter(d => d.proveedor !== nombreProv);
    setProcesoActual({ ...procesoActual, proveedores_invitados: nuevosInvitados, proveedor_adjudicado: nuevosAdjudicados, adjudicaciones_detalle: nuevosDetalles });
  };

  const agregarProveedorInvitado = (nombreProv) => {
    if (!nombreProv) return;
    setProcesoActual({ ...procesoActual, proveedores_invitados: [...procesoActual.proveedores_invitados, nombreProv] });
  };

  const removerProveedorAdjudicado = (nombreProv) => {
    const nuevosAdjudicados = procesoActual.proveedor_adjudicado.filter(p => p !== nombreProv);
    const nuevosDetalles = (procesoActual.adjudicaciones_detalle || []).filter(d => d.proveedor !== nombreProv);
    setProcesoActual({ ...procesoActual, proveedor_adjudicado: nuevosAdjudicados, adjudicaciones_detalle: nuevosDetalles });
  };

  const agregarProveedorAdjudicado = (nombreProv) => {
    if (!nombreProv) return;
    if (!procesoActual.proveedor_adjudicado.includes(nombreProv)) {
      setProcesoActual({ 
        ...procesoActual, 
        proveedor_adjudicado: [...procesoActual.proveedor_adjudicado, nombreProv],
        adjudicaciones_detalle: [...(procesoActual.adjudicaciones_detalle || []), {
          proveedor: nombreProv, carta_adjudicacion: '', termino_carta: '', aplica_contrato: 'no', 
          numero_contrato: '', termino_contrato: '', vigencia_contrato: '', renovacion_automatica: 'No', meses_renovacion: ''
        }]
      });
    }
  };

  const handleDetalleAdjudicacionChange = (proveedor, campo, valor) => {
    const nuevosDetalles = (procesoActual.adjudicaciones_detalle || []).map(det => {
      if (det.proveedor === proveedor) return { ...det, [campo]: valor };
      return det;
    });
    setProcesoActual({ ...procesoActual, adjudicaciones_detalle: nuevosDetalles });
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#f4f4f4', minHeight: '100vh', padding: '20px' }}>
      
      <Navbar 
        usuarioActual={usuarioActual} 
        vista={vista} 
        setVista={setVista} 
        setTabAdmin={setTabAdmin} 
        setUsuarioActual={setUsuarioActual} 
      />

      <ModalAuditoriaProv 
        mostrarModalAuditoria={mostrarModalAuditoria} 
        setMostrarModalAuditoria={setMostrarModalAuditoria} 
        logsAuditoriaProv={logsAuditoriaProv} 
      />

      <ModalProceso 
        modalProceso={modalProceso} 
        setModalProceso={setModalProceso} 
        procesoActual={procesoActual} 
        setProcesoActual={setProcesoActual} 
        guardarProceso={guardarProceso} 
        proveedoresAprobados={proveedores.filter(p => p.estado === 'Aprobado')} 
        removerProveedorInvitado={removerProveedorInvitado} 
        agregarProveedorInvitado={agregarProveedorInvitado} 
        removerProveedorAdjudicado={removerProveedorAdjudicado} 
        agregarProveedorAdjudicado={agregarProveedorAdjudicado} 
        handleDetalleAdjudicacionChange={handleDetalleAdjudicacionChange} 
      />

      <ModalEdicionProveedor 
        proveedorEditando={proveedorEditando} 
        setProveedorEditando={setProveedorEditando} 
        guardarEdicionProveedor={guardarEdicionProveedor} 
        manejarCambioZona={manejarCambioZona} 
        categoriasDinamicas={categoriasDinamicas} 
        zonasOpciones={zonasOpciones} 
        bloqueoSeguridad={bloqueoSeguridad} 
      />

      {vista === 'registro' && (
        <RegistroView 
          categoriasDinamicas={categoriasDinamicas} 
          zonasOpciones={zonasOpciones} 
          bloqueoSeguridad={bloqueoSeguridad} 
          setVista={setVista} 
        />
      )}

      {vista === 'pre_login' && (
        <PreLoginView 
          setVista={setVista} 
          bloqueoSeguridad={bloqueoSeguridad} 
          registrarAuditoria={registrarAuditoria} 
          registrarIntentoFallido={registrarIntentoFallido} 
          intentosFallidos={intentosFallidos} 
          setIntentosFallidos={setIntentosFallidos} 
        />
      )}

      {vista === 'login' && (
        <LoginView 
          setVista={setVista} 
          bloqueoSeguridad={bloqueoSeguridad} 
          registrarAuditoria={registrarAuditoria} 
          registrarIntentoFallido={registrarIntentoFallido} 
          intentosFallidos={intentosFallidos} 
          setIntentosFallidos={setIntentosFallidos} 
          setUsuarioActual={setUsuarioActual} 
          cargarProveedores={cargarProveedores} 
          cargarProcesos={cargarProcesos} 
        />
      )}

      {vista === 'recuperar' && (
        <RecuperarView 
          setVista={setVista} 
          bloqueoSeguridad={bloqueoSeguridad} 
          registrarAuditoria={registrarAuditoria} 
          registrarIntentoFallido={registrarIntentoFallido} 
        />
      )}

      {vista === 'panel' && (
        <PanelView 
          tabAdmin={tabAdmin} 
          setTabAdmin={setTabAdmin} 
          usuarioActual={usuarioActual} 
          proveedores={proveedores} 
          cargarProveedores={cargarProveedores} 
          categoriasDinamicas={categoriasDinamicas} 
          setCategoriasDinamicas={setCategoriasDinamicas} 
          zonasOpciones={zonasOpciones} 
          macroZonas={macroZonas} 
          aprobarProveedor={aprobarProveedor} 
          abrirEditorProveedor={abrirEditorProveedor} 
          rechazarProveedor={rechazarProveedor} 
          revocarProveedor={revocarProveedor} 
          cargarLogsAuditoriaProv={cargarLogsAuditoriaProv} 
          setMostrarModalAuditoria={setMostrarModalAuditoria} 
          abrirNuevoProcesoConSeleccionados={abrirNuevoProcesoConSeleccionados} 
          procesos={procesos} 
          cargarProcesos={cargarProcesos} 
          setProcesoActual={setProcesoActual} 
          setModalProceso={setModalProceso} 
          editarProceso={editarProceso} 
          administradoresDb={administradoresDb} 
          cargarAdministradores={cargarAdministradores} 
          bloqueoSeguridad={bloqueoSeguridad} 
          logsAuditoria={logsAuditoria} 
          cargarLogsAuditoria={cargarLogsAuditoria} 
        />
      )}
    </div>
  );
}