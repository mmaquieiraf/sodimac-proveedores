import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { categoriasSodimac as catSodimacOriginal, formatearRUT, validarRUT } from '../../datosSodimac';

// --- CONFIGURACIÓN DE CONSTANTES Y CATEGORÍAS (Extraídas del monolito) ---
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

// --- COMPONENTE PRINCIPAL DE REGISTRO ---
export default function RegistroPage() {
  const navigate = useNavigate();
  const [mostrarTerminos, setMostrarTerminos] = useState(false);
  const [categoriasDinamicas, setCategoriasDinamicas] = useState(cargarCategoriasDinamicas());
  
  const [formData, setFormData] = useState({
    razonSocial: '', nombreFantasia: '', rut: '', domicilio: '',
    categoria: [], subcategoria: [], emailPrincipal: '', emailSecundario: '',
    contacto: '', cargo: '', telefono: '', zonasCobertura: [], terminos: false,
    poseeWebsite: 'no', websiteUrl: ''
  });

  // Guardamos las categorías en LocalStorage si cambian (para mantener sincronía)
  useEffect(() => {
    localStorage.setItem('sodimac_categorias_dinamicas', JSON.stringify(categoriasDinamicas));
  }, [categoriasDinamicas]);

  // --- HANDLERS DEL FORMULARIO ---
  const manejarCambioZona = (zona, checked) => {
    let nuevasZonas = [...formData.zonasCobertura];
    if (checked) nuevasZonas.push(zona); else nuevasZonas = nuevasZonas.filter(z => z !== zona);
    setFormData({ ...formData, zonasCobertura: nuevasZonas });
  };

  const manejarCambioCategoria = (cat, checked) => {
    let nuevasCat = [...formData.categoria]; let nuevasSub = [...formData.subcategoria];
    if (checked) nuevasCat.push(cat);
    else {
      nuevasCat = nuevasCat.filter(c => c !== cat);
      const subsParaRemover = categoriasDinamicas[cat] || [];
      nuevasSub = nuevasSub.filter(s => !subsParaRemover.includes(s));
    }
    setFormData({ ...formData, categoria: nuevasCat, subcategoria: nuevasSub });
  };

  const manejarCambioSubcategoria = (sub, checked) => {
    let nuevasSub = [...formData.subcategoria];
    if (checked) nuevasSub.push(sub); else nuevasSub = nuevasSub.filter(s => s !== sub);
    setFormData({ ...formData, subcategoria: nuevasSub });
  };

  const manejarEnvioRegistro = async (e) => {
    e.preventDefault();
    if (!validarRUT(formData.rut)) return alert("El RUT ingresado no es válido.");
    if (formData.categoria.length === 0) return alert("Debe seleccionar al menos una Categoría.");
    if (formData.subcategoria.length === 0) return alert("Debe seleccionar al menos una Subcategoría.");
    if (formData.zonasCobertura.length === 0) return alert("Debe seleccionar al menos una Zona de Cobertura.");

    let zonasFinales = formData.zonasCobertura;
    if (zonasFinales.includes("Todo el País")) zonasFinales = ["Todo el País"];

    const rutLimpio = formData.rut.replace(/[<>]/g, '');
    const { data: existentes } = await supabase.from('proveedores').select('categoria, subcategoria').eq('rut', rutLimpio);

    const websiteFinal = formData.poseeWebsite === 'si' && formData.websiteUrl.trim() !== '' 
      ? formData.websiteUrl.replace(/[<>]/g, '').trim().toLowerCase() : 'No posee';

    const registrosAInsertar = [];
    const duplicadosEncontrados = [];

    formData.subcategoria.forEach(sub => {
      const catAsociada = Object.keys(categoriasDinamicas).find(key => categoriasDinamicas[key].includes(sub));
      const yaExiste = existentes?.some(ex => ex.categoria === catAsociada && ex.subcategoria === sub);
      
      if (yaExiste) duplicadosEncontrados.push(`${catAsociada} -> ${sub}`);
      else {
        registrosAInsertar.push({
          razon_social: sanitizarYCapitalizar(formData.razonSocial), nombre_fantasia: sanitizarYCapitalizar(formData.nombreFantasia),
          rut: rutLimpio, domicilio_comercial: sanitizarYCapitalizar(formData.domicilio),
          categoria: catAsociada, subcategoria: sub,      
          email_principal: formData.emailPrincipal.replace(/[<>]/g, '').toLowerCase().trim(), 
          email_secundario: formData.emailSecundario ? formData.emailSecundario.replace(/[<>]/g, '').toLowerCase().trim() : '',
          nombre_contacto: sanitizarYCapitalizar(formData.contacto), cargo: sanitizarYCapitalizar(formData.cargo),
          telefono: formData.telefono.replace(/[<>]/g, '').trim(), zonas_cobertura: zonasFinales.join(', '), 
          website: websiteFinal, terminos_aceptados: formData.terminos, estado: 'Pendiente'
        });
      }
    });

    if (duplicadosEncontrados.length > 0) {
      alert(`❌ ATENCIÓN: El RUT ya se encuentra registrado para las siguientes subcategorías:\n\n${duplicadosEncontrados.join('\n')}\n\nPor favor, desmárquelas para poder continuar.`);
      return; 
    }

    if (registrosAInsertar.length > 0) {
      const { error } = await supabase.from('proveedores').insert(registrosAInsertar);
      if (error) alert("⚠️ Error de sistema al registrar. Inténtelo más tarde."); 
      else { 
        alert(`✅ Registro enviado con éxito a revisión.`); 
        // Recargamos la vista para limpiar el formulario
        window.location.reload(); 
      }
    }
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#f4f4f4', minHeight: '100vh', padding: '20px' }}>
      
      {/* NAVBAR CORPORATIVO SODIMAC */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#004A99', padding: '15px 20px', borderRadius: '8px', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/logo.png" alt="Sodimac" style={{ height: '50px', objectFit: 'contain', transform: 'scale(2.8)', transformOrigin: 'left center', marginLeft: '5px' }} />
          <span style={{ fontSize: '22px', fontWeight: '600', letterSpacing: '0.5px', zIndex: 10, marginLeft: '4cm' }}>Portal de Proveedores</span>
        </div>
        <div style={{ zIndex: 10, display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* Navegamos mediante React Router hacia la página de login seguro */}
          <button onClick={() => navigate('/login')} style={{ background: 'none', border: '1px solid white', color: 'white', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>Acceso Interno</button>
        </div>
      </div>

      {/* FORMULARIO DE REGISTRO */}
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
          <button type="submit" style={{ width: '100%', padding: '15px', marginTop: '25px', backgroundColor: '#EE2D24', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', borderRadius: '4px' }}>ENVIAR REGISTRO</button>
        </form>
      </div>

      {/* MODAL DE TÉRMINOS Y CONDICIONES */}
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
    </div>
  );
}