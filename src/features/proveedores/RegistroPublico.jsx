import React from 'react';
import { validarRUT, formatearRUT, sanitizarYCapitalizar } from '../../utils/formato';
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
    <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h2 style={{ color: '#004A99', textAlign: 'center', marginBottom: '20px' }}>Registro de Proveedores</h2>
      <form onSubmit={manejarEnvioRegistro} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Razón Social</label>
          <input required value={formData.razonSocial} onChange={e => setFormData({...formData, razonSocial: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} disabled={bloqueoSeguridad} />
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Nombre de Fantasía</label>
          <input required value={formData.nombreFantasia} onChange={e => setFormData({...formData, nombreFantasia: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} disabled={bloqueoSeguridad} />
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>RUT</label>
          <input required value={formData.rut} onChange={e => setFormData({...formData, rut: formatearRUT(e.target.value)})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} disabled={bloqueoSeguridad} />
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Domicilio Comercial</label>
          <input required value={formData.domicilio} onChange={e => setFormData({...formData, domicilio: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} disabled={bloqueoSeguridad} />
        </div>
        
        <div>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Categoría</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginTop: '5px' }}>
            {Object.keys(categoriasDinamicas).map(cat => (
              <label key={cat} style={{ fontSize: '11px', display: 'flex', alignItems: 'center' }}>
                <input type="checkbox" checked={formData.categoria.includes(cat)} onChange={e => manejarCambioCategoria(cat, e.target.checked)} style={{ marginRight: '5px' }} disabled={bloqueoSeguridad} /> {cat}
              </label>
            ))}
          </div>
        </div>

        {/* SECCIÓN CORREGIDA: Subcategorías agrupadas dinámicamente por categoría seleccionada */}
        <div>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Subcategoría</label>
          <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '5px', backgroundColor: '#fcfcfc' }}>
            {formData.categoria.length === 0 ? (
              <p style={{ fontSize: '11px', color: '#888', fontStyle: 'italic', margin: '5px 0' }}>Seleccione al menos una categoría para ver sus subcategorías.</p>
            ) : (
              formData.categoria.map(cat => {
                const subcategoriasDeCat = categoriasDinamicas[cat] || [];
                if (subcategoriasDeCat.length === 0) return null;

                return (
                  <div key={cat} style={{ marginBottom: '12px', borderLeft: '3px solid #004A99', paddingLeft: '8px' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#004A99', marginBottom: '4px', textTransform: 'uppercase' }}>
                      {cat}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {subcategoriasDeCat.map(sub => (
                        <label key={sub} style={{ fontSize: '11px', display: 'flex', alignItems: 'center' }}>
                          <input 
                            type="checkbox" 
                            checked={formData.subcategoria.includes(sub)} 
                            onChange={e => manejarCambioSubcategoria(sub, e.target.checked)} 
                            style={{ marginRight: '5px' }} 
                            disabled={bloqueoSeguridad} 
                          /> 
                          {sub}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Zonas de Cobertura</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginTop: '5px' }}>
            {zonasOpciones.map(zona => (
              <label key={zona} style={{ fontSize: '11px', display: 'flex', alignItems: 'center' }}>
                <input type="checkbox" checked={formData.zonasCobertura.includes(zona)} onChange={e => manejarCambioZona(zona, e.target.checked)} style={{ marginRight: '5px' }} disabled={bloqueoSeguridad} /> {zona}
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Email Principal</label>
            <input required type="email" value={formData.emailPrincipal} onChange={e => setFormData({...formData, emailPrincipal: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} disabled={bloqueoSeguridad} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Email Secundario</label>
            <input type="email" value={formData.emailSecundario} onChange={e => setFormData({...formData, emailSecundario: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} disabled={bloqueoSeguridad} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Contacto</label>
                <input required value={formData.contacto} onChange={e => setFormData({...formData, contacto: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} disabled={bloqueoSeguridad} />
            </div>
            <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Cargo</label>
                <input required value={formData.cargo} onChange={e => setFormData({...formData, cargo: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} disabled={bloqueoSeguridad} />
            </div>
        </div>

        <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Teléfono</label>
            <input required value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} disabled={bloqueoSeguridad} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>¿Posee Website?</label>
          <select value={formData.poseeWebsite} onChange={e => setFormData({...formData, poseeWebsite: e.target.value})} disabled={bloqueoSeguridad}>
            <option value="no">No</option>
            <option value="si">Sí</option>
          </select>
          {formData.poseeWebsite === 'si' && (
            <input placeholder="URL" value={formData.websiteUrl} onChange={e => setFormData({...formData, websiteUrl: e.target.value})} style={{ flex: 1, padding: '5px', border: '1px solid #ccc', borderRadius: '4px' }} disabled={bloqueoSeguridad} />
          )}
        </div>

        <div style={{ fontSize: '12px' }}>
          <input type="checkbox" checked={formData.terminos} onChange={e => setFormData({...formData, terminos: e.target.checked})} disabled={bloqueoSeguridad} />
          <span style={{ marginLeft: '5px' }}>Acepto los <button type="button" onClick={() => setMostrarTerminos(true)} style={{ background: 'none', border: 'none', color: '#004A99', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}>Términos y Condiciones</button></span>
        </div>

        <button type="submit" style={{ padding: '12px', backgroundColor: '#EE2D24', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: bloqueoSeguridad ? 'not-allowed' : 'pointer' }} disabled={bloqueoSeguridad || !formData.terminos}>
          Enviar Registro
        </button>
      </form>
    </div>
  );
}