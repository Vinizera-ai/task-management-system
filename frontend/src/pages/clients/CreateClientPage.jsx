import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { clientsService } from '@/services/clientsService'
import { uploadService } from '@/services/uploadService'

import Loading from '@/components/ui/Loading'
import Button from '@/components/ui/Button'
import FileUpload from '@/components/ui/FileUpload'

import {
  ArrowLeftIcon,
  BuildingOfficeIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  MapPinIcon,
  DocumentTextIcon,
  PhotoIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

import toast from 'react-hot-toast'

function CreateClientPage() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const [logo, setLogo] = useState(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      companyName: '',
      responsibleName: '',
      email: '',
      password: '',
      phone: '',
      website: '',
      address: '',
      cnpj: '',
      industry: '',
      description: '',
      status: 'active'
    }
  })

  // Mutation para criar cliente
  const createClientMutation = useMutation(
    (clientData) => clientsService.createClient(clientData),
    {
      onSuccess: (data) => {
        toast.success('Cliente criado com sucesso!')
        queryClient.invalidateQueries('clients')
        queryClient.invalidateQueries('client-stats')
        navigate(`/clients/${data.data._id}`)
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Erro ao criar cliente')
      }
    }
  )

  // Mutation para upload de logo
  const uploadLogoMutation = useMutation(
    (file) => uploadService.uploadClientLogo(file),
    {
      onSuccess: (data) => {
        setLogo(data.data.file.url)
        setUploadingLogo(false)
        toast.success('Logo carregado com sucesso!')
      },
      onError: (error) => {
        setUploadingLogo(false)
        toast.error(error.response?.data?.error || 'Erro ao carregar logo')
      }
    }
  )

  const onSubmit = async (data) => {
    try {
      const clientData = {
        ...data,
        logo
      }
      
      await createClientMutation.mutateAsync(clientData)
    } catch (error) {
      console.error('Erro ao criar cliente:', error)
    }
  }

  const handleLogoUpload = async (files) => {
    if (files.length > 0) {
      setUploadingLogo(true)
      await uploadLogoMutation.mutateAsync(files[0])
    }
  }

  const removeLogo = () => {
    setLogo(null)
  }

  if (!isAdmin()) {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <ShieldCheckIcon className="w-16 h-16 text-white/20 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">
          Acesso Restrito
        </h3>
        <p className="text-white/60 mb-6">
          Apenas administradores podem criar clientes.
        </p>
        <Button onClick={() => navigate('/clients')}>
          Voltar para Clientes
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
          onClick={() => navigate('/clients')}
        >
          Voltar
        </Button>
        
        <div>
          <h1 className="text-2xl font-bold text-white">Novo Cliente</h1>
          <p className="text-white/70">
            Adicione um novo cliente ao sistema
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informações da Empresa */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-xl p-6"
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <BuildingOfficeIcon className="w-5 h-5 mr-2" />
                Informações da Empresa
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome da empresa */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Nome da Empresa *
                  </label>
                  <input
                    {...register('companyName', {
                      required: 'Nome da empresa é obrigatório',
                      minLength: {
                        value: 2,
                        message: 'Nome deve ter pelo menos 2 caracteres'
                      }
                    })}
                    type="text"
                    className="w-full input-glass rounded-lg text-white placeholder-white/40"
                    placeholder="Ex: Empresa ABC Ltda"
                  />
                  {errors.companyName && (
                    <p className="mt-1 text-sm text-red-400">{errors.companyName.message}</p>
                  )}
                </div>

                {/* CNPJ */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    CNPJ
                  </label>
                  <input
                    {...register('cnpj')}
                    type="text"
                    className="w-full input-glass rounded-lg text-white placeholder-white/40"
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                {/* Setor */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Setor
                  </label>
                  <input
                    {...register('industry')}
                    type="text"
                    className="w-full input-glass rounded-lg text-white placeholder-white/40"
                    placeholder="Ex: Tecnologia, Varejo, Saúde"
                  />
                </div>

                {/* Website */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Website
                  </label>
                  <input
                    {...register('website')}
                    type="url"
                    className="w-full input-glass rounded-lg text-white placeholder-white/40"
                    placeholder="https://www.empresa.com.br"
                  />
                </div>

                {/* Endereço */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Endereço
                  </label>
                  <input
                    {...register('address')}
                    type="text"
                    className="w-full input-glass rounded-lg text-white placeholder-white/40"
                    placeholder="Rua, número, bairro, cidade - UF"
                  />
                </div>

                {/* Descrição */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Descrição
                  </label>
                  <textarea
                    {...register('description')}
                    rows={4}
                    className="w-full input-glass rounded-lg text-white placeholder-white/40 resize-none"
                    placeholder="Descreva a empresa, seus produtos/serviços e objetivos..."
                  />
                </div>
              </div>
            </motion.div>

            {/* Informações do Responsável */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card rounded-xl p-6"
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <UserIcon className="w-5 h-5 mr-2" />
                Responsável pelo Contato
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome do responsável */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Nome do Responsável *
                  </label>
                  <input
                    {...register('responsibleName', {
                      required: 'Nome do responsável é obrigatório'
                    })}
                    type="text"
                    className="w-full input-glass rounded-lg text-white placeholder-white/40"
                    placeholder="Nome do contato principal"
                  />
                  {errors.responsibleName && (
                    <p className="mt-1 text-sm text-red-400">{errors.responsibleName.message}</p>
                  )}
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Telefone
                  </label>
                  <input
                    {...register('phone')}
                    type="tel"
                    className="w-full input-glass rounded-lg text-white placeholder-white/40"
                    placeholder="(11) 99999-9999"
                  />
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
                    placeholder="contato@empresa.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
                  )}
                </div>

                {/* Senha de acesso */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Senha de Acesso *
                  </label>
                  <input
                    {...register('password', {
                      required: 'Senha é obrigatória',
                      minLength: {
                        value: 6,
                        message: 'Senha deve ter pelo menos 6 caracteres'
                      }
                    })}
                    type="password"
                    className="w-full input-glass rounded-lg text-white placeholder-white/40"
                    placeholder="Senha para acesso ao portal"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Logo da Empresa */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <PhotoIcon className="w-5 h-5 mr-2" />
                Logo da Empresa
              </h3>

              {logo ? (
                <div className="text-center">
                  <img
                    src={logo}
                    alt="Preview"
                    className="w-32 h-32 mx-auto rounded-full object-cover ring-4 ring-white/20 mb-4"
                  />
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={removeLogo}
                  >
                    Remover Logo
                  </Button>
                </div>
              ) : (
                <div>
                  {uploadingLogo ? (
                    <div className="text-center py-8">
                      <Loading size="lg" text="Carregando logo..." />
                    </div>
                  ) : (
                    <FileUpload
                      onFileSelect={handleLogoUpload}
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

            {/* Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Status da Conta
              </h3>

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
                loading={createClientMutation.isLoading}
                disabled={createClientMutation.isLoading}
              >
                Criar Cliente
              </Button>

              <Button
                type="button"
                variant="ghost"
                fullWidth
                onClick={() => navigate('/clients')}
                disabled={createClientMutation.isLoading}
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

export default CreateClientPage