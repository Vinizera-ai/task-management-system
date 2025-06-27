import React from 'react'
import { motion } from 'framer-motion'
import {
  ClockIcon,
  PlusIcon,
  PencilIcon,
  ArrowRightIcon,
  ArrowUturnLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleLeftRightIcon,
  DocumentArrowUpIcon,
  PaperClipIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline'

import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function TaskHistory({ history = [] }) {
  const getActionIcon = (action) => {
    const iconClass = "w-5 h-5"
    
    switch (action) {
      case 'created':
        return <PlusIcon className={`${iconClass} text-green-400`} />
      case 'updated':
        return <PencilIcon className={`${iconClass} text-blue-400`} />
      case 'step_advanced':
        return <ArrowRightIcon className={`${iconClass} text-purple-400`} />
      case 'step_reverted':
        return <ArrowUturnLeftIcon className={`${iconClass} text-yellow-400`} />
      case 'completed':
        return <CheckCircleIcon className={`${iconClass} text-green-400`} />
      case 'reopened':
        return <XCircleIcon className={`${iconClass} text-orange-400`} />
      case 'approved':
        return <CheckCircleIcon className={`${iconClass} text-green-400`} />
      case 'rejected':
        return <XCircleIcon className={`${iconClass} text-red-400`} />
      case 'comment_added':
        return <ChatBubbleLeftRightIcon className={`${iconClass} text-blue-400`} />
      case 'delivery_added':
        return <DocumentArrowUpIcon className={`${iconClass} text-indigo-400`} />
      case 'file_uploaded':
        return <PaperClipIcon className={`${iconClass} text-teal-400`} />
      case 'assigned':
        return <UserPlusIcon className={`${iconClass} text-cyan-400`} />
      default:
        return <ClockIcon className={`${iconClass} text-gray-400`} />
    }
  }

  const getActionColor = (action) => {
    switch (action) {
      case 'created':
      case 'completed':
      case 'approved':
        return 'border-green-500/50 bg-green-500/10'
      case 'step_advanced':
        return 'border-purple-500/50 bg-purple-500/10'
      case 'step_reverted':
        return 'border-yellow-500/50 bg-yellow-500/10'
      case 'rejected':
        return 'border-red-500/50 bg-red-500/10'
      case 'updated':
      case 'comment_added':
        return 'border-blue-500/50 bg-blue-500/10'
      case 'delivery_added':
        return 'border-indigo-500/50 bg-indigo-500/10'
      case 'file_uploaded':
        return 'border-teal-500/50 bg-teal-500/10'
      case 'assigned':
        return 'border-cyan-500/50 bg-cyan-500/10'
      default:
        return 'border-gray-500/50 bg-gray-500/10'
    }
  }

  const formatTimestamp = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: ptBR
      })
    } catch (error) {
      return 'Agora'
    }
  }

  const formatFullDate = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return 'Data inválida'
    }
  }

  // Agrupar histórico por data
  const groupedHistory = history.reduce((groups, item) => {
    const date = new Date(item.timestamp).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(item)
    return groups
  }, {})

  if (history.length === 0) {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <ClockIcon className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <p className="text-white/60">Nenhum histórico disponível</p>
        <p className="text-white/40 text-sm mt-2">
          As atividades da tarefa aparecerão aqui
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedHistory)
        .sort(([a], [b]) => new Date(b) - new Date(a))
        .map(([date, items], groupIndex) => (
          <motion.div
            key={date}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIndex * 0.1 }}
            className="glass-card rounded-xl p-6"
          >
            {/* Cabeçalho da data */}
            <div className="flex items-center mb-4 pb-3 border-b border-white/10">
              <ClockIcon className="w-5 h-5 text-white/60 mr-2" />
              <h3 className="text-lg font-semibold text-white">
                {new Date(date).toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h3>
              <span className="ml-2 px-2 py-1 bg-white/10 text-white/60 text-xs rounded-full">
                {items.length} {items.length === 1 ? 'atividade' : 'atividades'}
              </span>
            </div>

            {/* Timeline dos itens */}
            <div className="space-y-4">
              {items
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .map((item, index) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (groupIndex * 0.1) + (index * 0.05) }}
                    className={`relative pl-12 pb-4 ${
                      index < items.length - 1 ? 'border-l-2 border-white/10 ml-6' : ''
                    }`}
                  >
                    {/* Ícone da ação */}
                    <div className={`absolute -left-6 top-0 w-12 h-12 rounded-full border-2 flex items-center justify-center ${
                      getActionColor(item.action)
                    }`}>
                      {getActionIcon(item.action)}
                    </div>

                    {/* Conteúdo */}
                    <div className="space-y-2">
                      {/* Descrição principal */}
                      <div className="flex items-start justify-between">
                        <p className="text-white font-medium flex-1">
                          {item.description}
                        </p>
                        <span className="text-white/50 text-xs ml-4 whitespace-nowrap">
                          {formatTimestamp(item.timestamp)}
                        </span>
                      </div>

                      {/* Autor */}
                      {item.changedBy && (
                        <div className="flex items-center space-x-2">
                          {item.changedBy.profileImage ? (
                            <img
                              src={item.changedBy.profileImage}
                              alt={item.changedBy.name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-xs text-white font-medium">
                                {item.changedBy.name?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <span className="text-white/60 text-sm">
                            por {item.changedBy.name}
                          </span>
                        </div>
                      )}

                      {/* Metadados adicionais */}
                      {item.metadata && (
                        <div className="text-white/50 text-xs space-y-1">
                          {item.metadata.stepFrom && item.metadata.stepTo && (
                            <p>
                              Etapa {item.metadata.stepFrom} → {item.metadata.stepTo}
                            </p>
                          )}
                          
                          {item.metadata.commentId && (
                            <p>ID do comentário: {item.metadata.commentId}</p>
                          )}
                          
                          {item.metadata.deliveryId && (
                            <p>ID da entrega: {item.metadata.deliveryId}</p>
                          )}
                          
                          {item.metadata.attachmentIds && item.metadata.attachmentIds.length > 0 && (
                            <p>
                              {item.metadata.attachmentIds.length} arquivo(s) anexado(s)
                            </p>
                          )}
                        </div>
                      )}

                      {/* Valores anteriores e novos */}
                      {(item.previousValue !== undefined || item.newValue !== undefined) && (
                        <div className="glass-subtle rounded-lg p-3 text-sm">
                          {item.previousValue !== undefined && (
                            <div className="mb-2">
                              <span className="text-white/60">Valor anterior: </span>
                              <span className="text-red-300 font-mono">
                                {typeof item.previousValue === 'object' 
                                  ? JSON.stringify(item.previousValue) 
                                  : String(item.previousValue)}
                              </span>
                            </div>
                          )}
                          {item.newValue !== undefined && (
                            <div>
                              <span className="text-white/60">Novo valor: </span>
                              <span className="text-green-300 font-mono">
                                {typeof item.newValue === 'object' 
                                  ? JSON.stringify(item.newValue) 
                                  : String(item.newValue)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Timestamp completo */}
                      <div className="text-white/40 text-xs">
                        {formatFullDate(item.timestamp)}
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          </motion.div>
        ))}
    </div>
  )
}

export default TaskHistory