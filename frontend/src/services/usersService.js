import { get, post, put, del } from './apiClient'

export const usersService = {
  // Listar usuários
  async getUsers(params = {}) {
    return await get('/users', params)
  },

  // Listar usuários ativos (para seletores)
  async getActiveUsers() {
    return await get('/users/active')
  },

  // Obter usuário específico
  async getUser(id) {
    return await get(`/users/${id}`)
  },

  // Criar novo usuário
  async createUser(userData) {
    return await post('/users', userData)
  },

  // Atualizar usuário
  async updateUser(id, userData) {
    return await put(`/users/${id}`, userData)
  },

  // Excluir usuário
  async deleteUser(id) {
    return await del(`/users/${id}`)
  },

  // Estatísticas dos usuários
  async getUserStats() {
    return await get('/users/stats/overview')
  }
}