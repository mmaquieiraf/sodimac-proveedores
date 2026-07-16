import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from "../../supabase";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [cargandoAuth, setCargandoAuth] = useState(true);

  useEffect(() => {
    // 1. Verificación inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUsuarioActual(session?.user || null);
      setCargandoAuth(false);
    });

    // 2. Suscripción a cambios (Logins, Logouts, Expiración de Token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUsuarioActual(session?.user || null);
      setCargandoAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, usuarioActual, cargandoAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para consumir el contexto fácilmente
export const useAuth = () => {
  return useContext(AuthContext);
};