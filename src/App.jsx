import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { categoriasSodimac, formatearRUT, validarRUT } from './datosSodimac';

export default function App() {
  // Estado de navegación: 'registro', 'login', 'panel'
  const [vista, setVista] = useState('registro'); 

  // --- LÓGICA DEL FORMULARIO PÚBLICO ---
  const [formData, setFormData] = useState({
    razonSocial: '', nombreFantasia: '', rut: '', domicilio: '',
    categoria: '', subcategoria: '', emailPrincipal: '', emailSecundario: '',
    contacto: '', cargo: '', telefono: '', terminos: false
  });

  const manejarEnvio = async (e) => {
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
      alert("Registro enviado con éxito. Estado: Pendiente de revisión.");
      window.location.reload();
    }
  };

  // --- LÓGICA DE ADMINISTRADOR ---
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
      .single();

    if (error || !data) {
      alert("Credenciales incorrectas. Verifique Usuario, Contraseña y PIN.");
    } else {
      setVista('panel');
      cargarProveedores();
    }
  };

  const cargarProveedores = async () => {
    const { data, error } = await supabase.from('proveedores').select('*').order('fecha_registro', { ascending: false });
    if (!error && data) {
      setProveedores(data);
    }
  };

  const aprobarProveedor = async (id) => {
    if(!window.confirm("¿Aprobar este proveedor para futuros procesos de cotización?")) return;
    const { error } = await supabase.from('proveedores').update({ estado: 'Aprobado' }).eq('id', id);
    if (!error) cargarProveedores();
  };

  const rechazarProveedor = async (id) => {
    if(!window.confirm("¿Rechazar y ELIMINAR definitivamente a este proveedor de la base de datos?")) return;
    const { error } = await supabase.from('proveedores').delete().eq('id', id);
    if (!error) cargarProveedores();
  };

  // --- RENDERIZADO DE PANTALLAS ---
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#f4f4f4', minHeight: '100vh', padding: '20px' }}>
      
      {/* BARRA SUPERIOR (NAVBAR) */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#004A99', padding: '15px 20px', borderRadius: '8px', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ backgroundColor: '#EE2D24', padding: '5px 10px', fontWeight: 'bold', borderRadius: '4px' }}>SODIMAC</div>
          <span style={{ fontSize: '18px', fontWeight: '600' }}>Portal de Proveedores</span>
        </div>
        <div>
          {vista !== 'registro' && <button onClick={() => setVista('registro')} style={{ background: 'none', border: '1px solid white', color: 'white', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}>Ver Formulario Público</button>}
          {vista === 'registro' && <button onClick={() => setVista('login')} style={{ background: 'none', border: '1px solid white', color: 'white', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>Acceso Interno</button>}
          {vista === 'panel' && <button onClick={() => setVista('login')} style={{ background: '#EE2D24', border: 'none', color: 'white', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>Cerrar Sesión</button>}
        </div>
      </div>

      {/* PANTALLA 1: FORMULARIO PÚBLICO */}
      {vista === 'registro' && (
        <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#333', fontSize: '22px', borderBottom: '3px solid #EE2D24', paddingBottom: '10px', marginBottom: '20px' }}>Registro de Nuevos Proveedores</h2>
          <form onSubmit={manejarEnvio}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Razón Social *</label>
                <input required style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} onChange={e => setFormData({...formData, razonSocial: e.target.value})} />
              </div>
              
              <div>
                <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Nombre de Fantasía *</label>
                <input required style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} onChange={e => setFormData({...formData, nombreFantasia: e.target.value})} />
              </div>
              
              <div>
                <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>RUT Empresa *</label>
                <input required placeholder="12345678-9" value={formData.rut} style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} onChange={e => setFormData({...formData, rut: formatearRUT(e.target.value)})} />
              </div>
              
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Domicilio Comercial *</label>
                <input required style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} onChange={e => setFormData({...formData, domicilio: e.target.value})} />
              </div>

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

              <div>
                <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Email Principal *</label>
                <input type="email" required style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} onChange={e => setFormData({...formData, emailPrincipal: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Email Secundario</label>
                <input type="email" style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} onChange={e => setFormData({...formData, emailSecundario: e.target.value})} />
              </div>
              
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Nombre Contacto *</label>
                <input required style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} onChange={e => setFormData({...formData, contacto: e.target.value})} />
              </div>
              
              <div>
                <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Cargo *</label>
                <input required style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} onChange={e => setFormData({...formData, cargo: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Teléfono *</label>
                <input required style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} onChange={e => setFormData({...formData, telefono: e.target.value})} />
              </div>
            </div>

            <div style={{ marginTop: '25px', padding: '15px', backgroundColor: '#f9f9f9', border: '1px solid #ddd', borderRadius: '4px' }}>
              <h3 style={{ fontSize: '14px', margin: '0 0 10px 0', color: '#333' }}>Términos y Condiciones</h3>
              <p style={{ fontSize: '12px', color: '#666', lineHeight: '1.5' }}>Al completar y enviar el formulario de registro de proveedores, el postulante declara y acepta expresamente que la información proporcionada podrá ser utilizada por Sodimac S.A. para fines de evaluación, contacto, validación, precalificación y eventual incorporación como proveedor en procesos de negociación, cotización, homologación, compra o contratación.</p>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '15px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                <input type="checkbox" required onChange={e => setFormData({...formData, terminos: e.target.checked})} style={{ width: '18px', height: '18px' }} />
                Acepto los Términos y Condiciones
              </label>
            </div>

            <button type="submit" style={{ width: '100%', padding: '15px', marginTop: '25px', backgroundColor: '#EE2D24', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', borderRadius: '4px' }}>
              ENVIAR REGISTRO
            </button>
          </form>
        </div>
      )}

      {/* PANTALLA 2: LOGIN ADMINISTRADOR */}
      {vista === 'login' && (
        <div style={{ maxWidth: '400px', margin: '50px auto', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h2 style={{ textAlign: 'center', color: '#004A99', marginBottom: '25px' }}>Acceso Administrativo</h2>
          <form onSubmit={manejarLogin}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Usuario</label>
              <input required style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} onChange={e => setCredenciales({...credenciales, usuario: e.target.value})} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Contraseña</label>
              <input required type="password" style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} onChange={e => setCredenciales({...credenciales, password: e.target.value})} />
            </div>
            <div style={{ marginBottom: '25px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>PIN de Seguridad (6 dígitos)</label>
              <input required type="password" maxLength="6" style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', letterSpacing: '3px' }} onChange={e => setCredenciales({...credenciales, pin: e.target.value})} />
            </div>
            <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#004A99', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>
              INGRESAR AL PANEL
            </button>
            <div style={{ textAlign: 'center', marginTop: '15px' }}>
              <button type="button" onClick={() => alert('Se enviará un enlace de recuperación al correo registrado (Función en desarrollo)')} style={{ background: 'none', border: 'none', color: '#004A99', textDecoration: 'underline', fontSize: '12px', cursor: 'pointer' }}>¿Olvidaste tu contraseña?</button>
            </div>
          </form>
        </div>
      )}

      {/* PANTALLA 3: DASHBOARD ADMINISTRATIVO */}
      {vista === 'panel' && (
        <div style={{ maxWidth: '1200px', margin: '0 auto', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#333', fontSize: '22px', borderBottom: '3px solid #EE2D24', paddingBottom: '10px', marginBottom: '20px' }}>Gestión de Proveedores</h2>
          
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
                      <td style={{ padding: '12px' }}>
                        <strong>{prov.razon_social}</strong><br/>
                        <span style={{ color: '#666' }}>{prov.rut}</span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {prov.categoria}<br/>
                        <span style={{ color: '#666', fontSize: '11px' }}>{prov.subcategoria}</span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {prov.nombre_contacto}<br/>
                        <a href={`mailto:${prov.email_principal}`} style={{ color: '#004A99', textDecoration: 'none' }}>{prov.email_principal}</a>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '12px', 
                          fontSize: '11px', 
                          fontWeight: 'bold',
                          backgroundColor: prov.estado === 'Aprobado' ? '#d4edda' : '#fff3cd',
                          color: prov.estado === 'Aprobado' ? '#155724' : '#856404'
                        }}>
                          {prov.estado}
                        </span>
                      </td>
                      <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                        {prov.estado === 'Pendiente' && (
                          <button onClick={() => aprobarProveedor(prov.id)} style={{ padding: '6px 10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Aprobar</button>
                        )}
                        <button onClick={() => alert('Función de edición y visualización de adjuntos en desarrollo')} style={{ padding: '6px 10px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Editar / Ver</button>
                        <button onClick={() => rechazarProveedor(prov.id)} style={{ padding: '6px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Rechazar</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}