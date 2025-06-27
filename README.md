# 🚀 Sistema de Gerenciamento de Tarefas para Agências

Sistema web moderno para gestão de tarefas operacionais de social media, desenvolvido com React, Node.js, MongoDB e Docker.

## ✨ Características

- **Design Moderno**: Interface clean com efeitos glassmorphism inspirados no iOS/Aero
- **Tempo Real**: Notificações instantâneas via Socket.IO
- **Responsivo**: Funciona perfeitamente em desktop e mobile
- **Seguro**: Autenticação JWT e validações robustas
- **Escalável**: Arquitetura preparada para cloud

## 🛠️ Stack Tecnológica

### Backend
- **Node.js** + Express.js
- **MongoDB** + Mongoose
- **JWT** para autenticação
- **Socket.IO** para tempo real
- **Multer** para upload de arquivos

### Frontend
- **React 18** + Vite
- **Tailwind CSS** com efeitos glassmorphism
- **React Query** para cache de dados
- **Fabric.js** para anotações em imagens
- **Framer Motion** para animações

### Infraestrutura
- **Docker** + Docker Compose
- **MongoDB** local
- **Volumes** persistentes para arquivos

## 🚀 Como Executar

### Pré-requisitos
- Docker e Docker Compose instalados
- Git instalado
- Porta 3000, 5000 e 27017 disponíveis

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd task-management-system
```

### 2. Execute com Docker
```bash
# Iniciar todos os serviços
docker-compose up -d

# Visualizar logs (opcional)
docker-compose logs -f
```

### 3. Acesse o sistema
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **MongoDB**: localhost:27017

### 4. Login inicial
- **E-mail**: admin@sistema.com
- **Senha**: admin123

## 📁 Estrutura do Projeto

```
task-management-system/
├── docker-compose.yml          # Orquestração dos containers
├── mongodb-init/               # Scripts de inicialização do DB
│   └── init.js
├── backend/                    # API Node.js
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── config/            # Configurações
│       ├── models/            # Modelos do MongoDB
│       ├── routes/            # Rotas da API
│       ├── middleware/        # Middlewares
│       └── server.js          # Servidor principal
└── frontend/                  # App React
    ├── Dockerfile
    ├── package.json
    ├── tailwind.config.js     # Configuração Tailwind
    └── src/
        ├── components/        # Componentes React
        ├── pages/            # Páginas
        ├── hooks/            # Hooks customizados
        ├── services/         # Serviços de API
        └── main.jsx          # Entry point
```

## 🔧 Comandos Úteis

```bash
# Parar todos os serviços
docker-compose down

# Reconstruir e iniciar
docker-compose up --build

# Ver logs específicos
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongodb

# Acessar shell do container
docker-compose exec backend sh
docker-compose exec frontend sh

# Limpar volumes (CUIDADO: apaga dados)
docker-compose down -v
```

## 📋 Fluxo de Trabalho Padrão

O sistema vem com um fluxo de 8 etapas para social media:

1. **Briefing** - Coleta de requisitos
2. **Estratégia** - Planejamento estratégico
3. **Criação** - Desenvolvimento do conteúdo
4. **Revisão Interna** - Revisão antes da apresentação
5. **Aprovação Cliente** - Apresentação ao cliente
6. **Ajustes** - Implementação de correções
7. **Publicação** - Publicação nas redes
8. **Relatório** - Análise de performance

## 🎯 Funcionalidades Principais

- ✅ **Gestão de Usuários** (Admin/Operacional)
- ✅ **Cadastro de Clientes** com links únicos
- ✅ **Fluxos de Trabalho** customizáveis
- ✅ **Modelos de Tarefa** reutilizáveis
- ✅ **Criação e Execução** de tarefas
- ✅ **Sistema de Aprovação** do cliente
- ✅ **Anotações em Imagens** com Fabric.js
- ✅ **Notificações em Tempo Real**
- ✅ **Upload de Arquivos** (200MB máximo)
- ✅ **Visualizações** Lista e Kanban
- ✅ **Histórico Completo** de alterações

## 🔐 Segurança

- Autenticação JWT com expiração de 30 dias
- Rate limiting (1000 requests/15min)
- Validação de entrada em todas as rotas
- Helmet para headers de segurança
- CORS configurado adequadamente

## 📊 Monitoramento

- Logs estruturados com Morgan
- Health check em `/api/health`
- Métricas de performance do fluxo
- Histórico de acessos dos clientes

## 🛠️ Desenvolvimento

Para desenvolver localmente:

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

## 📝 Próximas Funcionalidades

- [ ] Sistema de backup automático
- [ ] Integração com storage em nuvem (S3)
- [ ] Notificações por e-mail
- [ ] Dashboard analítico
- [ ] API mobile
- [ ] Integração com redes sociais
- [ ] Sistema de templates visuais

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para detalhes.

---

**Desenvolvido com ❤️ para agências de marketing que buscam eficiência e qualidade na gestão de suas tarefas.**