const express = require('express');
const { body, validationResult } = require('express-validator');
const Workflow = require('../models/Workflow');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(protect);

// @route   GET /api/workflows
// @desc    Listar fluxos de trabalho
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      isActive, 
      search 
    } = req.query;

    // Construir filtros
    const filters = {};
    
    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }
    
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Buscar workflows com paginação
    const workflows = await Workflow.find(filters)
      .populate('createdBy', 'name email')
      .sort({ isDefault: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Contar total
    const total = await Workflow.countDocuments(filters);

    res.status(200).json({
      success: true,
      data: workflows,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Erro ao listar workflows:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   GET /api/workflows/active
// @desc    Listar workflows ativos (para seletores)
// @access  Private
router.get('/active', async (req, res) => {
  try {
    const workflows = await Workflow.findActive()
      .select('name description steps isDefault')
      .sort({ isDefault: -1, name: 1 });

    res.status(200).json({
      success: true,
      data: workflows
    });

  } catch (error) {
    console.error('Erro ao listar workflows ativos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   GET /api/workflows/default
// @desc    Obter workflow padrão
// @access  Private
router.get('/default', async (req, res) => {
  try {
    const workflow = await Workflow.findDefault()
      .populate('createdBy', 'name email');

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Nenhum workflow padrão encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: workflow
    });

  } catch (error) {
    console.error('Erro ao buscar workflow padrão:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   GET /api/workflows/:id
// @desc    Obter workflow específico
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow não encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: workflow
    });

  } catch (error) {
    console.error('Erro ao buscar workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   POST /api/workflows
// @desc    Criar novo workflow
// @access  Private (Admin)
router.post('/', [
  authorize('admin'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Descrição não pode ter mais que 500 caracteres'),
  body('steps')
    .isArray({ min: 1 })
    .withMessage('Deve ter pelo menos uma etapa'),
  body('steps.*.name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nome da etapa deve ter entre 2 e 50 caracteres'),
  body('steps.*.description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Descrição da etapa não pode ter mais que 200 caracteres'),
  body('steps.*.color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Cor deve estar no formato hexadecimal')
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
      steps,
      isActive = true,
      isDefault = false
    } = req.body;

    // Verificar se nome já existe
    const existingWorkflow = await Workflow.findOne({ name });
    if (existingWorkflow) {
      return res.status(400).json({
        success: false,
        error: 'Nome do workflow já existe'
      });
    }

    // Processar etapas (adicionar ordem sequencial)
    const processedSteps = steps.map((step, index) => ({
      ...step,
      order: index + 1,
      color: step.color || '#3B82F6',
      icon: step.icon || 'circle',
      settings: {
        allowClientAccess: step.settings?.allowClientAccess || false,
        requiresApproval: step.settings?.requiresApproval || false,
        allowMultipleFiles: step.settings?.allowMultipleFiles !== false,
        isClientApprovalStep: step.settings?.isClientApprovalStep || false
      }
    }));

    // Criar workflow
    const workflow = await Workflow.create({
      name,
      description,
      steps: processedSteps,
      isActive,
      isDefault,
      createdBy: req.user.id
    });

    // Popular dados do criador
    await workflow.populate('createdBy', 'name email');

    // Emitir notificação via socket
    req.io.emit('workflow-created', {
      message: `Novo fluxo de trabalho criado: ${workflow.name}`,
      workflow: workflow
    });

    res.status(201).json({
      success: true,
      data: workflow
    });

  } catch (error) {
    console.error('Erro ao criar workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   PUT /api/workflows/:id
// @desc    Atualizar workflow
// @access  Private (Admin)
router.put('/:id', [
  authorize('admin'),
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
  body('steps')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Deve ter pelo menos uma etapa'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive deve ser boolean'),
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault deve ser boolean')
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

    const workflowId = req.params.id;
    const updates = req.body;

    // Verificar se workflow existe
    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow não encontrado'
      });
    }

    // Verificar nome único se estiver sendo alterado
    if (updates.name && updates.name !== workflow.name) {
      const existingWorkflow = await Workflow.findOne({ name: updates.name });
      if (existingWorkflow) {
        return res.status(400).json({
          success: false,
          error: 'Nome do workflow já existe'
        });
      }
    }

    // Processar etapas se estiver sendo alterado
    if (updates.steps) {
      updates.steps = updates.steps.map((step, index) => ({
        ...step,
        _id: step._id || undefined, // Manter ID se existir
        order: index + 1,
        color: step.color || '#3B82F6',
        icon: step.icon || 'circle',
        settings: {
          allowClientAccess: step.settings?.allowClientAccess || false,
          requiresApproval: step.settings?.requiresApproval || false,
          allowMultipleFiles: step.settings?.allowMultipleFiles !== false,
          isClientApprovalStep: step.settings?.isClientApprovalStep || false
        }
      }));
    }

    // Atualizar workflow
    const updatedWorkflow = await Workflow.findByIdAndUpdate(
      workflowId,
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      data: updatedWorkflow
    });

  } catch (error) {
    console.error('Erro ao atualizar workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   DELETE /api/workflows/:id
// @desc    Excluir workflow
// @access  Private (Admin)
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const workflowId = req.params.id;

    // Verificar se workflow existe
    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow não encontrado'
      });
    }

    // Verificar se é o workflow padrão
    if (workflow.isDefault) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível excluir o workflow padrão'
      });
    }

    // TODO: Verificar se workflow tem tarefas associadas
    // Por ora, vamos apenas inativar o workflow

    await Workflow.findByIdAndUpdate(workflowId, { isActive: false });

    res.status(200).json({
      success: true,
      message: 'Workflow inativado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao excluir workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   POST /api/workflows/:id/steps
// @desc    Adicionar etapa ao workflow
// @access  Private (Admin)
router.post('/:id/steps', [
  authorize('admin'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nome da etapa deve ter entre 2 e 50 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Descrição da etapa não pode ter mais que 200 caracteres')
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

    const workflowId = req.params.id;
    const stepData = req.body;

    // Verificar se workflow existe
    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow não encontrado'
      });
    }

    // Adicionar etapa
    await workflow.addStep(stepData);

    res.status(200).json({
      success: true,
      data: workflow
    });

  } catch (error) {
    console.error('Erro ao adicionar etapa:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   DELETE /api/workflows/:id/steps/:stepId
// @desc    Remover etapa do workflow
// @access  Private (Admin)
router.delete('/:id/steps/:stepId', authorize('admin'), async (req, res) => {
  try {
    const { id: workflowId, stepId } = req.params;

    // Verificar se workflow existe
    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow não encontrado'
      });
    }

    // Remover etapa
    await workflow.removeStep(stepId);

    res.status(200).json({
      success: true,
      data: workflow
    });

  } catch (error) {
    console.error('Erro ao remover etapa:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
});

// @route   PUT /api/workflows/:id/reorder
// @desc    Reordenar etapas do workflow
// @access  Private (Admin)
router.put('/:id/reorder', [
  authorize('admin'),
  body('stepOrder')
    .isArray({ min: 1 })
    .withMessage('Ordem das etapas é obrigatória')
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

    const workflowId = req.params.id;
    const { stepOrder } = req.body;

    // Verificar se workflow existe
    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow não encontrado'
      });
    }

    // Reordenar etapas
    await workflow.reorderSteps(stepOrder);

    res.status(200).json({
      success: true,
      data: workflow
    });

  } catch (error) {
    console.error('Erro ao reordenar etapas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;