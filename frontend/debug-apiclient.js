// debug-apiclient.js - Para testar o apiClient especificamente
import { post } from './src/services/apiClient.js'

const debugApiClient = async () => {
  console.log('🔍 DEBUGGING APICLIENT LOGIN\n')
  
  try {
    console.log('📡 Fazendo POST para /auth/login via apiClient...')
    
    const credentials = {
      email: 'admin@sistema.com',
      password: 'admin123'
    }
    
    console.log('📤 Credentials:', credentials)
    
    // Esta é a chamada exata que o authService faz
    const response = await post('/auth/login', credentials)
    
    console.log('📥 Response recebida:')
    console.log('   Tipo:', typeof response)
    console.log('   Success:', response.success)
    console.log('   Token existe:', !!response.token)
    console.log('   User existe:', !!response.user)
    console.log('   Response completa:', JSON.stringify(response, null, 2))
    
    if (response.success && response.token) {
      console.log('✅ APICLIENT FUNCIONANDO CORRETAMENTE!')
      console.log('🎯 O problema deve estar no AuthContext ou na UI')
    } else {
      console.log('❌ PROBLEMA NO APICLIENT:')
      console.log('   - Success não é true:', response.success)
      console.log('   - Token não existe:', !response.token)
    }
    
    return response
    
  } catch (error) {
    console.log('❌ ERRO NO APICLIENT:')
    console.log('   Message:', error.message)
    console.log('   Response Status:', error.response?.status)
    console.log('   Response Data:', error.response?.data)
    console.log('   Error completo:', error)
    
    // Verificar se é erro de rede
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      console.log('🔴 ERRO DE REDE - Backend não está acessível')
    }
    
    // Verificar se é erro de URL
    if (error.config?.url) {
      console.log('🌐 URL tentada:', error.config.url)
    }
    
    throw error
  }
}

// Testar variáveis de ambiente
const checkEnvVars = () => {
  console.log('🔍 VERIFICANDO VARIÁVEIS DE AMBIENTE:')
  console.log('   VITE_API_URL:', import.meta.env.VITE_API_URL)
  console.log('   Mode:', import.meta.env.MODE)
  console.log('   DEV:', import.meta.env.DEV)
  console.log('   PROD:', import.meta.env.PROD)
  
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
  console.log('   URL final usada:', apiUrl)
  
  if (!import.meta.env.VITE_API_URL) {
    console.log('⚠️  VITE_API_URL não definida, usando fallback')
  }
}

const runDebug = async () => {
  checkEnvVars()
  console.log('\n' + '='.repeat(50) + '\n')
  await debugApiClient()
}

// Executar se estiver em ambiente de desenvolvimento
if (import.meta.env.DEV) {
  console.log('🧪 Debug do ApiClient disponível')
  window.debugApiClient = runDebug
  console.log('💡 Execute: debugApiClient() no console do navegador')
}

export { debugApiClient as default }