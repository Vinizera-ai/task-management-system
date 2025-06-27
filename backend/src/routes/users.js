const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(protect);

// @route   GET /api/users
// @desc    Listar usuários
// @access  Private (Admin)
router.get('/', authorize('admin'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      role, 
      search 
    } = req.query;

    // Construir filtros
    const filters = {};
    
    if (status) {
      filters.status = status;
    }
    
    if (role) {
      filters.role = role;
    }
    
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } }
      ];
    }

    // Buscar usuários com paginação
    const users = await User.find(filters)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Contar total
    const total = await User.countDocuments(filters);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   GET /api/users/active
// @desc    Listar usuários ativos (para seletores)
// @access  Private
router.get('/active', async (req, res) => {
  try {
    const users = await User.findActive()
      .select('name email role position profileImage')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Erro ao listar usuários ativos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Obter usuário específico
// @access  Private (Admin ou próprio usuário)
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Verificar se é admin ou próprio usuário
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        error: 'Sem permissão para acessar este usuário'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   POST /api/users
// @desc    Criar novo usuário
// @access  Private (Admin)
router.post('/', [
  authorize('admin'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('E-mail inválido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Telefone é obrigatório'),
  body('position')
    .trim()
    .notEmpty()
    .withMessage('Cargo é obrigatório'),
  body('role')
    .isIn(['admin', 'operational'])
    .withMessage('Role deve ser admin ou operational')
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
      email,
      password,
      phone,
      position,
      role,
      status = 'active'
    } = req.body;

    // Verificar se e-mail já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'E-mail já está em uso'
      });
    }

    // Criar usuário
    const user = await User.create({
      name,
      email,
      password,
      phone,
      position,
      role,
      status
    });

    // Remover senha da resposta
    user.password = undefined;

    // Emitir notificação via socket
    req.io.emit('user-created', {
      message: `Novo usuário criado: ${user.name}`,
      user: user
    });

    res.status(201).json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Atualizar usuário
// @access  Private (Admin ou próprio usuário)
router.put('/:id', [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('E-mail inválido'),
  body('phone')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Telefone não pode ser vazio'),
  body('position')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Cargo não pode ser vazio'),
  body('role')
    .optional()
    .isIn(['admin', 'operational'])
    .withMessage('Role deve ser admin ou operational'),
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

    const userId = req.params.id;
    const updates = req.body;

    // Verificar se usuário existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Verificar permissões
    const isAdmin = req.user.role === 'admin';
    const isOwnProfile = req.user.id === userId;

    if (!isAdmin && !isOwnProfile) {
      return res.status(403).json({
        success: false,
        error: 'Sem permissão para editar este usuário'
      });
    }

    // Se não é admin, não pode alterar role e status
    if (!isAdmin) {
      delete updates.role;
      delete updates.status;
    }

    // Verificar e-mail único se estiver sendo alterado
    if (updates.email && updates.email !== user.email) {
      const existingUser = await User.findOne({ email: updates.email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'E-mail já está em uso'
        });
      }
    }

    // Atualizar usuário
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      data: updatedUser
    });

  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Excluir usuário
// @access  Private (Admin)
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const userId = req.params.id;

    // Verificar se não está tentando excluir a si mesmo
    if (req.user.id === userId) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível excluir sua própria conta'
      });
    }

    // Verificar se usuário existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // TODO: Verificar se usuário tem tarefas associadas
    // Por ora, vamos apenas inativar o usuário em vez de excluir

    await User.findByIdAndUpdate(userId, { status: 'inactive' });

    res.status(200).json({
      success: true,
      message: 'Usuário inativado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   GET /api/users/stats/overview
// @desc    Estatísticas dos usuários
// @access  Private (Admin)
router.get('/stats/overview', authorize('admin'), async (req, res) => {
  try {
    const stats = await Promise.all([
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'inactive' }),
      User.countDocuments({ role: 'admin', status: 'active' }),
      User.countDocuments({ role: 'operational', status: 'active' })
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalActive: stats[0],
        totalInactive: stats[1],
        totalAdmins: stats[2],
        totalOperational: stats[3],
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