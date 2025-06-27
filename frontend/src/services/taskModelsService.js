import { get, post, put, del } from './apiClient'

export const taskModelsService = {
  // Listar modelos de tarefa
  async getTaskModels(params = {}) {
    return await get('/task-models', params)
  },

  // Listar modelos ativos (para seletores)
  async getActiveTaskModels() {
    return await get('/task-models/active')
  },

  // Listar categorias dos modelos
  async getCategories() {
    return await get('/task-models/categories')
  },

  // Listar tags dos modelos
  async getTags() {
    return await get('/task-models/tags')
  },

  // Obter modelo específico
  async getTaskModel(id) {
    return await get(`/task-models/${id}`)
  },

  // Criar novo modelo
  async createTaskModel(modelData) {
    return await post('/task-models', modelData)
  },

  // Atualizar modelo
  async updateTaskModel(id, modelData) {
    return await put(`/task-models/${id}`, modelData)
  },

  // Excluir modelo
  async deleteTaskModel(id) {
    return await del(`/task-models/${id}`)
  },

  // Atualizar responsáveis padrão
  async updateDefaultAssignees(id, assigneesData) {
    return await put(`/task-models/${id}/assignees`, assigneesData)
  },

  // Estatísticas dos modelos
  async getTaskModelStats() {
    return await get('/task-models/stats/overview')
  }
}