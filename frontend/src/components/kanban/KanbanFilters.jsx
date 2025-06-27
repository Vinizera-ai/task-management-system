import React from 'react'
import { motion } from 'framer-motion'
import Button from '@/components/ui/Button'

function KanbanFilters({ 
  filters, 
  onFilterChange, 
  onClearFilters, 
  clients = [], 
  users = [], 
  isAdmin = false 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="glass-card rounded-xl p-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cliente (apenas para admins) */}
        {isAdmin && (
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Cliente
            </label>
            <select
              value={filters.client}
              onChange={(e) => onFilterChange('client', e.target.value)}
              className="w-full input-glass rounded-lg text-white bg-transparent"
            >
              <option value="">Todos os clientes</option>
              {clients.map(client => (
                <option key={client._id} value={client._id}>
                  {client.companyName}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Responsável */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Responsável
          </label>
          <select
            value={filters.assignedTo}
            onChange={(e) => onFilterChange('assignedTo', e.target.value)}
            className="w-full input-glass rounded-lg text-white bg-transparent"
          >
            <option value="">Todos os responsáveis</option>
            {users.map(user => (
              <option key={user._id} value={user._id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>

        {/* Prioridade */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Prioridade
          </label>
          <select
            value={filters.priority}
            onChange={(e) => onFilterChange('priority', e.target.value)}
            className="w-full input-glass rounded-lg text-white bg-transparent"
          >
            <option value="">Todas as prioridades</option>
            <option value="high">Alta</option>
            <option value="medium">Média</option>
            <option value="low">Baixa</option>
          </select>
        </div>

        {/* Ações */}
        <div className="flex items-end">
          <Button
            variant="ghost"
            onClick={onClearFilters}
            className="w-full"
          >
            Limpar Filtros
          </Button>
        </div>
      </div>

      {/* Filtros ativos */}
      {Object.values(filters).some(v => v) && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-white/60">Filtros ativos:</span>
            {Object.entries(filters).map(([key, value]) => {
              if (!value) return null
              
              let label = value
              
              // Buscar label legível
              if (key === 'client') {
                const client = clients.find(c => c._id === value)
                label = client?.companyName || value
              } else if (key === 'assignedTo') {
                const user = users.find(u => u._id === value)
                label = user?.name || value
              } else if (key === 'priority') {
                label = value === 'high' ? 'Alta' : value === 'medium' ? 'Média' : 'Baixa'
              }
              
              return (
                <span
                  key={key}
                  className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full flex items-center space-x-1"
                >
                  <span>{label}</span>
                  <button
                    onClick={() => onFilterChange(key, '')}
                    className="text-blue-300 hover:text-blue-200"
                  >
                    ×
                  </button>
                </span>
              )
            })}
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default KanbanFilters