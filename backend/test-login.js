// test-login.js - Script para testar o login
const axios = require('axios');

const testLogin = async () => {
  try {
    console.log('🧪 Testando login...');
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@sistema.com',
      password: 'admin123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login bem-sucedido!');
    console.log('📄 Resposta:', {
      success: response.data.success,
      user: response.data.user,
      tokenLength: response.data.token?.length
    });
    
    // Testar rota protegida
    const meResponse = await axios.get('http://localhost:5000/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${response.data.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Rota /me funcionando!');
    console.log('👤 Dados do usuário:', meResponse.data.user);
    
  } catch (error) {
    console.log('❌ Erro no login:');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Dados:', error.response.data);
    } else if (error.request) {
      console.log('Sem resposta do servidor');
    } else {
      console.log('Erro:', error.message);
    }
  }
};

// Testar health check primeiro
const testHealthCheck = async () => {
  try {
    console.log('🏥 Testando health check...');
    const response = await axios.get('http://localhost:5000/api/health');
    console.log('✅ API funcionando!');
    console.log('📄 Resposta:', response.data);
    return true;
  } catch (error) {
    console.log('❌ API não está respondendo');
    return false;
  }
};

const runTests = async () => {
  const isApiRunning = await testHealthCheck();
  
  if (isApiRunning) {
    await testLogin();
  } else {
    console.log('🔄 Certifique-se de que o servidor está rodando com: npm run dev');
  }
};

runTests();