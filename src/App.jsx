import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { categoriasSodimac, formatearRUT, validarRUT } from './datosSodimac';

// --- FUNCIÓN DE FORMATO ---
const capitalizarTexto = (texto) => {
  if (!texto) return '';
  return texto.toLowerCase().trim().split(/\s+/).map(palabra => 
    palabra.charAt(0).toUpperCase() + palabra.slice(1)
  ).join(' ');
};

export default function App() {
  // --- ESTADOS DE NAVEGACIÓN ---
  const [vista, setVista] = useState('registro'); 
  const [tabAdmin, setTabAdmin] = useState('dashboard');
  const [mostrarTerminos, setMostrarTerminos] = useState(false);
  const [tipoGraficoTorta, setTipoGraficoTorta] = useState('categoria');

  // --- LÓGICA DEL FORMULARIO PÚBLICO ---
  const [formData, setFormData] = useState({
    razonSocial: '', nombreFantasia: '', rut: '', domicilio: '',
    categoria: '', subcategoria: '', emailPrincipal: '', emailSecundario: '',
    contacto: '', cargo: '', telefono: '', terminos: false
  });

  const manejarEnvioRegistro = async (e) => {
    e.preventDefault();
    if (!validarRUT(formData.rut)) return alert("El RUT ingresado no es válido. Por favor revise.");

    const { error } = await supabase.from('proveedores').insert([{
      razon_social: capitalizarTexto(formData.razonSocial), 
      nombre_fantasia: capitalizarTexto(formData.nombreFantasia),
      rut: formData.rut, 
      domicilio_comercial: capitalizarTexto(formData.domicilio),
      categoria: formData.categoria, 
      subcategoria: formData.subcategoria,
      email_principal: formData.emailPrincipal.toLowerCase().trim(), 
      email_secundario: formData.emailSecundario ? formData.emailSecundario.toLowerCase().trim() : '',
      nombre_contacto: capitalizarTexto(formData.contacto), 
      cargo: capitalizarTexto(formData.cargo),
      telefono: formData.telefono.trim(), 
      terminos_aceptados: formData.terminos,
      estado: 'Pendiente'
    }]);

    if (error) alert("Error al guardar: " + error.message);
    else {
      alert("✅ Registro enviado con éxito. Estado: Pendiente de revisión.");
      window.location.reload();
    }
  };

  // --- LÓGICA DE PRE-LOGIN ---
  const [preLoginPin, setPreLoginPin] = useState('');

  const manejarPreLogin = (e) => {
    e.preventDefault();
    if (preLoginPin === '171819') { setVista('login'); setPreLoginPin(''); } 
    else { alert("⚠️ Código de autorización incorrecto."); setPreLoginPin(''); }
  };

  // --- LÓGICA DE ADMINISTRADOR ---
  const [credenciales, setCredenciales] = useState({ usuario: '', password: '', pin: '' });
  const [proveedores, setProveedores] = useState([]);
  const [nuevoAdmin, setNuevoAdmin] = useState({ nombre: '', apellido: '', usuario: '', correo: '', password: '', pin: '' });

  const manejarLogin = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.from('administradores').select('*')
      .eq('usuario', credenciales.usuario.trim()).eq('password', credenciales.password).eq('pin', credenciales.pin).maybeSingle();

    if (error) return alert("⚠️ Error de conexión con Supabase.");
    if (!data) return alert("🔍 Credenciales incorrectas.");

    setVista('panel');
    cargarProveedores();
  };

  const cargarProveedores = async () => {
    const { data, error } = await supabase.from('proveedores').select('*').order('fecha_registro', { ascending: false });
    if (!error && data) setProveedores(data);
  };

  const aprobarProveedor = async (id) => {
    if(!window.confirm("¿Aprobar este proveedor?")) return;
    const { error } = await supabase.from('proveedores').update({ estado: 'Aprobado' }).eq('id', id);
    if (!error) cargarProveedores();
  };

  const rechazarProveedor = async (id) => {
    if(!window.confirm("¿Rechazar y ELIMINAR definitivamente a este proveedor?")) return;
    const { error } = await supabase.from('proveedores').delete().eq('id', id);
    if (!error) cargarProveedores();
  };

  const crearAdministrador = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('administradores').insert([{
      usuario: nuevoAdmin.usuario.trim(), password: nuevoAdmin.password, pin: nuevoAdmin.pin,
      nombre_completo: capitalizarTexto(`${nuevoAdmin.nombre} ${nuevoAdmin.apellido}`), 
      correo: nuevoAdmin.correo.toLowerCase().trim()
    }]);

    if (error) alert("Error al crear usuario.");
    else {
      alert("✅ Usuario administrador creado exitosamente.");
      setNuevoAdmin({ nombre: '', apellido: '', usuario: '', correo: '', password: '', pin: '' });
      setTabAdmin('proveedores');
    }
  };

  // --- LÓGICA MÓDULO EXPORTACIÓN (CSV LIMPIO SIN COMILLAS) ---
  const [filtroRut, setFiltroRut] = useState('');
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroSubcategoria, setFiltroSubcategoria] = useState('');
  const [seleccionados, setSeleccionados] = useState([]);

  const proveedoresAprobados = proveedores.filter(p => p.estado === 'Aprobado');
  const proveedoresFiltrados = proveedoresAprobados.filter(p => {
    return (
      p.rut.toLowerCase().includes(filtroRut.toLowerCase()) &&
      p.nombre_fantasia.toLowerCase().includes(filtroNombre.toLowerCase()) &&
      (filtroCategoria === '' || p.categoria === filtroCategoria) &&
      (filtroSubcategoria === '' || p.subcategoria === filtroSubcategoria)
    );
  });

  const toggleSeleccion = (id) => {
    if (seleccionados.includes(id)) setSeleccionados(seleccionados.filter(item => item !== id));
    else setSeleccionados([...seleccionados, id]);
  };

  const toggleSeleccionarTodo = (e) => {
    if (e.target.checked) setSeleccionados(proveedoresFiltrados.map(p => p.id));
    else setSeleccionados([]);
  };

  const exportarCSV = () => {
    if (seleccionados.length === 0) return alert("⚠️ Seleccione al menos un proveedor para exportar.");
    const dataAExportar = proveedoresFiltrados.filter(p => seleccionados.includes(p.id));
    
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "Id,Nombre de la empresa*,Nombre del contacto,Correo electrónico*,Código del idioma,Código de Región\n";
    
    dataAExportar.forEach(p => {
      const nombreEmpresa = p.nombre_fantasia.replace(/"/g, '').replace(/,/g, ' ');
      const nombreContacto = p.nombre_contacto.replace(/"/g, '').replace(/,/g, ' ');
      const correo = p.email_principal.replace(/"/g, '').replace(/,/g, ' ');
      
      csvContent += `,${nombreEmpresa},${nombreContacto},${correo},,\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "proveedores_aprobados.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- RECUPERACIÓN DE CONTRASEÑA ---
  const [resetStep, setResetStep] = useState(1);
  const [resetData, setResetData] = useState({ correo: '', nuevaPass: '', nuevoPin: '', idUsuario: null });

  const buscarCorreo = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.from('administradores').select('id').eq('correo', resetData.correo.toLowerCase().trim()).maybeSingle();
    if (error || !data) alert("No se encontró ningún administrador asociado a este correo.");
    else { setResetData({ ...resetData, idUsuario: data.id }); setResetStep(2); }
  };

  const actualizarPassword = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('administradores').update({ password: resetData.nuevaPass, pin: resetData.nuevoPin }).eq('id', resetData.idUsuario);
    if (error) alert("Error al actualizar.");
    else {
      alert("✅ Credenciales actualizadas.");
      setVista('login'); setResetStep(1); setResetData({ correo: '', nuevaPass: '', nuevoPin: '', idUsuario: null });
    }
  };

  // --- LÓGICA DEL DASHBOARD ---
  const statsDashboard = () => {
    const total = proveedores.length;
    const fechasRaw = {};
    const renovaciones = [];
    const hace90Dias = new Date();
    hace90Dias.setDate(hace90Dias.getDate() - 90);

    proveedores.forEach(p => {
      const fechaCorta = new Date(p.fecha_registro).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
      fechasRaw[fechaCorta] = (fechasRaw[fechaCorta] || 0) + 1;
      if(new Date(p.fecha_registro) < hace90Dias) renovaciones.push(p);
    });

    const fechasOrdenadas = Object.keys(fechasRaw).sort((a,b) => {
      const [da, ma, ya] = a.split('-');
      const [db, mb, yb] = b.split('-');
      return new Date(`${ya}-${ma}-${da}`) - new Date(`${yb}-${mb}-${db}`);
    });

    return { total, fechasRaw, fechasOrdenadas, renovaciones };
  };

  const enviarRecordatorio = (prov) => {
    const destinatarios = prov.email_secundario ? `${prov.email_principal},${prov.email_secundario}` : prov.email_principal;
    const asunto = encodeURIComponent("Actualización de Datos - Portal Proveedores Sodimac");
    const cuerpo = encodeURIComponent(`Estimado(a) proveedor ${prov.razon_social},\n\nPor favor actualizar sus datos de contacto en el portal si estos han cambiado, para mantener vigente su postulación.\n\nSaludos cordiales,\nSodimac S.A.`);
    window.location.href = `mailto:${destinatarios}?subject=${asunto}&body=${cuerpo}`;
  };

  const stats = statsDashboard();

  // --- GENERADORES DE GRÁFICOS NATIVOS ---
  const coloresGrafico = ['#004A99', '#EE2D24', '#ffc107', '#28a745', '#17a2b8', '#6f42c1', '#e83e8c', '#fd7e14', '#20c997'];
  const tortaData = {};
  proveedoresAprobados.forEach(p => {
    const clave = tipoGraficoTorta === 'categoria' ? p.categoria : p.subcategoria;
    tortaData[clave] = (tortaData[clave] || 0) + 1;
  });
  
  let cumulativePercent = 0;
  const totalAprobados = proveedoresAprobados.length;
  const pieSlices = Object.entries(tortaData).map(([key, val], i) => {
    const percent = totalAprobados > 0 ? (val / totalAprobados) * 100 : 0;
    const slice = `${coloresGrafico[i % coloresGrafico.length]} ${cumulativePercent}% ${cumulativePercent + percent}%`;
    cumulativePercent += percent;
    return { key, val, percent, color: coloresGrafico[i % coloresGrafico.length], slice };
  });
  const tortaGradient = totalAprobados > 0 ? `conic-gradient(${pieSlices.map(s => s.slice).join(', ')})` : '#e0e0e0';

  const chartWidth = 800;
  const chartHeight = 250;
  const padX = 40;
  const padY = 30;
  const maxReg = Math.max(...stats.fechasOrdenadas.map(f => stats.fechasRaw[f]), 1);
  const stepX = stats.fechasOrdenadas.length > 1 ? (chartWidth - 2 * padX) / (stats.fechasOrdenadas.length - 1) : 0;
  
  const puntosLinea = stats.fechasOrdenadas.map((f, i) => {
    const x = padX + i * stepX;
    const y = chartHeight - padY - ((stats.fechasRaw[f] / maxReg) * (chartHeight - 2 * padY));
    return `${x},${y}`;
  }).join(' ');


  // --- RENDERIZADO VISUAL ---
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#f4f4f4', minHeight: '100vh', padding: '20px' }}>
      
      {/* NAVBAR */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#004A99', padding: '15px 20px', borderRadius: '8px', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        
        {/* SECCIÓN DEL LOGO CON ZOOM PARA ELIMINAR EL MARGEN TRANSPARENTE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4cm' }}>
  <img
    src="/logo.png"
    alt="Sodimac"
    style={{
      height: '50px',
      objectFit: 'contain',
      transform: 'scale(2.8)',
      transformOrigin: 'left center',
      marginLeft: '5px'
    }}
  />
  <span
    style={{
      fontSize: '22px',
      fontWeight: '600',
      letterSpacing: '0.5px',
      zIndex: 10
    }}
  >
    Portal de Proveedores
  </span>
</div>

        <div style={{ zIndex: 10 }}>
          {['login', 'recuperar', 'pre_login'].includes(vista) && <button onClick={() => setVista('registro')} style={{ background: 'none', border: '1px solid white', color: 'white', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>Ir a Registro Público</button>}
          {vista === 'registro' && <button onClick={() => setVista('pre_login')} style={{ background: 'none', border: '1px solid white', color: 'white', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>Acceso Interno</button>}
          {vista === 'panel' && <button onClick={() => {setVista('registro'); setTabAdmin('dashboard');}} style={{ background: '#EE2D24', border: 'none', color: 'white', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>Cerrar Sesión</button>}
        </div>
      </div>

      {/* PANTALLA 1: REGISTRO PÚBLICO */}
      {vista === 'registro' && (
        <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#333', fontSize: '22px', borderBottom: '3px solid #EE2D24', paddingBottom: '10px', marginBottom: '20px' }}>Registro de Nuevos Proveedores</h2>
          <form onSubmit={manejarEnvioRegistro}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Razón Social *</label><input required style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setFormData({...formData, razonSocial: e.target.value})} /></div>
              <div><label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Nombre de Fantasía *</label><input required style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setFormData({...formData, nombreFantasia: e.target.value})} /></div>
              <div><label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>RUT Empresa *</label><input required placeholder="12345678-9" value={formData.rut} style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setFormData({...formData, rut: formatearRUT(e.target.value)})} /></div>
              <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Domicilio Comercial *</label><input required style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setFormData({...formData, domicilio: e.target.value})} /></div>
              <div>
                <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Categoría *</label>
                <select required style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: 'white' }} onChange={e => setFormData({...formData, categoria: e.target.value, subcategoria: ''})}>
                  <option value="">Seleccione...</option>
                  {Object.keys(categoriasSodimac).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Subcategoría *</label>
                <select required disabled={!formData.categoria} style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: 'white' }} onChange={e => setFormData({...formData, subcategoria: e.target.value})}>
                  <option value="">Seleccione...</option>
                  {formData.categoria && categoriasSodimac[formData.categoria].map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
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
            <button type="submit" style={{ width: '100%', padding: '15px', marginTop: '25px', backgroundColor: '#EE2D24', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', borderRadius: '4px' }}>ENVIAR REGISTRO</button>
          </form>
        </div>
      )}

      {/* PANTALLA 1.5: BARRERA DE SEGURIDAD (PRE-LOGIN) */}
      {vista === 'pre_login' && (
        <div style={{ maxWidth: '400px', margin: '50px auto', backgroundColor: 'white', padding: '40px 30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h2 style={{ textAlign: 'center', color: '#004A99', marginBottom: '10px', fontSize: '24px' }}>Seguridad de Acceso</h2>
          <p style={{ textAlign: 'center', fontSize: '13px', color: '#666', marginBottom: '30px' }}>Ingrese el código de autorización institucional.</p>
          <form onSubmit={manejarPreLogin}>
            <div style={{ marginBottom: '30px' }}><input required type="password" maxLength="6" placeholder="******" value={preLoginPin} onChange={e => setPreLoginPin(e.target.value)} style={{ width: '100%', padding: '15px', border: '2px solid #ccc', borderRadius: '4px', letterSpacing: '12px', textAlign: 'center', fontSize: '24px', outline: 'none' }} /></div>
            <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#004A99', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '14px', borderRadius: '4px', cursor: 'pointer' }}>VALIDAR ACCESO</button>
            <button type="button" onClick={() => setVista('registro')} style={{ width: '100%', padding: '14px', marginTop: '10px', backgroundColor: 'transparent', color: '#555', border: '1px solid #ccc', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>VOLVER</button>
          </form>
        </div>
      )}

      {/* MODAL TÉRMINOS Y CONDICIONES */}
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

      {/* PANTALLA 2: LOGIN */}
      {vista === 'login' && (
        <div style={{ maxWidth: '400px', margin: '50px auto', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h2 style={{ textAlign: 'center', color: '#004A99', marginBottom: '25px' }}>Ingreso de Administrador</h2>
          <form onSubmit={manejarLogin}>
            <div style={{ marginBottom: '15px' }}><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Usuario</label><input required style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setCredenciales({...credenciales, usuario: e.target.value})} /></div>
            <div style={{ marginBottom: '15px' }}><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Contraseña</label><input required type="password" style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setCredenciales({...credenciales, password: e.target.value})} /></div>
            <div style={{ marginBottom: '25px' }}><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>PIN de Seguridad Interno</label><input required type="password" maxLength="6" style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', letterSpacing: '3px' }} onChange={e => setCredenciales({...credenciales, pin: e.target.value})} /></div>
            <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#004A99', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>INGRESAR AL PANEL</button>
            <div style={{ textAlign: 'center', marginTop: '15px' }}><button type="button" onClick={() => setVista('recuperar')} style={{ background: 'none', border: 'none', color: '#004A99', textDecoration: 'underline', fontSize: '12px', cursor: 'pointer' }}>¿Olvidaste tu contraseña?</button></div>
          </form>
        </div>
      )}

      {/* PANTALLA 3: RECUPERAR CONTRASEÑA */}
      {vista === 'recuperar' && (
        <div style={{ maxWidth: '400px', margin: '50px auto', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h2 style={{ textAlign: 'center', color: '#004A99', marginBottom: '10px' }}>Recuperar Acceso</h2>
          {resetStep === 1 ? (
            <form onSubmit={buscarCorreo}>
              <div style={{ marginBottom: '20px' }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>Correo Registrado</label><input required type="email" style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setResetData({...resetData, correo: e.target.value})} /></div>
              <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#004A99', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>VERIFICAR</button>
            </form>
          ) : (
            <form onSubmit={actualizarPassword}>
              <div style={{ marginBottom: '15px' }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>Nueva Contraseña</label><input required type="password" style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setResetData({...resetData, nuevaPass: e.target.value})} /></div>
              <div style={{ marginBottom: '25px' }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>Nuevo PIN</label><input required type="password" maxLength="6" style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setResetData({...resetData, nuevoPin: e.target.value})} /></div>
              <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>GUARDAR</button>
            </form>
          )}
        </div>
      )}

      {/* PANTALLA 4: PANEL ADMINISTRATIVO Y DASHBOARD */}
      {vista === 'panel' && (
        <div style={{ maxWidth: '1200px', margin: '0 auto', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', borderBottom: '3px solid #EE2D24', paddingBottom: '10px', marginBottom: '20px', gap: '20px', overflowX: 'auto' }}>
            <h2 onClick={() => setTabAdmin('dashboard')} style={{ color: tabAdmin === 'dashboard' ? '#004A99' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>Dashboard</h2>
            <h2 onClick={() => setTabAdmin('proveedores')} style={{ color: tabAdmin === 'proveedores' ? '#004A99' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>Pendientes / Gestión</h2>
            <h2 onClick={() => {setTabAdmin('exportar'); setSeleccionados([]);}} style={{ color: tabAdmin === 'exportar' ? '#28a745' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>Exportar Aprobados</h2>
            <h2 onClick={() => setTabAdmin('crear_admin')} style={{ color: tabAdmin === 'crear_admin' ? '#004A99' : '#999', fontSize: '18px', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Nuevo Admin</h2>
          </div>
          
          {tabAdmin === 'dashboard' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                <div style={{ backgroundColor: '#004A99', color: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase' }}>Total Proveedores Registrados</h3>
                  <p style={{ margin: '10px 0 0 0', fontSize: '36px', fontWeight: 'bold' }}>{stats.total}</p>
                </div>
                <div style={{ backgroundColor: '#EE2D24', color: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase' }}>Aprobados en Base</h3>
                  <p style={{ margin: '10px 0 0 0', fontSize: '36px', fontWeight: 'bold' }}>{totalAprobados}</p>
                </div>
                <div style={{ backgroundColor: '#ffc107', color: '#333', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase' }}>Requieren Actualización (>90 días)</h3>
                  <p style={{ margin: '10px 0 0 0', fontSize: '36px', fontWeight: 'bold' }}>{stats.renovaciones.length}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px', marginBottom: '30px' }}>
                <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px', backgroundColor: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, color: '#333', fontSize: '16px' }}>Distribución Aprobados</h3>
                    <select style={{ padding: '5px', fontSize: '12px', borderRadius: '4px', border: '1px solid #ccc' }} onChange={e => setTipoGraficoTorta(e.target.value)} value={tipoGraficoTorta}>
                      <option value="categoria">Por Categoría</option>
                      <option value="subcategoria">Por Subcategoría</option>
                    </select>
                  </div>
                  {totalAprobados === 0 ? <p style={{ textAlign: 'center', color: '#999', marginTop: '50px' }}>No hay aprobados aún</p> : (
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
                  <h3 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '16px' }}>Tendencia de Registros</h3>
                  {stats.fechasOrdenadas.length === 0 ? <p style={{ textAlign: 'center', color: '#999', marginTop: '50px' }}>No hay registros para graficar</p> : (
                    <div style={{ position: 'relative', width: '100%', height: '250px' }}>
                      <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
                        <line x1={padX} y1={chartHeight - padY} x2={chartWidth} y2={chartHeight - padY} stroke="#ccc" strokeWidth="2" />
                        <line x1={padX} y1="0" x2={padX} y2={chartHeight - padY} stroke="#ccc" strokeWidth="2" />
                        {stats.fechasOrdenadas.length > 1 && <polyline points={puntosLinea} fill="none" stroke="#004A99" strokeWidth="3" />}
                        {stats.fechasOrdenadas.map((f, i) => {
                          const cx = padX + i * stepX;
                          const cy = chartHeight - padY - ((stats.fechasRaw[f] / maxReg) * (chartHeight - 2 * padY));
                          return (
                            <g key={f}>
                              <circle cx={cx} cy={cy} r="5" fill="#EE2D24" />
                              <text x={cx} y={cy - 10} fontSize="12" fill="#333" textAnchor="middle">{stats.fechasRaw[f]}</text>
                              {i % Math.ceil(stats.fechasOrdenadas.length / 5) === 0 && <text x={cx} y={chartHeight - 10} fontSize="11" fill="#666" textAnchor="middle">{f.substring(0, 5)}</text>}
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {stats.renovaciones.length > 0 && (
                <div style={{ backgroundColor: '#fff3cd', border: '1px solid #ffeeba', padding: '20px', borderRadius: '8px' }}>
                  <h3 style={{ margin: '0 0 15px 0', color: '#856404' }}>Acción Requerida: Envío de Recordatorios</h3>
                  <p style={{ fontSize: '13px', color: '#856404', marginBottom: '15px' }}>Los siguientes proveedores llevan más de 90 días en la base y necesitan actualizar su información.</p>
                  {stats.renovaciones.map(prov => (
                    <div key={prov.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '10px', borderRadius: '4px', marginBottom: '8px', border: '1px solid #ddd' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{prov.razon_social} <span style={{ color: '#666', fontWeight: 'normal' }}>({prov.rut})</span></span>
                      <button onClick={() => enviarRecordatorio(prov)} style={{ backgroundColor: '#004A99', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Enviar Correo de Actualización</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tabAdmin === 'proveedores' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead><tr style={{ backgroundColor: '#f0f0f0', textAlign: 'left' }}><th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Razón Social / RUT</th><th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Categoría</th><th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Contacto</th><th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Estado</th><th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Acciones</th></tr></thead>
                <tbody>
                  {proveedores.map(prov => (
                    <tr key={prov.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px' }}><strong>{prov.razon_social}</strong><br/><span style={{ color: '#666' }}>{prov.rut}</span></td>
                      <td style={{ padding: '12px' }}>{prov.categoria}<br/><span style={{ color: '#666', fontSize: '11px' }}>{prov.subcategoria}</span></td>
                      <td style={{ padding: '12px' }}>{prov.nombre_contacto}<br/><a href={`mailto:${prov.email_principal}`} style={{ color: '#004A99', textDecoration: 'none' }}>{prov.email_principal}</a></td>
                      <td style={{ padding: '12px' }}><span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', backgroundColor: prov.estado === 'Aprobado' ? '#d4edda' : '#fff3cd', color: prov.estado === 'Aprobado' ? '#155724' : '#856404' }}>{prov.estado}</span></td>
                      <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                        {prov.estado === 'Pendiente' && <button onClick={() => aprobarProveedor(prov.id)} style={{ padding: '6px 10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Aprobar</button>}
                        <button onClick={() => rechazarProveedor(prov.id)} style={{ padding: '6px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tabAdmin === 'exportar' && (
            <div>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>Filtra y selecciona los proveedores aprobados para generar un archivo CSV compatible con los sistemas internos.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px', marginBottom: '20px', backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
                <div><label style={{ fontSize: '12px', fontWeight: 'bold' }}>Buscar por RUT</label><input placeholder="Ej: 12345678-9" style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setFiltroRut(e.target.value)} /></div>
                <div><label style={{ fontSize: '12px', fontWeight: 'bold' }}>Nombre de Fantasía</label><input placeholder="Buscar empresa..." style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setFiltroNombre(e.target.value)} /></div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Categoría</label>
                  <select style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => {setFiltroCategoria(e.target.value); setFiltroSubcategoria('');}}>
                    <option value="">Todas</option>
                    {Object.keys(categoriasSodimac).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Subcategoría</label>
                  <select disabled={!filtroCategoria} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setFiltroSubcategoria(e.target.value)}>
                    <option value="">Todas</option>
                    {filtroCategoria && categoriasSodimac[filtroCategoria].map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#004A99' }}>Seleccionados: {seleccionados.length} de {proveedoresFiltrados.length}</span>
                <button onClick={exportarCSV} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>Descargar CSV Exportable</button>
              </div>

              <div style={{ overflowX: 'auto', border: '1px solid #ccc', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f0f0f0', textAlign: 'left' }}>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ccc', width: '40px', textAlign: 'center' }}>
                        <input type="checkbox" onChange={toggleSeleccionarTodo} checked={seleccionados.length === proveedoresFiltrados.length && proveedoresFiltrados.length > 0} />
                      </th>
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
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <input type="checkbox" checked={seleccionados.includes(prov.id)} onChange={() => toggleSeleccion(prov.id)} />
                        </td>
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
            <div style={{ maxWidth: '600px' }}>
              <form onSubmit={crearAdministrador} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Nombre</label><input required value={nuevoAdmin.nombre} style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setNuevoAdmin({...nuevoAdmin, nombre: e.target.value})} /></div>
                <div><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Apellido</label><input required value={nuevoAdmin.apellido} style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setNuevoAdmin({...nuevoAdmin, apellido: e.target.value})} /></div>
                <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Usuario</label><input required value={nuevoAdmin.usuario} style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setNuevoAdmin({...nuevoAdmin, usuario: e.target.value})} /></div>
                <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Correo</label><input required type="email" value={nuevoAdmin.correo} style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setNuevoAdmin({...nuevoAdmin, correo: e.target.value})} /></div>
                <div><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Contraseña</label><input required type="password" value={nuevoAdmin.password} style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setNuevoAdmin({...nuevoAdmin, password: e.target.value})} /></div>
                <div><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>PIN (6 dígitos)</label><input required type="password" maxLength="6" value={nuevoAdmin.pin} style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', letterSpacing: '3px' }} onChange={e => setNuevoAdmin({...nuevoAdmin, pin: e.target.value})} /></div>
                <button type="submit" style={{ gridColumn: '1 / -1', padding: '12px', marginTop: '10px', backgroundColor: '#004A99', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>CREAR USUARIO</button>
              </form>
            </div>
          )}
        </div>
      )}

    </div>
  );
}