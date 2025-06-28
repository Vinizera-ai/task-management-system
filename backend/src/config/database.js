const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Configurações de conexão atualizadas (sem opções deprecated)
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/task-management');

    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);

    // Criar usuário admin padrão se não existir
    await createDefaultAdmin();

  } catch (error) {
    console.error('❌ Erro ao conectar com MongoDB:', error.message);
    process.exit(1);
  }
};

// Função para criar usuário admin padrão
const createDefaultAdmin = async () => {
  try {
    const User = require('../models/User');
    
    console.log('🔍 Verificando usuário admin...');
    
    const existingAdmin = await User.findOne({ email: 'admin@sistema.com' });
    
    if (!existingAdmin) {
      console.log('👤 Criando usuário admin padrão...');
      
      const adminUser = new User({
        name: 'Administrador do Sistema',
        email: 'admin@sistema.com',
        password: 'admin123', // Será hasheada automaticamente pelo middleware
        phone: '(00) 00000-0000',
        role: 'admin',
        position: 'Administrador',
        status: 'active'
      });

      await adminUser.save();
      console.log('👤 Usuário admin padrão criado: admin@sistema.com / admin123');
    } else {
      console.log('👤 Usuário admin já existe');
      
      // Verificar se o usuário está ativo
      if (existingAdmin.status !== 'active') {
        existingAdmin.status = 'active';
        await existingAdmin.save();
        console.log('👤 Usuário admin ativado');
      }
    }
  } catch (error) {
    console.log('⚠️  Erro ao criar/verificar usuário admin padrão:', error.message);
  }
};

// Event listeners para conexão
mongoose.connection.on('connected', () => {
  console.log('🟢 Mongoose conectado ao MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('🔴 Erro na conexão do Mongoose:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🟡 Mongoose desconectado');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🔌 Conexão do Mongoose fechada devido ao encerramento da aplicação');
  process.exit(0);
});

module.exports = connectDB;