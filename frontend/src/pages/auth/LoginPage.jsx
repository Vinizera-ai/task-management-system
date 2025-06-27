import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'

function LoginPage() {
  const { login, isLoading, error } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await login(formData)
    } catch (error) {
      console.error('Erro no login:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-aero flex items-center justify-center p-4">
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Card principal */}
        <div className="glass-strong rounded-2xl p-8 shadow-glass-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-16 h-16 bg-gradient-primary rounded-xl mx-auto mb-4 flex items-center justify-center"
            >
              <span className="text-2xl font-bold text-white">TM</span>
            </motion.div>
            
            <h1 className="text-2xl font-bold text-white mb-2">
              Task Manager
            </h1>
            <p className="text-white/80 text-sm">
              Sistema de Gerenciamento de Tarefas
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
                E-mail
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 input-glass rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="Digite seu e-mail"
                autoComplete="email"
              />
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 pr-12 input-glass rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Erro */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-sm text-red-200"
              >
                {error}
              </motion.div>
            )}

            {/* Botão de submit */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full bg-gradient-primary text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting || isLoading ? (
                <>
                  <div className="spinner mr-2"></div>
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </motion.button>
          </form>

          {/* Informações de acesso padrão */}
          <div className="mt-8 pt-6 border-t border-white/20">
            <div className="text-center">
              <p className="text-white/60 text-xs mb-2">Acesso padrão do sistema:</p>
              <div className="glass-subtle rounded-lg p-3 text-xs">
                <p className="text-white/80">
                  <strong>E-mail:</strong> admin@sistema.com
                </p>
                <p className="text-white/80">
                  <strong>Senha:</strong> admin123
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-white/60 text-sm">
            Sistema desenvolvido para agências de marketing
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default LoginPage