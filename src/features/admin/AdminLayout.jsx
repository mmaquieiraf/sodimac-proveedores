import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// 🛡️ Contextos de Seguridad
import { AuthProvider } from '../features/auth/AuthContext';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';

// 🌍 Rutas Públicas y de Acceso
import RegistroPage from '../pages/public/RegistroPage';
import LoginPage from '../pages/auth/LoginPage';

// 💼 Layout Administrativo (Ruta Corregida por ti)
import AdminLayout from '../features/admin/AdminLayout';

// 🧩 Features / Módulos Internos
import DashboardPanel from '../features/dashboard/DashboardPanel';
import PendientesPanel from '../features/proveedores/PendientesPanel';
import GestionPanel from '../features/proveedores/GestionPanel';
import ExportarPanel from '../features/proveedores/ExportarPanel';
import ProcesosPanel from '../features/procesos/ProcesosPanel';
import ActualizacionFormPanel from '../features/admin/ActualizacionFormPanel';
import AuditoriaPanel from '../features/admin/AuditoriaPanel';
import GeneradorRFP from '../features/generadores/GeneradorRFP';
import GeneradorRFQ from '../features/generadores/GeneradorRFQ';
import GeneradorFT from '../features/generadores/GeneradorFT';

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ======================= RUTAS PÚBLICAS ======================= */}
          <Route path="/" element={<RegistroPage />} />
          <Route path="/registro" element={<RegistroPage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* ======================= RUTAS PRIVADAS (BÓVEDA) ======================= */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            {/* Redirección por defecto al entrar a /admin */}
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            
            {/* Módulos inyectados dentro de <Outlet /> en AdminLayout */}
            <Route path="dashboard" element={<DashboardPanel />} />
            <Route path="pendientes" element={<PendientesPanel />} />
            <Route path="gestion" element={<GestionPanel />} />
            <Route path="exportar" element={<ExportarPanel />} />
            <Route path="procesos" element={<ProcesosPanel />} />
            <Route path="form" element={<ActualizacionFormPanel />} />
            <Route path="auditoria" element={<AuditoriaPanel />} />
            <Route path="rfp" element={<GeneradorRFP />} />
            <Route path="rfq" element={<GeneradorRFQ />} />
            <Route path="ft" element={<GeneradorFT />} />
          </Route>

          {/* Catch-all: Si tipean una ruta que no existe */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};