const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const clientSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: [true, 'Nome da empresa é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome da empresa não pode ter mais que 100 caracteres']
  },
  logo: {
    type: String,
    default: null
  },
  responsibleName: {
    type: String,
    required: [true, 'Nome do responsável é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome do responsável não pode ter mais que 100 caracteres']
  },
  responsibleEmail: {
    type: String,
    required: [true, 'E-mail do responsável é obrigatório'],
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'E-mail inválido'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Telefone é obrigatório'],
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  // Credenciais para acesso do cliente
  clientId: {
    type: String,
    unique: true,
    default: () => uuidv4()
  },
  accessPassword: {
    type: String,
    required: [true, 'Senha de acesso é obrigatória'],
    minlength: [4, 'Senha deve ter pelo menos 4 caracteres']
  },
  // Configurações específicas do cliente
  settings: {
    allowedFileTypes: {
      type: [String],
      default: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'pdf', 'doc', 'docx']
    },
    maxFileSize: {
      type: Number,
      default: 209715200 // 200MB em bytes
    },
    notificationPreferences: {
      email: {
        type: Boolean,
        default: true
      },
      taskAssigned: {
        type: Boolean,
        default: true
      },
      taskCompleted: {
        type: Boolean,
        default: true
      }
    }
  },
  // Histórico de acessos
  lastAccess: {
    type: Date,
    default: null
  },
  accessCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes para otimizar consultas
clientSchema.index({ companyName: 1 });
clientSchema.index({ status: 1 });
clientSchema.index({ responsibleEmail: 1 });

// Virtual para URL de acesso do cliente
clientSchema.virtual('accessUrl').get(function() {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${baseUrl}/client/${this.clientId}`;
});

// Virtual para iniciais da empresa
clientSchema.virtual('companyInitials').get(function() {
  return this.companyName
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 3);
});

// Método estático para buscar clientes ativos
clientSchema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

// Método estático para buscar por clientId
clientSchema.statics.findByClientId = function(clientId) {
  return this.findOne({ clientId, status: 'active' });
};

// Método para atualizar último acesso
clientSchema.methods.updateLastAccess = function() {
  this.lastAccess = new Date();
  this.accessCount += 1;
  return this.save();
};

// Middleware para validar senha antes de salvar
clientSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('accessPassword')) {
    // Aqui não fazemos hash da senha pois o cliente precisa dela em texto limpo
    // Em um ambiente mais seguro, consideraríamos hash + salt
  }
  next();
});

// Middleware para garantir clientId único
clientSchema.pre('save', async function(next) {
  if (this.isNew && !this.clientId) {
    let isUnique = false;
    let newClientId;
    
    while (!isUnique) {
      newClientId = uuidv4();
      const existing = await this.constructor.findOne({ clientId: newClientId });
      if (!existing) {
        isUnique = true;
      }
    }
    
    this.clientId = newClientId;
  }
  next();
});

module.exports = mongoose.model('Client', clientSchema);