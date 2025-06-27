import React, { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { usersService } from '@/services/usersService'
import { authService } from '@/services/authService'
import { uploadService } from '@/services/uploadService'

import Loading from '@/components/ui/Loading'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import FileUpload from '@/components/ui/FileUpload'

import {
  UserCircleIcon,
  PencilIcon,
  KeyIcon,
  PhotoIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  BriefcaseIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'

import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function ProfilePage() {
  const { user, updateUser } = useAuth()
  const queryClient = useQueryClient()

  const [isEditing, setIsEditing] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showPasswordFields, setShowPasswordFields] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Form para dados do perfil
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      position: user?.position || ''
    }
  })

  // Form para mudança de senha
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
    watch
  } = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  })

  const newPassword = watch('newPassword')

  // Mutation para atualizar perfil
  const updateProfileMutation = useMutation(
    (userData) => usersService.updateUser(user.id, userData),
    {
      onSuccess: (data) => {
        toast.success('Perfil atualizado com sucesso!')
        updateUser(data.data)
        setIsEditing(false)
        queryClient.invalidateQueries(['user', user.id])
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Erro ao atualizar perfil')
      }
    }
  )

  // Mutation para alterar senha
  const changePasswordMutation = useMutation(
    (passwords) => authService.changePassword(passwords),
    {
      onSuccess: () => {
        toast.success('Senha alterada com sucesso!')
        setShowChangePassword(false)
        resetPassword()
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Erro ao alterar senha')
      }
    }
  )

  // Mutation para upload de imagem
  const uploadImageMutation = useMutation(
    (file) => uploadService.uploadProfileImage(file),
    {
      onSuccess: (data) => {
        const newImageUrl = data.data.file.url
        updateUser({ profileImage: newImageUrl })
        setUploadingImage(false)
        toast.success('Foto de perfil atualizada!')
      },
      onError: (error) => {
        setUploadingImage(false)
        toast.error(error.response?.data?.error || 'Erro ao carregar imagem')
      }
    }
  )

  const onSubmitProfile = async (data) => {
    await updateProfileMutation.mutateAsync(data)
  }

  const onSubmitPassword = async (data) => {
    await changePasswordMutation.mutateAsync({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword
    })
  }

  const handleImageUpload = async (files) => {
    if (files.length > 0) {
      setUploadingImage(true)
      await uploadImageMutation.mutateAsync(files[0])
    }
  }

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancelar edição - resetar form
      reset({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        position: user?.position || ''
      })
    }
    setIsEditing(!isEditing)
  }

  const formatLastLogin = (date) => {
    if (!date) return 'Nunca'
    
    try {
      return formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: ptBR
      })
    } catch (error) {
      return 'Data inválida'
    }
  }

  if (!user) {
    return <Loading text="Carregando perfil..." />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <UserCircleIcon className="w-8 h-8 mr-3" />
            Meu Perfil
          </h1>
          <p className="text-white/70 mt-1">
            Gerencie suas informações pessoais e configurações
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            icon={<KeyIcon />}
            onClick={() => setShowChangePassword(true)}
          >
            Alterar Senha
          </Button>
          
          <Button
            variant={isEditing ? 'ghost' : 'primary'}
            icon={<PencilIcon />}
            onClick={handleEditToggle}
            disabled={updateProfileMutation.isLoading}
          >
            {isEditing ? 'Cancelar' : 'Editar Perfil'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Foto de Perfil */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-6 text-center"
        >
          <div className="space-y-4">
            <div className="relative inline-block">
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.name}
                  className="w-32 h-32 mx-auto rounded-full object-cover ring-4 ring-white/20"
                />
              ) : (
                <div className="w-32 h-32 mx-auto bg-gradient-primary rounded-full flex items-center justify-center ring-4 ring-white/20">
                  <span className="text-4xl font-bold text-white">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                </div>
              )}
              
              {uploadingImage && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <Loading size="sm" />
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">{user.name}</h2>
              <p className="text-white/60">{user.position}</p>
              <p className="text-white/40 text-sm">
                {user.role === 'admin' ? 'Administrador' : 'Operacional'}
              </p>
            </div>

            {!uploadingImage && (
              <FileUpload
                onFileSelect={handleImageUpload}
                selectedFiles={[]}
                accept="image/*"
                maxFiles={1}
                maxSize={5 * 1024 * 1024} // 5MB
                className="border-dashed border-2 border-white/30 rounded-lg p-4"
              />
            )}
          </div>
        </motion.div>

        {/* Informações do Perfil */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Dados Pessoais */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">
                Dados Pessoais
              </h3>
              {isEditing && (
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={updateProfileMutation.isLoading}
                  onClick={handleSubmit(onSubmitProfile)}
                >
                  Salvar Alterações
                </Button>
              )}
            </div>

            <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Nome Completo
                  </label>
                  {isEditing ? (
                    <input
                      {...register('name', {
                        required: 'Nome é obrigatório',
                        minLength: {
                          value: 2,
                          message: 'Nome deve ter pelo menos 2 caracteres'
                        }
                      })}
                      type="text"
                      className="w-full input-glass rounded-lg text-white placeholder-white/40"
                    />
                  ) : (
                    <div className="flex items-center space-x-2 text-white/80">
                      <UserCircleIcon className="w-5 h-5" />
                      <span>{user.name}</span>
                    </div>
                  )}
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    E-mail
                  </label>
                  {isEditing ? (
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
                    />
                  ) : (
                    <div className="flex items-center space-x-2 text-white/80">
                      <EnvelopeIcon className="w-5 h-5" />
                      <span>{user.email}</span>
                    </div>
                  )}
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
                  )}
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Telefone
                  </label>
                  {isEditing ? (
                    <input
                      {...register('phone', {
                        required: 'Telefone é obrigatório'
                      })}
                      type="tel"
                      className="w-full input-glass rounded-lg text-white placeholder-white/40"
                    />
                  ) : (
                    <div className="flex items-center space-x-2 text-white/80">
                      <PhoneIcon className="w-5 h-5" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-400">{errors.phone.message}</p>
                  )}
                </div>

                {/* Cargo */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Cargo
                  </label>
                  {isEditing ? (
                    <input
                      {...register('position', {
                        required: 'Cargo é obrigatório'
                      })}
                      type="text"
                      className="w-full input-glass rounded-lg text-white placeholder-white/40"
                    />
                  ) : (
                    <div className="flex items-center space-x-2 text-white/80">
                      <BriefcaseIcon className="w-5 h-5" />
                      <span>{user.position}</span>
                    </div>
                  )}
                  {errors.position && (
                    <p className="mt-1 text-sm text-red-400">{errors.position.message}</p>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Informações da Conta */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Informações da Conta
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Último Acesso
                </label>
                <div className="flex items-center space-x-2 text-white/80">
                  <CalendarIcon className="w-5 h-5" />
                  <span>{formatLastLogin(user.lastLogin)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Membro desde
                </label>
                <div className="flex items-center space-x-2 text-white/80">
                  <CheckCircleIcon className="w-5 h-5" />
                  <span>
                    {new Date(user.createdAt).toLocaleDateString('pt-BR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modal de Alterar Senha */}
      <Modal
        isOpen={showChangePassword}
        onClose={() => {
          setShowChangePassword(false)
          resetPassword()
          setShowPasswordFields(false)
        }}
        title="Alterar Senha"
        size="md"
      >
        <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
          {/* Senha atual */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Senha Atual *
            </label>
            <div className="relative">
              <input
                {...registerPassword('currentPassword', {
                  required: 'Senha atual é obrigatória'
                })}
                type={showPasswordFields ? 'text' : 'password'}
                className="w-full pr-12 input-glass rounded-lg text-white placeholder-white/40"
                placeholder="Digite sua senha atual"
              />
              <button
                type="button"
                onClick={() => setShowPasswordFields(!showPasswordFields)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
              >
                {showPasswordFields ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            {passwordErrors.currentPassword && (
              <p className="mt-1 text-sm text-red-400">
                {passwordErrors.currentPassword.message}
              </p>
            )}
          </div>

          {/* Nova senha */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Nova Senha *
            </label>
            <input
              {...registerPassword('newPassword', {
                required: 'Nova senha é obrigatória',
                minLength: {
                  value: 6,
                  message: 'Senha deve ter pelo menos 6 caracteres'
                }
              })}
              type={showPasswordFields ? 'text' : 'password'}
              className="w-full input-glass rounded-lg text-white placeholder-white/40"
              placeholder="Digite a nova senha"
            />
            {passwordErrors.newPassword && (
              <p className="mt-1 text-sm text-red-400">
                {passwordErrors.newPassword.message}
              </p>
            )}
          </div>

          {/* Confirmar nova senha */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Confirmar Nova Senha *
            </label>
            <input
              {...registerPassword('confirmPassword', {
                required: 'Confirmação de senha é obrigatória',
                validate: (value) =>
                  value === newPassword || 'As senhas não coincidem'
              })}
              type={showPasswordFields ? 'text' : 'password'}
              className="w-full input-glass rounded-lg text-white placeholder-white/40"
              placeholder="Confirme a nova senha"
            />
            {passwordErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-400">
                {passwordErrors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="flex space-x-3 justify-end pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowChangePassword(false)
                resetPassword()
                setShowPasswordFields(false)
              }}
              disabled={changePasswordMutation.isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={changePasswordMutation.isLoading}
            >
              Alterar Senha
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default ProfilePage