import React from 'react'
import { motion } from 'framer-motion'
import { 
  ClipboardDocumentListIcon, 
  PlusIcon 
} from '@heroicons/react/24/outline'
import Button from '@/components/ui/Button'

function TaskModelsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <ClipboardDocumentListIcon className="w-8 h-8 mr-3" />
            Modelos de Tarefa
          </h1>
          <p className="text-white/70 mt-1">
            Gerencie modelos e templates para criação rápida de tarefas
          </p>
        </div>

        <Button
          variant="primary"
          icon={<PlusIcon />}
        >
          Novo Modelo
        </Button>
      </div>

      {/* Conteúdo em desenvolvimento */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-12 text-center"
      >
        <ClipboardDocumentListIcon className="w-16 h-16 text-white/20 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">
          Modelos de Tarefa
        </h3>
        <p className="text-white/60 mb-6">
          Esta funcionalidade está em desenvolvimento e estará disponível em breve.
        </p>
        <p className="text-white/40 text-sm">
          Os modelos permitirão criar templates personalizados para diferentes tipos de projetos.
        </p>
      </motion.div>
    </div>
  )
}

export default TaskModelsPage