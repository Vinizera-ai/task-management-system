import { get, post, put, del } from './apiClient'

export const clientsService = {
  // Listar clientes
  async getClients(params = {}) {
    return await get('/clients', params)
  },

  // Listar clientes ativos (para seletores)
  async getActiveClients() {
    return await get('/clients/active')
  },

  // Obter cliente específico
  async getClient(id) {
    return await get(`/clients/${id}`)
  },

  // Criar novo cliente
  async createClient(clientData) {
    return await post('/clients', clientData)
  },

  // Atualizar cliente
  async updateClient(id, clientData) {
    return await put(`/clients/${id}`, clientData)
  },

  // Excluir cliente
  async deleteClient(id) {
    return await del(`/clients/${id}`)
  },

  // Acesso do cliente (sem autenticação JWT)
  async clientAccess(credentials) {
    return await post('/clients/access', credentials)
  },

  // Estatísticas dos clientes
  async getClientStats() {
    return await get('/clients/stats/overview')
  }
}