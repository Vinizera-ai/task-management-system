const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome não pode ter mais que 100 caracteres']
  },
  email: {
    type: String,
    required: [true, 'E-mail é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'E-mail inválido'
    ]
  },
  password: {
    type: String,
    required: [true, 'Senha é obrigatória'],
    minlength: [6, 'Senha deve ter pelo menos 6 caracteres'],
    select: false
  },
  phone: {
    type: String,
    required: [true, 'Telefone é obrigatório'],
    trim: true
  },
  profileImage: {
    type: String,
    default: null
  },
  position: {
    type: String,
    required: [true, 'Cargo é obrigatório'],
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'operational'],
    default: 'operational'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  lastLogin: {
    type: Date,
    default: null
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index para otimizar consultas
userSchema.index({ status: 1 });
userSchema.index({ role: 1 });
userSchema.index({ email: 1 });

// Middleware para hash da senha antes de salvar
userSchema.pre('save', async function(next) {
  try {
    // Só faz hash se a senha foi modificada
    if (!this.isModified('password')) {
      return next();
    }

    console.log('🔐 Fazendo hash da senha para:', this.email);
    
    // Gerar salt e hash
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    
    console.log('✅ Hash da senha criado com sucesso');
    next();
  } catch (error) {
    console.error('❌ Erro no hash da senha:', error);
    next(error);
  }
});

// Método para comparar senha
userSchema.methods.matchPassword = async function(enteredPassword) {
  try {
    console.log('🔍 Comparando senha para:', this.email);
    const result = await bcrypt.compare(enteredPassword, this.password);
    console.log('🔐 Resultado da comparação:', result);
    return result;
  } catch (error) {
    console.error('❌ Erro na comparação de senha:', error);
    return false;
  }
};

// Virtual para nome curto (primeiro nome)
userSchema.virtual('firstName').get(function() {
  return this.name.split(' ')[0];
});

// Virtual para iniciais
userSchema.virtual('initials').get(function() {
  return this.name
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
});

// Método estático para buscar usuários ativos
userSchema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

// Método estático para buscar admins
userSchema.statics.findAdmins = function() {
  return this.find({ role: 'admin', status: 'active' });
};

// Método estático para buscar operacionais
userSchema.statics.findOperational = function() {
  return this.find({ role: 'operational', status: 'active' });
};

// Middleware para remover referências quando usuário é excluído
userSchema.pre('remove', async function(next) {
  // TODO: Implementar lógica para lidar com tarefas associadas
  // Por enquanto, vamos apenas prevenir a exclusão se houver tarefas
  next();
});

module.exports = mongoose.model('User', userSchema);