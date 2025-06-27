import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

function ProtectedRoute({ children, requiredRole = null }) {
  const { isAuthenticated, user, isLoading } = useAuth()
  const location = useLocation()

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-aero flex items-center justify-center">
        <div className="glass-strong rounded-2xl p-8 text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-white font-medium">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  // Usuário não autenticado - redirecionar para login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Verificar role específica se requerida
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />
  }

  // Usuário autenticado e com permissão adequada
  return children
}

export default ProtectedRoute