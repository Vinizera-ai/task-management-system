import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Button from '@/components/ui/Button'
import { HomeIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline'

function UnauthorizedPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-aero flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="glass-strong rounded-2xl p-12 max-w-md mx-auto">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-6"
          >
            <ShieldExclamationIcon className="w-24 h-24 text-white/20 mx-auto mb-4" />
            <h1 className="text-6xl font-bold text-white mb-2">403</h1>
            <h2 className="text-xl font-semibold text-white mb-4">
              Acesso Negado
            </h2>
            <p className="text-white/70 mb-8">
              Você não tem permissão para acessar esta página. Entre em contato com o administrador se acredita que isto é um erro.
            </p>
          </motion.div>

          <div className="space-y-3">
            <Button
              variant="primary"
              icon={<HomeIcon />}
              onClick={() => navigate('/')}
              fullWidth
            >
              Voltar ao Dashboard
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              fullWidth
            >
              Voltar à página anterior
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default UnauthorizedPage