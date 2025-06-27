import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CloudArrowUpIcon,
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

function FileUpload({
  onFileSelect,
  selectedFiles = [],
  onRemoveFile,
  accept = 'image/*,video/*,.pdf,.doc,.docx,.txt',
  maxFiles = 10,
  maxSize = 200 * 1024 * 1024, // 200MB
  className = ''
}) {
  const onDrop = useCallback((acceptedFiles) => {
    // Validar número máximo de arquivos
    const totalFiles = selectedFiles.length + acceptedFiles.length
    if (totalFiles > maxFiles) {
      alert(`Máximo de ${maxFiles} arquivos permitidos`)
      return
    }

    // Validar tamanho dos arquivos
    const oversizedFiles = acceptedFiles.filter(file => file.size > maxSize)
    if (oversizedFiles.length > 0) {
      alert(`Alguns arquivos são muito grandes. Tamanho máximo: ${formatFileSize(maxSize)}`)
      return
    }

    // Adicionar arquivos selecionados
    const newFiles = [...selectedFiles, ...acceptedFiles]
    onFileSelect(newFiles)
  }, [selectedFiles, onFileSelect, maxFiles, maxSize])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi', '.wmv'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxSize,
    multiple: true
  })

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (file) => {
    const type = file.type
    if (type.startsWith('image/')) {
      return <PhotoIcon className="w-8 h-8 text-blue-400" />
    } else if (type.startsWith('video/')) {
      return <VideoCameraIcon className="w-8 h-8 text-purple-400" />
    } else {
      return <DocumentIcon className="w-8 h-8 text-green-400" />
    }
  }

  const getFilePreview = (file) => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file)
    }
    return null
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Área de Drop */}
      <motion.div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
          ${isDragActive 
            ? 'border-blue-400 bg-blue-500/10' 
            : 'border-white/30 hover:border-white/50 hover:bg-white/5'
          }
        `}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <input {...getInputProps()} />
        
        <CloudArrowUpIcon className="w-12 h-12 text-white/40 mx-auto mb-4" />
        
        <div className="space-y-2">
          <p className="text-white font-medium">
            {isDragActive 
              ? 'Solte os arquivos aqui...'
              : 'Arraste arquivos ou clique para selecionar'
            }
          </p>
          <p className="text-white/60 text-sm">
            Máximo {maxFiles} arquivos • Tamanho máximo {formatFileSize(maxSize)}
          </p>
          <p className="text-white/40 text-xs">
            Imagens, vídeos, PDF, DOC, DOCX, TXT
          </p>
        </div>
      </motion.div>

      {/* Lista de Arquivos Selecionados */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <h4 className="text-sm font-medium text-white/80">
              Arquivos Selecionados ({selectedFiles.length})
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedFiles.map((file, index) => (
                <motion.div
                  key={`${file.name}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="glass-subtle rounded-lg p-3 flex items-center space-x-3"
                >
                  {/* Preview ou Ícone */}
                  <div className="flex-shrink-0">
                    {getFilePreview(file) ? (
                      <img
                        src={getFilePreview(file)}
                        alt={file.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                        {getFileIcon(file)}
                      </div>
                    )}
                  </div>

                  {/* Informações do arquivo */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {file.name}
                    </p>
                    <p className="text-white/60 text-xs">
                      {formatFileSize(file.size)}
                    </p>
                  </div>

                  {/* Botão de remover */}
                  <button
                    onClick={() => onRemoveFile(index)}
                    className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Informações adicionais */}
      {selectedFiles.length > 0 && (
        <div className="text-xs text-white/50 text-center">
          Total: {formatFileSize(selectedFiles.reduce((total, file) => total + file.size, 0))}
        </div>
      )}
    </div>
  )
}

export default FileUpload