const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const TaskModel = require('../models/TaskModel');
const Client = require('../models/Client');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { uploadMultiple } = require('../middleware/upload');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(protect);

// @route   GET /api/tasks
// @desc    Listar tarefas
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status,
      priority,
      client,
      assignedTo,
      currentStepOnly = 'true',
      search,
      sortBy = 'priority',
      sortOrder = 'desc',
      dueDate,
      overdue
    } = req.query;

    // Construir filtros
    const filters = {};

    // Filtro por usuário baseado no papel
    if (req.user.role === 'operational') {
      // Operacionais só veem suas tarefas
      filters['assignedUsers.userId'] = req.user.id;
      
      if (currentStepOnly === 'true') {
        // Só tarefas na etapa atual do usuário
        filters.$expr = {
          $eq: [
            '$currentStep', 
            { 
              $arrayElemAt: [
                '$assignedUsers.stepOrder', 
                { $indexOfArray: ['$assignedUsers.userId', req.user.id] }
              ] 
            }
          ]
        };
      }
    }
    
    if (status && status !== 'all') {
      if (status === 'overdue') {
        filters.status = 'active';
        filters.dueDate = { $lt: new Date() };
      } else {
        filters.status = status;
      }
    }
    
    if (priority) {
      filters.priority = priority;
    }
    
    if (client) {
      filters.client = client;
    }
    
    if (assignedTo) {
      filters['assignedUsers.userId'] = assignedTo;
    }
    
    if (dueDate) {
      const date = new Date(dueDate);
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);
      
      filters.dueDate = {
        $gte: date,
        $lt: nextDay
      };
    }
    
    if (overdue === 'true') {
      filters.status = 'active';
      filters.dueDate = { $lt: new Date() };
    }
    
    if (search) {
      filters.$or = [
        { title: { $regex: search, $options: 'i' } },
        { briefing: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Construir ordenação
    const sortOptions = {};
    
    // Ordenação especial por prioridade e data
    if (sortBy === 'priority') {
      sortOptions.priority = sortOrder === 'desc' ? -1 : 1;
      sortOptions.dueDate = 1; // Secundário: mais urgente primeiro
    } else if (sortBy === 'dueDate') {
      sortOptions.dueDate = sortOrder === 'desc' ? -1 : 1;
    } else {
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    // Buscar tarefas com paginação
    const tasks = await Task.find(filters)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Contar total
    const total = await Task.countDocuments(filters);

    res.status(200).json({
      success: true,
      data: tasks,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Erro ao listar tarefas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   GET /api/tasks/my
// @desc    Listar tarefas do usuário atual
// @access  Private
router.get('/my', async (req, res) => {
  try {
    const { status = 'active', includeCompleted = false } = req.query;

    const tasks = await Task.findUserTasks(req.user.id, {
      status,
      currentStepOnly: true,
      includeCompleted: includeCompleted === 'true'
    });

    res.status(200).json({
      success: true,
      data: tasks
    });

  } catch (error) {
    console.error('Erro ao buscar tarefas do usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   GET /api/tasks/kanban
// @desc    Obter tarefas para visualização Kanban
// @access  Private
router.get('/kanban', async (req, res) => {
  try {
    const { client, assignedTo } = req.query;

    const filters = {};
    
    // Filtro por usuário baseado no papel
    if (req.user.role === 'operational') {
      filters['assignedUsers.userId'] = req.user.id;
    }
    
    if (client) {
      filters.client = client;
    }
    
    if (assignedTo) {
      filters['assignedUsers.userId'] = assignedTo;
    }

    // Buscar apenas tarefas ativas
    filters.status = 'active';

    const tasks = await Task.find(filters)
      .sort({ priority: -1, dueDate: 1 });

    // Agrupar por etapa
    const kanbanColumns = {};
    
    tasks.forEach(task => {
      const step = task.currentStep;
      if (!kanbanColumns[step]) {
        kanbanColumns[step] = {
          stepOrder: step,
          stepName: `Etapa ${step}`,
          tasks: []
        };
      }
      kanbanColumns[step].tasks.push(task);
    });

    // Converter para array ordenado
    const columns = Object.values(kanbanColumns).sort((a, b) => a.stepOrder - b.stepOrder);

    res.status(200).json({
      success: true,
      data: {
        columns,
        totalTasks: tasks.length
      }
    });

  } catch (error) {
    console.error('Erro ao buscar dados do Kanban:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   GET /api/tasks/:id
// @desc    Obter tarefa específica
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tarefa não encontrada'
      });
    }

    // Verificar permissões
    if (req.user.role === 'operational') {
      const isAssigned = task.assignedUsers.some(
        assignment => assignment.userId._id.toString() === req.user.id
      );
      
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          error: 'Você não tem permissão para ver esta tarefa'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: task
    });

  } catch (error) {
    console.error('Erro ao buscar tarefa:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   POST /api/tasks
// @desc    Criar nova tarefa
// @access  Private
router.post('/', [
  uploadMultiple('attachments', 5),
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Título deve ter entre 5 e 200 caracteres'),
  body('briefing')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Briefing deve ter entre 10 e 5000 caracteres'),
  body('client')
    .isMongoId()
    .withMessage('ID do cliente inválido'),
  body('taskModel')
    .isMongoId()
    .withMessage('ID do modelo inválido'),
  body('dueDate')
    .isISO8601()
    .withMessage('Data de entrega inválida'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Prioridade deve ser low, medium ou high')
], async (req, res) => {
  try {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: errors.array()
      });
    }

    const {
      title,
      briefing,
      client: clientId,
      taskModel: taskModelId,
      dueDate,
      priority = 'medium',
      tags = []
    } = req.body;

    // Verificar se cliente existe
    const client = await Client.findById(clientId);
    if (!client || client.status !== 'active') {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado ou inativo'
      });
    }

    // Verificar se modelo existe
    const taskModel = await TaskModel.findById(taskModelId);
    if (!taskModel || !taskModel.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Modelo de tarefa não encontrado ou inativo'
      });
    }

    // Processar anexos iniciais
    const initialAttachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`,
      uploadedBy: req.user.id
    })) : [];

    // TODO: Obter atribuições baseadas na tabela Cliente x Etapa
    // Por ora, usar responsáveis padrão do modelo
    const assignedUsers = taskModel.defaultAssignees.map(assignee => ({
      stepId: assignee.stepId,
      stepOrder: assignee.stepOrder,
      stepName: assignee.stepName,
      userId: assignee.userId,
      assignedBy: req.user.id
    }));

    // Criar tarefa
    const task = await Task.create({
      title,
      briefing,
      client: clientId,
      taskModel: taskModelId,
      workflow: taskModel.workflow._id,
      currentStep: 1,
      currentStepId: taskModel.selectedSteps[0].stepId,
      totalSteps: taskModel.selectedSteps.length,
      priority,
      dueDate: new Date(dueDate),
      estimatedHours: taskModel.settings.estimatedHours,
      tags,
      createdBy: req.user.id,
      assignedUsers,
      initialAttachments
    });

    // Adicionar histórico inicial
    task.history.push({
      action: 'created',
      description: `Tarefa criada usando modelo "${taskModel.name}"`,
      changedBy: req.user.id
    });

    await task.save();

    // Popular dados para resposta
    await task.populate('client taskModel createdBy assignedUsers.userId');

    // Atualizar estatísticas do modelo
    await taskModel.updateStats({
      totalTasks: taskModel.stats.totalTasks + 1
    });

    // Emitir notificações via socket
    assignedUsers.forEach(assignment => {
      if (assignment.stepOrder === 1) { // Notificar responsável da primeira etapa
        req.io.to(`user-${assignment.userId}`).emit('task-assigned', {
          taskId: task._id,
          taskTitle: task.title,
          assignedTo: assignment.userId,
          stepName: assignment.stepName,
          dueDate: task.dueDate
        });
      }
    });

    res.status(201).json({
      success: true,
      data: task
    });

  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Atualizar tarefa
// @access  Private
router.put('/:id', [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Título deve ter entre 5 e 200 caracteres'),
  body('briefing')
    .optional()
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Briefing deve ter entre 10 e 5000 caracteres'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Data de entrega inválida'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Prioridade deve ser low, medium ou high')
], async (req, res) => {
  try {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: errors.array()
      });
    }

    const taskId = req.params.id;
    const updates = req.body;

    // Verificar se tarefa existe
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tarefa não encontrada'
      });
    }

    // Verificar permissões
    if (req.user.role === 'operational') {
      const isAssigned = task.assignedUsers.some(
        assignment => assignment.userId._id.toString() === req.user.id
      );
      
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          error: 'Você não tem permissão para editar esta tarefa'
        });
      }
    }

    // Rastrear mudanças para histórico
    const changes = [];
    
    Object.keys(updates).forEach(field => {
      if (task[field] !== updates[field]) {
        changes.push({
          field,
          oldValue: task[field],
          newValue: updates[field]
        });
      }
    });

    // Atualizar tarefa
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      updates,
      { new: true, runValidators: true }
    );

    // Adicionar mudanças ao histórico
    changes.forEach(change => {
      updatedTask.history.push({
        action: 'updated',
        description: `Campo "${change.field}" alterado`,
        changedBy: req.user.id,
        previousValue: change.oldValue,
        newValue: change.newValue
      });
    });

    if (changes.length > 0) {
      await updatedTask.save();
    }

    res.status(200).json({
      success: true,
      data: updatedTask
    });

  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   POST /api/tasks/:id/advance
// @desc    Avançar tarefa para próxima etapa
// @access  Private
router.post('/:id/advance', [
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notas não podem ter mais que 500 caracteres')
], async (req, res) => {
  try {
    const { notes } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tarefa não encontrada'
      });
    }

    // Verificar se usuário pode avançar (é responsável da etapa atual)
    const currentAssignee = task.assignedUsers.find(
      assignment => assignment.stepOrder === task.currentStep
    );

    if (req.user.role === 'operational' && 
        (!currentAssignee || currentAssignee.userId._id.toString() !== req.user.id)) {
      return res.status(403).json({
        success: false,
        error: 'Você não é o responsável por esta etapa'
      });
    }

    await task.advanceStep(req.user.id, notes);

    // Notificar próximo responsável se houver
    if (task.currentStep <= task.totalSteps) {
      const nextAssignee = task.assignedUsers.find(
        assignment => assignment.stepOrder === task.currentStep
      );

      if (nextAssignee) {
        req.io.to(`user-${nextAssignee.userId}`).emit('task-assigned', {
          taskId: task._id,
          taskTitle: task.title,
          assignedTo: nextAssignee.userId,
          stepName: nextAssignee.stepName,
          dueDate: task.dueDate
        });
      }
    }

    // Notificar conclusão se aplicável
    if (task.status === 'completed') {
      task.assignedUsers.forEach(assignment => {
        req.io.to(`user-${assignment.userId}`).emit('task-completed', {
          taskId: task._id,
          taskTitle: task.title,
          involvedUsers: task.assignedUsers.map(a => a.userId._id)
        });
      });
    }

    res.status(200).json({
      success: true,
      data: task,
      message: task.status === 'completed' ? 'Tarefa concluída com sucesso!' : 'Tarefa avançada para próxima etapa!'
    });

  } catch (error) {
    console.error('Erro ao avançar tarefa:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
});

// @route   POST /api/tasks/:id/revert
// @desc    Retroceder tarefa para etapa anterior
// @access  Private
router.post('/:id/revert', [
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Motivo não pode ter mais que 500 caracteres')
], async (req, res) => {
  try {
    const { reason } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tarefa não encontrada'
      });
    }

    // Verificar permissões (Admin ou responsável atual)
    if (req.user.role === 'operational') {
      const currentAssignee = task.assignedUsers.find(
        assignment => assignment.stepOrder === task.currentStep
      );

      if (!currentAssignee || currentAssignee.userId._id.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Você não tem permissão para retroceder esta tarefa'
        });
      }
    }

    await task.revertStep(req.user.id, reason);

    res.status(200).json({
      success: true,
      data: task,
      message: 'Tarefa retrocedida para etapa anterior!'
    });

  } catch (error) {
    console.error('Erro ao retroceder tarefa:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
});

// @route   POST /api/tasks/:id/comments
// @desc    Adicionar comentário à tarefa
// @access  Private
router.post('/:id/comments', [
  uploadMultiple('attachments', 3),
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comentário deve ter entre 1 e 1000 caracteres'),
  body('mentions')
    .optional()
    .isArray()
    .withMessage('Menções devem ser um array'),
  body('isInternal')
    .optional()
    .isBoolean()
    .withMessage('isInternal deve ser boolean')
], async (req, res) => {
  try {
    const { content, mentions = [], isInternal = true } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tarefa não encontrada'
      });
    }

    // Verificar permissões
    if (req.user.role === 'operational') {
      const isAssigned = task.assignedUsers.some(
        assignment => assignment.userId._id.toString() === req.user.id
      );
      
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          error: 'Você não tem permissão para comentar nesta tarefa'
        });
      }
    }

    // Processar anexos
    const attachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`,
      uploadedBy: req.user.id
    })) : [];

    await task.addComment(req.user.id, content, mentions, attachments, isInternal);

    // Notificar usuários mencionados
    if (mentions.length > 0) {
      mentions.forEach(userId => {
        req.io.to(`user-${userId}`).emit('user-mentioned', {
          taskId: task._id,
          taskTitle: task.title,
          mentionedUserId: userId,
          authorName: req.user.name
        });
      });
    }

    res.status(201).json({
      success: true,
      data: task,
      message: 'Comentário adicionado com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   POST /api/tasks/:id/deliveries
// @desc    Adicionar entrega à tarefa
// @access  Private
router.post('/:id/deliveries', [
  uploadMultiple('attachments', 5),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notas não podem ter mais que 500 caracteres')
], async (req, res) => {
  try {
    const { notes } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tarefa não encontrada'
      });
    }

    // Verificar se usuário pode entregar (é responsável da etapa atual)
    const currentAssignee = task.assignedUsers.find(
      assignment => assignment.stepOrder === task.currentStep
    );

    if (req.user.role === 'operational' && 
        (!currentAssignee || currentAssignee.userId._id.toString() !== req.user.id)) {
      return res.status(403).json({
        success: false,
        error: 'Você não é o responsável por esta etapa'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Pelo menos um arquivo deve ser enviado'
      });
    }

    // Processar anexos
    const attachments = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`,
      uploadedBy: req.user.id
    }));

    await task.addDelivery(req.user.id, task.currentStep, attachments, notes);

    res.status(201).json({
      success: true,
      data: task,
      message: 'Entrega adicionada com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao adicionar entrega:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   GET /api/tasks/stats/overview
// @desc    Estatísticas das tarefas
// @access  Private (Admin)
router.get('/stats/overview', authorize('admin'), async (req, res) => {
  try {
    const stats = await Promise.all([
      Task.countDocuments({ status: 'active' }),
      Task.countDocuments({ status: 'completed' }),
      Task.countDocuments({ status: 'active', dueDate: { $lt: new Date() } }),
      Task.countDocuments({ priority: 'high', status: 'active' }),
      Task.aggregate([
        { $match: { status: 'completed' } },
        { $group: { 
          _id: null, 
          avgCompletionDays: { 
            $avg: { 
              $divide: [
                { $subtract: ['$completedAt', '$createdAt'] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        }}
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalActive: stats[0],
        totalCompleted: stats[1],
        totalOverdue: stats[2],
        totalHighPriority: stats[3],
        averageCompletionDays: Math.round(stats[4][0]?.avgCompletionDays || 0),
        total: stats[0] + stats[1]
      }
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;