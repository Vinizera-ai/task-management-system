import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon } from '@heroicons/react/24/outline'
import Button from './Button'

function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = ''
}) {
  // Tamanhos do modal
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  }

  // Fechar com ESC
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, closeOnEscape, onClose])

  // Prevenir scroll no body quando modal está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleOverlayClick}
          />

          {/* Modal */}
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className={`relative w-full ${sizes[size]} glass-strong rounded-2xl shadow-glass-lg ${className}`}
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                  {title && (
                    <h2 className="text-xl font-semibold text-white">
                      {title}
                    </h2>
                  )}
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="p-6">
                {children}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}

// Modal de confirmação
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar ação',
  message = 'Tem certeza que deseja continuar?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger',
  loading = false
}) {
  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
    >
      <div className="space-y-4">
        <p className="text-white/80">
          {message}
        </p>

        <div className="flex space-x-3 justify-end">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={type}
            onClick={handleConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// Modal de alerta
export function AlertModal({
  isOpen,
  onClose,
  title = 'Aviso',
  message,
  type = 'info',
  buttonText = 'OK'
}) {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅'
      case 'warning':
        return '⚠️'
      case 'error':
        return '❌'
      default:
        return 'ℹ️'
    }
  }

  const getTypeColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-400'
      case 'warning':
        return 'text-yellow-400'
      case 'error':
        return 'text-red-400'
      default:
        return 'text-blue-400'
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center">
          <span className={`text-2xl mr-3 ${getTypeColor()}`}>
            {getIcon()}
          </span>
          {title}
        </div>
      }
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-white/80">
          {message}
        </p>

        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={onClose}
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default Modal