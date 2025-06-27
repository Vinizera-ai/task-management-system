import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { tasksService } from '@/services/tasksService'
import { clientsService } from '@/services/clientsService'
import { usersService } from '@/services/usersService'

import Loading, { CardSkeleton } from '@/components/ui/Loading'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

import {
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline'

function TasksPage() {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Estados locais
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || 'all',
    priority: searchParams.get('priority') || '',
    client: searchParams.get('client') || '',
    assignedTo: searchParams.get('assignedTo') || '',
    overdue: searchParams.get('overdue') === 'true'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1)

  // Queries
  const { 
    data: tasksData, 
    isLoading: loadingTasks, 
    error: tasksError,
    refetch: refetchTasks 
  } = useQuery(
    ['tasks', { ...filters, search: searchQuery, page }],
    () => tasksService.getTasks({
      ...filters,
      search: searchQuery,
      page,
      limit: 10,
      sortBy: 'priority',
      sortOrder: 'desc'
    }),
    {
      keepPreviousData: true,
      staleTime: 30000 // 30 segundos
    }
  )

  // Dados para filtros
  const { data: clientsData } = useQuery(
    'active-clients',
    clientsService.getActiveClients,
    { enabled: isAdmin() }
  )

  const { data: usersData } = useQuery(
    'active-users',
    usersService.getActiveUsers
  )

  // Sincronizar filtros com URL
  useEffect(() => {
    const params = new URLSearchParams()
    
    if (searchQuery) params.set('search', searchQuery)
    if (filters.status !== 'all') params.set('status', filters.status)
    if (filters.priority) params.set('priority', filters.priority)
    if (filters.client) params.set('client', filters.client)
    if (filters.assignedTo) params.set('assignedTo', filters.assignedTo)
    if (filters.overdue) params.set('overdue', 'true')
    if (page > 1) params.set('page', page.toString())

    setSearchParams(params)
  }, [searchQuery, filters, page, setSearchParams])

  const tasks = tasksData?.data || []
  const pagination = tasksData?.pagination

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1) // Reset página ao buscar
    refetchTasks()
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1) // Reset página ao filtrar
  }

  const clearFilters = () => {
    setFilters({
      status: 'all',
      priority: '',
      client: '',
      assignedTo: '',
      overdue: false
    })
    setSearchQuery('')
    setPage(1)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-500/20'
      case 'active':
        return 'text-blue-400 bg-blue-500/20'
      case 'on_hold':
        return 'text-yellow-400 bg-yellow-500/20'
      case 'cancelled':
        return 'text-red-400 bg-red-500/20'
      default:
        return 'text-gray-400 bg-gray-500/20'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Concluída'
      case 'active':
        return 'Ativa'
      case 'on_hold':
        return 'Em pausa'
      case 'cancelled':
        return 'Cancelada'
      default:
        return 'Desconhecido'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-400'
      case 'medium':
        return 'text-yellow-400'
      case 'low':
        return 'text-green-400'
      default:
        return 'text-gray-400'
    }
  }

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'high':
        return 'Alta'
      case 'medium':
        return 'Média'
      case 'low':
        return 'Baixa'
      default:
        return 'Não definida'
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const isOverdue = (task) => {
    return task.status === 'active' && new Date(task.dueDate) < new Date()
  }

  if (loadingTasks && !tasks.length) {
    return <CardSkeleton count={5} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tarefas</h1>
          <p className="text-white/70 mt-1">
            Gerencie e acompanhe todas as tarefas do sistema
          </p>
        </div>

        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button
            variant="secondary"
            icon={<FunnelIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filtros
          </Button>
          
          <Button
            variant="primary"
            icon={<PlusIcon />}
            onClick={() => navigate('/tasks/create')}
          >
            Nova Tarefa
          </Button>
        </div>
      </div>

      {/* Busca e Filtros */}
      <div className="glass-card rounded-xl p-6">
        {/* Busca */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar tarefas por título, briefing ou tags..."
              className="w-full pl-10 pr-4 py-3 input-glass rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </form>

        {/* Filtros */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-white/10 pt-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full input-glass rounded-lg text-white bg-transparent"
                  >
                    <option value="all">Todos</option>
                    <option value="active">Ativas</option>
                    <option value="completed">Concluídas</option>
                    <option value="on_hold">Em pausa</option>
                    <option value="cancelled">Canceladas</option>
                    <option value="overdue">Atrasadas</option>
                  </select>
                </div>

                {/* Prioridade */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Prioridade
                  </label>
                  <select
                    value={filters.priority}
                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                    className="w-full input-glass rounded-lg text-white bg-transparent"
                  >
                    <option value="">Todas</option>
                    <option value="high">Alta</option>
                    <option value="medium">Média</option>
                    <option value="low">Baixa</option>
                  </select>
                </div>

                {/* Cliente */}
                {isAdmin() && (
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Cliente
                    </label>
                    <select
                      value={filters.client}
                      onChange={(e) => handleFilterChange('client', e.target.value)}
                      className="w-full input-glass rounded-lg text-white bg-transparent"
                    >
                      <option value="">Todos</option>
                      {clientsData?.data?.map(client => (
                        <option key={client._id} value={client._id}>
                          {client.companyName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Responsável */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Responsável
                  </label>
                  <select
                    value={filters.assignedTo}
                    onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
                    className="w-full input-glass rounded-lg text-white bg-transparent"
                  >
                    <option value="">Todos</option>
                    {usersData?.data?.map(user => (
                      <option key={user._id} value={user._id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                >
                  Limpar Filtros
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Lista de Tarefas */}
      <div className="space-y-4">
        {loadingTasks ? (
          <CardSkeleton count={3} />
        ) : tasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card rounded-xl p-12 text-center"
          >
            <ClipboardDocumentListIcon className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              Nenhuma tarefa encontrada
            </h3>
            <p className="text-white/60 mb-6">
              {searchQuery || Object.values(filters).some(v => v && v !== 'all') 
                ? 'Tente ajustar os filtros ou termo de busca'
                : 'Que tal criar sua primeira tarefa?'
              }
            </p>
            {!searchQuery && !Object.values(filters).some(v => v && v !== 'all') && (
              <Button
                variant="primary"
                icon={<PlusIcon />}
                onClick={() => navigate('/tasks/create')}
              >
                Criar Tarefa
              </Button>
            )}
          </motion.div>
        ) : (
          tasks.map((task, index) => (
            <motion.div
              key={task._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`glass-card rounded-xl p-6 hover:bg-white/5 transition-all duration-200 cursor-pointer ${
                isOverdue(task) ? 'ring-2 ring-red-500/50' : ''
              }`}
              onClick={() => navigate(`/tasks/${task._id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Header da tarefa */}
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-white truncate">
                      {task.title}
                    </h3>
                    
                    {isOverdue(task) && (
                      <span className="flex items-center text-red-400 text-sm">
                        <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                        Atrasada
                      </span>
                    )}
                  </div>

                  {/* Informações da tarefa */}
                  <div className="space-y-2">
                    <p className="text-white/70 text-sm line-clamp-2">
                      {task.briefing}
                    </p>

                    <div className="flex items-center space-x-4 text-sm text-white/60">
                      {/* Cliente */}
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        {task.client?.companyName}
                      </span>

                      {/* Data de entrega */}
                      <span className="flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        {formatDate(task.dueDate)}
                      </span>

                      {/* Progresso */}
                      <span className="flex items-center">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        Etapa {task.currentStep}/{task.totalSteps}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status e ações */}
                <div className="flex flex-col items-end space-y-2 ml-4">
                  <div className="flex items-center space-x-2">
                    {/* Prioridade */}
                    <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {getPriorityText(task.priority)}
                    </span>

                    {/* Status */}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {getStatusText(task.status)}
                    </span>
                  </div>

                  {/* Responsável atual */}
                  {task.currentAssignee && (
                    <div className="flex items-center text-xs text-white/60">
                      <span>Responsável: </span>
                      <span className="ml-1 font-medium">
                        {task.assignedUsers?.find(a => a.userId._id === task.currentAssignee)?.userId.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Barra de progresso */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-white/60 mb-1">
                  <span>Progresso</span>
                  <span>{task.progressPercentage || 0}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${task.progressPercentage || 0}%` }}
                  ></div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Paginação */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-white/60">
            Mostrando {(page - 1) * pagination.limit + 1} a{' '}
            {Math.min(page * pagination.limit, pagination.total)} de{' '}
            {pagination.total} tarefas
          </div>

          <div className="flex space-x-2">
            <Button
              variant="ghost"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Anterior
            </Button>
            
            {[...Array(pagination.pages)].map((_, index) => (
              <Button
                key={index + 1}
                variant={page === index + 1 ? 'primary' : 'ghost'}
                onClick={() => setPage(index + 1)}
              >
                {index + 1}
              </Button>
            ))}
            
            <Button
              variant="ghost"
              disabled={page >= pagination.pages}
              onClick={() => setPage(page + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TasksPage