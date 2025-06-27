import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-aero flex items-center justify-center">
        <div className="glass-strong rounded-2xl p-8 text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-white font-medium">Carregando...</p>
        </div>
      </div>
    )
  }

  // Usuário já autenticado - redirecionar para página inicial
  if (isAuthenticated) {
    // Tentar redirecionar para onde o usuário estava tentando ir
    const from = location.state?.from?.pathname || '/'
    return <Navigate to={from} replace />
  }

  // Usuário não autenticado - mostrar página pública
  return children
}

export default PublicRoute