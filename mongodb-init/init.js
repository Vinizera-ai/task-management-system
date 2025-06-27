// Script de inicialização do MongoDB
// Este script cria o fluxo de trabalho padrão para social media

db = db.getSiblingDB('task_management');

// Criar fluxo de trabalho padrão para social media
db.workflows.insertOne({
  name: "Social Media - Fluxo Completo",
  description: "Fluxo de trabalho completo para criação de conteúdo de redes sociais",
  steps: [
    {
      name: "Briefing",
      description: "Coleta de informações e requisitos do cliente",
      order: 1,
      color: "#10B981",
      icon: "document-text",
      settings: {
        allowClientAccess: false,
        requiresApproval: false,
        allowMultipleFiles: true,
        isClientApprovalStep: false
      }
    },
    {
      name: "Estratégia",
      description: "Planejamento estratégico do conteúdo",
      order: 2,
      color: "#8B5CF6",
      icon: "light-bulb",
      settings: {
        allowClientAccess: false,
        requiresApproval: false,
        allowMultipleFiles: true,
        isClientApprovalStep: false
      }
    },
    {
      name: "Criação",
      description: "Desenvolvimento do conteúdo visual e textual",
      order: 3,
      color: "#F59E0B",
      icon: "paint-brush",
      settings: {
        allowClientAccess: false,
        requiresApproval: false,
        allowMultipleFiles: true,
        isClientApprovalStep: false
      }
    },
    {
      name: "Revisão Interna",
      description: "Revisão e ajustes internos antes da apresentação",
      order: 4,
      color: "#EF4444",
      icon: "eye",
      settings: {
        allowClientAccess: false,
        requiresApproval: true,
        allowMultipleFiles: true,
        isClientApprovalStep: false
      }
    },
    {
      name: "Aprovação Cliente",
      description: "Apresentação ao cliente para aprovação",
      order: 5,
      color: "#3B82F6",
      icon: "check-circle",
      settings: {
        allowClientAccess: true,
        requiresApproval: true,
        allowMultipleFiles: false,
        isClientApprovalStep: true
      }
    },
    {
      name: "Ajustes",
      description: "Implementação de ajustes solicitados pelo cliente",
      order: 6,
      color: "#F97316",
      icon: "wrench",
      settings: {
        allowClientAccess: false,
        requiresApproval: false,
        allowMultipleFiles: true,
        isClientApprovalStep: false
      }
    },
    {
      name: "Publicação",
      description: "Publicação do conteúdo nas redes sociais",
      order: 7,
      color: "#06B6D4",
      icon: "share",
      settings: {
        allowClientAccess: false,
        requiresApproval: false,
        allowMultipleFiles: true,
        isClientApprovalStep: false
      }
    },
    {
      name: "Relatório",
      description: "Análise de performance e relatório final",
      order: 8,
      color: "#84CC16",
      icon: "chart-bar",
      settings: {
        allowClientAccess: true,
        requiresApproval: false,
        allowMultipleFiles: true,
        isClientApprovalStep: false
      }
    }
  ],
  isActive: true,
  isDefault: true,
  stats: {
    totalTasks: 0,
    completedTasks: 0,
    averageCompletionTime: 0
  },
  createdAt: new Date(),
  updatedAt: new Date()
});

// Criar índices para otimizar consultas
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "status": 1 });
db.users.createIndex({ "role": 1 });

db.clients.createIndex({ "companyName": 1 });
db.clients.createIndex({ "status": 1 });
db.clients.createIndex({ "clientId": 1 }, { unique: true });
db.clients.createIndex({ "responsibleEmail": 1 });

db.workflows.createIndex({ "isActive": 1 });
db.workflows.createIndex({ "isDefault": 1 });
db.workflows.createIndex({ "createdBy": 1 });

db.tasks.createIndex({ "client": 1 });
db.tasks.createIndex({ "status": 1 });
db.tasks.createIndex({ "priority": 1 });
db.tasks.createIndex({ "dueDate": 1 });
db.tasks.createIndex({ "currentStep": 1 });
db.tasks.createIndex({ "assignedUsers": 1 });

print("✅ Banco de dados inicializado com sucesso!");
print("📋 Fluxo de trabalho padrão criado com 8 etapas");
print("🔍 Índices de otimização criados");