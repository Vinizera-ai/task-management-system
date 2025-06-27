const express = require('express');
const { body, validationResult } = require('express-validator');
const TaskModel = require('../models/TaskModel');
const Workflow = require('../models/Workflow');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(protect);

// @route   GET /api/task-models
// @desc    Listar modelos de tarefa
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      isActive, 
      category,
      tag,
      search,
      createdBy
    } = req.query;

    // Construir filtros
    const filters = {};
    
    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }
    
    if (category) {
      filters['settings.category'] = category;
    }
    
    if (tag) {
      filters['settings.tags'] = tag;
    }
    
    if (createdBy) {
      filters.createdBy = createdBy;
    }
    
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'settings.category': { $regex: search, $options: 'i' } }
      ];
    }

    // Buscar modelos com paginação
    const taskModels = await TaskModel.find(filters)
      .sort({ 'stats.lastUsed': -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Contar total
    const total = await TaskModel.countDocuments(filters);

    res.status(200).json({
      success: true,
      data: taskModels,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Erro ao listar modelos de tarefa:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   GET /api/task-models/active
// @desc    Listar modelos ativos (para seletores)
// @access  Private
router.get('/active', async (req, res) => {
  try {
    const taskModels = await TaskModel.findActive()
      .select('name description selectedSteps settings.category settings.defaultPriority stats')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: taskModels
    });

  } catch (error) {
    console.error('Erro ao listar modelos ativos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   GET /api/task-models/categories
// @desc    Listar categorias dos modelos
// @access  Private
router.get('/categories', async (req, res) => {
  try {
    const categories = await TaskModel.distinct('settings.category', { isActive: true });
    
    res.status(200).json({
      success: true,
      data: categories.filter(cat => cat) // Remove valores nulos/vazios
    });

  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   GET /api/task-models/tags
// @desc    Listar tags dos modelos
// @access  Private
router.get('/tags', async (req, res) => {
  try {
    const tags = await TaskModel.distinct('settings.tags', { isActive: true });
    
    res.status(200).json({
      success: true,
      data: tags.filter(tag => tag) // Remove valores nulos/vazios
    });

  } catch (error) {
    console.error('Erro ao listar tags:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   GET /api/task-models/:id
// @desc    Obter modelo específico
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const taskModel = await TaskModel.findById(req.params.id);

    if (!taskModel) {
      return res.status(404).json({
        success: false,
        error: 'Modelo de tarefa não encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: taskModel
    });

  } catch (error) {
    console.error('Erro ao buscar modelo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   POST /api/task-models
// @desc    Criar novo modelo de tarefa
// @access  Private
router.post('/', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('workflow')
    .isMongoId()
    .withMessage('ID do workflow inválido'),
  body('selectedSteps')
    .isArray({ min: 1 })
    .withMessage('Deve ter pelo menos uma etapa selecionada'),
  body('selectedSteps.*.stepId')
    .isMongoId()
    .withMessage('ID da etapa inválido'),
  body('selectedSteps.*.stepOrder')
    .isInt({ min: 1 })
    .withMessage('Ordem da etapa deve ser um número positivo'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Descrição não pode ter mais que 500 caracteres')
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
      name,
      description,
      workflow: workflowId,
      selectedSteps,
      defaultAssignees = [],
      settings = {}
    } = req.body;

    // Verificar se nome já existe
    const existingModel = await TaskModel.findOne({ name });
    if (existingModel) {
      return res.status(400).json({
        success: false,
        error: 'Nome do modelo já existe'
      });
    }

    // Verificar se workflow existe
    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow não encontrado'
      });
    }

    // Validar e processar etapas selecionadas
    const processedSteps = [];
    for (const selectedStep of selectedSteps) {
      const workflowStep = workflow.steps.find(
        step => step._id.toString() === selectedStep.stepId.toString()
      );
      
      if (!workflowStep) {
        return res.status(400).json({
          success: false,
          error: `Etapa com ID ${selectedStep.stepId} não encontrada no workflow`
        });
      }

      processedSteps.push({
        stepId: selectedStep.stepId,
        stepOrder: workflowStep.order,
        stepName: workflowStep.name,
        stepColor: workflowStep.color,
        stepIcon: workflowStep.icon,
        stepSettings: workflowStep.settings
      });
    }

    // Ordenar por ordem do workflow
    processedSteps.sort((a, b) => a.stepOrder - b.stepOrder);

    // Processar configurações
    const processedSettings = {
      defaultPriority: settings.defaultPriority || 'medium',
      estimatedHours: settings.estimatedHours || 8,
      category: settings.category || '',
      tags: settings.tags || [],
      allowedFileTypes: settings.allowedFileTypes || ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'pdf', 'doc', 'docx'],
      maxFileSize: settings.maxFileSize || 209715200
    };

    // Criar modelo
    const taskModel = await TaskModel.create({
      name,
      description,
      workflow: workflowId,
      selectedSteps: processedSteps,
      defaultAssignees,
      settings: processedSettings,
      createdBy: req.user.id
    });

    // Popular dados relacionados
    await taskModel.populate('workflow', 'name steps');
    await taskModel.populate('createdBy', 'name email role');

    // Emitir notificação via socket
    req.io.emit('task-model-created', {
      message: `Novo modelo de tarefa criado: ${taskModel.name}`,
      taskModel: taskModel
    });

    res.status(201).json({
      success: true,
      data: taskModel
    });

  } catch (error) {
    console.error('Erro ao criar modelo de tarefa:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   PUT /api/task-models/:id
// @desc    Atualizar modelo de tarefa
// @access  Private (Admin ou criador)
router.put('/:id', [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Descrição não pode ter mais que 500 caracteres'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive deve ser boolean')
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

    const modelId = req.params.id;
    const updates = req.body;

    // Verificar se modelo existe
    const taskModel = await TaskModel.findById(modelId);
    if (!taskModel) {
      return res.status(404).json({
        success: false,
        error: 'Modelo de tarefa não encontrado'
      });
    }

    // Verificar permissões (Admin ou criador)
    const isAdmin = req.user.role === 'admin';
    const isCreator = taskModel.createdBy.toString() === req.user.id;

    if (!isAdmin && !isCreator) {
      return res.status(403).json({
        success: false,
        error: 'Sem permissão para editar este modelo'
      });
    }

    // Verificar nome único se estiver sendo alterado
    if (updates.name && updates.name !== taskModel.name) {
      const existingModel = await TaskModel.findOne({ name: updates.name });
      if (existingModel) {
        return res.status(400).json({
          success: false,
          error: 'Nome do modelo já existe'
        });
      }
    }

    // Não permitir alteração de selectedSteps após criação (imutável)
    if (updates.selectedSteps) {
      return res.status(400).json({
        success: false,
        error: 'Etapas do modelo não podem ser alteradas após a criação'
      });
    }

    // Atualizar modelo
    const updatedModel = await TaskModel.findByIdAndUpdate(
      modelId,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedModel
    });

  } catch (error) {
    console.error('Erro ao atualizar modelo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   DELETE /api/task-models/:id
// @desc    Excluir modelo de tarefa
// @access  Private (Admin ou criador)
router.delete('/:id', async (req, res) => {
  try {
    const modelId = req.params.id;

    // Verificar se modelo existe
    const taskModel = await TaskModel.findById(modelId);
    if (!taskModel) {
      return res.status(404).json({
        success: false,
        error: 'Modelo de tarefa não encontrado'
      });
    }

    // Verificar permissões (Admin ou criador)
    const isAdmin = req.user.role === 'admin';
    const isCreator = taskModel.createdBy.toString() === req.user.id;

    if (!isAdmin && !isCreator) {
      return res.status(403).json({
        success: false,
        error: 'Sem permissão para excluir este modelo'
      });
    }

    // TODO: Verificar se modelo tem tarefas associadas
    // Por ora, vamos apenas inativar o modelo

    await TaskModel.findByIdAndUpdate(modelId, { isActive: false });

    res.status(200).json({
      success: true,
      message: 'Modelo inativado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao excluir modelo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   PUT /api/task-models/:id/assignees
// @desc    Atualizar responsáveis padrão do modelo
// @access  Private (Admin ou criador)
router.put('/:id/assignees', [
  body('defaultAssignees')
    .isArray()
    .withMessage('Responsáveis padrão deve ser um array'),
  body('defaultAssignees.*.stepOrder')
    .isInt({ min: 1 })
    .withMessage('Ordem da etapa deve ser um número positivo'),
  body('defaultAssignees.*.userId')
    .isMongoId()
    .withMessage('ID do usuário inválido')
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

    const modelId = req.params.id;
    const { defaultAssignees } = req.body;

    // Verificar se modelo existe
    const taskModel = await TaskModel.findById(modelId);
    if (!taskModel) {
      return res.status(404).json({
        success: false,
        error: 'Modelo de tarefa não encontrado'
      });
    }

    // Verificar permissões (Admin ou criador)
    const isAdmin = req.user.role === 'admin';
    const isCreator = taskModel.createdBy.toString() === req.user.id;

    if (!isAdmin && !isCreator) {
      return res.status(403).json({
        success: false,
        error: 'Sem permissão para editar este modelo'
      });
    }

    // Atualizar responsáveis padrão
    taskModel.defaultAssignees = defaultAssignees;
    await taskModel.save();

    res.status(200).json({
      success: true,
      data: taskModel
    });

  } catch (error) {
    console.error('Erro ao atualizar responsáveis:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   GET /api/task-models/stats/overview
// @desc    Estatísticas dos modelos
// @access  Private (Admin)
router.get('/stats/overview', authorize('admin'), async (req, res) => {
  try {
    const stats = await Promise.all([
      TaskModel.countDocuments({ isActive: true }),
      TaskModel.countDocuments({ isActive: false }),
      TaskModel.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, totalTasks: { $sum: '$stats.totalTasks' } } }
      ]),
      TaskModel.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, completedTasks: { $sum: '$stats.completedTasks' } } }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalActive: stats[0],
        totalInactive: stats[1],
        total: stats[0] + stats[1],
        totalTasks: stats[2][0]?.totalTasks || 0,
        completedTasks: stats[3][0]?.completedTasks || 0
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