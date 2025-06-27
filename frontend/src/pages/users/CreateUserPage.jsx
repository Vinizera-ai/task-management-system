import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { usersService } from '@/services/usersService'
import { uploadService } from '@/services/uploadService'

import Loading from '@/components/ui/Loading'
import Button from '@/components/ui/Button'
import FileUpload from '@/components/ui/FileUpload'

import {
  ArrowLeftIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'

import toast from 'react-hot-toast'

function CreateUserPage() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const [showPassword, setShowPassword] = useState(false)
  const [profileImage, setProfileImage] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      position: '',
      role: 'operational',
      status: 'active'
    }
  })

  const password = watch('password')

  // Mutation para criar usuário
  const createUserMutation = useMutation(
    (userData) => usersService.createUser(userData),
    {
      onSuccess: (data) => {
        toast.success('Usuário criado com sucesso!')
        queryClient.invalidateQueries('users')
        queryClient.invalidateQueries('user-stats')
        navigate(`/users/${data.data._id}`)
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Erro ao criar usuário')
      }
    }
  )

  // Mutation para upload de imagem
  const uploadImageMutation = useMutation(
    (file) => uploadService.uploadProfileImage(file),
    {
      onSuccess: (data) => {
        setProfileImage(data.data.file.url)
        setUploadingImage(false)
        toast.success('Imagem carregada com sucesso!')
      },
      onError: (error) => {
        setUploadingImage(false)
        toast.error(error.response?.data?.error || 'Erro ao carregar imagem')
      }
    }
  )

  const onSubmit = async (data) => {
    try {
      const userData = {
        ...data,
        profileImage
      }
      
      delete userData.confirmPassword
      
      await createUserMutation.mutateAsync(userData)
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
    }
  }

  const handleImageUpload = async (files) => {
    if (files.length > 0) {
      setUploadingImage(true)
      await uploadImageMutation.mutateAsync(files[0])
    }
  }

  const removeImage = () => {
    setProfileImage(null)
  }

  if (!isAdmin()) {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <ShieldCheckIcon className="w-16 h-16 text-white/20 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">
          Acesso Restrito
        </h3>
        <p className="text-white/60 mb-6">
          Apenas administradores podem criar usuários.
        </p>
        <Button onClick={() => navigate('/users')}>
          Voltar para Usuários
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          icon={<ArrowLeftIcon />}
          onClick={() => navigate('/users')}
        >
          Voltar
        </Button>
        
        <div>
          <h1 className="text-2xl font-bold text-white">Novo Usuário</h1>
          <p className="text-white/70">
            Adicione um novo usuário ao sistema
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informações Pessoais */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-xl p-6"
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <UserIcon className="w-5 h-5 mr-2" />
                Informações Pessoais
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome completo */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    {...register('name', {
                      required: 'Nome é obrigatório',
                      minLength: {
                        value: 2,
                        message: 'Nome deve ter pelo menos 2 caracteres'
                      },
                      maxLength: {
                        value: 100,
                        message: 'Nome não pode ter mais que 100 caracteres'
                      }
                    })}
                    type="text"
                    className="w-full input-glass rounded-lg text-white placeholder-white/40"
                    placeholder="Ex: João Silva Santos"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    E-mail *
                  </label>
                  <input
                    {...register('email', {
                      required: 'E-mail é obrigatório',
                      pattern: {
                        value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                        message: 'E-mail inválido'
                      }
                    })}
                    type="email"
                    className="w-full input-glass rounded-lg text-white placeholder-white/40"
                    placeholder="joao@empresa.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
                  )}
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Telefone *
                  </label>
                  <input
                    {...register('phone', {
                      required: 'Telefone é obrigatório'
                    })}
                    type="tel"
                    className="w-full input-glass rounded-lg text-white placeholder-white/40"
                    placeholder="(11) 99999-9999"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-400">{errors.phone.message}</p>
                  )}
                </div>

                {/* Cargo */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Cargo *
                  </label>
                  <input
                    {...register('position', {
                      required: 'Cargo é obrigatório'
                    })}
                    type="text"
                    className="w-full input-glass rounded-lg text-white placeholder-white/40"
                    placeholder="Ex: Designer Gráfico, Social Media, Gerente de Projetos"
                  />
                  {errors.position && (
                    <p className="mt-1 text-sm text-red-400">{errors.position.message}</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Senha */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card rounded-xl p-6"
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <ShieldCheckIcon className="w-5 h-5 mr-2" />
                Credenciais de Acesso
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Senha */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Senha *
                  </label>
                  <div className="relative">
                    <input
                      {...register('password', {
                        required: 'Senha é obrigatória',
                        minLength: {
                          value: 6,
                          message: 'Senha deve ter pelo menos 6 caracteres'
                        }
                      })}
                      type={showPassword ? 'text' : 'password'}
                      className="w-full pr-12 input-glass rounded-lg text-white placeholder-white/40"
                      placeholder="••••••••"
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

                {/* Confirmar senha */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Confirmar Senha *
                  </label>
                  <input
                    {...register('confirmPassword', {
                      required: 'Confirmação de senha é obrigatória',
                      validate: (value) =>
                        value === password || 'As senhas não coincidem'
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className="w-full input-glass rounded-lg text-white placeholder-white/40"
                    placeholder="••••••••"
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Foto de Perfil */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <PhotoIcon className="w-5 h-5 mr-2" />
                Foto de Perfil
              </h3>

              {profileImage ? (
                <div className="text-center">
                  <img
                    src={profileImage}
                    alt="Preview"
                    className="w-32 h-32 mx-auto rounded-full object-cover ring-4 ring-white/20 mb-4"
                  />
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={removeImage}
                  >
                    Remover Foto
                  </Button>
                </div>
              ) : (
                <div>
                  {uploadingImage ? (
                    <div className="text-center py-8">
                      <Loading size="lg" text="Carregando imagem..." />
                    </div>
                  ) : (
                    <FileUpload
                      onFileSelect={handleImageUpload}
                      selectedFiles={[]}
                      accept="image/*"
                      maxFiles={1}
                      maxSize={5 * 1024 * 1024} // 5MB
                      className="border-dashed border-2 border-white/30 rounded-lg p-6 text-center hover:border-white/50 transition-colors"
                    />
                  )}
                </div>
              )}
            </motion.div>

            {/* Configurações */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <BriefcaseIcon className="w-5 h-5 mr-2" />
                Configurações
              </h3>

              <div className="space-y-4">
                {/* Papel */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Papel no Sistema
                  </label>
                  <select
                    {...register('role')}
                    className="w-full input-glass rounded-lg text-white bg-transparent"
                  >
                    <option value="operational">Operacional</option>
                    <option value="admin">Administrador</option>
                  </select>
                  <p className="mt-1 text-xs text-white/60">
                    Admins têm acesso total ao sistema
                  </p>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Status
                  </label>
                  <select
                    {...register('status')}
                    className="w-full input-glass rounded-lg text-white bg-transparent"
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
              </div>
            </motion.div>

            {/* Ações */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={createUserMutation.isLoading}
                disabled={createUserMutation.isLoading}
              >
                Criar Usuário
              </Button>

              <Button
                type="button"
                variant="ghost"
                fullWidth
                onClick={() => navigate('/users')}
                disabled={createUserMutation.isLoading}
              >
                Cancelar
              </Button>
            </motion.div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default CreateUserPage