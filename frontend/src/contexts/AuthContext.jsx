import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { authService } from '@/services/authService'
import toast from 'react-hot-toast'

// Estado inicial
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: true,
  error: null
}

// Tipos de ação
const actionTypes = {
  AUTH_START: 'AUTH_START',
  AUTH_SUCCESS: 'AUTH_SUCCESS',
  AUTH_FAILURE: 'AUTH_FAILURE',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR'
}

// Reducer
function authReducer(state, action) {
  switch (action.type) {
    case actionTypes.AUTH_START:
      return {
        ...state,
        isLoading: true,
        error: null
      }

    case actionTypes.AUTH_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      }

    case actionTypes.AUTH_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      }

    case actionTypes.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      }

    case actionTypes.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      }

    case actionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null
      }

    default:
      return state
  }
}

// Contexto - EXPORTADO
export const AuthContext = createContext()

// Provider
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Verificar autenticação ao carregar
  useEffect(() => {
    checkAuth()
  }, [])

  // Configurar token no localStorage quando mudar
  useEffect(() => {
    if (state.token) {
      localStorage.setItem('token', state.token)
      // Configurar token padrão para as requisições
      authService.setAuthToken(state.token)
    } else {
      localStorage.removeItem('token')
      authService.removeAuthToken()
    }
  }, [state.token])

  // Verificar se usuário está autenticado
  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    
    if (!token) {
      dispatch({ type: actionTypes.AUTH_FAILURE, payload: null })
      return
    }

    try {
      authService.setAuthToken(token)
      const response = await authService.getMe()
      
      dispatch({
        type: actionTypes.AUTH_SUCCESS,
        payload: {
          user: response.data.user,
          token: token
        }
      })
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
      dispatch({ type: actionTypes.AUTH_FAILURE, payload: null })
    }
  }

  // Login
  const login = async (credentials) => {
    dispatch({ type: actionTypes.AUTH_START })

    try {
      const response = await authService.login(credentials)
      
      dispatch({
        type: actionTypes.AUTH_SUCCESS,
        payload: {
          user: response.data.user,
          token: response.data.token
        }
      })

      toast.success(`Bem-vindo, ${response.data.user.name}!`)
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erro ao fazer login'
      
      dispatch({
        type: actionTypes.AUTH_FAILURE,
        payload: errorMessage
      })

      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Logout
  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    } finally {
      dispatch({ type: actionTypes.LOGOUT })
      toast.success('Logout realizado com sucesso')
    }
  }

  // Alterar senha
  const changePassword = async (passwords) => {
    try {
      await authService.changePassword(passwords)
      toast.success('Senha alterada com sucesso')
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erro ao alterar senha'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Atualizar dados do usuário
  const updateUser = (userData) => {
    dispatch({
      type: actionTypes.UPDATE_USER,
      payload: userData
    })
  }

  // Limpar erro
  const clearError = () => {
    dispatch({ type: actionTypes.CLEAR_ERROR })
  }

  // Renovar token
  const refreshToken = async () => {
    try {
      const response = await authService.refreshToken()
      
      dispatch({
        type: actionTypes.AUTH_SUCCESS,
        payload: {
          user: state.user,
          token: response.data.token
        }
      })

      return response.data.token
    } catch (error) {
      console.error('Erro ao renovar token:', error)
      logout()
      return null
    }
  }

  // Verificar se usuário tem permissão
  const hasPermission = (requiredRole) => {
    if (!state.user) return false
    
    if (requiredRole === 'admin') {
      return state.user.role === 'admin'
    }
    
    return true // Usuários operacionais têm acesso a funcionalidades básicas
  }

  // Verificar se é admin
  const isAdmin = () => {
    return state.user?.role === 'admin'
  }

  // Verificar se é operacional
  const isOperational = () => {
    return state.user?.role === 'operational'
  }

  const value = {
    // Estado
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,

    // Ações
    login,
    logout,
    changePassword,
    updateUser,
    clearError,
    refreshToken,
    checkAuth,

    // Utilitários
    hasPermission,
    isAdmin,
    isOperational
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook para usar o contexto
export function useAuth() {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  
  return context
}