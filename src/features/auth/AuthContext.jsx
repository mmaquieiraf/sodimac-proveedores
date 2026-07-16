import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from "../../supabase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);

  useEffect(() => {
    // 1. Obtener la sesión inicial al cargar la app
    const inicializarAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUsuarioActual({
          usuario: session.user.email,
          esSuperAdmin: session.user.email === 'mmaquieiraf@sodimac.cl' || session.user.email === 'matiasignaciof01@gmail.com'
        });
      }
      setCargandoSesion(false);
    };

    inicializarAuth();

    // 2. Escuchar cambios de sesión nativos de Supabase (Login/Logout automáticos)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUsuarioActual({
          usuario: session.user.email,
          esSuperAdmin: session.user.email === 'mmaquieiraf@sodimac.cl' || session.user.email === 'matiasignaciof01@gmail.com'
        });
      } else {
        setUsuarioActual(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // 🛡️ CANDADO 3: Auto-Cierre de Sesión por Inactividad (20 Minutos) - NIVEL GLOBAL
  useEffect(() => {
    let temporizadorInactividad;

    const resetearTemporizador = () => {
      clearTimeout(temporizadorInactividad);
      if (usuarioActual) {
        temporizadorInactividad = setTimeout(async () => {
          await supabase.auth.signOut();
          alert("🔒 Por tu seguridad, la sesión se ha cerrado automáticamente tras 20 minutos de inactividad.");
        }, 1200000); 
      }
    };

    if (usuarioActual) {
      window.addEventListener('mousemove', resetearTemporizador);
      window.addEventListener('keypress', resetearTemporizador);
      window.addEventListener('click', resetearTemporizador);
      window.addEventListener('scroll', resetearTemporizador);
      resetearTemporizador(); 
    }

    return () => {
      clearTimeout(temporizadorInactividad);
      window.removeEventListener('mousemove', resetearTemporizador);
      window.removeEventListener('keypress', resetearTemporizador);
      window.removeEventListener('click', resetearTemporizador);
      window.removeEventListener('scroll', resetearTemporizador);
    };
  }, [usuarioActual]);

  return (
    <AuthContext.Provider value={{ usuarioActual, cargandoSesion }}>
      {!cargandoSesion && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);