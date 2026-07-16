import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { usuarioActual, cargandoSesion } = useAuth();
  const location = useLocation();

  if (cargandoSesion) {
    return <div style={{ padding: '50px', textAlign: 'center', color: '#004A99', fontWeight: 'bold' }}>Verificando credenciales de seguridad...</div>;
  }

  // Si no hay usuario logueado, lo pateamos al Login y guardamos a dónde quería ir
  if (!usuarioActual) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si está autorizado, renderizamos la pantalla que solicitó
  return children;
};