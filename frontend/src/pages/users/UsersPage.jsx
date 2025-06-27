import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { usersService } from '@/services/usersService'

import Loading, { CardSkeleton } from '@/components/ui/Loading'
import Button from '@/components/ui/Button'
import Modal, { ConfirmModal } from '@/components/ui/Modal'

import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UsersIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ShieldCheckIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon
} from '@heroicons/react/24/outline'

import toast from 'react-hot-toast'

function UsersPage() {
  const { user: currentUser, isAdmin } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  // Estados locais
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || 'all',
    role: searchParams.get('role') || 'all'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1)
  const [userToDelete, setUserToDelete] = useState(null)

  // Query para buscar usuários
  const { 
    data: usersData, 
    isLoading, 
    error,
    refetch 
  } = useQuery(
    ['users', { ...filters, search: searchQuery, page }],
    () => usersService.getUsers({
      ...filters,
      search: searchQuery,
      page,
      limit: 12
    }),
    {
      keepPreviousData: true,
      staleTime: 30000
    }
  )

  // Query para estatísticas
  const { data: statsData } = useQuery(
    'user-stats',
    usersService.getUserStats,
    { staleTime: 60000 }
  )

  // Mutation para excluir usuário
  const deleteUserMutation = useMutation(
    (userId) => usersService.deleteUser(userId),
    {
      onSuccess: () => {
        toast.success('Usuário removido com sucesso!')
        queryClient.invalidateQueries('users')
        queryClient.invalidateQueries('user-stats')
        setUserToDelete(null)
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Erro ao remover usuário')
      }
    }
  )

  const users = usersData?.data || []
  const pagination = usersData?.pagination
  const stats = statsData?.data

  // Sincronizar filtros com URL
  useEffect(() => {
    const params = new URLSearchParams()
    
    if (searchQuery) params.set('search', searchQuery)
    if (filters.status !== 'all') params.set('status', filters.status)
    if (filters.role !== 'all') params.set('role', filters.role)
    if (page > 1) params.set('page', page.toString())

    setSearchParams(params)
  }, [searchQuery, filters, page, setSearchParams])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    refetch()
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const clearFilters = () => {
    setFilters({
      status: 'all',
      role: 'all'
    })
    setSearchQuery('')
    setPage(1)
  }

  const handleDeleteUser = async () => {
    if (userToDelete) {
      await deleteUserMutation.mutateAsync(userToDelete._id)
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'text-purple-400 bg-purple-500/20'
      case 'operational':
        return 'text-blue-400 bg-blue-500/20'
      default:
        return 'text-gray-400 bg-gray-500/20'
    }
  }

  const getRoleText = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrador'
      case 'operational':
        return 'Operacional'
      default:
        return 'Desconhecido'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-400 bg-green-500/20'
      case 'inactive':
        return 'text-red-400 bg-red-500/20'
      default:
        return 'text-gray-400 bg-gray-500/20'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Ativo'
      case 'inactive':
        return 'Inativo'
      default:
        return 'Desconhecido'
    }
  }

  if (!isAdmin()) {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <ShieldCheckIcon className="w-16 h-16 text-white/20 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">
          Acesso Restrito
        </h3>
        <p className="text-white/60 mb-6">
          Apenas administradores podem acessar o gerenciamento de usuários.
        </p>
        <Button onClick={() => navigate('/')}>
          Voltar ao Dashboard
        </Button>
      </div>
    )
  }

  if (isLoading && !users.length) {
    return <CardSkeleton count={6} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <UsersIcon className="w-8 h-8 mr-3" />
            Usuários
          </h1>
          <p className="text-white/70 mt-1">
            Gerencie usuários do sistema
          </p>
        </div>

        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button
            variant="secondary"
            icon={<FunnelIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filtros
          </Button>
          
          <Button
            variant="primary"
            icon={<PlusIcon />}
            onClick={() => navigate('/users/create')}
          >
            Novo Usuário
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <UsersIcon className="w-6 h-6 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-white/60 text-sm">Total</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <UserIcon className="w-6 h-6 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-white/60 text-sm">Ativos</p>
                <p className="text-2xl font-bold text-white">{stats.totalActive}</p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <ShieldCheckIcon className="w-6 h-6 text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-white/60 text-sm">Admins</p>
                <p className="text-2xl font-bold text-white">{stats.totalAdmins}</p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <UserIcon className="w-6 h-6 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-white/60 text-sm">Operacionais</p>
                <p className="text-2xl font-bold text-white">{stats.totalOperational}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Busca e Filtros */}
      <div className="glass-card rounded-xl p-6">
        {/* Busca */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar usuários por nome, email ou cargo..."
              className="w-full pl-10 pr-4 py-3 input-glass rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </form>

        {/* Filtros */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-white/10 pt-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full input-glass rounded-lg text-white bg-transparent"
                  >
                    <option value="all">Todos</option>
                    <option value="active">Ativos</option>
                    <option value="inactive">Inativos</option>
                  </select>
                </div>

                {/* Papel */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Papel
                  </label>
                  <select
                    value={filters.role}
                    onChange={(e) => handleFilterChange('role', e.target.value)}
                    className="w-full input-glass rounded-lg text-white bg-transparent"
                  >
                    <option value="all">Todos</option>
                    <option value="admin">Administradores</option>
                    <option value="operational">Operacionais</option>
                  </select>
                </div>

                {/* Ações */}
                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="w-full"
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Lista de usuários */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <CardSkeleton count={6} />
        ) : users.length === 0 ? (
          <div className="col-span-full">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card rounded-xl p-12 text-center"
            >
              <UsersIcon className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                Nenhum usuário encontrado
              </h3>
              <p className="text-white/60 mb-6">
                {searchQuery || Object.values(filters).some(v => v !== 'all') 
                  ? 'Tente ajustar os filtros ou termo de busca'
                  : 'Que tal criar o primeiro usuário?'
                }
              </p>
              {!searchQuery && !Object.values(filters).some(v => v !== 'all') && (
                <Button
                  variant="primary"
                  icon={<PlusIcon />}
                  onClick={() => navigate('/users/create')}
                >
                  Criar Usuário
                </Button>
              )}
            </motion.div>
          </div>
        ) : (
          users.map((user, index) => (
            <motion.div
              key={user._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="glass-card rounded-xl p-6 hover:bg-white/5 transition-all duration-200"
            >
              {/* Header do usuário */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {user.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-white/20"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                      <span className="text-lg font-medium text-white">
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white truncate">
                      {user.name}
                    </h3>
                    <p className="text-white/60 text-sm truncate">
                      {user.position}
                    </p>
                  </div>
                </div>

                {/* Status e papel */}
                <div className="flex flex-col items-end space-y-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                    {getStatusText(user.status)}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                    {getRoleText(user.role)}
                  </span>
                </div>
              </div>

              {/* Informações de contato */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-white/70">
                  <EnvelopeIcon className="w-4 h-4" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-white/70">
                  <PhoneIcon className="w-4 h-4" />
                  <span>{user.phone}</span>
                </div>
              </div>

              {/* Último login */}
              {user.lastLogin && (
                <div className="text-xs text-white/50 mb-4">
                  Último acesso: {new Date(user.lastLogin).toLocaleDateString('pt-BR')}
                </div>
              )}

              {/* Ações */}
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<EyeIcon />}
                  onClick={() => navigate(`/users/${user._id}`)}
                  className="flex-1"
                >
                  Ver
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<PencilIcon />}
                  onClick={() => navigate(`/users/${user._id}/edit`)}
                  className="flex-1"
                >
                  Editar
                </Button>
                {user._id !== currentUser.id && (
                  <Button
                    variant="danger"
                    size="sm"
                    icon={<TrashIcon />}
                    onClick={() => setUserToDelete(user)}
                  >
                    Excluir
                  </Button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Paginação */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-white/60">
            Mostrando {(page - 1) * pagination.limit + 1} a{' '}
            {Math.min(page * pagination.limit, pagination.total)} de{' '}
            {pagination.total} usuários
          </div>

          <div className="flex space-x-2">
            <Button
              variant="ghost"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Anterior
            </Button>
            
            {[...Array(pagination.pages)].map((_, index) => (
              <Button
                key={index + 1}
                variant={page === index + 1 ? 'primary' : 'ghost'}
                onClick={() => setPage(index + 1)}
              >
                {index + 1}
              </Button>
            ))}
            
            <Button
              variant="ghost"
              disabled={page >= pagination.pages}
              onClick={() => setPage(page + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      <ConfirmModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteUser}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja remover o usuário "${userToDelete?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Remover"
        type="danger"
        loading={deleteUserMutation.isLoading}
      />
    </div>
  )
}

export default UsersPage