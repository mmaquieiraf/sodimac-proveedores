import React from 'react';
import { AppRouter } from './router/AppRouter';

/**
 * Componente Raíz de la Aplicación.
 * Inicializa y monta el enrutador central de la plataforma, delegando de forma segura 
 * el control de rutas públicas, autenticación, autorización RLS y renderizado dinámico.
 */
export default function App() {
  return <AppRouter />;
}