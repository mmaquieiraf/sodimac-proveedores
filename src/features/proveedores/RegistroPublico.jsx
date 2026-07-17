import React from 'react';
import { formatearRUT } from '../../datosSodimac';
import { zonasOpciones } from '../../utils/constantes';

export default function RegistroPublico({
  formData,
  setFormData,
  manejarEnvioRegistro,
  categoriasDinamicas,
  manejarCambioCategoria,
  manejarCambioSubcategoria,
  manejarCambioZona,
  setMostrarTerminos,
  bloqueoSeguridad
}) {
  return (
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
  );
}