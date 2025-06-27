const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Importar configurações
const connectDB = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');

// Importar rotas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const clientRoutes = require('./routes/clients');
const workflowRoutes = require('./routes/workflows');
const taskModelRoutes = require('./routes/taskModels');
const taskRoutes = require('./routes/tasks');
const uploadRoutes = require('./routes/uploads');

const app = express();
const server = createServer(app);

// Configuração do Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Conectar ao banco de dados
connectDB();

// Middlewares de segurança
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // limite de 1000 requests por windowMs
  message: 'Muitas tentativas, tente novamente em 15 minutos'
});
app.use(limiter);

// Middlewares gerais
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir arquivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Socket.IO para notificações em tempo real
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/task-models', taskModelRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/uploads', uploadRoutes);

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Sistema de Gerenciamento de Tarefas - API funcionando!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Middleware de tratamento de erros
app.use(errorHandler);

// Configuração do Socket.IO
io.on('connection', (socket) => {
  console.log('Usuário conectado:', socket.id);

  // Juntar-se a sala específica do usuário
  socket.on('join-user', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`Usuário ${userId} entrou na sala`);
  });

  // Juntar-se a sala específica da tarefa
  socket.on('join-task', (taskId) => {
    socket.join(`task-${taskId}`);
    console.log(`Usuário entrou na sala da tarefa ${taskId}`);
  });

  // Deixar sala da tarefa
  socket.on('leave-task', (taskId) => {
    socket.leave(`task-${taskId}`);
    console.log(`Usuário saiu da sala da tarefa ${taskId}`);
  });

  socket.on('disconnect', () => {
    console.log('Usuário desconectado:', socket.id);
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV}`);
  console.log(`🔗 API disponível em: http://localhost:${PORT}/api`);
});

module.exports = app;