const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware para proteger rotas
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extrair token do header
      token = req.headers.authorization.split(' ')[1];

      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Buscar usuário e adicionar ao req
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Usuário não encontrado'
        });
      }

      if (req.user.status !== 'active') {
        return res.status(401).json({
          success: false,
          error: 'Usuário inativo'
        });
      }

      next();
    } catch (error) {
      console.error('Erro na autenticação:', error);
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      error: 'Token não fornecido'
    });
  }
};

// Middleware para autorizar roles específicas
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Sem permissão para acessar este recurso'
      });
    }

    next();
  };
};

// Middleware para autenticação de cliente (para aprovação de tarefas)
const protectClient = async (req, res, next) => {
  try {
    const { clientId, password } = req.body;

    if (!clientId || !password) {
      return res.status(400).json({
        success: false,
        error: 'ClientId e senha são obrigatórios'
      });
    }

    const Client = require('../models/Client');
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

    req.client = client;
    next();
  } catch (error) {
    console.error('Erro na autenticação do cliente:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  protect,
  authorize,
  protectClient
};