import React from 'react'
import { motion } from 'framer-motion'
import { ClipboardDocumentListIcon, EyeIcon } from '@heroicons/react/24/outline'

function ClientDashboardPage() {
  // Dados do cliente do sessionStorage
  const clientData = JSON.parse(sessionStorage.getItem('clientData') || '{}')

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-white mb-2">
          Bem-vindo, {clientData.companyName}!
        </h1>
        <p className="text-white/70">
          Acompanhe o progresso dos seus projetos
        </p>
      </motion.div>

      {/* Informações do Cliente */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-xl p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">
          Informações da Conta
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-white/60 text-sm">Empresa</p>
            <p className="text-white font-medium">{clientData.companyName}</p>
          </div>
          <div>
            <p className="text-white/60 text-sm">Responsável</p>
            <p className="text-white font-medium">{clientData.responsibleName}</p>
          </div>
        </div>
      </motion.div>

      {/* Tarefas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-xl p-8 text-center"
      >
        <ClipboardDocumentListIcon className="w-16 h-16 text-white/20 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">
          Suas Tarefas
        </h3>
        <p className="text-white/60 mb-6">
          Suas tarefas e projetos aparecerão aqui
        </p>
        <div className="text-sm text-white/50">
          Portal do cliente em desenvolvimento
        </div>
      </motion.div>
    </div>
  )
}

export default ClientDashboardPage