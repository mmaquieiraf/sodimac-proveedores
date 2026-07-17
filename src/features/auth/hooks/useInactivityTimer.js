import { useEffect } from 'react';
import { supabase } from '../../../supabase';

export const useInactivityTimer = (usuarioActual, setUsuarioActual, setVista) => {
  useEffect(() => {
    let temporizadorInactividad;

    const resetearTemporizador = () => {
      // 1. Limpiamos el contador anterior si el usuario interactúa
      clearTimeout(temporizadorInactividad);
      
      // 2. Solo iniciamos la cuenta regresiva si hay un administrador conectado
      if (usuarioActual) {
        // 1.200.000 ms = 20 minutos exactos
        temporizadorInactividad = setTimeout(async () => {
          // Destruimos la sesión criptográfica en el backend
          await supabase.auth.signOut();
          
          // Limpiamos la memoria del frontend y redirigimos
          setUsuarioActual(null);
          setVista('login');
          
          alert("🔒 Por tu seguridad, la sesión se ha cerrado automáticamente tras 20 minutos de inactividad.");
        }, 1200000); 
      }
    };

    // 3. Escuchamos las interacciones físicas con la pantalla
    window.addEventListener('mousemove', resetearTemporizador);
    window.addEventListener('keypress', resetearTemporizador);
    window.addEventListener('click', resetearTemporizador);
    window.addEventListener('scroll', resetearTemporizador);

    // 4. Iniciamos el reloj de inmediato
    resetearTemporizador(); 

    // 5. Limpieza vital para que React no genere fugas de memoria
    return () => {
      clearTimeout(temporizadorInactividad);
      window.removeEventListener('mousemove', resetearTemporizador);
      window.removeEventListener('keypress', resetearTemporizador);
      window.removeEventListener('click', resetearTemporizador);
      window.removeEventListener('scroll', resetearTemporizador);
    };
  }, [usuarioActual, setUsuarioActual, setVista]);
};