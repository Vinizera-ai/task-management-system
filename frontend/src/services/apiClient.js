import axios from 'axios'
import toast from 'react-hot-toast'

// Configuração base da API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Criar instância do axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - adicionar token automaticamente
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Log da requisição em desenvolvimento
    if (import.meta.env.DEV) {
      console.log(`🔄 ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params
      })
    }
    
    return config
  },
  (error) => {
    console.error('❌ Erro na requisição:', error)
    return Promise.reject(error)
  }
)

// Response interceptor - tratamento de erros globais
apiClient.interceptors.response.use(
  (response) => {
    // Log da resposta em desenvolvimento
    if (import.meta.env.DEV) {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data
      })
    }
    
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Log do erro em desenvolvimento
    if (import.meta.env.DEV) {
      console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      })
    }

    // Token expirado - tentar renovar
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshResponse = await apiClient.post('/auth/refresh')
        const newToken = refreshResponse.data.token

        localStorage.setItem('token', newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`

        return apiClient(originalRequest)
      } catch (refreshError) {
        // Refresh falhou - fazer logout
        localStorage.removeItem('token')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    // Erro de rede
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      toast.error('Problema de conectividade. Verifique sua internet.')
      return Promise.reject(error)
    }

    // Erro de timeout
    if (error.code === 'ECONNABORTED') {
      toast.error('Tempo limite excedido. Tente novamente.')
      return Promise.reject(error)
    }

    // Erro 403 - sem permissão
    if (error.response?.status === 403) {
      toast.error('Você não tem permissão para esta ação.')
      return Promise.reject(error)
    }

    // Erro 404 - não encontrado
    if (error.response?.status === 404) {
      const message = error.response?.data?.error || 'Recurso não encontrado'
      toast.error(message)
      return Promise.reject(error)
    }

    // Erro 422 - dados inválidos
    if (error.response?.status === 422) {
      const message = error.response?.data?.error || 'Dados inválidos'
      toast.error(message)
      return Promise.reject(error)
    }

    // Erro 429 - muitas requisições
    if (error.response?.status === 429) {
      toast.error('Muitas tentativas. Aguarde um momento.')
      return Promise.reject(error)
    }

    // Erro 500 - erro interno do servidor
    if (error.response?.status >= 500) {
      toast.error('Erro interno do servidor. Tente novamente mais tarde.')
      return Promise.reject(error)
    }

    return Promise.reject(error)
  }
)

// Funções utilitárias para diferentes tipos de requisição

// GET request
export const get = async (url, params = {}) => {
  const response = await apiClient.get(url, { params })
  return response.data
}

// POST request
export const post = async (url, data = {}) => {
  const response = await apiClient.post(url, data)
  return response.data
}

// PUT request
export const put = async (url, data = {}) => {
  const response = await apiClient.put(url, data)
  return response.data
}

// PATCH request
export const patch = async (url, data = {}) => {
  const response = await apiClient.patch(url, data)
  return response.data
}

// DELETE request
export const del = async (url) => {
  const response = await apiClient.delete(url)
  return response.data
}

// Upload de arquivo
export const upload = async (url, formData, onUploadProgress = null) => {
  const response = await apiClient.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: onUploadProgress ? (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      )
      onUploadProgress(percentCompleted)
    } : undefined,
  })
  return response.data
}

// Download de arquivo
export const download = async (url, filename = null) => {
  const response = await apiClient.get(url, {
    responseType: 'blob',
  })

  // Criar link de download
  const blob = new Blob([response.data])
  const downloadUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = downloadUrl
  
  // Definir nome do arquivo
  if (filename) {
    link.download = filename
  } else {
    // Tentar extrair nome do cabeçalho Content-Disposition
    const contentDisposition = response.headers['content-disposition']
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/)
      if (filenameMatch) {
        link.download = filenameMatch[1]
      }
    }
  }

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(downloadUrl)

  return response.data
}

// Configurar token de autenticação
export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete apiClient.defaults.headers.common['Authorization']
  }
}

// Remover token de autenticação
export const removeAuthToken = () => {
  delete apiClient.defaults.headers.common['Authorization']
}

// Health check da API
export const healthCheck = async () => {
  try {
    const response = await apiClient.get('/health')
    return {
      status: 'healthy',
      data: response.data
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    }
  }
}

// Cancelar requisições pendentes
export const cancelPendingRequests = () => {
  // Implementar se necessário com AbortController
}

export default apiClient