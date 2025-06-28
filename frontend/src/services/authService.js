// frontend/src/services/authService.js
import { get, post, setAuthToken, removeAuthToken } from './apiClient'

export const authService = {
  // Login do usuário
  async login(credentials) {
    try {
      // A função post já retorna response.data automaticamente
      const data = await post('/auth/login', credentials)
      
      // Verificar se o login foi bem-sucedido
      if (data.success && data.token) {
        setAuthToken(data.token)
        return data // Retornar os dados já parseados
      } else {
        throw new Error(data.error || 'Erro no login')
      }
    } catch (error) {
      // Re-lançar o erro para ser tratado pelo AuthContext
      throw error
    }
  },

  // Logout do usuário
  async logout() {
    try {
      await post('/auth/logout')
    } catch (error) {
      // Ignorar erros de logout, pois pode ser que o token já esteja inválido
      console.warn('Erro no logout:', error)
    } finally {
      removeAuthToken()
    }
  },

  // Obter dados do usuário logado
  async getMe() {
    return await get('/auth/me')
  },

  // Renovar token
  async refreshToken() {
    try {
      const data = await post('/auth/refresh')
      
      if (data.success && data.token) {
        setAuthToken(data.token)
        return data
      } else {
        throw new Error('Erro ao renovar token')
      }
    } catch (error) {
      throw error
    }
  },

  // Alterar senha
  async changePassword(passwords) {
    return await post('/auth/change-password', passwords)
  },

  // Configurar token de autenticação
  setAuthToken,

  // Remover token de autenticação
  removeAuthToken,

  // Verificar se usuário está autenticado
  isAuthenticated() {
    const token = localStorage.getItem('token')
    return !!token
  },

  // Obter token atual
  getToken() {
    return localStorage.getItem('token')
  },

  // Decodificar payload do JWT (básico, sem verificação de assinatura)
  decodeToken(token = null) {
    const tokenToUse = token || this.getToken()
    
    if (!tokenToUse) return null

    try {
      const payload = tokenToUse.split('.')[1]
      const decoded = JSON.parse(atob(payload))
      return decoded
    } catch (error) {
      console.error('Erro ao decodificar token:', error)
      return null
    }
  },

  // Verificar se token está expirado
  isTokenExpired(token = null) {
    const decoded = this.decodeToken(token)
    
    if (!decoded || !decoded.exp) return true

    const currentTime = Date.now() / 1000
    return decoded.exp < currentTime
  },

  // Obter tempo restante do token em segundos
  getTokenTimeRemaining(token = null) {
    const decoded = this.decodeToken(token)
    
    if (!decoded || !decoded.exp) return 0

    const currentTime = Date.now() / 1000
    const timeRemaining = decoded.exp - currentTime
    
    return Math.max(0, timeRemaining)
  }
}