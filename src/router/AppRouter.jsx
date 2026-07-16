import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../features/auth/AuthContext';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';

// Estas importaciones las activaremos en la Fase 6
// import LoginPage from '../pages/auth/LoginPage';
// import LegacyAppMonolito from '../AppLegacy'; 

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* RUTAS PÚBLICAS */}
          {/* <Route path="/login" element={<LoginPage />} /> */}
          
          {/* RUTAS PRIVADAS (Protegidas por el Guardián) */}
          {/* <Route path="/admin/*" element={
            <ProtectedRoute>
              <LegacyAppMonolito />
            </ProtectedRoute>
          } /> */}

          {/* Redirección temporal de seguridad */}
          <Route path="*" element={<div style={{padding: '50px', textAlign: 'center'}}>Sistema en mantenimiento arquitectónico...</div>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};