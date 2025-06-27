import React from 'react'
import { motion } from 'framer-motion'
import {
  CalendarIcon,
  ExclamationTriangleIcon,
  BuildingOfficeIcon,
  UserIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

function KanbanCard({ task, onClick, isDragging = false, canDrag = false }) {
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

  const getPriorityDot = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'low':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    })
  }

  const isOverdue = () => {
    return task.status === 'active' && new Date(task.dueDate) < new Date()
  }

  const getDaysRemaining = () => {
    const today = new Date()
    const dueDate = new Date(task.dueDate)
    const diffTime = dueDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysRemaining = getDaysRemaining()
  const overdue = isOverdue()

  // Responsável atual
  const currentAssignee = task.assignedUsers?.find(
    assignment => assignment.stepOrder === task.currentStep
  )

  return (
    <motion.div
      whileHover={!isDragging ? { y: -2, scale: 1.02 } : {}}
      whileTap={!isDragging ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={`
        glass-card rounded-lg p-4 cursor-pointer transition-all duration-200
        border-l-4 ${getPriorityColor(task.priority)}
        ${isDragging ? 'shadow-2xl bg-white/20' : 'hover:shadow-lg hover:bg-white/10'}
        ${canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
        ${overdue ? 'ring-2 ring-red-500/50' : ''}
      `}
    >
      {/* Header com prioridade e status */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${getPriorityDot(task.priority)}`} />
          <span className="text-xs text-white/60 uppercase tracking-wide">
            {getPriorityText(task.priority)}
          </span>
        </div>
        
        {overdue && (
          <div className="flex items-center text-red-400">
            <ExclamationTriangleIcon className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Título */}
      <h4 className="text-white font-medium text-sm mb-3 line-clamp-2 leading-tight">
        {task.title}
      </h4>

      {/* Cliente */}
      <div className="flex items-center space-x-2 mb-3">
        <BuildingOfficeIcon className="w-4 h-4 text-white/40 flex-shrink-0" />
        <span className="text-white/70 text-xs truncate">
          {task.client?.companyName}
        </span>
      </div>

      {/* Responsável atual */}
      {currentAssignee && (
        <div className="flex items-center space-x-2 mb-3">
          {currentAssignee.userId.profileImage ? (
            <img
              src={currentAssignee.userId.profileImage}
              alt={currentAssignee.userId.name}
              className="w-5 h-5 rounded-full object-cover"
            />
          ) : (
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-medium">
                {currentAssignee.userId.name?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <span className="text-white/70 text-xs truncate">
            {currentAssignee.userId.name}
          </span>
        </div>
      )}

      {/* Data de entrega */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-4 h-4 text-white/40" />
          <span className={`text-xs ${
            overdue 
              ? 'text-red-400 font-medium' 
              : daysRemaining <= 2 
                ? 'text-yellow-400' 
                : 'text-white/70'
          }`}>
            {formatDate(task.dueDate)}
          </span>
        </div>

        {/* Indicador de prazo */}
        <div className="flex items-center space-x-1">
          <ClockIcon className="w-3 h-3 text-white/40" />
          <span className={`text-xs ${
            overdue 
              ? 'text-red-400 font-medium'
              : daysRemaining <= 2 
                ? 'text-yellow-400'
                : daysRemaining <= 7 
                  ? 'text-orange-400'
                  : 'text-white/60'
          }`}>
            {overdue 
              ? `${Math.abs(daysRemaining)}d atraso`
              : daysRemaining === 0 
                ? 'Hoje'
                : daysRemaining === 1
                  ? 'Amanhã'
                  : `${daysRemaining}d`
            }
          </span>
        </div>
      </div>

      {/* Progresso visual */}
      <div className="mt-3 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between text-xs text-white/60 mb-1">
          <span>Progresso</span>
          <span>{Math.round((task.currentStep / task.totalSteps) * 100)}%</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              task.currentStep === task.totalSteps 
                ? 'bg-green-500'
                : overdue 
                  ? 'bg-red-500'
                  : 'bg-blue-500'
            }`}
            style={{ width: `${(task.currentStep / task.totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Indicadores adicionais */}
      <div className="flex items-center justify-between mt-3">
        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex space-x-1">
            {task.tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-white/10 text-white/60 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
            {task.tags.length > 2 && (
              <span className="px-2 py-1 bg-white/10 text-white/60 text-xs rounded-full">
                +{task.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Indicadores de atividade */}
        <div className="flex items-center space-x-2">
          {/* Comentários */}
          {task.comments && task.comments.length > 0 && (
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
              <span className="text-xs text-white/60">{task.comments.length}</span>
            </div>
          )}
          
          {/* Entregas */}
          {task.deliveries && task.deliveries.length > 0 && (
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              <span className="text-xs text-white/60">{task.deliveries.length}</span>
            </div>
          )}
          
          {/* Anexos iniciais */}
          {task.initialAttachments && task.initialAttachments.length > 0 && (
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
              <span className="text-xs text-white/60">{task.initialAttachments.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Indicador de arrastar (apenas para admins) */}
      {canDrag && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-2 h-2 bg-white/30 rounded-full" />
        </div>
      )}
    </motion.div>
  )
}

export default KanbanCard