const mongoose = require('mongoose');

// Schema para responsáveis padrão por etapa
const defaultAssigneeSchema = new mongoose.Schema({
  stepId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  stepOrder: {
    type: Number,
    required: true
  },
  stepName: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  _id: false
});

const taskModelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome do modelo é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome do modelo não pode ter mais que 100 caracteres']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Descrição não pode ter mais que 500 caracteres']
  },
  // Referência ao workflow base
  workflow: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
    required: [true, 'Workflow é obrigatório']
  },
  // Etapas selecionadas do workflow (mantém ordem do workflow original)
  selectedSteps: [{
    stepId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    stepOrder: {
      type: Number,
      required: true
    },
    stepName: {
      type: String,
      required: true
    },
    stepColor: {
      type: String,
      default: '#3B82F6'
    },
    stepIcon: {
      type: String,
      default: 'circle'
    },
    stepSettings: {
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
  }],
  // Responsáveis padrão para quando não há atribuição específica por cliente
  defaultAssignees: [defaultAssigneeSchema],
  // Configurações específicas do modelo
  settings: {
    defaultPriority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    estimatedHours: {
      type: Number,
      min: [0.5, 'Horas estimadas deve ser pelo menos 0.5'],
      default: 8
    },
    category: {
      type: String,
      trim: true,
      maxlength: [50, 'Categoria não pode ter mais que 50 caracteres']
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: [30, 'Tag não pode ter mais que 30 caracteres']
    }],
    allowedFileTypes: {
      type: [String],
      default: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'pdf', 'doc', 'docx']
    },
    maxFileSize: {
      type: Number,
      default: 209715200 // 200MB em bytes
    }
  },
  // Metadados
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isTemplate: {
    type: Boolean,
    default: false // Para futuros templates pré-definidos do sistema
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
    },
    lastUsed: {
      type: Date,
      default: null
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes para otimizar consultas
taskModelSchema.index({ name: 1 });
taskModelSchema.index({ workflow: 1 });
taskModelSchema.index({ createdBy: 1 });
taskModelSchema.index({ isActive: 1 });
taskModelSchema.index({ 'settings.category': 1 });
taskModelSchema.index({ 'settings.tags': 1 });

// Virtual para número de etapas
taskModelSchema.virtual('stepCount').get(function() {
  return this.selectedSteps.length;
});

// Virtual para etapas ordenadas
taskModelSchema.virtual('orderedSteps').get(function() {
  return this.selectedSteps.sort((a, b) => a.stepOrder - b.stepOrder);
});

// Virtual para taxa de conclusão
taskModelSchema.virtual('completionRate').get(function() {
  if (this.stats.totalTasks === 0) return 0;
  return Math.round((this.stats.completedTasks / this.stats.totalTasks) * 100);
});

// Método estático para buscar modelos ativos
taskModelSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Método estático para buscar por categoria
taskModelSchema.statics.findByCategory = function(category) {
  return this.find({ 'settings.category': category, isActive: true });
};

// Método estático para buscar por tag
taskModelSchema.statics.findByTag = function(tag) {
  return this.find({ 'settings.tags': tag, isActive: true });
};

// Método para obter responsável padrão de uma etapa
taskModelSchema.methods.getDefaultAssignee = function(stepOrder) {
  return this.defaultAssignees.find(assignee => assignee.stepOrder === stepOrder);
};

// Método para atualizar estatísticas de uso
taskModelSchema.methods.updateStats = function(statsUpdate) {
  this.stats = {
    ...this.stats,
    ...statsUpdate,
    lastUsed: new Date()
  };
  return this.save();
};

// Método para validar etapas selecionadas
taskModelSchema.methods.validateSelectedSteps = async function() {
  const workflow = await this.populate('workflow');
  
  for (const selectedStep of this.selectedSteps) {
    const workflowStep = workflow.workflow.steps.find(
      step => step._id.toString() === selectedStep.stepId.toString()
    );
    
    if (!workflowStep) {
      throw new Error(`Etapa ${selectedStep.stepName} não existe no workflow`);
    }
    
    // Verificar se a ordem está correta (deve manter ordem sequencial do workflow)
    if (workflowStep.order !== selectedStep.stepOrder) {
      throw new Error(`Ordem da etapa ${selectedStep.stepName} está incorreta`);
    }
  }
  
  // Verificar se as etapas mantêm ordem sequencial (sem gaps)
  const orders = this.selectedSteps.map(step => step.stepOrder).sort((a, b) => a - b);
  const workflowSteps = workflow.workflow.steps.map(step => step.order).sort((a, b) => a - b);
  
  // Verificar se todas as etapas selecionadas formam uma sequência válida do workflow
  for (let i = 0; i < orders.length - 1; i++) {
    const currentOrder = orders[i];
    const nextOrder = orders[i + 1];
    
    // Verificar se a próxima etapa existe no workflow
    const currentIndex = workflowSteps.indexOf(currentOrder);
    const nextIndex = workflowSteps.indexOf(nextOrder);
    
    if (currentIndex === -1 || nextIndex === -1) {
      throw new Error('Etapas selecionadas não existem no workflow');
    }
    
    // Verificar se não há gaps inválidos (pode pular etapas, mas deve manter ordem)
    if (nextIndex <= currentIndex) {
      throw new Error('Etapas devem manter a ordem sequencial do workflow');
    }
  }
};

// Middleware para validar antes de salvar
taskModelSchema.pre('save', async function(next) {
  if (this.isModified('selectedSteps') || this.isModified('workflow')) {
    try {
      await this.validateSelectedSteps();
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Middleware para popular workflow automaticamente
taskModelSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'workflow',
    select: 'name steps'
  }).populate({
    path: 'createdBy',
    select: 'name email role'
  }).populate({
    path: 'defaultAssignees.userId',
    select: 'name email profileImage'
  });
  next();
});

module.exports = mongoose.model('TaskModel', taskModelSchema);