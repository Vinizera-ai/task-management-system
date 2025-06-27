const express = require('express');
const { body, validationResult } = require('express-validator');
const Client = require('../models/Client');
const { protect, authorize, protectClient } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas requerem autenticação (exceto acesso do cliente)
router.use(protect);

// @route   GET /api/clients
// @desc    Listar clientes
// @access  Private (Admin)
router.get('/', authorize('admin'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      search 
    } = req.query;

    // Construir filtros
    const filters = {};
    
    if (status) {
      filters.status = status;
    }
    
    if (search) {
      filters.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { responsibleName: { $regex: search, $options: 'i' } },
        { responsibleEmail: { $regex: search, $options: 'i' } }
      ];
    }

    // Buscar clientes com paginação
    const clients = await Client.find(filters)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Contar total
    const total = await Client.countDocuments(filters);

    res.status(200).json({
      success: true,
      data: clients,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   GET /api/clients/active
// @desc    Listar clientes ativos (para seletores)
// @access  Private
router.get('/active', async (req, res) => {
  try {
    const clients = await Client.findActive()
      .select('companyName logo responsibleName')
      .sort({ companyName: 1 });

    res.status(200).json({
      success: true,
      data: clients
    });

  } catch (error) {
    console.error('Erro ao listar clientes ativos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   GET /api/clients/:id
// @desc    Obter cliente específico
// @access  Private (Admin)
router.get('/:id', authorize('admin'), async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: client
    });

  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   POST /api/clients
// @desc    Criar novo cliente
// @access  Private (Admin)
router.post('/', [
  authorize('admin'),
  body('companyName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome da empresa deve ter entre 2 e 100 caracteres'),
  body('responsibleName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome do responsável deve ter entre 2 e 100 caracteres'),
  body('responsibleEmail')
    .isEmail()
    .normalizeEmail()
    .withMessage('E-mail do responsável inválido'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Telefone é obrigatório'),
  body('accessPassword')
    .isLength({ min: 4 })
    .withMessage('Senha de acesso deve ter pelo menos 4 caracteres')
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
      companyName,
      responsibleName,
      responsibleEmail,
      phone,
      accessPassword,
      status = 'active'
    } = req.body;

    // Verificar se e-mail do responsável já existe
    const existingClient = await Client.findOne({ responsibleEmail });
    if (existingClient) {
      return res.status(400).json({
        success: false,
        error: 'E-mail do responsável já está em uso'
      });
    }

    // Criar cliente
    const client = await Client.create({
      companyName,
      responsibleName,
      responsibleEmail,
      phone,
      accessPassword,
      status
    });

    // Emitir notificação via socket
    req.io.emit('client-created', {
      message: `Novo cliente criado: ${client.companyName}`,
      client: client
    });

    res.status(201).json({
      success: true,
      data: client
    });

  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   PUT /api/clients/:id
// @desc    Atualizar cliente
// @access  Private (Admin)
router.put('/:id', [
  authorize('admin'),
  body('companyName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome da empresa deve ter entre 2 e 100 caracteres'),
  body('responsibleName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome do responsável deve ter entre 2 e 100 caracteres'),
  body('responsibleEmail')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('E-mail do responsável inválido'),
  body('phone')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Telefone não pode ser vazio'),
  body('accessPassword')
    .optional()
    .isLength({ min: 4 })
    .withMessage('Senha de acesso deve ter pelo menos 4 caracteres'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status deve ser active ou inactive')
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

    const clientId = req.params.id;
    const updates = req.body;

    // Verificar se cliente existe
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado'
      });
    }

    // Verificar e-mail único se estiver sendo alterado
    if (updates.responsibleEmail && updates.responsibleEmail !== client.responsibleEmail) {
      const existingClient = await Client.findOne({ responsibleEmail: updates.responsibleEmail });
      if (existingClient) {
        return res.status(400).json({
          success: false,
          error: 'E-mail do responsável já está em uso'
        });
      }
    }

    // Atualizar cliente
    const updatedClient = await Client.findByIdAndUpdate(
      clientId,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedClient
    });

  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   DELETE /api/clients/:id
// @desc    Excluir cliente
// @access  Private (Admin)
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const clientId = req.params.id;

    // Verificar se cliente existe
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado'
      });
    }

    // TODO: Verificar se cliente tem tarefas associadas
    // Por ora, vamos apenas inativar o cliente em vez de excluir

    await Client.findByIdAndUpdate(clientId, { status: 'inactive' });

    res.status(200).json({
      success: true,
      message: 'Cliente inativado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   GET /api/clients/stats/overview
// @desc    Estatísticas dos clientes
// @access  Private (Admin)
router.get('/stats/overview', authorize('admin'), async (req, res) => {
  try {
    const stats = await Promise.all([
      Client.countDocuments({ status: 'active' }),
      Client.countDocuments({ status: 'inactive' }),
      Client.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, totalAccess: { $sum: '$accessCount' } } }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalActive: stats[0],
        totalInactive: stats[1],
        total: stats[0] + stats[1],
        totalAccess: stats[2][0]?.totalAccess || 0
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

// @route   POST /api/clients/access
// @desc    Acesso do cliente (sem middleware protect)
// @access  Public
router.post('/access', [
  body('clientId')
    .notEmpty()
    .withMessage('ID do cliente é obrigatório'),
  body('password')
    .notEmpty()
    .withMessage('Senha é obrigatória')
], async (req, res) => {
  // Remove middleware protect para esta rota
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

    const { clientId, password } = req.body;

    // Buscar cliente
    const client = await Client.findByClientId(clientId);

    if (!client) {
      return res.status(401).json({
        success: false,
        error: 'Cliente não encontrado'
      });
    }

    if (client.accessPassword !== password) {
      return res.status(401).json({
        success: false,
        error: 'Senha incorreta'
      });
    }

    // Atualizar último acesso
    await client.updateLastAccess();

    res.status(200).json({
      success: true,
      data: {
        clientId: client.clientId,
        companyName: client.companyName,
        logo: client.logo,
        responsibleName: client.responsibleName
      }
    });

  } catch (error) {
    console.error('Erro no acesso do cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;