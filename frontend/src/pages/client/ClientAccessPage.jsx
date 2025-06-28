import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { clientsService } from '@/services/clientsService'
import Button from '@/components/ui/Button'
import {
  BuildingOfficeIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

function ClientAccessPage() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      clientId: clientId || '',
      password: ''
    }
  })

  const onSubmit = async (data) => {
    setIsLoading(true)
    
    try {
      const response = await clientsService.clientAccess(data)
      
      if (response.success) {
        // Salvar dados do cliente no sessionStorage
        sessionStorage.setItem('clientData', JSON.stringify(response.data))
        
        toast.success(`Bem-vindo, ${response.data.companyName}!`)
        navigate(`/client/${data.clientId}/dashboard`)
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao fazer login')
    } finally {
      setIsLoading(false)
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
              <BuildingOfficeIcon className="w-8 h-8 text-white" />
            </motion.div>
            
            <h1 className="text-2xl font-bold text-white mb-2">
              Acesso do Cliente
            </h1>
            <p className="text-white/80 text-sm">
              Entre com suas credenciais para acessar seus projetos
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* ID do Cliente */}
            <div>
              <label htmlFor="clientId" className="block text-sm font-medium text-white/90 mb-2">
                ID do Cliente
              </label>
              <input
                {...register('clientId', {
                  required: 'ID do cliente é obrigatório'
                })}
                type="text"
                className="w-full px-4 py-3 input-glass rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="Digite seu ID"
                autoComplete="username"
              />
              {errors.clientId && (
                <p className="mt-1 text-sm text-red-400">{errors.clientId.message}</p>
              )}
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
                Senha de Acesso
              </label>
              <div className="relative">
                <input
                  {...register('password', {
                    required: 'Senha é obrigatória'
                  })}
                  type={showPassword ? 'text' : 'password'}
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
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Botão de submit */}
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={isLoading}
              disabled={isLoading}
            >
              Acessar Projetos
            </Button>
          </form>

          {/* Informações de contato */}
          <div className="mt-8 pt-6 border-t border-white/20 text-center">
            <p className="text-white/60 text-xs">
              Não possui acesso? Entre em contato com nossa equipe
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default ClientAccessPage