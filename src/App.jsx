import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { categoriasSodimac, formatearRUT, validarRUT } from './datosSodimac';

export default function App() {
  // Estado de navegación: 'registro', 'login', 'panel', 'recuperar'
  const [vista, setVista] = useState('registro'); 
  // Sub-navegación del panel: 'proveedores', 'crear_admin'
  const [tabAdmin, setTabAdmin] = useState('proveedores');

  // --- 1. LÓGICA DEL FORMULARIO PÚBLICO ---
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
      razon_social: formData.razonSocial,
      nombre_fantasia: formData.nombreFantasia,
      rut: formData.rut,
      domicilio_comercial: formData.domicilio,
      categoria: formData.categoria,
      subcategoria: formData.subcategoria,
      email_principal: formData.emailPrincipal,
      email_secundario: formData.emailSecundario,
      nombre_contacto: formData.contacto,
      cargo: formData.cargo,
      telefono: formData.telefono,
      terminos_aceptados: formData.terminos,
      estado: 'Pendiente'
    }]);

    if (error) {
      alert("Error al guardar: " + error.message);
    } else {
      alert("✅ Registro enviado con éxito. Estado: Pendiente de revisión.");
      window.location.reload();
    }
  };

  // --- 2. LÓGICA DE LOGIN Y PANEL ADMINISTRADOR ---
  const [credenciales, setCredenciales] = useState({ usuario: '', password: '', pin: '' });
  const [proveedores, setProveedores] = useState([]);

  const manejarLogin = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('administradores')
      .select('*')
      .eq('usuario', credenciales.usuario)
      .eq('password', credenciales.password)
      .eq('pin', credenciales.pin)
      .maybeSingle();

    if (error) {
      alert("⚠️ Error de conexión con Supabase. Verifica tu internet.");
      return;
    }
    if (!data) {
      alert("🔍 Credenciales incorrectas. Verifica Usuario, Contraseña y PIN.");
      return;
    }

    setVista('panel');
    cargarProveedores();
  };

  const cargarProveedores = async () => {
    const { data, error } = await supabase
      .from('proveedores')
      .select('*')
      .order('fecha_registro', { ascending: false });
    if (!error && data) setProveedores(data);
  };

  const aprobarProveedor = async (id) => {
    if(!window.confirm("¿Aprobar este proveedor para futuros procesos de cotización?")) return;
    const { error } = await supabase.from('proveedores').update({ estado: 'Aprobado' }).eq('id', id);
    if (!error) cargarProveedores();
  };

  const rechazarProveedor = async (id) => {
    if(!window.confirm("¿Rechazar y ELIMINAR definitivamente a este proveedor?")) return;
    const { error } = await supabase.from('proveedores').delete().eq('id', id);
    if (!error) cargarProveedores();
  };

  // --- 3. LÓGICA CREACIÓN DE USUARIOS ---
  const [nuevoAdmin, setNuevoAdmin] = useState({ nombre: '', apellido: '', usuario: '', correo: '', password: '', pin: '' });

  const crearAdministrador = async (e) => {
    e.preventDefault();
    const nombreCompleto = `${nuevoAdmin.nombre} ${nuevoAdmin.apellido}`;
    
    const { error } = await supabase.from('administradores').insert([{
      usuario: nuevoAdmin.usuario,
      password: nuevoAdmin.password,
      pin: nuevoAdmin.pin,
      nombre_completo: nombreCompleto,
      correo: nuevoAdmin.correo
    }]);

    if (error) {
      alert("Error al crear usuario. Es posible que el nombre de usuario o correo ya existan.");
    } else {
      alert("✅ Usuario administrador creado exitosamente.");
      setNuevoAdmin({ nombre: '', apellido: '', usuario: '', correo: '', password: '', pin: '' });
      setTabAdmin('proveedores');
    }
  };

  // --- 4. LÓGICA DE RECUPERACIÓN DE CONTRASEÑA ---
  const [resetStep, setResetStep] = useState(1);
  const [resetData, setResetData] = useState({ correo: '', nuevaPass: '', nuevoPin: '', idUsuario: null });

  const buscarCorreo = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.from('administradores').select('id').eq('correo', resetData.correo).maybeSingle();
    
    if (error || !data) {
      alert("No se encontró ningún administrador asociado a este correo.");
    } else {
      setResetData({ ...resetData, idUsuario: data.id });
      setResetStep(2);
    }
  };

  const actualizarPassword = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('administradores')
      .update({ password: resetData.nuevaPass, pin: resetData.nuevoPin })
      .eq('id', resetData.idUsuario);

    if (error) {
      alert("Error al actualizar las credenciales.");
    } else {
      alert("✅ Contraseña y PIN actualizados correctamente. Ya puedes iniciar sesión.");
      setVista('login');
      setResetStep(1);
      setResetData({ correo: '', nuevaPass: '', nuevoPin: '', idUsuario: null });
    }
  };

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
          {(vista === 'login' || vista === 'recuperar') && <button onClick={() => setVista('registro')} style={{ background: 'none', border: '1px solid white', color: 'white', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>Ir a Registro Público</button>}
          {vista === 'registro' && <button onClick={() => setVista('login')} style={{ background: 'none', border: '1px solid white', color: 'white', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>Acceso Interno</button>}
          {vista === 'panel' && <button onClick={() => {setVista('login'); setTabAdmin('proveedores');}} style={{ background: '#EE2D24', border: 'none', color: 'white', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>Cerrar Sesión</button>}
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
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                <input type="checkbox" required onChange={e => setFormData({...formData, terminos: e.target.checked})} style={{ width: '18px', height: '18px' }} />
                Acepto los Términos y Condiciones de registro de proveedores de Sodimac.
              </label>
            </div>
            <button type="submit" style={{ width: '100%', padding: '15px', marginTop: '25px', backgroundColor: '#EE2D24', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', borderRadius: '4px' }}>
              ENVIAR REGISTRO
            </button>
          </form>
        </div>
      )}

      {/* PANTALLA: LOGIN */}
      {vista === 'login' && (
        <div style={{ maxWidth: '400px', margin: '50px auto', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h2 style={{ textAlign: 'center', color: '#004A99', marginBottom: '25px' }}>Acceso Administrativo</h2>
          <form onSubmit={manejarLogin}>
            <div style={{ marginBottom: '15px' }}><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Usuario</label><input required style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} onChange={e => setCredenciales({...credenciales, usuario: e.target.value})} /></div>
            <div style={{ marginBottom: '15px' }}><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Contraseña</label><input required type="password" style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} onChange={e => setCredenciales({...credenciales, password: e.target.value})} /></div>
            <div style={{ marginBottom: '25px' }}><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>PIN de Seguridad (6 dígitos)</label><input required type="password" maxLength="6" style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', letterSpacing: '3px' }} onChange={e => setCredenciales({...credenciales, pin: e.target.value})} /></div>
            <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#004A99', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>INGRESAR AL PANEL</button>
            <div style={{ textAlign: 'center', marginTop: '15px' }}>
              <button type="button" onClick={() => setVista('recuperar')} style={{ background: 'none', border: 'none', color: '#004A99', textDecoration: 'underline', fontSize: '12px', cursor: 'pointer' }}>¿Olvidaste tu contraseña?</button>
            </div>
          </form>
        </div>
      )}

      {/* PANTALLA: RECUPERAR CONTRASEÑA */}
      {vista === 'recuperar' && (
        <div style={{ maxWidth: '400px', margin: '50px auto', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h2 style={{ textAlign: 'center', color: '#004A99', marginBottom: '10px' }}>Recuperar Acceso</h2>
          <p style={{ textAlign: 'center', fontSize: '12px', color: '#666', marginBottom: '25px' }}>Verificación y actualización directa.</p>
          
          {resetStep === 1 && (
            <form onSubmit={buscarCorreo}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Correo Electrónico Registrado</label>
                <input required type="email" style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} onChange={e => setResetData({...resetData, correo: e.target.value})} />
              </div>
              <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#004A99', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>VERIFICAR CORREO</button>
              <button type="button" onClick={() => setVista('login')} style={{ width: '100%', padding: '12px', marginTop: '10px', backgroundColor: 'transparent', color: '#555', border: '1px solid #ccc', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>VOLVER</button>
            </form>
          )}

          {resetStep === 2 && (
            <form onSubmit={actualizarPassword}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Nueva Contraseña</label>
                <input required type="password" style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} onChange={e => setResetData({...resetData, nuevaPass: e.target.value})} />
              </div>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Nuevo PIN (6 dígitos)</label>
                <input required type="password" maxLength="6" style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', letterSpacing: '3px' }} onChange={e => setResetData({...resetData, nuevoPin: e.target.value})} />
              </div>
              <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>GUARDAR NUEVAS CREDENCIALES</button>
            </form>
          )}
        </div>
      )}

      {/* PANTALLA: DASHBOARD */}
      {vista === 'panel' && (
        <div style={{ maxWidth: '1200px', margin: '0 auto', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', borderBottom: '3px solid #EE2D24', paddingBottom: '10px', marginBottom: '20px', gap: '20px' }}>
            <h2 onClick={() => setTabAdmin('proveedores')} style={{ color: tabAdmin === 'proveedores' ? '#004A99' : '#999', fontSize: '20px', margin: 0, cursor: 'pointer' }}>Gestión de Proveedores</h2>
            <h2 onClick={() => setTabAdmin('crear_admin')} style={{ color: tabAdmin === 'crear_admin' ? '#004A99' : '#999', fontSize: '20px', margin: 0, cursor: 'pointer' }}>+ Crear Usuario Admin</h2>
          </div>
          
          {tabAdmin === 'proveedores' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f0f0f0', textAlign: 'left' }}>
                    <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Razón Social / RUT</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Categoría</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Contacto</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Estado</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {proveedores.length === 0 ? (
                    <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#777' }}>No hay proveedores registrados aún.</td></tr>
                  ) : (
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {tabAdmin === 'crear_admin' && (
            <div style={{ maxWidth: '600px' }}>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>Ingresa los datos para registrar un nuevo perfil con acceso al panel administrativo.</p>
              <form onSubmit={crearAdministrador} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Nombre</label><input required value={nuevoAdmin.nombre} style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} onChange={e => setNuevoAdmin({...nuevoAdmin, nombre: e.target.value})} /></div>
                <div><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Apellido</label><input required value={nuevoAdmin.apellido} style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} onChange={e => setNuevoAdmin({...nuevoAdmin, apellido: e.target.value})} /></div>
                
                <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Usuario de Acceso (Ej: jmartinez)</label><input required value={nuevoAdmin.usuario} style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} onChange={e => setNuevoAdmin({...nuevoAdmin, usuario: e.target.value})} /></div>
                
                <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Correo Electrónico Sodimac</label><input required type="email" value={nuevoAdmin.correo} style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} onChange={e => setNuevoAdmin({...nuevoAdmin, correo: e.target.value})} /></div>
                
                <div><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Contraseña</label><input required type="password" value={nuevoAdmin.password} style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} onChange={e => setNuevoAdmin({...nuevoAdmin, password: e.target.value})} /></div>
                <div><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>PIN (6 dígitos)</label><input required type="password" maxLength="6" value={nuevoAdmin.pin} style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', letterSpacing: '3px' }} onChange={e => setNuevoAdmin({...nuevoAdmin, pin: e.target.value})} /></div>
                
                <button type="submit" style={{ gridColumn: '1 / -1', padding: '12px', marginTop: '10px', backgroundColor: '#004A99', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>CREAR USUARIO ADMINISTRADOR</button>
              </form>
            </div>
          )}
        </div>
      )}

    </div>
  );
}