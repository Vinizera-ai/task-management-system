import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useSocket } from '@/contexts/SocketContext'
import { tasksService } from '@/services/tasksService'
import { usersService } from '@/services/usersService'

import Loading from '@/components/ui/Loading'
import Button from '@/components/ui/Button'
import Modal, { ConfirmModal } from '@/components/ui/Modal'
import FileUpload from '@/components/ui/FileUpload'
import TaskComments from '@/components/tasks/TaskComments'
import TaskHistory from '@/components/tasks/TaskHistory'
import TaskDeliveries from '@/components/tasks/TaskDeliveries'

import {
  ArrowLeftIcon,
  PencilIcon,
  ArrowRightIcon,
  ArrowUturnLeftIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  DocumentArrowUpIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

import toast from 'react-hot-toast'

function TaskDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, isAdmin } = useAuth()
  const { joinTaskRoom, leaveTaskRoom } = useSocket()

  // Estados locais
  const [activeTab, setActiveTab] = useState('overview')
  const [showAdvanceModal, setShowAdvanceModal] = useState(false)
  const [showRevertModal, setShowRevertModal] = useState(false)
  const [showDeliveryModal, setShowDeliveryModal] = useState(false)
  const [advanceNotes, setAdvanceNotes] = useState('')
  const [revertReason, setRevertReason] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [deliveryFiles, setDeliveryFiles] = useState([])

  // Query para buscar tarefa
  const { 
    data: taskData, 
    isLoading, 
    error,
    refetch
  } = useQuery(
    ['task', id],
    () => tasksService.getTask(id),
    {
      refetchOnWindowFocus: false,
      staleTime: 30000
    }
  )

  const task = taskData?.data

  // Query para usuários ativos (para menções)
  const { data: usersData } = useQuery(
    'active-users',
    usersService.getActiveUsers
  )

  // Mutations
  const advanceTaskMutation = useMutation(
    (notes) => tasksService.advanceTask(id, notes),
    {
      onSuccess: () => {
        toast.success('Tarefa avançada com sucesso!')
        queryClient.invalidateQueries(['task', id])
        setShowAdvanceModal(false)
        setAdvanceNotes('')
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Erro ao avançar tarefa')
      }
    }
  )

  const revertTaskMutation = useMutation(
    (reason) => tasksService.revertTask(id, reason),
    {
      onSuccess: () => {
        toast.success('Tarefa retrocedida com sucesso!')
        queryClient.invalidateQueries(['task', id])
        setShowRevertModal(false)
        setRevertReason('')
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Erro ao retroceder tarefa')
      }
    }
  )

  const addDeliveryMutation = useMutation(
    ({ notes, files }) => tasksService.addDelivery(id, { notes }, files),
    {
      onSuccess: () => {
        toast.success('Entrega adicionada com sucesso!')
        queryClient.invalidateQueries(['task', id])
        setShowDeliveryModal(false)
        setDeliveryNotes('')
        setDeliveryFiles([])
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Erro ao adicionar entrega')
      }
    }
  )

  // Entrar na sala da tarefa via socket
  useEffect(() => {
    if (task) {
      joinTaskRoom(task._id)
      return () => leaveTaskRoom(task._id)
    }
  }, [task, joinTaskRoom, leaveTaskRoom])

  // Verificar se usuário pode interagir com a tarefa
  const canInteract = () => {
    if (isAdmin()) return true
    
    return task?.assignedUsers?.some(assignment => 
      assignment.userId._id === user.id && assignment.stepOrder === task.currentStep
    )
  }

  const canAdvance = () => {
    return canInteract() && task?.currentStep < task?.totalSteps
  }

  const canRevert = () => {
    return canInteract() && task?.currentStep > 1
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const isOverdue = () => {
    return task?.status === 'active' && new Date(task.dueDate) < new Date()
  }

  const handleAdvance = () => {
    advanceTaskMutation.mutate(advanceNotes)
  }

  const handleRevert = () => {
    revertTaskMutation.mutate(revertReason)
  }

  const handleDelivery = () => {
    if (deliveryFiles.length === 0) {
      toast.error('Selecione pelo menos um arquivo para a entrega')
      return
    }
    
    addDeliveryMutation.mutate({
      notes: deliveryNotes,
      files: deliveryFiles
    })
  }

  if (isLoading) {
    return <Loading text="Carregando tarefa..." />
  }

  if (error) {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <p className="text-red-400 mb-4">Erro ao carregar tarefa</p>
        <Button onClick={() => navigate('/tasks')}>
          Voltar para Tarefas
        </Button>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <p className="text-white/60 mb-4">Tarefa não encontrada</p>
        <Button onClick={() => navigate('/tasks')}>
          Voltar para Tarefas
        </Button>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', name: 'Visão Geral', icon: EyeIcon },
    { id: 'comments', name: 'Comentários', icon: ChatBubbleLeftRightIcon },
    { id: 'deliveries', name: 'Entregas', icon: DocumentArrowUpIcon },
    { id: 'history', name: 'Histórico', icon: ClockIcon }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <Button
            variant="ghost"
            icon={<ArrowLeftIcon />}
            onClick={() => navigate('/tasks')}
          >
            Voltar
          </Button>
          
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-bold text-white">
                {task.title}
              </h1>
              
              {isOverdue() && (
                <span className="flex items-center text-red-400 text-sm px-2 py-1 bg-red-500/20 rounded-full">
                  Atrasada
                </span>
              )}
              
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                {getStatusText(task.status)}
              </span>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-white/60">
              <span>Cliente: {task.client?.companyName}</span>
              <span>•</span>
              <span>Entrega: {formatDate(task.dueDate)}</span>
              <span>•</span>
              <span className={getPriorityColor(task.priority)}>
                Prioridade {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
              </span>
            </div>
          </div>
        </div>

        {/* Ações */}
        {canInteract() && task.status === 'active' && (
          <div className="flex items-center space-x-2">
            {canRevert() && (
              <Button
                variant="secondary"
                icon={<ArrowUturnLeftIcon />}
                onClick={() => setShowRevertModal(true)}
              >
                Voltar
              </Button>
            )}
            
            <Button
              variant="secondary"
              icon={<DocumentArrowUpIcon />}
              onClick={() => setShowDeliveryModal(true)}
            >
              Entregar
            </Button>
            
            {canAdvance() && (
              <Button
                variant="primary"
                icon={task.currentStep === task.totalSteps ? <CheckCircleIcon /> : <ArrowRightIcon />}
                onClick={() => setShowAdvanceModal(true)}
              >
                {task.currentStep === task.totalSteps ? 'Concluir' : 'Avançar'}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Progresso */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            Progresso da Tarefa
          </h2>
          <span className="text-white/60">
            Etapa {task.currentStep} de {task.totalSteps}
          </span>
        </div>

        <div className="space-y-4">
          <div className="w-full bg-white/10 rounded-full h-3">
            <div
              className="bg-gradient-primary h-3 rounded-full transition-all duration-500"
              style={{ width: `${(task.currentStep / task.totalSteps) * 100}%` }}
            />
          </div>

          {/* Responsável atual */}
          {task.currentAssignee && (
            <div className="flex items-center space-x-3">
              <span className="text-white/60 text-sm">Responsável atual:</span>
              <div className="flex items-center space-x-2">
                {task.assignedUsers?.find(a => a.userId._id === task.currentAssignee)?.userId.profileImage ? (
                  <img
                    src={task.assignedUsers.find(a => a.userId._id === task.currentAssignee).userId.profileImage}
                    alt=""
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">
                      {task.assignedUsers?.find(a => a.userId._id === task.currentAssignee)?.userId.name?.charAt(0)}
                    </span>
                  </div>
                )}
                <span className="text-white text-sm font-medium">
                  {task.assignedUsers?.find(a => a.userId._id === task.currentAssignee)?.userId.name}
                </span>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-white/60 hover:text-white/80'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Conteúdo das tabs */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Briefing */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Briefing</h3>
                <p className="text-white/80 whitespace-pre-wrap">{task.briefing}</p>
                
                {/* Tags */}
                {task.tags && task.tags.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex flex-wrap gap-2">
                      {task.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-white/10 text-white/70 text-xs rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Anexos iniciais */}
              {task.initialAttachments && task.initialAttachments.length > 0 && (
                <div className="glass-card rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Anexos do Briefing
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {task.initialAttachments.map((attachment, index) => (
                      <div key={index} className="glass-subtle rounded-lg p-3">
                        <div className="flex items-center space-x-3">
                          {attachment.mimetype.startsWith('image/') ? (
                            <img
                              src={attachment.url}
                              alt={attachment.originalName}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                              <DocumentIcon className="w-6 h-6 text-white/60" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">
                              {attachment.originalName}
                            </p>
                            <p className="text-white/60 text-xs">
                              {(attachment.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <TaskComments 
              taskId={task._id} 
              users={usersData?.data || []}
              canComment={canInteract()}
            />
          )}

          {activeTab === 'deliveries' && (
            <TaskDeliveries 
              taskId={task._id}
              deliveries={task.deliveries || []}
              canViewAll={isAdmin()}
            />
          )}

          {activeTab === 'history' && (
            <TaskHistory 
              history={task.history || []}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modal de Avançar */}
      <Modal
        isOpen={showAdvanceModal}
        onClose={() => setShowAdvanceModal(false)}
        title={task.currentStep === task.totalSteps ? 'Concluir Tarefa' : 'Avançar Tarefa'}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-white/80">
            {task.currentStep === task.totalSteps 
              ? 'Tem certeza que deseja marcar esta tarefa como concluída?'
              : `Avançar da etapa ${task.currentStep} para ${task.currentStep + 1}?`
            }
          </p>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Observações (opcional)
            </label>
            <textarea
              value={advanceNotes}
              onChange={(e) => setAdvanceNotes(e.target.value)}
              rows={3}
              className="w-full input-glass rounded-lg text-white placeholder-white/40 resize-none"
              placeholder="Adicione observações sobre esta etapa..."
            />
          </div>

          <div className="flex space-x-3 justify-end">
            <Button
              variant="ghost"
              onClick={() => setShowAdvanceModal(false)}
              disabled={advanceTaskMutation.isLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleAdvance}
              loading={advanceTaskMutation.isLoading}
            >
              {task.currentStep === task.totalSteps ? 'Concluir' : 'Avançar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Retroceder */}
      <Modal
        isOpen={showRevertModal}
        onClose={() => setShowRevertModal(false)}
        title="Retroceder Tarefa"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-white/80">
            Retroceder da etapa {task.currentStep} para {task.currentStep - 1}?
          </p>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Motivo (opcional)
            </label>
            <textarea
              value={revertReason}
              onChange={(e) => setRevertReason(e.target.value)}
              rows={3}
              className="w-full input-glass rounded-lg text-white placeholder-white/40 resize-none"
              placeholder="Explique o motivo do retrocesso..."
            />
          </div>

          <div className="flex space-x-3 justify-end">
            <Button
              variant="ghost"
              onClick={() => setShowRevertModal(false)}
              disabled={revertTaskMutation.isLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="warning"
              onClick={handleRevert}
              loading={revertTaskMutation.isLoading}
            >
              Retroceder
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Entrega */}
      <Modal
        isOpen={showDeliveryModal}
        onClose={() => setShowDeliveryModal(false)}
        title="Nova Entrega"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Observações (opcional)
            </label>
            <textarea
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              rows={3}
              className="w-full input-glass rounded-lg text-white placeholder-white/40 resize-none"
              placeholder="Adicione observações sobre esta entrega..."
            />
          </div>

          <FileUpload
            onFileSelect={setDeliveryFiles}
            selectedFiles={deliveryFiles}
            onRemoveFile={(index) => {
              setDeliveryFiles(prev => prev.filter((_, i) => i !== index))
            }}
            maxFiles={5}
          />

          <div className="flex space-x-3 justify-end">
            <Button
              variant="ghost"
              onClick={() => setShowDeliveryModal(false)}
              disabled={addDeliveryMutation.isLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleDelivery}
              loading={addDeliveryMutation.isLoading}
              disabled={deliveryFiles.length === 0}
            >
              Adicionar Entrega
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default TaskDetailPage