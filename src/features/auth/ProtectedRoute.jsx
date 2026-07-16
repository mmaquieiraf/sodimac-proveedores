import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { usuarioActual, cargandoSesion } = useAuth();
  const location = useLocation();

  // 1. Retenemos el renderizado mientras Supabase valida el token.
  // ADAPTACIÓN VISUAL 1:1 - Se retorna el fondo base exacto del App.jsx (#f4f4f4) 
  // eliminando textos de carga que no existen en el monolito original.
  if (cargandoSesion) {
    return <div style={{ backgroundColor: '#f4f4f4', minHeight: '100vh' }}></div>;
  }

  // 2. Seguridad: Si definitivamente no hay usuario, lo pateamos al Login.
  // Equivalente a no poder alcanzar la `vista === 'panel'` en el monolito.
  if (!usuarioActual) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Si está autorizado, renderizamos la bóveda administrativa.
  return children;
};