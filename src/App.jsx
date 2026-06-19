import React, { useState } from 'react';
import { supabase } from './supabase';
import { categoriasSodimac, formatearRUT, validarRUT } from './datosSodimac';

export default function App() {
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
      terminos_aceptados: formData.terminos
    }]);

    if (error) {
      alert("Error al guardar: " + error.message);
    } else {
      alert("Registro enviado con éxito. Estado: Pendiente de revisión.");
      window.location.reload();
    }
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#f4f4f4', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        
        <div style={{ borderBottom: '3px solid #EE2D24', paddingBottom: '10px', marginBottom: '20px' }}>
          <h1 style={{ color: '#004A99', margin: 0 }}>SODIMAC S.A.</h1>
          <h2 style={{ color: '#333', fontSize: '18px', margin: '5px 0 0 0' }}>Registro de Proveedores</h2>
        </div>

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
    </div>
  );
}