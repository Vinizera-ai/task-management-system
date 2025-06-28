import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { clientsService } from '@/services/clientsService'

import Loading, { CardSkeleton } from '@/components/ui/Loading'
import Button from '@/components/ui/Button'
import Modal, { ConfirmModal } from '@/components/ui/Modal'

import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  BuildingOfficeIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'

import toast from 'react-hot-toast'

function ClientsPage() {
  const { user: currentUser, isAdmin } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  // Estados locais
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || 'all'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1)
  const [clientToDelete, setClientToDelete] = useState(null)

  // Query para buscar clientes
  const { 
    data: clientsData, 
    isLoading, 
    error,
    refetch 
  } = useQuery(
    ['clients', { ...filters, search: searchQuery, page }],
    () => clientsService.getClients({
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
    'client-stats',
    clientsService.getClientStats,
    { staleTime: 60000 }
  )

  // Mutation para excluir cliente
  const deleteClientMutation = useMutation(
    (clientId) => clientsService.deleteClient(clientId),
    {
      onSuccess: () => {
        toast.success('Cliente removido com sucesso!')
        queryClient.invalidateQueries('clients')
        queryClient.invalidateQueries('client-stats')
        setClientToDelete(null)
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Erro ao remover cliente')
      }
    }
  )

  const clients = clientsData?.data || []
  const pagination = clientsData?.pagination
  const stats = statsData?.data

  // Sincronizar filtros com URL
  useEffect(() => {
    const params = new URLSearchParams()
    
    if (searchQuery) params.set('search', searchQuery)
    if (filters.status !== 'all') params.set('status', filters.status)
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
      status: 'all'
    })
    setSearchQuery('')
    setPage(1)
  }

  const handleDeleteClient = async () => {
    if (clientToDelete) {
      await deleteClientMutation.mutateAsync(clientToDelete._id)
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
          Apenas administradores podem acessar o gerenciamento de clientes.
        </p>
        <Button onClick={() => navigate('/')}>
          Voltar ao Dashboard
        </Button>
      </div>
    )
  }

  if (isLoading && !clients.length) {
    return <CardSkeleton count={6} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <BuildingOfficeIcon className="w-8 h-8 mr-3" />
            Clientes
          </h1>
          <p className="text-white/70 mt-1">
            Gerencie clientes do sistema
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
            onClick={() => navigate('/clients/create')}
          >
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <BuildingOfficeIcon className="w-6 h-6 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-white/60 text-sm">Total</p>
                <p className="text-2xl font-bold text-white">{stats.total || 0}</p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <BuildingOfficeIcon className="w-6 h-6 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-white/60 text-sm">Ativos</p>
                <p className="text-2xl font-bold text-white">{stats.totalActive || 0}</p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <BuildingOfficeIcon className="w-6 h-6 text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-white/60 text-sm">Projetos</p>
                <p className="text-2xl font-bold text-white">{stats.totalProjects || 0}</p>
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
              placeholder="Buscar clientes por nome, email ou empresa..."
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Lista de clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <CardSkeleton count={6} />
        ) : clients.length === 0 ? (
          <div className="col-span-full">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card rounded-xl p-12 text-center"
            >
              <BuildingOfficeIcon className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                Nenhum cliente encontrado
              </h3>
              <p className="text-white/60 mb-6">
                {searchQuery || Object.values(filters).some(v => v !== 'all') 
                  ? 'Tente ajustar os filtros ou termo de busca'
                  : 'Que tal criar o primeiro cliente?'
                }
              </p>
              {!searchQuery && !Object.values(filters).some(v => v !== 'all') && (
                <Button
                  variant="primary"
                  icon={<PlusIcon />}
                  onClick={() => navigate('/clients/create')}
                >
                  Criar Cliente
                </Button>
              )}
            </motion.div>
          </div>
        ) : (
          clients.map((client, index) => (
            <motion.div
              key={client._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="glass-card rounded-xl p-6 hover:bg-white/5 transition-all duration-200"
            >
              {/* Header do cliente */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {client.logo ? (
                    <img
                      src={client.logo}
                      alt={client.companyName}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-white/20"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                      <span className="text-lg font-medium text-white">
                        {client.companyName?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white truncate">
                      {client.companyName}
                    </h3>
                    <p className="text-white/60 text-sm truncate">
                      {client.responsibleName}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                  {getStatusText(client.status)}
                </span>
              </div>

              {/* Informações de contato */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-white/70">
                  <EnvelopeIcon className="w-4 h-4" />
                  <span className="truncate">{client.email}</span>
                </div>
                {client.phone && (
                  <div className="flex items-center space-x-2 text-sm text-white/70">
                    <PhoneIcon className="w-4 h-4" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.website && (
                  <div className="flex items-center space-x-2 text-sm text-white/70">
                    <GlobeAltIcon className="w-4 h-4" />
                    <span className="truncate">{client.website}</span>
                  </div>
                )}
              </div>

              {/* Ações */}
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<EyeIcon />}
                  onClick={() => navigate(`/clients/${client._id}`)}
                  className="flex-1"
                >
                  Ver
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<PencilIcon />}
                  onClick={() => navigate(`/clients/${client._id}/edit`)}
                  className="flex-1"
                >
                  Editar
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={<TrashIcon />}
                  onClick={() => setClientToDelete(client)}
                >
                  Excluir
                </Button>
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
            {pagination.total} clientes
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
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        onConfirm={handleDeleteClient}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja remover o cliente "${clientToDelete?.companyName}"? Esta ação não pode ser desfeita.`}
        confirmText="Remover"
        type="danger"
        loading={deleteClientMutation.isLoading}
      />
    </div>
  )
}

export default ClientsPage