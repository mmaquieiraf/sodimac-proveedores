import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { usuarioActual, cargandoAuth } = useAuth();
  const location = useLocation();

  if (cargandoAuth) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f4f4' }}>
        <h2 style={{ color: '#004A99', letterSpacing: '1px' }}>⏳ Verificando Credenciales...</h2>
      </div>
    );
  }

  if (!usuarioActual) {
    // Redirige al login, pero guarda en la memoria a dónde intentaba ir para una redirección futura si lo deseas
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};