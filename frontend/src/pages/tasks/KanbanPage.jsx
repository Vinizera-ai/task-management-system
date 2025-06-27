import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { tasksService } from '@/services/tasksService'
import { clientsService } from '@/services/clientsService'
import { usersService } from '@/services/usersService'

import Loading, { CardSkeleton } from '@/components/ui/Loading'
import Button from '@/components/ui/Button'
import KanbanCard from '@/components/kanban/KanbanCard'
import KanbanFilters from '@/components/kanban/KanbanFilters'

import {
  ViewColumnsIcon,
  FunnelIcon,
  PlusIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

import toast from 'react-hot-toast'

function KanbanPage() {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  // Estados locais
  const [filters, setFilters] = useState({
    client: searchParams.get('client') || '',
    assignedTo: searchParams.get('assignedTo') || '',
    priority: searchParams.get('priority') || ''
  })
  const [showFilters, setShowFilters] = useState(false)

  // Query para dados do Kanban
  const { 
    data: kanbanData, 
    isLoading, 
    error,
    refetch 
  } = useQuery(
    ['kanban', filters],
    () => tasksService.getKanbanData(filters),
    {
      refetchOnWindowFocus: false,
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

  // Mutation para mover tarefa (apenas para admins)
  const moveTaskMutation = useMutation(
    ({ taskId, action }) => {
      if (action === 'advance') {
        return tasksService.advanceTask(taskId)
      } else if (action === 'revert') {
        return tasksService.revertTask(taskId)
      }
    },
    {
      onSuccess: () => {
        toast.success('Tarefa movida com sucesso!')
        queryClient.invalidateQueries('kanban')
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Erro ao mover tarefa')
      }
    }
  )

  const columns = kanbanData?.data?.columns || []
  const totalTasks = kanbanData?.data?.totalTasks || 0

  // Sincronizar filtros com URL
  useEffect(() => {
    const params = new URLSearchParams()
    
    if (filters.client) params.set('client', filters.client)
    if (filters.assignedTo) params.set('assignedTo', filters.assignedTo)
    if (filters.priority) params.set('priority', filters.priority)

    setSearchParams(params)
  }, [filters, setSearchParams])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      client: '',
      assignedTo: '',
      priority: ''
    })
  }

  const onDragEnd = (result) => {
    // Só admins podem fazer drag & drop
    if (!isAdmin()) {
      toast.error('Apenas administradores podem mover tarefas')
      return
    }

    const { destination, source, draggableId } = result

    // Se não foi dropado em lugar válido
    if (!destination) return

    // Se foi dropado no mesmo lugar
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    const sourceStepOrder = parseInt(source.droppableId)
    const destStepOrder = parseInt(destination.droppableId)

    // Determinar ação baseada no movimento
    let action = null
    if (destStepOrder > sourceStepOrder) {
      action = 'advance'
    } else if (destStepOrder < sourceStepOrder) {
      action = 'revert'
    }

    if (action) {
      moveTaskMutation.mutate({
        taskId: draggableId,
        action
      })
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-red-500/50 shadow-red-500/20'
      case 'medium':
        return 'border-yellow-500/50 shadow-yellow-500/20'
      case 'low':
        return 'border-green-500/50 shadow-green-500/20'
      default:
        return 'border-gray-500/50 shadow-gray-500/20'
    }
  }

  const getColumnColor = (stepOrder) => {
    const colors = [
      'bg-blue-500/10 border-blue-500/20',
      'bg-purple-500/10 border-purple-500/20',
      'bg-green-500/10 border-green-500/20',
      'bg-yellow-500/10 border-yellow-500/20',
      'bg-red-500/10 border-red-500/20',
      'bg-indigo-500/10 border-indigo-500/20',
      'bg-pink-500/10 border-pink-500/20',
      'bg-teal-500/10 border-teal-500/20'
    ]
    return colors[(stepOrder - 1) % colors.length]
  }

  if (isLoading) {
    return <Loading text="Carregando Kanban..." />
  }

  if (error) {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <p className="text-red-400 mb-4">Erro ao carregar Kanban</p>
        <Button onClick={() => refetch()}>
          Tentar Novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <ViewColumnsIcon className="w-8 h-8 mr-3" />
            Kanban
          </h1>
          <p className="text-white/70 mt-1">
            Visualização em colunas das tarefas por etapa
          </p>
        </div>

        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button
            variant="secondary"
            icon={<ArrowPathIcon />}
            onClick={() => refetch()}
            loading={isLoading}
          >
            Atualizar
          </Button>
          
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

      {/* Estatísticas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{totalTasks}</p>
              <p className="text-white/60 text-sm">Total de Tarefas</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{columns.length}</p>
              <p className="text-white/60 text-sm">Etapas Ativas</p>
            </div>

            {isAdmin() && (
              <div className="text-center">
                <p className="text-xs text-white/60">
                  💡 Arraste e solte para mover tarefas
                </p>
              </div>
            )}
          </div>

          {!isAdmin() && (
            <div className="text-right">
              <p className="text-xs text-white/50">
                Visualização apenas • Sem permissão para mover tarefas
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Filtros */}
      <AnimatePresence>
        {showFilters && (
          <KanbanFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
            clients={clientsData?.data || []}
            users={usersData?.data || []}
            isAdmin={isAdmin()}
          />
        )}
      </AnimatePresence>

      {/* Board Kanban */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="overflow-x-auto pb-4">
          <div className="flex space-x-6 min-w-max">
            {columns.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full max-w-md mx-auto glass-card rounded-xl p-8 text-center"
              >
                <ViewColumnsIcon className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  Nenhuma tarefa encontrada
                </h3>
                <p className="text-white/60 mb-6">
                  {Object.values(filters).some(v => v) 
                    ? 'Tente ajustar os filtros aplicados'
                    : 'Que tal criar sua primeira tarefa?'
                  }
                </p>
                {!Object.values(filters).some(v => v) && (
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
              columns.map((column, columnIndex) => (
                <motion.div
                  key={column.stepOrder}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: columnIndex * 0.1 }}
                  className="flex-shrink-0 w-80"
                >
                  <Droppable droppableId={column.stepOrder.toString()}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`h-full min-h-96 rounded-xl border-2 transition-all duration-200 ${
                          getColumnColor(column.stepOrder)
                        } ${
                          snapshot.isDraggingOver
                            ? 'border-blue-400/50 bg-blue-500/20 scale-105'
                            : ''
                        }`}
                      >
                        {/* Header da coluna */}
                        <div className="p-4 border-b border-white/10">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                                getColumnColor(column.stepOrder)
                              }`}>
                                <span className="text-white font-semibold">
                                  {column.stepOrder}
                                </span>
                              </div>
                              <div>
                                <h3 className="font-semibold text-white">
                                  {column.stepName}
                                </h3>
                                <p className="text-white/60 text-sm">
                                  {column.tasks.length} {column.tasks.length === 1 ? 'tarefa' : 'tarefas'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Lista de tarefas */}
                        <div className="p-4 space-y-3 overflow-y-auto max-h-96">
                          {column.tasks.map((task, index) => (
                            <Draggable
                              key={task._id}
                              draggableId={task._id}
                              index={index}
                              isDragDisabled={!isAdmin()}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`transition-all duration-200 ${
                                    snapshot.isDragging
                                      ? 'rotate-2 scale-105 shadow-xl'
                                      : ''
                                  }`}
                                >
                                  <KanbanCard
                                    task={task}
                                    onClick={() => navigate(`/tasks/${task._id}`)}
                                    isDragging={snapshot.isDragging}
                                    canDrag={isAdmin()}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      </div>
                    )}
                  </Droppable>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </DragDropContext>
    </div>
  )
}

export default KanbanPage