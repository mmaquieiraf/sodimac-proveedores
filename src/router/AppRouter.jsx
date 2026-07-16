import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../features/auth/AuthContext';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';

// Páginas de acceso (Rutas Públicas)
import RegistroPage from '../pages/public/RegistroPage';
import LoginPage from '../pages/auth/LoginPage';
import AdminLayout from "../features/admin/AdminLayout";

// Features (Paneles Internos)
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
import AdminRolesPanel from '../features/admin/AdminRolesPanel'; // <-- IMPORTACIÓN AÑADIDA

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
            
            {/* <-- RUTA DEL PANEL DE ROLES AÑADIDA --> */}
            <Route path="roles" element={<AdminRolesPanel />} /> 
          </Route>

          {/* ======================= CATCH-ALL SEGURIDAD ======================= */}
          {/* Redirige silenciosamente al inicio cualquier intento de acceder a una URL inexistente */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};