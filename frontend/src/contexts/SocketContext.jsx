import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const SocketContext = createContext()

export function SocketProvider({ children }) {
  const { user, isAuthenticated, token } = useAuth()
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [notifications, setNotifications] = useState([])
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  // Conectar ao socket quando autenticado
  useEffect(() => {
    if (isAuthenticated && user && token) {
      connectSocket()
    } else {
      disconnectSocket()
    }

    return () => {
      disconnectSocket()
    }
  }, [isAuthenticated, user, token])

  const connectSocket = () => {
    try {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'
      
      const newSocket = io(socketUrl, {
        auth: {
          token: token
        },
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000
      })

      // Event listeners
      newSocket.on('connect', () => {
        console.log('✅ Socket conectado:', newSocket.id)
        setIsConnected(true)
        reconnectAttempts.current = 0
        
        // Entrar na sala do usuário
        if (user?.id) {
          newSocket.emit('join-user', user.id)
        }
      })

      newSocket.on('disconnect', (reason) => {
        console.log('❌ Socket desconectado:', reason)
        setIsConnected(false)
      })

      newSocket.on('connect_error', (error) => {
        console.error('❌ Erro de conexão socket:', error)
        setIsConnected(false)
        reconnectAttempts.current++
        
        if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.error('❌ Máximo de tentativas de reconexão atingido')
          toast.error('Problema de conectividade. Recarregue a página.')
        }
      })

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('🔄 Socket reconectado após', attemptNumber, 'tentativas')
        toast.success('Conexão reestabelecida!')
      })

      // Listeners de notificações
      newSocket.on('notification', (data) => {
        handleNotification(data)
      })

      // Listeners específicos do sistema
      newSocket.on('task-assigned', (data) => {
        handleTaskAssigned(data)
      })

      newSocket.on('task-updated', (data) => {
        handleTaskUpdated(data)
      })

      newSocket.on('task-completed', (data) => {
        handleTaskCompleted(data)
      })

      newSocket.on('task-approved', (data) => {
        handleTaskApproved(data)
      })

      newSocket.on('task-rejected', (data) => {
        handleTaskRejected(data)
      })

      newSocket.on('user-mentioned', (data) => {
        handleUserMentioned(data)
      })

      newSocket.on('user-created', (data) => {
        handleUserCreated(data)
      })

      newSocket.on('client-created', (data) => {
        handleClientCreated(data)
      })

      newSocket.on('workflow-created', (data) => {
        handleWorkflowCreated(data)
      })

      newSocket.on('task-model-created', (data) => {
        handleTaskModelCreated(data)
      })

      setSocket(newSocket)
    } catch (error) {
      console.error('❌ Erro ao conectar socket:', error)
    }
  }

  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect()
      setSocket(null)
      setIsConnected(false)
    }
  }

  // Handlers de notificações
  const handleNotification = (data) => {
    const notification = {
      id: Date.now(),
      ...data,
      timestamp: new Date(),
      read: false
    }

    setNotifications(prev => [notification, ...prev].slice(0, 50)) // Manter apenas 50 notificações
    
    // Mostrar toast se não for notificação silenciosa
    if (!data.silent) {
      toast(data.message, {
        icon: getNotificationIcon(data.type),
        duration: 4000
      })
    }
  }

  const handleTaskAssigned = (data) => {
    if (data.assignedTo === user?.id) {
      toast.success(`Nova tarefa atribuída: ${data.taskTitle}`, {
        icon: '📋'
      })
    }
  }

  const handleTaskUpdated = (data) => {
    // Só notificar se o usuário está envolvido na tarefa
    if (data.involvedUsers?.includes(user?.id)) {
      toast.info(`Tarefa atualizada: ${data.taskTitle}`, {
        icon: '🔄'
      })
    }
  }

  const handleTaskCompleted = (data) => {
    if (data.involvedUsers?.includes(user?.id)) {
      toast.success(`Tarefa concluída: ${data.taskTitle}`, {
        icon: '✅'
      })
    }
  }

  const handleTaskApproved = (data) => {
    if (data.assignedTo === user?.id) {
      toast.success(`Tarefa aprovada: ${data.taskTitle}`, {
        icon: '👍'
      })
    }
  }

  const handleTaskRejected = (data) => {
    if (data.assignedTo === user?.id) {
      toast.error(`Tarefa rejeitada: ${data.taskTitle}`, {
        icon: '👎'
      })
    }
  }

  const handleUserMentioned = (data) => {
    if (data.mentionedUserId === user?.id) {
      toast.info(`Você foi mencionado em: ${data.taskTitle}`, {
        icon: '💬'
      })
    }
  }

  const handleUserCreated = (data) => {
    if (user?.role === 'admin') {
      toast.info(data.message, { icon: '👤' })
    }
  }

  const handleClientCreated = (data) => {
    if (user?.role === 'admin') {
      toast.info(data.message, { icon: '🏢' })
    }
  }

  const handleWorkflowCreated = (data) => {
    toast.info(data.message, { icon: '⚙️' })
  }

  const handleTaskModelCreated = (data) => {
    toast.info(data.message, { icon: '📝' })
  }

  // Utilitários
  const getNotificationIcon = (type) => {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      task: '📋',
      user: '👤',
      client: '🏢',
      system: '⚙️'
    }
    return icons[type] || 'ℹ️'
  }

  // Funções para usar nos componentes
  const joinTaskRoom = (taskId) => {
    if (socket && isConnected) {
      socket.emit('join-task', taskId)
    }
  }

  const leaveTaskRoom = (taskId) => {
    if (socket && isConnected) {
      socket.emit('leave-task', taskId)
    }
  }

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    )
  }

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    )
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  const getUnreadCount = () => {
    return notifications.filter(notif => !notif.read).length
  }

  const emitEvent = (eventName, data) => {
    if (socket && isConnected) {
      socket.emit(eventName, data)
    }
  }

  const value = {
    socket,
    isConnected,
    notifications,
    
    // Funções
    joinTaskRoom,
    leaveTaskRoom,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    getUnreadCount,
    emitEvent,
    
    // Utilitários
    connectSocket,
    disconnectSocket
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  
  if (!context) {
    throw new Error('useSocket deve ser usado dentro de um SocketProvider')
  }
  
  return context
}