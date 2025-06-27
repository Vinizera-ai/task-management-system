import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DocumentArrowUpIcon,
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'

import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function TaskDeliveries({ taskId, deliveries = [], canViewAll = false }) {
  const [expandedDeliveries, setExpandedDeliveries] = useState(new Set())

  const toggleExpanded = (deliveryId) => {
    setExpandedDeliveries(prev => {
      const newSet = new Set(prev)
      if (newSet.has(deliveryId)) {
        newSet.delete(deliveryId)
      } else {
        newSet.add(deliveryId)
      }
      return newSet
    })
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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimetype) => {
    const iconClass = "w-8 h-8"
    
    if (mimetype.startsWith('image/')) {
      return <PhotoIcon className={`${iconClass} text-blue-400`} />
    } else if (mimetype.startsWith('video/')) {
      return <VideoCameraIcon className={`${iconClass} text-purple-400`} />
    } else {
      return <DocumentIcon className={`${iconClass} text-green-400`} />
    }
  }

  const getStepColor = (stepOrder) => {
    const colors = [
      'border-blue-500/50 bg-blue-500/10',
      'border-purple-500/50 bg-purple-500/10',
      'border-green-500/50 bg-green-500/10',
      'border-yellow-500/50 bg-yellow-500/10',
      'border-red-500/50 bg-red-500/10',
      'border-indigo-500/50 bg-indigo-500/10',
      'border-pink-500/50 bg-pink-500/10',
      'border-teal-500/50 bg-teal-500/10'
    ]
    return colors[(stepOrder - 1) % colors.length]
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
            Ativa
          </span>
        )
      case 'superseded':
        return (
          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
            Substituída
          </span>
        )
      case 'rejected':
        return (
          <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
            Rejeitada
          </span>
        )
      default:
        return null
    }
  }

  // Agrupar entregas por etapa
  const groupedDeliveries = deliveries.reduce((groups, delivery) => {
    const stepOrder = delivery.stepOrder
    if (!groups[stepOrder]) {
      groups[stepOrder] = []
    }
    groups[stepOrder].push(delivery)
    return groups
  }, {})

  // Ordenar por ordem da etapa
  const sortedSteps = Object.keys(groupedDeliveries)
    .sort((a, b) => parseInt(a) - parseInt(b))

  if (deliveries.length === 0) {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <DocumentArrowUpIcon className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <p className="text-white/60">Nenhuma entrega ainda</p>
        <p className="text-white/40 text-sm mt-2">
          As entregas de cada etapa aparecerão aqui
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {sortedSteps.map((stepOrder, stepIndex) => {
        const stepDeliveries = groupedDeliveries[stepOrder]
          .sort((a, b) => new Date(b.deliveredAt) - new Date(a.deliveredAt))
        
        return (
          <motion.div
            key={stepOrder}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: stepIndex * 0.1 }}
            className={`glass-card rounded-xl p-6 border-l-4 ${getStepColor(parseInt(stepOrder))}`}
          >
            {/* Cabeçalho da etapa */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                  getStepColor(parseInt(stepOrder))
                }`}>
                  <span className="text-white font-semibold">
                    {stepOrder}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {stepDeliveries[0]?.stepName || `Etapa ${stepOrder}`}
                  </h3>
                  <p className="text-white/60 text-sm">
                    {stepDeliveries.length} {stepDeliveries.length === 1 ? 'entrega' : 'entregas'}
                  </p>
                </div>
              </div>
            </div>

            {/* Lista de entregas da etapa */}
            <div className="space-y-4">
              {stepDeliveries.map((delivery, deliveryIndex) => {
                const isExpanded = expandedDeliveries.has(delivery._id)
                
                return (
                  <motion.div
                    key={delivery._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (stepIndex * 0.1) + (deliveryIndex * 0.05) }}
                    className="glass-subtle rounded-lg p-4"
                  >
                    {/* Header da entrega */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {delivery.deliveredBy?.profileImage ? (
                          <img
                            src={delivery.deliveredBy.profileImage}
                            alt={delivery.deliveredBy.name}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-white/20"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {delivery.deliveredBy?.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        
                        <div>
                          <p className="font-medium text-white">
                            {delivery.deliveredBy?.name}
                          </p>
                          <p className="text-xs text-white/60">
                            {formatTimestamp(delivery.deliveredAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {getStatusBadge(delivery.status)}
                        
                        {delivery.attachments && delivery.attachments.length > 0 && (
                          <button
                            onClick={() => toggleExpanded(delivery._id)}
                            className="flex items-center text-white/60 hover:text-white text-sm transition-colors"
                          >
                            {delivery.attachments.length} arquivo(s)
                            {isExpanded ? (
                              <ChevronUpIcon className="w-4 h-4 ml-1" />
                            ) : (
                              <ChevronDownIcon className="w-4 h-4 ml-1" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Notas da entrega */}
                    {delivery.notes && (
                      <div className="mb-3">
                        <p className="text-white/80 text-sm whitespace-pre-wrap">
                          {delivery.notes}
                        </p>
                      </div>
                    )}

                    {/* Anexos da entrega */}
                    <AnimatePresence>
                      {isExpanded && delivery.attachments && delivery.attachments.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-white/10 pt-3"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {delivery.attachments.map((attachment, attachIndex) => (
                              <div key={attachIndex} className="group relative">
                                <div className="glass-subtle rounded-lg p-3 hover:bg-white/10 transition-colors">
                                  <div className="flex items-center space-x-3">
                                    {/* Preview ou ícone */}
                                    <div className="flex-shrink-0">
                                      {attachment.mimetype.startsWith('image/') ? (
                                        <div className="relative">
                                          <img
                                            src={attachment.url}
                                            alt={attachment.originalName}
                                            className="w-12 h-12 object-cover rounded-lg"
                                          />
                                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                            <EyeIcon className="w-5 h-5 text-white" />
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                                          {getFileIcon(attachment.mimetype)}
                                        </div>
                                      )}
                                    </div>

                                    {/* Informações do arquivo */}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-white text-sm font-medium truncate">
                                        {attachment.originalName}
                                      </p>
                                      <p className="text-white/60 text-xs">
                                        {formatFileSize(attachment.size)}
                                      </p>
                                    </div>

                                    {/* Ações */}
                                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <a
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                                        title="Abrir arquivo"
                                      >
                                        <EyeIcon className="w-4 h-4" />
                                      </a>
                                      <a
                                        href={attachment.url}
                                        download={attachment.originalName}
                                        className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors ml-1"
                                        title="Baixar arquivo"
                                      >
                                        <ArrowDownTrayIcon className="w-4 h-4" />
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Preview rápido dos anexos quando não expandido */}
                    {!isExpanded && delivery.attachments && delivery.attachments.length > 0 && (
                      <div className="flex space-x-2 mt-3">
                        {delivery.attachments.slice(0, 4).map((attachment, index) => (
                          <div key={index} className="flex-shrink-0">
                            {attachment.mimetype.startsWith('image/') ? (
                              <img
                                src={attachment.url}
                                alt={attachment.originalName}
                                className="w-16 h-16 object-cover rounded-lg opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                                onClick={() => toggleExpanded(delivery._id)}
                              />
                            ) : (
                              <div 
                                className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors"
                                onClick={() => toggleExpanded(delivery._id)}
                              >
                                {getFileIcon(attachment.mimetype)}
                              </div>
                            )}
                          </div>
                        ))}
                        {delivery.attachments.length > 4 && (
                          <div 
                            className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors"
                            onClick={() => toggleExpanded(delivery._id)}
                          >
                            <span className="text-white/60 text-xs">
                              +{delivery.attachments.length - 4}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

export default TaskDeliveries