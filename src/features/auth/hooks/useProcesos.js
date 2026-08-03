// IMPORTACIÓN NUEVA (Ponla arriba del archivo useProcesos.js)
import * as XLSX from 'xlsx';

// ... (El resto de tu código queda igual)

  // REEMPLAZA TU FUNCIÓN ACTUAL CON ESTA NUEVA LECTORA DE EXCEL
  const manejarCargaMasivaProcesos = (e) => {
    const file = e.target.files[0]; 
    if (!file) return;

    const reader = new FileReader();
    
    const parseFechaSegura = (valorExcel, defaultValue) => {
      if (!valorExcel || valorExcel.toString().trim() === '' || valorExcel.toString().toUpperCase() === 'N/A') return defaultValue;
      
      // Si Excel manda un número serial (ej. 45931), lo transformamos
      if (!isNaN(valorExcel) && typeof valorExcel === 'number') {
        const date = new Date(Math.round((valorExcel - 25569) * 86400 * 1000));
        return date.toISOString().split('T')[0];
      }
      
      // Si es un string YYYY-MM-DD lo validamos
      const regex = /^\d{4}-\d{2}-\d{2}$/;
      return regex.test(valorExcel.toString().trim()) ? valorExcel.toString().trim() : defaultValue;
    };

    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convertimos el Excel a un arreglo JSON
        const excelJson = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (excelJson.length <= 1) return alert("El archivo está vacío o solo contiene la cabecera.");
        
        const procesosNuevos = [];
        const defaultDate = `${new Date().getFullYear()}-01-01`;

        for (let i = 1; i < excelJson.length; i++) {
          const row = excelJson[i];
          if (!row || row.length === 0 || !row[0]) continue; // Fila vacía o sin nombre

          const baselineLimpio = row[10] && row[10].toString().toUpperCase() !== 'N/A' ? parseInt(row[10].toString().replace(/\D/g, '')) : 0;
          const montoAdjLimpio = row[11] && row[11].toString().toUpperCase() !== 'N/A' ? parseInt(row[11].toString().replace(/\D/g, '')) : 0;
          
          const fechaInicioLimpia = parseFechaSegura(row[8], defaultDate);
          const fechaTerminoLimpia = parseFechaSegura(row[9], fechaInicioLimpia);

          procesosNuevos.push({
            nombre: sanitizarYCapitalizar(row[0]?.toString() || ''), 
            clasificacion: row[1]?.toString() || 'Opex',
            subgerencia: row[2]?.toString() || 'Administración', 
            solicitante: sanitizarYCapitalizar(row[3]?.toString() || ''),
            tipo: row[4]?.toString() || 'RFP', 
            tipo_compra: row[5]?.toString() || 'Spot',
            controller: row[6]?.toString() || usuarioActual?.usuario, 
            estado_proceso: row[7]?.toString() || 'Estableciendo alcance, equipo y objetivos',
            fecha_inicio: fechaInicioLimpia, 
            fecha_termino: fechaTerminoLimpia,
            baseline: isNaN(baselineLimpio) ? 0 : baselineLimpio, 
            monto_adjudicado: isNaN(montoAdjLimpio) ? 0 : montoAdjLimpio,
            proveedores_invitados: '', 
            proveedor_adjudicado: null, 
            adjudicaciones_detalle: []
          });
        }
        
        if (procesosNuevos.length > 0) { 
          const { error } = await insertarProcesosMasivoService(procesosNuevos); 
          if (!error) { alert(`✅ ${procesosNuevos.length} procesos agregados masivamente desde Excel.`); cargarProcesos(); }
          else { alert("⚠️ Ocurrió un error en la base de datos al importar."); console.error(error); }
        }
      } catch (error) {
        console.error("Error procesando Excel:", error);
        alert("⚠️ Hubo un error al leer el archivo Excel. Asegúrese de que el formato sea correcto.");
      }
    };
    
    // El cambio clave: ahora lee el binario del Excel en lugar de texto
    reader.readAsArrayBuffer(file); 
    e.target.value = null; 
  };