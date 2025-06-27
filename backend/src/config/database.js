const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

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
    
    const existingAdmin = await User.findOne({ email: 'admin@sistema.com' });
    
    if (!existingAdmin) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const adminUser = new User({
        name: 'Administrador do Sistema',
        email: 'admin@sistema.com',
        password: hashedPassword,
        phone: '(00) 00000-0000',
        role: 'admin',
        position: 'Administrador',
        status: 'active'
      });

      await adminUser.save();
      console.log('👤 Usuário admin padrão criado: admin@sistema.com / admin123');
    }
  } catch (error) {
    console.log('⚠️  Erro ao criar usuário admin padrão:', error.message);
  }
};

module.exports = connectDB;