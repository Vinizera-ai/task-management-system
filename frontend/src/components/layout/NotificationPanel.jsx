import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '@/contexts/SocketContext'
import { 
  XMarkIcon, 
  BellIcon,
  CheckIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function NotificationPanel({ isOpen, onClose }) {
  const { 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead,
    clearNotifications,
    getUnreadCount
  } = useSocket()

  const unreadCount = getUnreadCount()

  const getNotificationIcon = (type) => {
    const iconClass = "w-5 h-5 flex-shrink-0"
    
    switch (type) {
      case 'task':
        return <span className={`${iconClass} text-blue-400`}>📋</span>
      case 'user':
        return <span className={`${iconClass} text-green-400`}>👤</span>
      case 'client':
        return <span className={`${iconClass} text-purple-400`}>🏢</span>
      case 'system':
        return <span className={`${iconClass} text-yellow-400`}>⚙️</span>
      case 'success':
        return <span className={`${iconClass} text-green-400`}>✅</span>
      case 'warning':
        return <span className={`${iconClass} text-orange-400`}>⚠️</span>
      case 'error':
        return <span className={`${iconClass} text-red-400`}>❌</span>
      default:
        return <span className={`${iconClass} text-blue-400`}>ℹ️</span>
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-gradient-to-b from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-l border-white/10 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center">
                <BellIcon className="w-6 h-6 text-white mr-3" />
                <h2 className="text-lg font-semibold text-white">
                  Notificações
                </h2>
                {unreadCount > 0 && (
                  <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Actions */}
            {notifications.length > 0 && (
              <div className="flex items-center justify-between px-6 py-3 border-b border-white/10">
                <button
                  onClick={markAllNotificationsAsRead}
                  disabled={unreadCount === 0}
                  className="flex items-center text-sm text-blue-400 hover:text-blue-300 disabled:text-white/40 disabled:cursor-not-allowed transition-colors"
                >
                  <CheckIcon className="w-4 h-4 mr-1" />
                  Marcar todas como lidas
                </button>
                <button
                  onClick={clearNotifications}
                  className="flex items-center text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  <TrashIcon className="w-4 h-4 mr-1" />
                  Limpar todas
                </button>
              </div>
            )}

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <BellIcon className="w-16 h-16 text-white/20 mb-4" />
                  <p className="text-white/60 text-lg font-medium mb-2">
                    Nenhuma notificação
                  </p>
                  <p className="text-white/40 text-sm">
                    Você está em dia! Novas notificações aparecerão aqui.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 hover:bg-white/5 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-blue-500/10' : ''
                      }`}
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${
                            notification.read ? 'text-white/80' : 'text-white font-medium'
                          }`}>
                            {notification.message}
                          </p>
                          
                          {notification.description && (
                            <p className="text-sm text-white/60 mt-1">
                              {notification.description}
                            </p>
                          )}

                          <p className="text-xs text-white/40 mt-2">
                            {formatTimestamp(notification.timestamp)}
                          </p>
                        </div>

                        {/* Unread indicator */}
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10">
              <p className="text-xs text-white/40 text-center">
                Notificações em tempo real
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default NotificationPanel