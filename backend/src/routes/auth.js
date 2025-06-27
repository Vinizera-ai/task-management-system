const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Função para gerar JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  });
};

// @route   POST /api/auth/login
// @desc    Login de usuário
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('E-mail inválido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres')
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

    const { email, password } = req.body;

    // Verificar se usuário existe
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas'
      });
    }

    // Verificar se usuário está ativo
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: 'Usuário inativo'
      });
    }

    // Verificar senha
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas'
      });
    }

    // Atualizar último login
    user.lastLogin = new Date();
    await user.save();

    // Gerar token
    const token = generateToken(user._id);

    // Remover senha da resposta
    user.password = undefined;

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        position: user.position,
        profileImage: user.profileImage,
        phone: user.phone,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Obter dados do usuário logado
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        position: user.position,
        profileImage: user.profileImage,
        phone: user.phone,
        status: user.status,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   POST /api/auth/refresh
// @desc    Renovar token
// @access  Private
router.post('/refresh', protect, async (req, res) => {
  try {
    // Gerar novo token
    const token = generateToken(req.user.id);

    res.status(200).json({
      success: true,
      token
    });

  } catch (error) {
    console.error('Erro ao renovar token:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout (invalidar token - lado cliente)
// @access  Private
router.post('/logout', protect, async (req, res) => {
  try {
    // Em um sistema mais avançado, poderíamos manter uma blacklist de tokens
    // Por ora, o logout é feito apenas no frontend removendo o token

    res.status(200).json({
      success: true,
      message: 'Logout realizado com sucesso'
    });

  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   POST /api/auth/change-password
// @desc    Alterar senha do usuário
// @access  Private
router.post('/change-password', [
  protect,
  body('currentPassword')
    .isLength({ min: 6 })
    .withMessage('Senha atual é obrigatória'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Nova senha deve ter pelo menos 6 caracteres')
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

    const { currentPassword, newPassword } = req.body;

    // Buscar usuário com senha
    const user = await User.findById(req.user.id).select('+password');

    // Verificar senha atual
    const isCurrentPasswordValid = await user.matchPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Senha atual incorreta'
      });
    }

    // Atualizar senha
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Senha alterada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;