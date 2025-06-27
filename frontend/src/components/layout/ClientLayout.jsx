import React from 'react'
import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'

function ClientLayout() {
  return (
    <div className="min-h-screen bg-gradient-aero">
      {/* Header para clientes */}
      <header className="glass-dark border-b border-white/10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-white">TM</span>
              </div>
              <span className="ml-2 text-white font-semibold">Task Manager</span>
            </div>
            
            <div className="text-white/60 text-sm">
              Portal do Cliente
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="px-4 sm:px-6 lg:px-8 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/10 glass-dark">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <p className="text-white/60 text-sm">
              Sistema de Gerenciamento de Tarefas - Portal do Cliente
            </p>
            <p className="text-white/40 text-xs mt-1">
              Desenvolvido para agências de marketing
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default ClientLayout