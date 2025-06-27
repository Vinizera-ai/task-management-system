import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

import { tasksService } from '@/services/tasksService'
import { clientsService } from '@/services/clientsService'
import { taskModelsService } from '@/services/taskModelsService'

import Loading from '@/components/ui/Loading'
import Button from '@/components/ui/Button'
import FileUpload from '@/components/ui/FileUpload'

import {
  ArrowLeftIcon,
  DocumentTextIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  TagIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline'

function CreateTaskPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedFiles, setSelectedFiles] = useState([])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      title: '',
      briefing: '',
      client: '',
      taskModel: '',
      dueDate: '',
      priority: 'medium',
      tags: ''
    }
  })

  const selectedClient = watch('client')
  const selectedTaskModel = watch('taskModel')

  // Queries para dados necessários
  const { data: clientsData, isLoading: loadingClients } = useQuery(
    'active-clients',
    clientsService.getActiveClients
  )

  const { data: taskModelsData, isLoading: loadingTaskModels } = useQuery(
    'active-task-models',
    () => taskModelsService.getActiveTaskModels()
  )

  // Obter detalhes do modelo selecionado
  const { data: selectedTaskModelData } = useQuery(
    ['task-model', selectedTaskModel],
    () => taskModelsService.getTaskModel(selectedTaskModel),
    {
      enabled: !!selectedTaskModel
    }
  )

  // Mutation para criar tarefa
  const createTaskMutation = useMutation(
    ({ taskData, attachments }) => tasksService.createTask(taskData, attachments),
    {
      onSuccess: (data) => {
        toast.success('Tarefa criada com sucesso!')
        queryClient.invalidateQueries('tasks')
        navigate(`/tasks/${data.data._id}`)
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Erro ao criar tarefa')
      }
    }
  )

  const onSubmit = async (data) => {
    try {
      // Processar tags
      const tags = data.tags 
        ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        : []

      const taskData = {
        ...data,
        tags
      }

      await createTaskMutation.mutateAsync({
        taskData,
        attachments: selectedFiles
      })
    } catch (error) {
      console.error('Erro ao criar tarefa:', error)
    }
  }

  const handleFileSelect = (files) => {
    setSelectedFiles(files)
  }

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Formatação de data mínima (hoje)
  const today = new Date().toISOString().split('T')[0]

  if (loadingClients || loadingTaskModels) {
    return <Loading text="Carregando dados..." />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          icon={<ArrowLeftIcon />}
          onClick={() => navigate('/tasks')}
        >
          Voltar
        </Button>
        
        <div>
          <h1 className="text-2xl font-bold text-white">Nova Tarefa</h1>
          <p className="text-white/70">
            Crie uma nova tarefa para seus clientes
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informações Básicas */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-xl p-6"
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <DocumentTextIcon className="w-5 h-5 mr-2" />
                Informações Básicas
              </h2>

              <div className="space-y-4">
                {/* Título */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Título da Tarefa *
                  </label>
                  <input
                    {...register('title', {
                      required: 'Título é obrigatório',
                      minLength: {
                        value: 5,
                        message: 'Título deve ter pelo menos 5 caracteres'
                      },
                      maxLength: {
                        value: 200,
                        message: 'Título não pode ter mais que 200 caracteres'
                      }
                    })}
                    type="text"
                    className="w-full input-glass rounded-lg text-white placeholder-white/40"
                    placeholder="Ex: Post para Instagram - Campanha Black Friday"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-400">{errors.title.message}</p>
                  )}
                </div>

                {/* Cliente */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Cliente *
                  </label>
                  <select
                    {...register('client', { required: 'Cliente é obrigatório' })}
                    className="w-full input-glass rounded-lg text-white bg-transparent"
                  >
                    <option value="">Selecione um cliente</option>
                    {clientsData?.data?.map(client => (
                      <option key={client._id} value={client._id}>
                        {client.companyName}
                      </option>
                    ))}
                  </select>
                  {errors.client && (
                    <p className="mt-1 text-sm text-red-400">{errors.client.message}</p>
                  )}
                </div>

                {/* Modelo de Tarefa */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Modelo de Tarefa *
                  </label>
                  <select
                    {...register('taskModel', { required: 'Modelo é obrigatório' })}
                    className="w-full input-glass rounded-lg text-white bg-transparent"
                  >
                    <option value="">Selecione um modelo</option>
                    {taskModelsData?.data?.map(model => (
                      <option key={model._id} value={model._id}>
                        {model.name} ({model.stepCount} etapas)
                      </option>
                    ))}
                  </select>
                  {errors.taskModel && (
                    <p className="mt-1 text-sm text-red-400">{errors.taskModel.message}</p>
                  )}
                </div>

                {/* Briefing */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Briefing *
                  </label>
                  <textarea
                    {...register('briefing', {
                      required: 'Briefing é obrigatório',
                      minLength: {
                        value: 10,
                        message: 'Briefing deve ter pelo menos 10 caracteres'
                      },
                      maxLength: {
                        value: 5000,
                        message: 'Briefing não pode ter mais que 5000 caracteres'
                      }
                    })}
                    rows={6}
                    className="w-full input-glass rounded-lg text-white placeholder-white/40 resize-none"
                    placeholder="Descreva detalhadamente os requisitos da tarefa..."
                  />
                  {errors.briefing && (
                    <p className="mt-1 text-sm text-red-400">{errors.briefing.message}</p>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Tags
                  </label>
                  <input
                    {...register('tags')}
                    type="text"
                    className="w-full input-glass rounded-lg text-white placeholder-white/40"
                    placeholder="Ex: instagram, stories, reel (separadas por vírgula)"
                  />
                  <p className="mt-1 text-xs text-white/60">
                    Separe as tags por vírgula
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Anexos */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card rounded-xl p-6"
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <PaperClipIcon className="w-5 h-5 mr-2" />
                Anexos do Briefing
              </h2>

              <FileUpload
                onFileSelect={handleFileSelect}
                selectedFiles={selectedFiles}
                onRemoveFile={removeFile}
                accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                maxFiles={5}
                maxSize={200 * 1024 * 1024} // 200MB
              />
            </motion.div>
          </div>

          {/* Sidebar com configurações */}
          <div className="space-y-6">
            {/* Configurações */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card rounded-xl p-6"
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2" />
                Configurações
              </h2>

              <div className="space-y-4">
                {/* Data de Entrega */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Data de Entrega *
                  </label>
                  <input
                    {...register('dueDate', { required: 'Data de entrega é obrigatória' })}
                    type="date"
                    min={today}
                    className="w-full input-glass rounded-lg text-white"
                  />
                  {errors.dueDate && (
                    <p className="mt-1 text-sm text-red-400">{errors.dueDate.message}</p>
                  )}
                </div>

                {/* Prioridade */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Prioridade
                  </label>
                  <select
                    {...register('priority')}
                    className="w-full input-glass rounded-lg text-white bg-transparent"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>
            </motion.div>

            {/* Preview do Modelo */}
            {selectedTaskModelData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4">
                  Fluxo da Tarefa
                </h3>

                <div className="space-y-3">
                  {selectedTaskModelData.data.selectedSteps?.map((step, index) => (
                    <div key={step.stepId} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <span className="text-blue-400 text-sm font-medium">
                          {index + 1}
                        </span>
                      </div>
                      <span className="text-white/80 text-sm">
                        {step.stepName}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-sm text-white/60">
                    <span>Total de etapas:</span>
                    <span className="font-medium">
                      {selectedTaskModelData.data.selectedSteps?.length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-white/60 mt-1">
                    <span>Tempo estimado:</span>
                    <span className="font-medium">
                      {selectedTaskModelData.data.settings?.estimatedHours || 8}h
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Ações */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={createTaskMutation.isLoading}
                disabled={createTaskMutation.isLoading}
              >
                Criar Tarefa
              </Button>

              <Button
                type="button"
                variant="ghost"
                fullWidth
                onClick={() => navigate('/tasks')}
                disabled={createTaskMutation.isLoading}
              >
                Cancelar
              </Button>
            </motion.div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default CreateTaskPage