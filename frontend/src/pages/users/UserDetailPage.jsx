import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from 'react-query'
import { usersService } from '@/services/usersService'
import { useAuth } from '@/hooks/useAuth'
import Loading from '@/components/ui/Loading'
import Button from '@/components/ui/Button'
import {
  ArrowLeftIcon,
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  BriefcaseIcon,
  CalendarIcon,
  PencilIcon
} from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function UserDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: currentUser, isAdmin } = useAuth()

  // Query para buscar usuário
  const { data: userData, isLoading, error } = useQuery(
    ['user', id],
    () => usersService.getUser(id),
    {
      enabled: !!id
    }
  )

  const user = userData?.data

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

  const getStatusColor = (status) => {
    return status === 'active' 
      ? 'text-green-400 bg-green-500/20'
      : 'text-red-400 bg-red-500/20'
  }

  const getStatusText = (status) => {
    return status === 'active' ? 'Ativo' : 'Inativo'
  }

  const getRoleColor = (role) => {
    return role === 'admin' 
      ? 'text-purple-400 bg-purple-500/20'
      : 'text-blue-400 bg-blue-500/20'
  }

  const getRoleText = (role) => {
    return role === 'admin' ? 'Administrador' : 'Operacional'
  }

  // Verificar se pode editar (admin ou próprio usuário)
  const canEdit = isAdmin() || currentUser.id === id

  if (isLoading) {
    return <Loading text="Carregando usuário..." />
  }

  if (error || !user) {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <p className="text-red-400 mb-4">Erro ao carregar usuário</p>
        <Button onClick={() => navigate('/users')}>
          Voltar para Usuários
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            icon={<ArrowLeftIcon />}
            onClick={() => navigate('/users')}
          >
            Voltar
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold text-white">
              Perfil do Usuário
            </h1>
            <p className="text-white/70">
              Informações detalhadas do usuário
            </p>
          </div>
        </div>

        {canEdit && (
          <Button
            variant="primary"
            icon={<PencilIcon />}
            onClick={() => navigate(`/users/${id}/edit`)}
          >
            Editar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Foto e informações básicas */}
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
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">{user.name}</h2>
              <p className="text-white/60">{user.position}</p>
              
              <div className="flex items-center justify-center space-x-2 mt-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                  {getStatusText(user.status)}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                  {getRoleText(user.role)}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Informações detalhadas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Dados de contato */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Informações de Contato
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  E-mail
                </label>
                <div className="flex items-center space-x-2 text-white/80">
                  <EnvelopeIcon className="w-5 h-5" />
                  <span>{user.email}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Telefone
                </label>
                <div className="flex items-center space-x-2 text-white/80">
                  <PhoneIcon className="w-5 h-5" />
                  <span>{user.phone}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Cargo
                </label>
                <div className="flex items-center space-x-2 text-white/80">
                  <BriefcaseIcon className="w-5 h-5" />
                  <span>{user.position}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Papel no Sistema
                </label>
                <div className="flex items-center space-x-2 text-white/80">
                  <UserCircleIcon className="w-5 h-5" />
                  <span>{getRoleText(user.role)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Informações da conta */}
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
                  <CalendarIcon className="w-5 h-5" />
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

          {/* Estatísticas */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Estatísticas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">0</p>
                <p className="text-white/60 text-sm">Tarefas Ativas</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-white">0</p>
                <p className="text-white/60 text-sm">Tarefas Concluídas</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-white">0</p>
                <p className="text-white/60 text-sm">Projetos</p>
              </div>
            </div>
            
            <div className="text-xs text-white/50 text-center mt-4">
              Estatísticas serão implementadas em breve
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default UserDetailPage