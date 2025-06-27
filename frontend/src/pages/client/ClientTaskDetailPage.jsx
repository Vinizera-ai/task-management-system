import React from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline'

function ClientTaskDetailPage() {
  const { taskId } = useParams()

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-8 text-center"
      >
        <ClipboardDocumentListIcon className="w-16 h-16 text-white/20 mx-auto mb-4" />
        <h1 className="text-xl font-medium text-white mb-2">
          Detalhes da Tarefa
        </h1>
        <p className="text-white/60 mb-4">
          ID da Tarefa: {taskId}
        </p>
        <div className="text-sm text-white/50">
          Portal do cliente em desenvolvimento
        </div>
      </motion.div>
    </div>
  )
}

export default ClientTaskDetailPage