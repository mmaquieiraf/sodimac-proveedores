import { useState, useEffect } from 'react';

export const useSecurityBlock = () => {
  const [intentosFallidos, setIntentosFallidos] = useState(0);
  const [bloqueoSeguridad, setBloqueoSeguridad] = useState(false);

  useEffect(() => {
    const tiempoBloqueo = localStorage.getItem('sodimac_bloqueo_seguridad');
    if (tiempoBloqueo) {
      const tiempoRestante = parseInt(tiempoBloqueo) - Date.now();
      if (tiempoRestante > 0) {
        setBloqueoSeguridad(true);
        setTimeout(() => {
          setBloqueoSeguridad(false);
          localStorage.removeItem('sodimac_bloqueo_seguridad');
          setIntentosFallidos(0);
        }, tiempoRestante);
      } else {
        localStorage.removeItem('sodimac_bloqueo_seguridad');
      }
    }
  }, []);

  const registrarIntentoFallido = () => {
    const nuevosIntentos = intentosFallidos + 1;
    setIntentosFallidos(nuevosIntentos);
    if (nuevosIntentos >= 3) {
      setBloqueoSeguridad(true);
      const veinticuatroHorasMs = 86400000; 
      localStorage.setItem('sodimac_bloqueo_seguridad', Date.now() + veinticuatroHorasMs);
      alert("⚠️ ALERTA DE SEGURIDAD EXTREMA: 3 intentos fallidos. Sistema bloqueado automáticamente por 24 HORAS.");
      setTimeout(() => {
        setBloqueoSeguridad(false);
        localStorage.removeItem('sodimac_bloqueo_seguridad');
        setIntentosFallidos(0);
      }, veinticuatroHorasMs);
      return true; 
    }
    return false; 
  };

  const resetearIntentos = () => {
    setIntentosFallidos(0);
  };

  return {
    intentosFallidos,
    bloqueoSeguridad,
    registrarIntentoFallido,
    resetearIntentos
  };
};