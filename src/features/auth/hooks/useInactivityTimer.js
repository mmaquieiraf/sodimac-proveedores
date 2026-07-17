import { useEffect } from 'react';

export const useInactivityTimer = (usuarioActual, onTimeOut) => {
  useEffect(() => {
    let temporizadorInactividad;

    const resetearTemporizador = () => {
      clearTimeout(temporizadorInactividad);
      if (usuarioActual) {
        // 1.200.000 ms = 20 minutos exactos
        temporizadorInactividad = setTimeout(() => {
          onTimeOut();
        }, 1200000); 
      }
    };

    window.addEventListener('mousemove', resetearTemporizador);
    window.addEventListener('keypress', resetearTemporizador);
    window.addEventListener('click', resetearTemporizador);
    window.addEventListener('scroll', resetearTemporizador);

    resetearTemporizador(); 

    return () => {
      clearTimeout(temporizadorInactividad);
      window.removeEventListener('mousemove', resetearTemporizador);
      window.removeEventListener('keypress', resetearTemporizador);
      window.removeEventListener('click', resetearTemporizador);
      window.removeEventListener('scroll', resetearTemporizador);
    };
  }, [usuarioActual, onTimeOut]);
};