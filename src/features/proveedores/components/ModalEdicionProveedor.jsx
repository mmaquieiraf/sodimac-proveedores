import React from 'react';
import { formatearRUT } from '../../../utils/datosSodimac';

export default function ModalEdicionProveedor({
  proveedorEditando,
  setProveedorEditando,
  guardarEdicionProveedor,
  manejarCambioZona,
  categoriasDinamicas,
  zonasOpciones,
  bloqueoSeguridad
}) {
  if (!proveedorEditando) return null;

  return (
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
  );
}