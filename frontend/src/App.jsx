import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { SocketProvider } from '@/contexts/SocketContext'
import { useAuth } from '@/hooks/useAuth'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import PublicRoute from '@/components/auth/PublicRoute'
import Layout from '@/components/layout/Layout'
import ClientLayout from '@/components/layout/ClientLayout'

// Páginas de autenticação
import LoginPage from '@/pages/auth/LoginPage'

// Páginas principais
import DashboardPage from '@/pages/DashboardPage'
import TasksPage from '@/pages/tasks/TasksPage'
import KanbanPage from '@/pages/tasks/KanbanPage'
import TaskDetailPage from '@/pages/tasks/TaskDetailPage'
import CreateTaskPage from '@/pages/tasks/CreateTaskPage'

// Páginas de usuários
import UsersPage from '@/pages/users/UsersPage'
import UserDetailPage from '@/pages/users/UserDetailPage'
import CreateUserPage from '@/pages/users/CreateUserPage'
import ProfilePage from '@/pages/users/ProfilePage'

// Páginas de clientes
import ClientsPage from '@/pages/clients/ClientsPage'
import ClientDetailPage from '@/pages/clients/ClientDetailPage'
import CreateClientPage from '@/pages/clients/CreateClientPage'

// Páginas de configurações
import WorkflowsPage from '@/pages/settings/WorkflowsPage'
import TaskModelsPage from '@/pages/settings/TaskModelsPage'
import SettingsPage from '@/pages/settings/SettingsPage'

// Páginas do cliente
import ClientAccessPage from '@/pages/client/ClientAccessPage'
import ClientDashboardPage from '@/pages/client/ClientDashboardPage'
import ClientTaskDetailPage from '@/pages/client/ClientTaskDetailPage'

// Páginas de erro
import NotFoundPage from '@/pages/errors/NotFoundPage'
import UnauthorizedPage from '@/pages/errors/UnauthorizedPage'

// Componente principal da aplicação
function AppContent() {
  const { isLoading } = useAuth()

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-aero flex items-center justify-center">
        <div className="glass-strong rounded-2xl p-8 text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-white font-medium">Carregando sistema...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Rotas públicas */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* Rotas do cliente (sem autenticação JWT) */}
      <Route path="/client" element={<ClientLayout />}>
        <Route index element={<ClientAccessPage />} />
        <Route path=":clientId" element={<ClientAccessPage />} />
        <Route path=":clientId/dashboard" element={<ClientDashboardPage />} />
        <Route path=":clientId/task/:taskId" element={<ClientTaskDetailPage />} />
      </Route>

      {/* Rotas protegidas */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}
        <Route index element={<DashboardPage />} />

        {/* Tarefas */}
        <Route path="tasks">
          <Route index element={<TasksPage />} />
          <Route path="kanban" element={<KanbanPage />} />
          <Route path="create" element={<CreateTaskPage />} />
          <Route path=":id" element={<TaskDetailPage />} />
        </Route>

        {/* Usuários */}
        <Route path="users">
          <Route index element={<UsersPage />} />
          <Route path="create" element={
            <ProtectedRoute requiredRole="admin">
              <CreateUserPage />
            </ProtectedRoute>
          } />
          <Route path=":id" element={<UserDetailPage />} />
        </Route>

        {/* Clientes */}
        <Route path="clients">
          <Route index element={
            <ProtectedRoute requiredRole="admin">
              <ClientsPage />
            </ProtectedRoute>
          } />
          <Route path="create" element={
            <ProtectedRoute requiredRole="admin">
              <CreateClientPage />
            </ProtectedRoute>
          } />
          <Route path=":id" element={
            <ProtectedRoute requiredRole="admin">
              <ClientDetailPage />
            </ProtectedRoute>
          } />
        </Route>

        {/* Configurações */}
        <Route path="settings">
          <Route index element={<SettingsPage />} />
          <Route path="workflows" element={
            <ProtectedRoute requiredRole="admin">
              <WorkflowsPage />
            </ProtectedRoute>
          } />
          <Route path="task-models" element={<TaskModelsPage />} />
        </Route>

        {/* Perfil */}
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Páginas de erro */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <div className="min-h-screen bg-gradient-aero">
          <AppContent />
        </div>
      </SocketProvider>
    </AuthProvider>
  )
}

export default App