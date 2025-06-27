const mongoose = require('mongoose');

// Schema para uma etapa individual do fluxo
const stepSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome da etapa é obrigatório'],
    trim: true,
    maxlength: [50, 'Nome da etapa não pode ter mais que 50 caracteres']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Descrição não pode ter mais que 200 caracteres']
  },
  order: {
    type: Number,
    required: [true, 'Ordem da etapa é obrigatória'],
    min: [1, 'Ordem deve ser maior que 0']
  },
  color: {
    type: String,
    default: '#3B82F6', // Azul padrão
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Cor deve estar no formato hexadecimal']
  },
  icon: {
    type: String,
    default: 'circle'
  },
  // Configurações específicas da etapa
  settings: {
    allowClientAccess: {
      type: Boolean,
      default: false
    },
    requiresApproval: {
      type: Boolean,
      default: false
    },
    allowMultipleFiles: {
      type: Boolean,
      default: true
    },
    isClientApprovalStep: {
      type: Boolean,
      default: false
    }
  }
}, {
  _id: true
});

const workflowSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome do fluxo é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome do fluxo não pode ter mais que 100 caracteres']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Descrição não pode ter mais que 500 caracteres']
  },
  steps: [stepSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Estatísticas de uso
  stats: {
    totalTasks: {
      type: Number,
      default: 0
    },
    completedTasks: {
      type: Number,
      default: 0
    },
    averageCompletionTime: {
      type: Number,
      default: 0 // em horas
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes para otimizar consultas
workflowSchema.index({ isActive: 1 });
workflowSchema.index({ isDefault: 1 });
workflowSchema.index({ createdBy: 1 });
workflowSchema.index({ 'steps.order': 1 });

// Virtual para número de etapas
workflowSchema.virtual('stepCount').get(function() {
  return this.steps.length;
});

// Virtual para etapas ordenadas
workflowSchema.virtual('orderedSteps').get(function() {
  return this.steps.sort((a, b) => a.order - b.order);
});

// Método estático para buscar fluxo ativo
workflowSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Método estático para buscar fluxo padrão
workflowSchema.statics.findDefault = function() {
  return this.findOne({ isDefault: true, isActive: true });
};

// Método para adicionar etapa
workflowSchema.methods.addStep = function(stepData) {
  const maxOrder = this.steps.reduce((max, step) => Math.max(max, step.order), 0);
  const newStep = {
    ...stepData,
    order: maxOrder + 1
  };
  this.steps.push(newStep);
  return this.save();
};

// Método para remover etapa
workflowSchema.methods.removeStep = function(stepId) {
  const stepIndex = this.steps.findIndex(step => step._id.toString() === stepId);
  if (stepIndex === -1) {
    throw new Error('Etapa não encontrada');
  }
  
  const removedOrder = this.steps[stepIndex].order;
  this.steps.splice(stepIndex, 1);
  
  // Reordenar etapas subsequentes
  this.steps.forEach(step => {
    if (step.order > removedOrder) {
      step.order -= 1;
    }
  });
  
  return this.save();
};

// Método para reordenar etapas
workflowSchema.methods.reorderSteps = function(newOrder) {
  // newOrder é um array de stepIds na nova ordem
  this.steps.forEach((step, index) => {
    const newIndex = newOrder.indexOf(step._id.toString());
    if (newIndex !== -1) {
      step.order = newIndex + 1;
    }
  });
  
  return this.save();
};

// Método para obter etapa por posição
workflowSchema.methods.getStepByOrder = function(order) {
  return this.steps.find(step => step.order === order);
};

// Método para obter próxima etapa
workflowSchema.methods.getNextStep = function(currentOrder) {
  return this.steps.find(step => step.order === currentOrder + 1);
};

// Método para obter etapa anterior
workflowSchema.methods.getPreviousStep = function(currentOrder) {
  return this.steps.find(step => step.order === currentOrder - 1);
};

// Middleware para validar antes de salvar
workflowSchema.pre('save', function(next) {
  // Validar que não há ordens duplicadas
  const orders = this.steps.map(step => step.order);
  const uniqueOrders = [...new Set(orders)];
  
  if (orders.length !== uniqueOrders.length) {
    return next(new Error('Não pode haver etapas com a mesma ordem'));
  }
  
  // Validar sequência de ordens (deve ser sequencial começando em 1)
  const sortedOrders = orders.sort((a, b) => a - b);
  for (let i = 0; i < sortedOrders.length; i++) {
    if (sortedOrders[i] !== i + 1) {
      return next(new Error('Ordens das etapas devem ser sequenciais começando em 1'));
    }
  }
  
  next();
});

// Middleware para definir apenas um fluxo como padrão
workflowSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    // Remove isDefault de outros fluxos
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

module.exports = mongoose.model('Workflow', workflowSchema);