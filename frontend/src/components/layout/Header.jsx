import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useSocket } from '@/contexts/SocketContext'
import { useOnClickOutside } from '@/hooks/useOnClickOutside'
import {
  Bars3Icon,
  BellIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  CogIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

function Header({ onMenuClick, onNotificationClick }) {
  const { user, logout, isAdmin } = useAuth()
  const { getUnreadCount } = useSocket()
  const navigate = useNavigate()
  
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  const userMenuRef = useRef(null)
  
  useOnClickOutside(userMenuRef, () => setUserMenuOpen(false))

  const unreadNotifications = getUnreadCount()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Implementar busca global
      console.log('Buscar:', searchQuery)
    }
  }

  const handleCreateTask = () => {
    navigate('/tasks/create')
  }

  const userMenuItems = [
    {
      name: 'Perfil',
      icon: UserCircleIcon,
      onClick: () => {
        navigate('/profile')
        setUserMenuOpen(false)
      }
    },
    {
      name: 'Configurações',
      icon: CogIcon,
      onClick: () => {
        navigate('/settings')
        setUserMenuOpen(false)
      }
    },
    {
      name: 'Sair',
      icon: ArrowRightOnRectangleIcon,
      onClick: handleLogout,
      danger: true
    }
  ]

  return (
    <header className="glass-dark border-b border-white/10 sticky top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left side */}
          <div className="flex items-center space-x-4">
            {/* Menu button - mobile */}
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="hidden sm:block">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar tarefas, usuários..."
                  className="w-64 pl-10 pr-4 py-2 input-glass rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </form>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-3">
            
            {/* Create task button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCreateTask}
              className="hidden sm:flex items-center px-4 py-2 bg-gradient-primary text-white rounded-lg font-medium transition-all duration-200 hover:shadow-glow"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Nova Tarefa
            </motion.button>

            {/* Create task button - mobile */}
            <button
              onClick={handleCreateTask}
              className="sm:hidden p-2 bg-gradient-primary text-white rounded-lg transition-all duration-200 hover:shadow-glow"
            >
              <PlusIcon className="w-5 h-5" />
            </button>

            {/* Notifications */}
            <button
              onClick={onNotificationClick}
              className="relative p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <BellIcon className="w-6 h-6" />
              {unreadNotifications > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
                >
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </motion.span>
              )}
            </button>

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                {user?.profileImage ? (
                  <img
                    className="w-8 h-8 rounded-lg object-cover ring-2 ring-white/20"
                    src={user.profileImage}
                    alt={user.name}
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                )}
              </button>

              {/* User dropdown */}
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-64 glass-strong rounded-xl shadow-glass-lg border border-white/20 overflow-hidden z-50"
                  >
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-white/20">
                      <div className="flex items-center">
                        {user?.profileImage ? (
                          <img
                            className="w-10 h-10 rounded-lg object-cover ring-2 ring-white/20"
                            src={user.profileImage}
                            alt={user.name}
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="ml-3 flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {user?.name}
                          </p>
                          <p className="text-xs text-white/60 truncate">
                            {user?.email}
                          </p>
                          <p className="text-xs text-white/50">
                            {user?.role === 'admin' ? 'Administrador' : 'Operacional'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-2">
                      {userMenuItems.map((item, index) => (
                        <button
                          key={index}
                          onClick={item.onClick}
                          className={`w-full flex items-center px-4 py-2 text-sm transition-colors ${
                            item.danger
                              ? 'text-red-300 hover:bg-red-500/20 hover:text-red-200'
                              : 'text-white/80 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <item.icon className="w-5 h-5 mr-3" />
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header