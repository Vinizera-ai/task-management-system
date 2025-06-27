import React from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useSocket } from '@/contexts/SocketContext'
import {
  ClipboardDocumentListIcon,
  UsersIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

function DashboardPage() {
  const { user, isAdmin } = useAuth()
  const { isConnected } = useSocket()

  // Dados mock para demonstração
  const stats = {
    totalTasks: 42,
    completedTasks: 28,
    pendingTasks: 14,
    overdueTasks: 3,
    totalUsers: 8,
    totalClients: 15
  }

  const recentTasks = [
    {
      id: 1,
      title: 'Post para Instagram - Cliente ABC',
      status: 'in_progress',
      dueDate: '2024-06-28',
      priority: 'high',
      assignee: 'João Silva'
    },
    {
      id: 2,
      title: 'Vídeo promocional - Cliente XYZ',
      status: 'pending',
      dueDate: '2024-06-30',
      priority: 'medium',
      assignee: 'Maria Santos'
    },
    {
      id: 3,
      title: 'Stories para Facebook - Cliente 123',
      status: 'completed',
      dueDate: '2024-06-25',
      priority: 'low',
      assignee: 'Pedro Costa'
    }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-500/20'
      case 'in_progress':
        return 'text-blue-400 bg-blue-500/20'
      case 'pending':
        return 'text-yellow-400 bg-yellow-500/20'
      case 'overdue':
        return 'text-red-400 bg-red-500/20'
      default:
        return 'text-gray-400 bg-gray-500/20'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Concluída'
      case 'in_progress':
        return 'Em andamento'
      case 'pending':
        return 'Pendente'
      case 'overdue':
        return 'Atrasada'
      default:
        return 'Desconhecido'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-red-500/50 bg-red-500/10'
      case 'medium':
        return 'border-yellow-500/50 bg-yellow-500/10'
      case 'low':
        return 'border-green-500/50 bg-green-500/10'
      default:
        return 'border-gray-500/50 bg-gray-500/10'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold text-white mb-2">
            Olá, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-white/70">
            Aqui está um resumo das suas atividades hoje.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center mt-4 sm:mt-0"
        >
          <div className="flex items-center text-sm text-white/60">
            <div className={`w-2 h-2 rounded-full mr-2 ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            {isConnected ? 'Conectado' : 'Desconectado'}
          </div>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {/* Tarefas Totais */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <ClipboardDocumentListIcon className="w-6 h-6 text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-white/60 text-sm">Total de Tarefas</p>
              <p className="text-2xl font-bold text-white">{stats.totalTasks}</p>
            </div>
          </div>
        </div>

        {/* Tarefas Concluídas */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-white/60 text-sm">Concluídas</p>
              <p className="text-2xl font-bold text-white">{stats.completedTasks}</p>
            </div>
          </div>
        </div>

        {/* Tarefas Pendentes */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <ClockIcon className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-white/60 text-sm">Pendentes</p>
              <p className="text-2xl font-bold text-white">{stats.pendingTasks}</p>
            </div>
          </div>
        </div>

        {/* Tarefas Atrasadas */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-500/20 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-white/60 text-sm">Atrasadas</p>
              <p className="text-2xl font-bold text-white">{stats.overdueTasks}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tarefas Recentes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:col-span-2 glass-card rounded-xl p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4">
            Tarefas Recentes
          </h2>
          
          <div className="space-y-4">
            {recentTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`border rounded-lg p-4 hover:bg-white/5 transition-colors cursor-pointer ${
                  getPriorityColor(task.priority)
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-white mb-1">
                      {task.title}
                    </h3>
                    <p className="text-sm text-white/60 mb-2">
                      Responsável: {task.assignee}
                    </p>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        getStatusColor(task.status)
                      }`}>
                        {getStatusText(task.status)}
                      </span>
                      <span className="text-xs text-white/50">
                        Prazo: {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 text-center">
            <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
              Ver todas as tarefas →
            </button>
          </div>
        </motion.div>

        {/* Admin Stats */}
        {isAdmin() && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="glass-card rounded-xl p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4">
              Estatísticas do Sistema
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <UsersIcon className="w-5 h-5 text-white/60 mr-3" />
                  <span className="text-white/80">Usuários</span>
                </div>
                <span className="text-white font-semibold">{stats.totalUsers}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <BuildingOfficeIcon className="w-5 h-5 text-white/60 mr-3" />
                  <span className="text-white/80">Clientes</span>
                </div>
                <span className="text-white font-semibold">{stats.totalClients}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10">
              <h3 className="text-sm font-medium text-white/80 mb-3">
                Ações Rápidas
              </h3>
              <div className="space-y-2">
                <button className="w-full text-left text-sm text-blue-400 hover:text-blue-300 transition-colors">
                  → Criar novo usuário
                </button>
                <button className="w-full text-left text-sm text-blue-400 hover:text-blue-300 transition-colors">
                  → Adicionar cliente
                </button>
                <button className="w-full text-left text-sm text-blue-400 hover:text-blue-300 transition-colors">
                  → Configurar fluxo
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Actions for Operational */}
        {!isAdmin() && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="glass-card rounded-xl p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4">
              Ações Rápidas
            </h2>
            
            <div className="space-y-3">
              <button className="w-full p-3 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 text-sm font-medium transition-colors">
                + Nova Tarefa
              </button>
              <button className="w-full p-3 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-400 text-sm font-medium transition-colors">
                📋 Minhas Tarefas
              </button>
              <button className="w-full p-3 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-purple-400 text-sm font-medium transition-colors">
                📊 Ver Kanban
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default DashboardPage