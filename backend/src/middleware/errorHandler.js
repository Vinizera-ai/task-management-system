const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error('❌ Erro:', err);

  // Erro de validação do Mongoose
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      message,
      status: 400
    };
  }

  // Erro de duplicação do MongoDB
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} já existe no sistema`;
    error = {
      message,
      status: 400
    };
  }

  // Erro de Cast do Mongoose (ID inválido)
  if (err.name === 'CastError') {
    const message = 'Recurso não encontrado';
    error = {
      message,
      status: 404
    };
  }

  // Erro de JWT
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token inválido';
    error = {
      message,
      status: 401
    };
  }

  // Erro de JWT expirado
  if (err.name === 'TokenExpiredError') {
    const message = 'Token expirado';
    error = {
      message,
      status: 401
    };
  }

  res.status(error.status || 500).json({
    success: false,
    error: error.message || 'Erro interno do servidor'
  });
};

module.exports = { errorHandler };