import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { categoriasSodimac, formatearRUT, validarRUT } from './datosSodimac';

export default function App() {
  // --- ESTADOS DE NAVEGACIÓN ---
  const [vista, setVista] = useState('registro'); 
  const [tabAdmin, setTabAdmin] = useState('dashboard');
  const [mostrarTerminos, setMostrarTerminos] = useState(false);

  // --- LÓGICA DEL FORMULARIO PÚBLICO ---
  const [formData, setFormData] = useState({
    razonSocial: '', nombreFantasia: '', rut: '', domicilio: '',
    categoria: '', subcategoria: '', emailPrincipal: '', emailSecundario: '',
    contacto: '', cargo: '', telefono: '', terminos: false
  });

  const manejarEnvioRegistro = async (e) => {
    e.preventDefault();
    if (!validarRUT(formData.rut)) {
      alert("El RUT ingresado no es válido. Por favor revise.");
      return;
    }

    const { error } = await supabase.from('proveedores').insert([{
      razon_social: formData.razonSocial, nombre_fantasia: formData.nombreFantasia,
      rut: formData.rut, domicilio_comercial: formData.domicilio,
      categoria: formData.categoria, subcategoria: formData.subcategoria,
      email_principal: formData.emailPrincipal, email_secundario: formData.emailSecundario,
      nombre_contacto: formData.contacto, cargo: formData.cargo,
      telefono: formData.telefono, terminos_aceptados: formData.terminos,
      estado: 'Pendiente'
    }]);

    if (error) alert("Error al guardar: " + error.message);
    else {
      alert("✅ Registro enviado con éxito. Estado: Pendiente de revisión.");
      window.location.reload();
    }
  };

  // --- LÓGICA DE ADMINISTRADOR ---
  const [credenciales, setCredenciales] = useState({ usuario: '', password: '', pin: '' });
  const [proveedores, setProveedores] = useState([]);
  const [nuevoAdmin, setNuevoAdmin] = useState({ nombre: '', apellido: '', usuario: '', correo: '', password: '', pin: '' });

  const manejarLogin = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.from('administradores').select('*')
      .eq('usuario', credenciales.usuario).eq('password', credenciales.password).eq('pin', credenciales.pin).maybeSingle();

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
      usuario: nuevoAdmin.usuario, password: nuevoAdmin.password, pin: nuevoAdmin.pin,
      nombre_completo: `${nuevoAdmin.nombre} ${nuevoAdmin.apellido}`, correo: nuevoAdmin.correo
    }]);

    if (error) alert("Error al crear usuario.");
    else {
      alert("✅ Usuario administrador creado exitosamente.");
      setNuevoAdmin({ nombre: '', apellido: '', usuario: '', correo: '', password: '', pin: '' });
      setTabAdmin('proveedores');
    }
  };

  // --- RECUPERACIÓN DE CONTRASEÑA ---
  const [resetStep, setResetStep] = useState(1);
  const [resetData, setResetData] = useState({ correo: '', nuevaPass: '', nuevoPin: '', idUsuario: null });

  const buscarCorreo = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.from('administradores').select('id').eq('correo', resetData.correo).maybeSingle();
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

  // --- LÓGICA DEL DASHBOARD (CALCULOS) ---
  const statsDashboard = () => {
    const total = proveedores.length;
    const categorias = {};
    const fechas = {};
    const renovaciones = [];
    
    const hace90Dias = new Date();
    hace90Dias.setDate(hace90Dias.getDate() - 90);

    proveedores.forEach(p => {
      // Conteo Categorías
      categorias[p.categoria] = (categorias[p.categoria] || 0) + 1;
      // Tendencia Fechas
      const fechaCorta = new Date(p.fecha_registro).toLocaleDateString('es-CL');
      fechas[fechaCorta] = (fechas[fechaCorta] || 0) + 1;
      // Vencidos (> 90 dias)
      const fechaReg = new Date(p.fecha_registro);
      if(fechaReg < hace90Dias) renovaciones.push(p);
    });

    return { total, categorias, fechas, renovaciones };
  };

  const enviarRecordatorio = (prov) => {
    const destinatarios = prov.email_secundario ? `${prov.email_principal},${prov.email_secundario}` : prov.email_principal;
    const asunto = encodeURIComponent("Actualización de Datos - Portal Proveedores Sodimac");
    const cuerpo = encodeURIComponent(`Estimado(a) proveedor ${prov.razon_social},\n\nPor favor actualizar sus datos de contacto en el portal si estos han cambiado, para mantener vigente su postulación.\n\nSaludos cordiales,\nSodimac S.A.`);
    window.location.href = `mailto:${destinatarios}?subject=${asunto}&body=${cuerpo}`;
  };

  const stats = statsDashboard();

  // --- RENDERIZADO VISUAL ---
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#f4f4f4', minHeight: '100vh', padding: '20px' }}>
      
      {/* NAVBAR */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#004A99', padding: '15px 20px', borderRadius: '8px', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ backgroundColor: '#EE2D24', padding: '5px 10px', fontWeight: 'bold', borderRadius: '4px' }}>SODIMAC</div>
          <span style={{ fontSize: '18px', fontWeight: '600' }}>Portal de Proveedores</span>
        </div>
        <div>
          {(vista === 'login' || vista === 'recuperar') && <button onClick={() => setVista('registro')} style={{ background: 'none', border: '1px solid white', color: 'white', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>Ir a Registro</button>}
          {vista === 'registro' && <button onClick={() => setVista('login')} style={{ background: 'none', border: '1px solid white', color: 'white', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>Acceso Interno</button>}
          {vista === 'panel' && <button onClick={() => {setVista('login'); setTabAdmin('dashboard');}} style={{ background: '#EE2D24', border: 'none', color: 'white', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>Cerrar Sesión</button>}
        </div>
      </div>

      {/* PANTALLA: REGISTRO PÚBLICO */}
      {vista === 'registro' && (
        <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#333', fontSize: '22px', borderBottom: '3px solid #EE2D24', paddingBottom: '10px', marginBottom: '20px' }}>Registro de Nuevos Proveedores</h2>
          <form onSubmit={manejarEnvioRegistro}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Razón Social *</label><input required style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} onChange={e => setFormData({...formData, razonSocial: e.target.value})} /></div>
              <div><label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Nombre de Fantasía *</label><input required style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} onChange={e => setFormData({...formData, nombreFantasia: e.target.value})} /></div>
              <div><label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>RUT Empresa *</label><input required placeholder="12345678-9" value={formData.rut} style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} onChange={e => setFormData({...formData, rut: formatearRUT(e.target.value)})} /></div>
              <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Domicilio Comercial *</label><input required style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} onChange={e => setFormData({...formData, domicilio: e.target.value})} /></div>
              <div>
                <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Categoría *</label>
                <select required style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', backgroundColor: 'white' }} onChange={e => setFormData({...formData, categoria: e.target.value, subcategoria: ''})}>
                  <option value="">Seleccione...</option>
                  {Object.keys(categoriasSodimac).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Subcategoría *</label>
                <select required disabled={!formData.categoria} style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', backgroundColor: 'white' }} onChange={e => setFormData({...formData, subcategoria: e.target.value})}>
                  <option value="">Seleccione...</option>
                  {formData.categoria && categoriasSodimac[formData.categoria].map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
              </div>
              <div><label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Email Principal *</label><input type="email" required style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} onChange={e => setFormData({...formData, emailPrincipal: e.target.value})} /></div>
              <div><label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Email Secundario</label><input type="email" style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} onChange={e => setFormData({...formData, emailSecundario: e.target.value})} /></div>
              <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Nombre Contacto *</label><input required style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} onChange={e => setFormData({...formData, contacto: e.target.value})} /></div>
              <div><label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Cargo *</label><input required style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} onChange={e => setFormData({...formData, cargo: e.target.value})} /></div>
              <div><label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Teléfono *</label><input required style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} onChange={e => setFormData({...formData, telefono: e.target.value})} /></div>
            </div>
            
            <div style={{ marginTop: '25px', padding: '15px', backgroundColor: '#f9f9f9', border: '1px solid #ddd', borderRadius: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
                <input type="checkbox" required onChange={e => setFormData({...formData, terminos: e.target.checked})} style={{ width: '18px', height: '18px' }} />
                <span>He leído y acepto los <strong onClick={(e) => {e.preventDefault(); setMostrarTerminos(true);}} style={{ color: '#004A99', textDecoration: 'underline', cursor: 'pointer' }}>Términos y Condiciones</strong> de Sodimac.</span>
              </label>
            </div>
            
            <button type="submit" style={{ width: '100%', padding: '15px', marginTop: '25px', backgroundColor: '#EE2D24', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', borderRadius: '4px' }}>
              ENVIAR REGISTRO
            </button>
          </form>
        </div>
      )}

      {/* MODAL TÉRMINOS Y CONDICIONES */}
      {mostrarTerminos && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={() => setMostrarTerminos(false)} style={{ position: 'absolute', top: '15px', right: '20px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#EE2D24', fontWeight: 'bold' }}>&times;</button>
            <h2 style={{ color: '#004A99', marginTop: 0, borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Términos y condiciones de registro de proveedores</h2>
            <div style={{ fontSize: '13px', color: '#444', lineHeight: '1.6' }}>
              <p>Al completar y enviar el formulario de registro de proveedores, el postulante declara y acepta expresamente que la información proporcionada podrá ser utilizada por Sodimac S.A. para fines de evaluación, contacto, validación, precalificación y eventual incorporación como proveedor en procesos de negociación, cotización, homologación, compra o contratación.</p>
              
              <strong>1. Información recopilada</strong>
              <p>Sodimac podrá recopilar, almacenar, organizar, revisar y tratar información de carácter empresarial y de contacto, incluyendo, entre otros, razón social, RUT, giro, nombre de contacto, cargo, correo electrónico, teléfono, dirección comercial y cualquier otro dato entregado por el proveedor en el formulario o en documentación asociada.</p>
              
              <strong>2. Finalidad del tratamiento</strong>
              <p>Los datos serán tratados con la exclusiva finalidad de:<br/>
              - gestionar el registro del proveedor;<br/>
              - evaluar su idoneidad como potencial proveedor;<br/>
              - contactar al proveedor respecto de su postulación;<br/>
              - administrar procesos de negociación, cotización y selección;<br/>
              - verificar información comercial, tributaria y de contacto; y<br/>
              - mantener un historial interno de postulaciones y gestiones vinculadas al proceso de abastecimiento.</p>
              
              <strong>3. Aceptación expresa</strong>
              <p>El proveedor, al marcar la casilla de aceptación, seleccionar la opción de conformidad o continuar con el envío del formulario, declara que:<br/>
              - ha leído y comprendido estos términos y condiciones;<br/>
              - autoriza a Sodimac a tratar los datos ingresados para las finalidades indicadas;<br/>
              - entiende que su registro no garantiza adjudicación, contratación ni relación comercial alguna; y<br/>
              - acepta que Sodimac pueda analizar su información dentro de sus procesos internos de evaluación y negociación.</p>

              <strong>4. Declaración sobre la información entregada</strong>
              <p>El proveedor declara que la información proporcionada es veraz, actualizada y suficiente para el proceso de evaluación. Asimismo, se obliga a mantenerla debidamente actualizada y a responder de buena fe las solicitudes de antecedentes adicionales que Sodimac requiera para continuar con la revisión de su postulación.</p>

              <strong>5. Conservación de la información</strong>
              <p>Sodimac podrá conservar la información entregada por el tiempo necesario para cumplir con las finalidades descritas, para fines de trazabilidad interna, control de gestión, auditoría, respaldo documental y eventuales revisiones futuras de proveedores.</p>

              <strong>6. Encargados y acceso a la información</strong>
              <p>El acceso a los datos quedará restringido a personal autorizado de Sodimac y, cuando corresponda, a terceros que intervengan en actividades de soporte, evaluación o gestión del proceso, siempre bajo instrucciones de Sodimac y conforme a la normativa aplicable.</p>

              <strong>7. Modificaciones</strong>
              <p>Sodimac podrá modificar estos términos y condiciones en cualquier momento, publicando la versión actualizada en el sitio web de registro. El uso continuado de la plataforma después de dichos cambios implicará la aceptación de la nueva versión.</p>

              <strong>8. Aceptación final</strong>
              <p>Al enviar este formulario, declaro que acepto estos Términos y Condiciones y autorizo a Sodimac S.A. a tratar mis datos para ser considerado como potencial proveedor en sus procesos de negociación y evaluación comercial.</p>
            </div>
            <button onClick={() => setMostrarTerminos(false)} style={{ width: '100%', padding: '12px', marginTop: '15px', backgroundColor: '#004A99', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>CERRAR</button>
          </div>
        </div>
      )}

      {/* PANTALLA: LOGIN */}
      {vista === 'login' && (
        <div style={{ maxWidth: '400px', margin: '50px auto', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h2 style={{ textAlign: 'center', color: '#004A99', marginBottom: '25px' }}>Acceso Administrativo</h2>
          <form onSubmit={manejarLogin}>
            <div style={{ marginBottom: '15px' }}><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Usuario</label><input required style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} onChange={e => setCredenciales({...credenciales, usuario: e.target.value})} /></div>
            <div style={{ marginBottom: '15px' }}><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Contraseña</label><input required type="password" style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} onChange={e => setCredenciales({...credenciales, password: e.target.value})} /></div>
            <div style={{ marginBottom: '25px' }}><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>PIN de Seguridad</label><input required type="password" maxLength="6" style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', letterSpacing: '3px' }} onChange={e => setCredenciales({...credenciales, pin: e.target.value})} /></div>
            <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#004A99', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>INGRESAR AL PANEL</button>
            <div style={{ textAlign: 'center', marginTop: '15px' }}><button type="button" onClick={() => setVista('recuperar')} style={{ background: 'none', border: 'none', color: '#004A99', textDecoration: 'underline', fontSize: '12px', cursor: 'pointer' }}>¿Olvidaste tu contraseña?</button></div>
          </form>
        </div>
      )}

      {/* PANTALLA: RECUPERAR CONTRASEÑA */}
      {vista === 'recuperar' && (
        <div style={{ maxWidth: '400px', margin: '50px auto', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h2 style={{ textAlign: 'center', color: '#004A99', marginBottom: '10px' }}>Recuperar Acceso</h2>
          {resetStep === 1 ? (
            <form onSubmit={buscarCorreo}>
              <div style={{ marginBottom: '20px' }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>Correo Registrado</label><input required type="email" style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} onChange={e => setResetData({...resetData, correo: e.target.value})} /></div>
              <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#004A99', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>VERIFICAR</button>
            </form>
          ) : (
            <form onSubmit={actualizarPassword}>
              <div style={{ marginBottom: '15px' }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>Nueva Contraseña</label><input required type="password" style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} onChange={e => setResetData({...resetData, nuevaPass: e.target.value})} /></div>
              <div style={{ marginBottom: '25px' }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>Nuevo PIN</label><input required type="password" maxLength="6" style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} onChange={e => setResetData({...resetData, nuevoPin: e.target.value})} /></div>
              <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>GUARDAR</button>
            </form>
          )}
        </div>
      )}

      {/* PANTALLA: PANEL ADMINISTRATIVO Y DASHBOARD */}
      {vista === 'panel' && (
        <div style={{ maxWidth: '1200px', margin: '0 auto', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', borderBottom: '3px solid #EE2D24', paddingBottom: '10px', marginBottom: '20px', gap: '20px' }}>
            <h2 onClick={() => setTabAdmin('dashboard')} style={{ color: tabAdmin === 'dashboard' ? '#004A99' : '#999', fontSize: '20px', margin: 0, cursor: 'pointer' }}>Dashboard</h2>
            <h2 onClick={() => setTabAdmin('proveedores')} style={{ color: tabAdmin === 'proveedores' ? '#004A99' : '#999', fontSize: '20px', margin: 0, cursor: 'pointer' }}>Gestión de Registros</h2>
            <h2 onClick={() => setTabAdmin('crear_admin')} style={{ color: tabAdmin === 'crear_admin' ? '#004A99' : '#999', fontSize: '20px', margin: 0, cursor: 'pointer' }}>+ Nuevo Admin</h2>
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
                  <p style={{ margin: '10px 0 0 0', fontSize: '36px', fontWeight: 'bold' }}>{proveedores.filter(p => p.estado === 'Aprobado').length}</p>
                </div>
                <div style={{ backgroundColor: '#ffc107', color: '#333', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase' }}>Requieren Actualización (>90 días)</h3>
                  <p style={{ margin: '10px 0 0 0', fontSize: '36px', fontWeight: 'bold' }}>{stats.renovaciones.length}</p>
                </div>
              </div>

              {/* RECORDATORIOS 90 DÍAS */}
              {stats.renovaciones.length > 0 && (
                <div style={{ backgroundColor: '#fff3cd', border: '1px solid #ffeeba', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                {/* GRAFICO BARRAS CSS */}
                <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px' }}>
                  <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '16px' }}>Proveedores por Categoría</h3>
                  {Object.keys(stats.categorias).map(cat => (
                    <div key={cat} style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', color: '#555' }}>
                        <span>{cat}</span>
                        <span>{stats.categorias[cat]}</span>
                      </div>
                      <div style={{ width: '100%', backgroundColor: '#eee', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                        <div style={{ width: `${(stats.categorias[cat] / stats.total) * 100}%`, backgroundColor: '#004A99', height: '100%' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* TENDENCIA REGISTROS */}
                <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px' }}>
                  <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '16px' }}>Tendencia de Registros Diarios</h3>
                  <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr><th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', paddingBottom: '8px' }}>Fecha</th><th style={{ textAlign: 'right', borderBottom: '1px solid #ccc', paddingBottom: '8px' }}>Nuevos Registros</th></tr>
                      </thead>
                      <tbody>
                        {Object.keys(stats.fechas).map(fecha => (
                          <tr key={fecha}>
                            <td style={{ padding: '8px 0', borderBottom: '1px solid #eee', color: '#555' }}>{fecha}</td>
                            <td style={{ padding: '8px 0', borderBottom: '1px solid #eee', textAlign: 'right', fontWeight: 'bold', color: '#004A99' }}>+{stats.fechas[fecha]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tabAdmin === 'proveedores' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead><tr style={{ backgroundColor: '#f0f0f0', textAlign: 'left' }}><th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Razón Social / RUT</th><th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Categoría</th><th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Contacto</th><th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Estado</th><th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Acciones</th></tr></thead>
                <tbody>
                  {proveedores.length === 0 ? <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#777' }}>No hay proveedores registrados aún.</td></tr> : 
                  proveedores.map(prov => (
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

          {tabAdmin === 'crear_admin' && (
            <div style={{ maxWidth: '600px' }}>
              <form onSubmit={crearAdministrador} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Nombre</label><input required value={nuevoAdmin.nombre} style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setNuevoAdmin({...nuevoAdmin, nombre: e.target.value})} /></div>
                <div><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Apellido</label><input required value={nuevoAdmin.apellido} style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setNuevoAdmin({...nuevoAdmin, apellido: e.target.value})} /></div>
                <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Usuario (Ej: jmartinez)</label><input required value={nuevoAdmin.usuario} style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setNuevoAdmin({...nuevoAdmin, usuario: e.target.value})} /></div>
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