import React from 'react'
import { motion } from 'framer-motion'
import { 
  WrenchScrewdriverIcon, 
  PlusIcon 
} from '@heroicons/react/24/outline'
import Button from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

function WorkflowsPage() {
  const { isAdmin } = useAuth()

  if (!isAdmin()) {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <WrenchScrewdriverIcon className="w-16 h-16 text-white/20 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">
          Acesso Restrito
        </h3>
        <p className="text-white/60 mb-6">
          Apenas administradores podem gerenciar fluxos de trabalho.
        </p>
        <Button onClick={() => navigate('/')}>
          Voltar ao Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <WrenchScrewdriverIcon className="w-8 h-8 mr-3" />
            Fluxos de Trabalho
          </h1>
          <p className="text-white/70 mt-1">
            Configure e gerencie fluxos e etapas de trabalho
          </p>
        </div>

        <Button
          variant="primary"
          icon={<PlusIcon />}
        >
          Novo Fluxo
        </Button>
      </div>

      {/* Conteúdo em desenvolvimento */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-12 text-center"
      >
        <WrenchScrewdriverIcon className="w-16 h-16 text-white/20 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">
          Fluxos de Trabalho
        </h3>
        <p className="text-white/60 mb-6">
          Esta funcionalidade está em desenvolvimento e estará disponível em breve.
        </p>
        <p className="text-white/40 text-sm">
          Os fluxos permitirão criar etapas personalizadas para diferentes tipos de projetos.
        </p>
      </motion.div>
    </div>
  )
}

export default WorkflowsPage