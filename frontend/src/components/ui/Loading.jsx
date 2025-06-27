import React from 'react'
import { motion } from 'framer-motion'

function Loading({ 
  size = 'md', 
  text = 'Carregando...', 
  fullScreen = false,
  className = '' 
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-strong rounded-2xl p-8 text-center"
        >
          <div className={`spinner mx-auto mb-4 ${sizeClasses[size]}`}></div>
          <p className={`text-white font-medium ${textSizeClasses[size]}`}>
            {text}
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <div className={`spinner mb-4 ${sizeClasses[size]}`}></div>
      {text && (
        <p className={`text-white/80 font-medium ${textSizeClasses[size]}`}>
          {text}
        </p>
      )}
    </div>
  )
}

// Componente para skeleton loading
export function Skeleton({ className = '', width = '100%', height = '1rem' }) {
  return (
    <div
      className={`skeleton rounded ${className}`}
      style={{ width, height }}
    />
  )
}

// Componente para loading de cards
export function CardSkeleton({ count = 1 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="glass-card rounded-xl p-6">
          <div className="animate-pulse">
            <div className="flex items-center space-x-4">
              <Skeleton width="48px" height="48px" className="rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton width="60%" height="20px" />
                <Skeleton width="40%" height="16px" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Skeleton width="100%" height="16px" />
              <Skeleton width="80%" height="16px" />
            </div>
            <div className="mt-4 flex space-x-2">
              <Skeleton width="80px" height="32px" className="rounded-lg" />
              <Skeleton width="60px" height="32px" className="rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Componente para loading de tabela
export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="animate-pulse">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, index) => (
              <Skeleton key={index} width="80%" height="20px" />
            ))}
          </div>
        </div>
        
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4 border-b border-white/5 last:border-b-0">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton key={colIndex} width="90%" height="16px" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Spinner simples
export function Spinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  return (
    <div className={`spinner ${sizeClasses[size]} ${className}`}></div>
  )
}

export default Loading