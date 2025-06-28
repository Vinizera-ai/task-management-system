// backend/debug-auth.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Conectar ao MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/task-management');
    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Erro ao conectar com MongoDB:', error.message);
    process.exit(1);
  }
};

// Schema do usuário (simplificado para debug)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  status: String
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

const debugAuth = async () => {
  await connectDB();
  
  console.log('\n🔍 VERIFICANDO CONFIGURAÇÕES...');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('JWT_SECRET definido:', !!process.env.JWT_SECRET);
  console.log('MONGO_URI:', process.env.MONGO_URI);
  
  console.log('\n🔍 VERIFICANDO USUÁRIO ADMIN...');
  
  try {
    const adminUser = await User.findOne({ email: 'admin@sistema.com' });
    
    if (!adminUser) {
      console.log('❌ Usuário admin não encontrado');
      
      // Criar usuário admin para teste
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const newAdmin = new User({
        name: 'Administrador do Sistema',
        email: 'admin@sistema.com',
        password: hashedPassword,
        role: 'admin',
        status: 'active'
      });
      
      await newAdmin.save();
      console.log('✅ Usuário admin criado para teste');
    } else {
      console.log('✅ Usuário admin encontrado');
      console.log('Nome:', adminUser.name);
      console.log('Email:', adminUser.email);
      console.log('Role:', adminUser.role);
      console.log('Status:', adminUser.status);
      
      // Testar senha
      const passwordMatch = await adminUser.matchPassword('admin123');
      console.log('Senha "admin123" funciona:', passwordMatch);
      
      if (!passwordMatch) {
        console.log('🔧 Atualizando senha do admin...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        adminUser.password = hashedPassword;
        await adminUser.save();
        console.log('✅ Senha atualizada');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
  
  console.log('\n🔍 TESTANDO GERAÇÃO DE TOKEN...');
  
  try {
    const jwt = require('jsonwebtoken');
    const testToken = jwt.sign(
      { id: 'test123' }, 
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '30d' }
    );
    
    console.log('✅ Token gerado com sucesso');
    console.log('Token (primeiros 50 chars):', testToken.substring(0, 50) + '...');
    
    // Verificar token
    const decoded = jwt.verify(testToken, process.env.JWT_SECRET || 'fallback_secret');
    console.log('✅ Token verificado com sucesso');
    console.log('Decoded ID:', decoded.id);
    
  } catch (error) {
    console.error('❌ Erro no token:', error.message);
  }
  
  mongoose.connection.close();
};

debugAuth();