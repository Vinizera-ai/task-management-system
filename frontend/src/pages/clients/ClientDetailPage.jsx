import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from 'react-query'
import { clientsService } from '@/services/clientsService'
import { useAuth } from '@/hooks/useAuth'
import Loading from '@/components/ui/Loading'
import Button from '@/components/ui/Button'
import {
  ArrowLeftIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  MapPinIcon,
  CalendarIcon,
  PencilIcon
} from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function ClientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()

  // Query para buscar cliente
  const { data: clientData, isLoading, error } = useQuery(
    ['client', id],
    () => clientsService.getClient(id),
    {
      enabled: !!id
    }
  )

  const client = clientData?.data

  const formatLastActivity = (date) => {
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

  if (isLoading) {
    return <Loading text="Carregando cliente..." />
  }

  if (error || !client) {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <p className="text-red-400 mb-4">Erro ao carregar cliente</p>
        <Button onClick={() => navigate('/clients')}>
          Voltar para Clientes
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
            onClick={() => navigate('/clients')}
          >
            Voltar
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold text-white">
              Detalhes do Cliente
            </h1>
            <p className="text-white/70">
              Informações detalhadas do cliente
            </p>
          </div>
        </div>

        {isAdmin() && (
          <Button
            variant="primary"
            icon={<PencilIcon />}
            onClick={() => navigate(`/clients/${id}/edit`)}
          >
            Editar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logo e informações básicas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-6 text-center"
        >
          <div className="space-y-4">
            <div className="relative inline-block">
              {client.logo ? (
                <img
                  src={client.logo}
                  alt={client.companyName}
                  className="w-32 h-32 mx-auto rounded-full object-cover ring-4 ring-white/20"
                />
              ) : (
                <div className="w-32 h-32 mx-auto bg-gradient-primary rounded-full flex items-center justify-center ring-4 ring-white/20">
                  <span className="text-4xl font-bold text-white">
                    {client.companyName?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">{client.companyName}</h2>
              <p className="text-white/60">{client.responsibleName}</p>
              
              <div className="flex items-center justify-center space-x-2 mt-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                  {getStatusText(client.status)}
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
                  <span>{client.email}</span>
                </div>
              </div>

              {client.phone && (
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Telefone
                  </label>
                  <div className="flex items-center space-x-2 text-white/80">
                    <PhoneIcon className="w-5 h-5" />
                    <span>{client.phone}</span>
                  </div>
                </div>
              )}

              {client.website && (
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Website
                  </label>
                  <div className="flex items-center space-x-2 text-white/80">
                    <GlobeAltIcon className="w-5 h-5" />
                    <a 
                      href={client.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {client.website}
                    </a>
                  </div>
                </div>
              )}

              {client.address && (
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Endereço
                  </label>
                  <div className="flex items-center space-x-2 text-white/80">
                    <MapPinIcon className="w-5 h-5" />
                    <span>{client.address}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Informações da empresa */}
          {(client.description || client.cnpj || client.industry) && (
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Informações da Empresa
              </h3>

              <div className="space-y-4">
                {client.description && (
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Descrição
                    </label>
                    <p className="text-white/80 whitespace-pre-wrap">
                      {client.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {client.cnpj && (
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        CNPJ
                      </label>
                      <p className="text-white/80">{client.cnpj}</p>
                    </div>
                  )}

                  {client.industry && (
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Setor
                      </label>
                      <p className="text-white/80">{client.industry}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Informações da conta */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Informações da Conta
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Cliente desde
                </label>
                <div className="flex items-center space-x-2 text-white/80">
                  <CalendarIcon className="w-5 h-5" />
                  <span>
                    {new Date(client.createdAt).toLocaleDateString('pt-BR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Última atividade
                </label>
                <div className="flex items-center space-x-2 text-white/80">
                  <CalendarIcon className="w-5 h-5" />
                  <span>{formatLastActivity(client.lastActivity)}</span>
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

export default ClientDetailPage