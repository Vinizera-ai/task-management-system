import { get, post, put, del, upload } from './apiClient'

export const tasksService = {
  // Listar tarefas
  async getTasks(params = {}) {
    return await get('/tasks', params)
  },

  // Listar minhas tarefas
  async getMyTasks(params = {}) {
    return await get('/tasks/my', params)
  },

  // Obter dados do Kanban
  async getKanbanData(params = {}) {
    return await get('/tasks/kanban', params)
  },

  // Obter tarefa específica
  async getTask(id) {
    return await get(`/tasks/${id}`)
  },

  // Criar nova tarefa
  async createTask(taskData, attachments = null) {
    if (attachments && attachments.length > 0) {
      const formData = new FormData()
      
      // Adicionar dados da tarefa
      Object.keys(taskData).forEach(key => {
        if (Array.isArray(taskData[key])) {
          taskData[key].forEach(item => {
            formData.append(`${key}[]`, item)
          })
        } else {
          formData.append(key, taskData[key])
        }
      })
      
      // Adicionar arquivos
      attachments.forEach(file => {
        formData.append('attachments', file)
      })
      
      return await upload('/tasks', formData)
    } else {
      return await post('/tasks', taskData)
    }
  },

  // Atualizar tarefa
  async updateTask(id, taskData) {
    return await put(`/tasks/${id}`, taskData)
  },

  // Avançar tarefa para próxima etapa
  async advanceTask(id, notes = null) {
    return await post(`/tasks/${id}/advance`, { notes })
  },

  // Retroceder tarefa para etapa anterior
  async revertTask(id, reason = null) {
    return await post(`/tasks/${id}/revert`, { reason })
  },

  // Adicionar comentário
  async addComment(id, commentData, attachments = null) {
    if (attachments && attachments.length > 0) {
      const formData = new FormData()
      
      // Adicionar dados do comentário
      Object.keys(commentData).forEach(key => {
        if (Array.isArray(commentData[key])) {
          commentData[key].forEach(item => {
            formData.append(`${key}[]`, item)
          })
        } else {
          formData.append(key, commentData[key])
        }
      })
      
      // Adicionar arquivos
      attachments.forEach(file => {
        formData.append('attachments', file)
      })
      
      return await upload(`/tasks/${id}/comments`, formData)
    } else {
      return await post(`/tasks/${id}/comments`, commentData)
    }
  },

  // Adicionar entrega
  async addDelivery(id, deliveryData, attachments) {
    const formData = new FormData()
    
    // Adicionar dados da entrega
    if (deliveryData.notes) {
      formData.append('notes', deliveryData.notes)
    }
    
    // Adicionar arquivos (obrigatório para entregas)
    attachments.forEach(file => {
      formData.append('attachments', file)
    })
    
    return await upload(`/tasks/${id}/deliveries`, formData)
  },

  // Estatísticas das tarefas
  async getTaskStats() {
    return await get('/tasks/stats/overview')
  },

  // Buscar tarefas por filtros específicos
  async searchTasks(searchParams) {
    return await get('/tasks', searchParams)
  },

  // Obter tarefas por prioridade
  async getTasksByPriority(priority) {
    return await get('/tasks', { priority, status: 'active' })
  },

  // Obter tarefas atrasadas
  async getOverdueTasks() {
    return await get('/tasks', { overdue: 'true' })
  },

  // Obter tarefas por cliente
  async getClientTasks(clientId) {
    return await get('/tasks', { client: clientId })
  },

  // Obter tarefas por data de entrega
  async getTasksByDueDate(date) {
    return await get('/tasks', { dueDate: date })
  }
}