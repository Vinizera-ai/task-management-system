import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  ViewColumnsIcon,
  UsersIcon,
  BuildingOfficeIcon,
  CogIcon,
  UserCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

function Sidebar({ isOpen, onClose }) {
  const { user, isAdmin } = useAuth()
  const location = useLocation()

  // Itens de navegação baseados no papel do usuário
  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: HomeIcon,
      current: location.pathname === '/'
    },
    {
      name: 'Tarefas',
      href: '/tasks',
      icon: ClipboardDocumentListIcon,
      current: location.pathname.startsWith('/tasks')
    },
    {
      name: 'Kanban',
      href: '/tasks/kanban',
      icon: ViewColumnsIcon,
      current: location.pathname === '/tasks/kanban'
    },
    ...(isAdmin() ? [
      {
        name: 'Usuários',
        href: '/users',
        icon: UsersIcon,
        current: location.pathname.startsWith('/users'),
        adminOnly: true
      },
      {
        name: 'Clientes',
        href: '/clients',
        icon: BuildingOfficeIcon,
        current: location.pathname.startsWith('/clients'),
        adminOnly: true
      }
    ] : []),
    {
      name: 'Configurações',
      href: '/settings',
      icon: CogIcon,
      current: location.pathname.startsWith('/settings')
    },
    {
      name: 'Perfil',
      href: '/profile',
      icon: UserCircleIcon,
      current: location.pathname === '/profile'
    }
  ]

  return (
    <>
      {/* Sidebar para desktop */}
      <div className="hidden lg:block fixed inset-y-0 left-0 w-64 z-50">
        <div className="flex flex-col h-full glass-dark border-r border-white/10">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-white">TM</span>
              </div>
              <span className="ml-2 text-white font-semibold">Task Manager</span>
            </div>
          </div>

          {/* User Info */}
          <div className="px-6 py-4 border-b border-white/10">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {user?.profileImage ? (
                  <img
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white/20"
                    src={user.profileImage}
                    alt={user.name}
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-white/60 truncate">
                  {user?.role === 'admin' ? 'Administrador' : 'Operacional'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <item.icon
                  className="flex-shrink-0 w-5 h-5 mr-3"
                  aria-hidden="true"
                />
                {item.name}
                {item.adminOnly && (
                  <span className="ml-auto text-xs bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded-full">
                    Admin
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/10">
            <p className="text-xs text-white/60 text-center">
              Task Manager v1.0
            </p>
          </div>
        </div>
      </div>

      {/* Sidebar para mobile */}
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: isOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="lg:hidden fixed inset-y-0 left-0 w-80 z-50"
      >
        <div className="flex flex-col h-full glass-dark border-r border-white/10">
          {/* Header com botão de fechar */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-white">TM</span>
              </div>
              <span className="ml-2 text-white font-semibold">Task Manager</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* User Info */}
          <div className="px-6 py-4 border-b border-white/10">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {user?.profileImage ? (
                  <img
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-white/20"
                    src={user.profileImage}
                    alt={user.name}
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                    <span className="text-lg font-medium text-white">
                      {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-base font-medium text-white truncate">
                  {user?.name}
                </p>
                <p className="text-sm text-white/60 truncate">
                  {user?.email}
                </p>
                <p className="text-xs text-white/50 truncate">
                  {user?.role === 'admin' ? 'Administrador' : 'Operacional'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center px-4 py-3 text-base font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <item.icon
                  className="flex-shrink-0 w-6 h-6 mr-4"
                  aria-hidden="true"
                />
                {item.name}
                {item.adminOnly && (
                  <span className="ml-auto text-xs bg-blue-500/30 text-blue-200 px-2 py-1 rounded-full">
                    Admin
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/10">
            <p className="text-xs text-white/60 text-center">
              Task Manager v1.0.0
            </p>
          </div>
        </div>
      </motion.div>
    </>
  )
}

export default Sidebar