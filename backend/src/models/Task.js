const mongoose = require('mongoose');

// Schema para arquivos anexados
const attachmentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, {
  _id: true
});

// Schema para comentários
const commentSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: [1000, 'Comentário não pode ter mais que 1000 caracteres']
  },
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  attachments: [attachmentSchema],
  isInternal: {
    type: Boolean,
    default: true // true = comentário interno, false = visível para cliente
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  _id: true
});

// Schema para entregas de cada etapa
const deliverySchema = new mongoose.Schema({
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
  deliveredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attachments: [attachmentSchema],
  notes: {
    type: String,
    maxlength: [500, 'Notas não podem ter mais que 500 caracteres']
  },
  deliveredAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'superseded', 'rejected'],
    default: 'active'
  }
}, {
  _id: true
});

// Schema para responsáveis por etapa
const stepAssigneeSchema = new mongoose.Schema({
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
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  _id: false
});

// Schema para histórico de mudanças
const historySchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'created', 'updated', 'step_advanced', 'step_reverted', 
      'assigned', 'completed', 'reopened', 'approved', 'rejected',
      'comment_added', 'delivery_added', 'file_uploaded'
    ]
  },
  description: {
    type: String,
    required: true
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  previousValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  metadata: {
    stepFrom: Number,
    stepTo: Number,
    commentId: mongoose.Schema.Types.ObjectId,
    deliveryId: mongoose.Schema.Types.ObjectId,
    attachmentIds: [mongoose.Schema.Types.ObjectId]
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  _id: true
});

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Título da tarefa é obrigatório'],
    trim: true,
    maxlength: [200, 'Título não pode ter mais que 200 caracteres']
  },
  briefing: {
    type: String,
    required: [true, 'Briefing é obrigatório'],
    maxlength: [5000, 'Briefing não pode ter mais que 5000 caracteres']
  },
  // Referências
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Cliente é obrigatório']
  },
  taskModel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaskModel',
    required: [true, 'Modelo de tarefa é obrigatório']
  },
  workflow: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
    required: [true, 'Workflow é obrigatório']
  },
  
  // Status e progresso
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'on_hold'],
    default: 'active'
  },
  currentStep: {
    type: Number,
    required: true,
    min: 1
  },
  currentStepId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  totalSteps: {
    type: Number,
    required: true
  },
  
  // Metadados da tarefa
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  dueDate: {
    type: Date,
    required: [true, 'Data de entrega é obrigatória']
  },
  estimatedHours: {
    type: Number,
    min: 0.5,
    default: 8
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag não pode ter mais que 30 caracteres']
  }],
  
  // Pessoas envolvidas
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedUsers: [stepAssigneeSchema],
  
  // Anexos iniciais (do briefing)
  initialAttachments: [attachmentSchema],
  
  // Entregas por etapa
  deliveries: [deliverySchema],
  
  // Comentários
  comments: [commentSchema],
  
  // Histórico de mudanças
  history: [historySchema],
  
  // Dados de aprovação do cliente
  clientApproval: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    approvedAt: Date,
    rejectedAt: Date,
    comments: String,
    annotatedImage: String // URL da imagem com anotações do cliente
  },
  
  // Timestamps calculados
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  
  // Configurações específicas da tarefa
  settings: {
    allowClientComments: {
      type: Boolean,
      default: true
    },
    notifyOnUpdate: {
      type: Boolean,
      default: true
    },
    autoAdvanceOnApproval: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes para otimizar consultas
taskSchema.index({ client: 1, status: 1 });
taskSchema.index({ status: 1, currentStep: 1 });
taskSchema.index({ dueDate: 1, status: 1 });
taskSchema.index({ priority: 1, status: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ 'assignedUsers.userId': 1 });
taskSchema.index({ tags: 1 });
taskSchema.index({ createdAt: -1 });

// Index composto para busca de tarefas por usuário
taskSchema.index({ 
  'assignedUsers.userId': 1, 
  'assignedUsers.stepOrder': 1, 
  currentStep: 1, 
  status: 1 
});

// Virtual para progresso percentual
taskSchema.virtual('progressPercentage').get(function() {
  return Math.round((this.currentStep / this.totalSteps) * 100);
});

// Virtual para verificar se está atrasada
taskSchema.virtual('isOverdue').get(function() {
  return this.status === 'active' && new Date() > this.dueDate;
});

// Virtual para dias restantes
taskSchema.virtual('daysRemaining').get(function() {
  if (this.status !== 'active') return null;
  
  const today = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
});

// Virtual para usuário responsável atual
taskSchema.virtual('currentAssignee').get(function() {
  const currentAssignment = this.assignedUsers.find(
    assignment => assignment.stepOrder === this.currentStep
  );
  return currentAssignment ? currentAssignment.userId : null;
});

// Virtual para entrega ativa da etapa atual
taskSchema.virtual('currentDelivery').get(function() {
  const currentDeliveries = this.deliveries.filter(
    delivery => delivery.stepOrder === this.currentStep && delivery.status === 'active'
  );
  return currentDeliveries.length > 0 ? currentDeliveries[currentDeliveries.length - 1] : null;
});

// Método estático para buscar tarefas do usuário
taskSchema.statics.findUserTasks = function(userId, options = {}) {
  const {
    status = 'active',
    currentStepOnly = true,
    includeCompleted = false
  } = options;

  const query = {
    'assignedUsers.userId': userId
  };

  if (currentStepOnly) {
    query.$expr = {
      $eq: ['$currentStep', { $arrayElemAt: ['$assignedUsers.stepOrder', { $indexOfArray: ['$assignedUsers.userId', userId] }] }]
    };
  }

  if (!includeCompleted) {
    query.status = { $ne: 'completed' };
  }

  if (status !== 'all') {
    query.status = status;
  }

  return this.find(query)
    .populate('client', 'companyName logo')
    .populate('taskModel', 'name')
    .populate('createdBy', 'name email')
    .populate('assignedUsers.userId', 'name email profileImage')
    .sort({ priority: -1, dueDate: 1 });
};

// Método para avançar para próxima etapa
taskSchema.methods.advanceStep = function(userId, notes = null) {
  if (this.currentStep >= this.totalSteps) {
    throw new Error('Tarefa já está na última etapa');
  }

  const previousStep = this.currentStep;
  this.currentStep += 1;

  // Atualizar currentStepId baseado no workflow
  // Isso seria obtido do taskModel/workflow, simplificando aqui
  
  // Adicionar ao histórico
  this.history.push({
    action: 'step_advanced',
    description: `Tarefa avançou da etapa ${previousStep} para ${this.currentStep}`,
    changedBy: userId,
    previousValue: previousStep,
    newValue: this.currentStep,
    metadata: {
      stepFrom: previousStep,
      stepTo: this.currentStep
    }
  });

  // Se chegou na última etapa, marcar como concluída
  if (this.currentStep >= this.totalSteps) {
    this.status = 'completed';
    this.completedAt = new Date();
    
    this.history.push({
      action: 'completed',
      description: 'Tarefa marcada como concluída',
      changedBy: userId
    });
  }

  return this.save();
};

// Método para retroceder uma etapa
taskSchema.methods.revertStep = function(userId, reason = null) {
  if (this.currentStep <= 1) {
    throw new Error('Tarefa já está na primeira etapa');
  }

  const previousStep = this.currentStep;
  this.currentStep -= 1;

  // Se estava concluída, reativar
  if (this.status === 'completed') {
    this.status = 'active';
    this.completedAt = null;
  }

  // Adicionar ao histórico
  this.history.push({
    action: 'step_reverted',
    description: `Tarefa retornou da etapa ${previousStep} para ${this.currentStep}${reason ? ` - Motivo: ${reason}` : ''}`,
    changedBy: userId,
    previousValue: previousStep,
    newValue: this.currentStep,
    metadata: {
      stepFrom: previousStep,
      stepTo: this.currentStep
    }
  });

  return this.save();
};

// Método para adicionar comentário
taskSchema.methods.addComment = function(userId, content, mentions = [], attachments = [], isInternal = true) {
  const comment = {
    author: userId,
    content: content,
    mentions: mentions,
    attachments: attachments,
    isInternal: isInternal
  };

  this.comments.push(comment);

  // Adicionar ao histórico
  this.history.push({
    action: 'comment_added',
    description: `Comentário adicionado ${isInternal ? '(interno)' : '(visível ao cliente)'}`,
    changedBy: userId,
    metadata: {
      commentId: comment._id
    }
  });

  return this.save();
};

// Método para adicionar entrega
taskSchema.methods.addDelivery = function(userId, stepOrder, attachments, notes = null) {
  const delivery = {
    stepId: this.currentStepId, // Seria obtido do workflow
    stepOrder: stepOrder || this.currentStep,
    stepName: `Etapa ${stepOrder || this.currentStep}`, // Seria obtido do workflow
    deliveredBy: userId,
    attachments: attachments,
    notes: notes
  };

  this.deliveries.push(delivery);

  // Adicionar ao histórico
  this.history.push({
    action: 'delivery_added',
    description: `Entrega adicionada para etapa ${delivery.stepOrder}`,
    changedBy: userId,
    metadata: {
      deliveryId: delivery._id,
      attachmentIds: attachments.map(att => att._id)
    }
  });

  return this.save();
};

// Método para aprovação/rejeição do cliente
taskSchema.methods.clientApprovalAction = function(action, comments = null, annotatedImage = null) {
  this.clientApproval.status = action;
  this.clientApproval.comments = comments;
  
  if (action === 'approved') {
    this.clientApproval.approvedAt = new Date();
    this.clientApproval.rejectedAt = null;
    
    // Auto-avançar se configurado
    if (this.settings.autoAdvanceOnApproval) {
      // Lógica para avançar seria implementada aqui
    }
  } else if (action === 'rejected') {
    this.clientApproval.rejectedAt = new Date();
    this.clientApproval.approvedAt = null;
    this.clientApproval.annotatedImage = annotatedImage;
    
    // Retroceder 2 etapas conforme especificado
    const targetStep = Math.max(1, this.currentStep - 2);
    if (targetStep < this.currentStep) {
      this.currentStep = targetStep;
      
      // Se estava concluída, reativar
      if (this.status === 'completed') {
        this.status = 'active';
        this.completedAt = null;
      }
    }
  }

  // Adicionar ao histórico
  this.history.push({
    action: action === 'approved' ? 'approved' : 'rejected',
    description: `Tarefa ${action === 'approved' ? 'aprovada' : 'rejeitada'} pelo cliente${comments ? ` - ${comments}` : ''}`,
    changedBy: null, // Cliente não tem userId
    metadata: {
      stepFrom: this.currentStep,
      stepTo: action === 'rejected' ? Math.max(1, this.currentStep - 2) : this.currentStep
    }
  });

  return this.save();
};

// Middleware para popular referências automaticamente
taskSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'client',
    select: 'companyName logo responsibleName responsibleEmail'
  }).populate({
    path: 'taskModel',
    select: 'name selectedSteps'
  }).populate({
    path: 'createdBy',
    select: 'name email profileImage'
  }).populate({
    path: 'assignedUsers.userId',
    select: 'name email profileImage'
  }).populate({
    path: 'comments.author',
    select: 'name email profileImage'
  }).populate({
    path: 'comments.mentions',
    select: 'name email'
  }).populate({
    path: 'deliveries.deliveredBy',
    select: 'name email profileImage'
  }).populate({
    path: 'history.changedBy',
    select: 'name email'
  });
  next();
});

module.exports = mongoose.model('Task', taskSchema);