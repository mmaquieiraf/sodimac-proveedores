import React from 'react';
import { zonasOpciones } from '../../utils/constantes';
import { formatearRUT } from '../../utils/formato';

export default function ModalEdicionProveedor({
  proveedorEditando,
  setProveedorEditando,
  guardarEdicionProveedor,
  manejarCambioZona,
  categoriasDinamicas,
  bloqueoSeguridad
}) {
  if (!proveedorEditando) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ marginTop: 0, color: '#004A99', borderBottom: '2px solid #EE2D24', paddingBottom: '10px' }}>Editar Proveedor</h3>
        
        <form onSubmit={guardarEdicionProveedor} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Razón Social</label>
            <input required value={proveedorEditando.razon_social} onChange={e => setProveedorEditando({...proveedorEditando, razon_social: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} disabled={bloqueoSeguridad} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Nombre de Fantasía</label>
            <input required value={proveedorEditando.nombre_fantasia} onChange={e => setProveedorEditando({...proveedorEditando, nombre_fantasia: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} disabled={bloqueoSeguridad} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>RUT</label>
            <input required value={proveedorEditando.rut} onChange={e => setProveedorEditando({...proveedorEditando, rut: formatearRUT(e.target.value)})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} disabled={bloqueoSeguridad} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Domicilio Comercial</label>
            <input required value={proveedorEditando.domicilio_comercial} onChange={e => setProveedorEditando({...proveedorEditando, domicilio_comercial: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} disabled={bloqueoSeguridad} />
          </div>
          
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Categoría</label>
            <select required value={proveedorEditando.categoria} onChange={e => setProveedorEditando({...proveedorEditando, categoria: e.target.value, subcategoria: ''})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} disabled={bloqueoSeguridad}>
              <option value="">Seleccione Categoría</option>
              {Object.keys(categoriasDinamicas).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Subcategoría</label>
            <select required value={proveedorEditando.subcategoria} onChange={e => setProveedorEditando({...proveedorEditando, subcategoria: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} disabled={bloqueoSeguridad || !proveedorEditando.categoria}>
              <option value="">Seleccione Subcategoría</option>
              {proveedorEditando.categoria && categoriasDinamicas[proveedorEditando.categoria]?.map(sub => <option key={sub} value={sub}>{sub}</option>)}
            </select>
          </div>
          
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Email Principal</label>
            <input required type="email" value={proveedorEditando.email_principal} onChange={e => setProveedorEditando({...proveedorEditando, email_principal: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} disabled={bloqueoSeguridad} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Email Secundario</label>
            <input type="email" value={proveedorEditando.email_secundario || ''} onChange={e => setProveedorEditando({...proveedorEditando, email_secundario: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} disabled={bloqueoSeguridad} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Nombre Contacto</label>
            <input required value={proveedorEditando.nombre_contacto} onChange={e => setProveedorEditando({...proveedorEditando, nombre_contacto: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} disabled={bloqueoSeguridad} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Cargo</label>
            <input required value={proveedorEditando.cargo} onChange={e => setProveedorEditando({...proveedorEditando, cargo: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} disabled={bloqueoSeguridad} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Teléfono</label>
            <input required value={proveedorEditando.telefono} onChange={e => setProveedorEditando({...proveedorEditando, telefono: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} disabled={bloqueoSeguridad} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Website (Opcional)</label>
            <input value={proveedorEditando.website || ''} onChange={e => setProveedorEditando({...proveedorEditando, website: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} disabled={bloqueoSeguridad} />
          </div>
          
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Zonas de Cobertura</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', marginTop: '5px' }}>
              {zonasOpciones.map(zona => (
                <label key={zona} style={{ fontSize: '12px', display: 'flex', alignItems: 'center' }}>
                  <input type="checkbox" checked={proveedorEditando.zonas_cobertura_arr?.includes(zona)} onChange={e => manejarCambioZona(zona, e.target.checked, true)} style={{ marginRight: '5px', cursor: 'pointer' }} disabled={bloqueoSeguridad} /> {zona}
                </label>
              ))}
            </div>
          </div>
          
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" onClick={() => setProveedorEditando(null)} style={{ padding: '8px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" disabled={bloqueoSeguridad} style={{ padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  );
}