import React from 'react'
import { motion } from 'framer-motion'
import { Spinner } from './Loading'

function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon = null,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  // Variantes de estilo
  const variants = {
    primary: 'bg-gradient-primary text-white hover:shadow-glow border-transparent',
    secondary: 'glass-card text-white hover:bg-white/20 border-white/20',
    success: 'bg-gradient-success text-white hover:shadow-glow border-transparent',
    warning: 'bg-gradient-warning text-white hover:shadow-glow border-transparent',
    danger: 'bg-gradient-error text-white hover:shadow-glow border-transparent',
    ghost: 'bg-transparent text-white/80 hover:text-white hover:bg-white/10 border-transparent',
    outline: 'bg-transparent text-white border-white/30 hover:border-white/50 hover:bg-white/10'
  }

  // Tamanhos
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  }

  // Classes base
  const baseClasses = [
    'inline-flex items-center justify-center',
    'font-medium rounded-lg border',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-blue-500/50',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none',
    fullWidth ? 'w-full' : '',
    variants[variant],
    sizes[size],
    className
  ].filter(Boolean).join(' ')

  const isDisabled = disabled || loading

  const handleClick = (e) => {
    if (!isDisabled && onClick) {
      onClick(e)
    }
  }

  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      type={type}
      className={baseClasses}
      disabled={isDisabled}
      onClick={handleClick}
      {...props}
    >
      {/* Loading spinner */}
      {loading && (
        <Spinner size="sm" className="mr-2" />
      )}

      {/* Icon - left */}
      {icon && iconPosition === 'left' && !loading && (
        <span className="mr-2 flex-shrink-0">
          {React.cloneElement(icon, { className: 'w-4 h-4' })}
        </span>
      )}

      {/* Content */}
      <span className={loading ? 'opacity-70' : ''}>
        {children}
      </span>

      {/* Icon - right */}
      {icon && iconPosition === 'right' && !loading && (
        <span className="ml-2 flex-shrink-0">
          {React.cloneElement(icon, { className: 'w-4 h-4' })}
        </span>
      )}
    </motion.button>
  )
}

// Grupo de botões
export function ButtonGroup({ children, className = '' }) {
  return (
    <div className={`inline-flex rounded-lg overflow-hidden ${className}`}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            className: `${child.props.className || ''} ${
              index === 0 ? 'rounded-r-none' : 
              index === React.Children.count(children) - 1 ? 'rounded-l-none border-l-0' :
              'rounded-none border-l-0'
            }`.trim()
          })
        }
        return child
      })}
    </div>
  )
}

// Botão com ícone
export function IconButton({
  icon,
  children,
  tooltip,
  variant = 'ghost',
  size = 'md',
  className = '',
  ...props
}) {
  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
    xl: 'p-4'
  }

  const button = (
    <Button
      variant={variant}
      className={`${sizeClasses[size]} ${className}`}
      {...props}
    >
      {icon && React.cloneElement(icon, { className: 'w-5 h-5' })}
      {children}
    </Button>
  )

  if (tooltip) {
    return (
      <div className="relative group">
        {button}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          {tooltip}
        </div>
      </div>
    )
  }

  return button
}

// Botão flutuante
export function FloatingButton({
  icon,
  onClick,
  className = '',
  position = 'bottom-right',
  ...props
}) {
  const positions = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6'
  }

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={`${positions[position]} z-40`}
    >
      <Button
        variant="primary"
        size="lg"
        className={`rounded-full shadow-lg hover:shadow-xl ${className}`}
        onClick={onClick}
        {...props}
      >
        {icon && React.cloneElement(icon, { className: 'w-6 h-6' })}
      </Button>
    </motion.div>
  )
}

export default Button