import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/ui/Button'
import {
  CogIcon,
  UsersIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  WrenchScrewdriverIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

function SettingsPage() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()

  const settingsItems = [
    {
      name: 'Fluxos de Trabalho',
      description: 'Configure fluxos e etapas de trabalho',
      icon: WrenchScrewdriverIcon,
      href: '/settings/workflows',
      adminOnly: true,
      color: 'bg-blue-500/20 text-blue-400'
    },
    {
      name: 'Modelos de Tarefa',
      description: 'Gerencie modelos e templates de tarefas',
      icon: ClipboardDocumentListIcon,
      href: '/settings/task-models',
      adminOnly: false,
      color: 'bg-green-500/20 text-green-400'
    },
    {
      name: 'Usuários',
      description: 'Adicione e gerencie usuários do sistema',
      icon: UsersIcon,
      href: '/users',
      adminOnly: true,
      color: 'bg-purple-500/20 text-purple-400'
    },
    {
      name: 'Clientes',
      description: 'Configure clientes e acessos',
      icon: BuildingOfficeIcon,
      href: '/clients',
      adminOnly: true,
      color: 'bg-orange-500/20 text-orange-400'
    }
  ]

  // Filtrar itens baseado nas permissões
  const availableItems = settingsItems.filter(item => 
    !item.adminOnly || isAdmin()
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center">
          <CogIcon className="w-8 h-8 mr-3" />
          Configurações
        </h1>
        <p className="text-white/70 mt-1">
          Configure e personalize o sistema conforme suas necessidades
        </p>
      </div>

      {/* Grid de configurações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {availableItems.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="glass-card rounded-xl p-6 hover:bg-white/5 transition-all duration-200 cursor-pointer group"
            onClick={() => navigate(item.href)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${item.color}`}>
                  <item.icon className="w-6 h-6" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-white/60 text-sm mt-1">
                    {item.description}
                  </p>
                  
                  {item.adminOnly && (
                    <span className="inline-block mt-2 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                      Apenas Admins
                    </span>
                  )}
                </div>
              </div>
              
              <ChevronRightIcon className="w-5 h-5 text-white/40 group-hover:text-white/60 transition-colors" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Informações adicionais */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">
          Informações do Sistema
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-white/60">Versão</p>
            <p className="text-white font-medium">1.0.0</p>
          </div>
          
          <div>
            <p className="text-white/60">Ambiente</p>
            <p className="text-white font-medium">
              {import.meta.env.DEV ? 'Desenvolvimento' : 'Produção'}
            </p>
          </div>
          
          <div>
            <p className="text-white/60">Última Atualização</p>
            <p className="text-white font-medium">
              {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Configurações pessoais */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">
          Configurações Pessoais
        </h3>
        
        <div className="space-y-3">
          <Button
            variant="secondary"
            onClick={() => navigate('/profile')}
            className="w-full justify-between"
          >
            <span>Editar Perfil</span>
            <ChevronRightIcon className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

export default SettingsPage