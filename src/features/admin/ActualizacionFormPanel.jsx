import React, { useState } from 'react';
// Importación directa de la función global, tal como se consume en el monolito original.
import { sanitizarYCapitalizar } from '../../utils/validaciones'; 

export default function ActualizacionFormPanel({
  categoriasDinamicas = {},
  setCategoriasDinamicas
}) {
  const [nuevaCatInput, setNuevaCatInput] = useState('');
  const [nuevasSubInputs, setNuevasSubInputs] = useState({});

  // Handlers con lógica 100% idéntica al App.jsx
  const handleAgregarCategoria = (e) => { 
    e.preventDefault(); 
    const cat = sanitizarYCapitalizar(nuevaCatInput); 
    if(cat && !categoriasDinamicas[cat]) { 
      setCategoriasDinamicas({...categoriasDinamicas, [cat]: []}); 
      setNuevaCatInput(''); 
    } 
  };
  
  const handleEliminarCategoria = (cat) => { 
    if(window.confirm(`¿Eliminar "${cat}"?`)) { 
      const copia = {...categoriasDinamicas}; 
      delete copia[cat]; 
      setCategoriasDinamicas(copia); 
    } 
  };
  
  const handleAgregarSubcategoria = (e, cat) => { 
    e.preventDefault(); 
    const sub = sanitizarYCapitalizar(nuevasSubInputs[cat]); 
    if(sub && !categoriasDinamicas[cat].includes(sub)) { 
      setCategoriasDinamicas({ ...categoriasDinamicas, [cat]: [...categoriasDinamicas[cat], sub] }); 
      setNuevasSubInputs({...nuevasSubInputs, [cat]: ''}); 
    } 
  };
  
  const handleEliminarSubcategoria = (cat, sub) => { 
    if(window.confirm(`¿Eliminar "${sub}"?`)) {
      setCategoriasDinamicas({ ...categoriasDinamicas, [cat]: categoriasDinamicas[cat].filter(s => s !== sub) }); 
    }
  };

  // Renderizado JSX 100% idéntico al App.jsx
  return (
    <div>
      <h3 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '18px', borderBottom: '2px solid #EE2D24', paddingBottom: '10px' }}>Actualización de Formulario Dinámico</h3>
      <p style={{ fontSize: '14px', color: '#555', marginBottom: '20px' }}>Añade o elimina Categorías y Subcategorías. Los cambios se reflejarán instantáneamente en el formulario público.</p>
      
      <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#f9f9f9', border: '1px solid #ddd', borderRadius: '8px' }}>
        <form onSubmit={handleAgregarCategoria} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input required placeholder="Escriba nueva Categoría Maestra..." value={nuevaCatInput} onChange={e => setNuevaCatInput(e.target.value)} style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>+ Agregar Categoría</button>
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {Object.keys(categoriasDinamicas).map(cat => (
          <div key={cat} style={{ border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ backgroundColor: '#004A99', color: 'white', padding: '10px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '15px' }}>{cat}</h4>
              <button onClick={() => handleEliminarCategoria(cat)} style={{ background: 'none', border: 'none', color: '#ffb3b3', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Eliminar Categoría</button>
            </div>
            <div style={{ padding: '15px', backgroundColor: '#fff' }}>
              <form onSubmit={(e) => handleAgregarSubcategoria(e, cat)} style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                <input required placeholder="Nueva subcategoría..." value={nuevasSubInputs[cat] || ''} onChange={e => setNuevasSubInputs({...nuevasSubInputs, [cat]: e.target.value})} style={{ flex: 1, padding: '6px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }} />
                <button type="submit" style={{ padding: '6px 12px', backgroundColor: '#17a2b8', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Añadir</button>
              </form>
              <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                {categoriasDinamicas[cat].length === 0 ? <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>No hay subcategorías.</p> : 
                  categoriasDinamicas[cat].map(sub => (
                    <div key={sub} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #eee', fontSize: '13px' }}>
                      <span>{sub}</span>
                      <button onClick={() => handleEliminarSubcategoria(cat, sub)} style={{ background: 'none', border: 'none', color: '#EE2D24', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>Borrar</button>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}