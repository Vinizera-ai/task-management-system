import React, { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { tasksService } from '@/services/tasksService'

import Button from '@/components/ui/Button'
import FileUpload from '@/components/ui/FileUpload'

import {
  ChatBubbleLeftRightIcon,
  PaperClipIcon,
  EyeIcon,
  EyeSlashIcon,
  DocumentIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'

import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'

function TaskComments({ taskId, users = [], canComment = false }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  const [newComment, setNewComment] = useState('')
  const [mentions, setMentions] = useState([])
  const [isInternal, setIsInternal] = useState(true)
  const [attachments, setAttachments] = useState([])
  const [showAttachments, setShowAttachments] = useState(false)

  // Query para buscar tarefa (para obter comentários)
  const { data: taskData } = queryClient.getQueryData(['task', taskId]) || {}
  const comments = taskData?.comments || []

  // Mutation para adicionar comentário
  const addCommentMutation = useMutation(
    ({ commentData, files }) => tasksService.addComment(taskId, commentData, files),
    {
      onSuccess: () => {
        toast.success('Comentário adicionado com sucesso!')
        queryClient.invalidateQueries(['task', taskId])
        setNewComment('')
        setMentions([])
        setAttachments([])
        setShowAttachments(false)
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Erro ao adicionar comentário')
      }
    }
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!newComment.trim() && attachments.length === 0) {
      toast.error('Adicione um comentário ou anexo')
      return
    }

    const commentData = {
      content: newComment.trim(),
      mentions,
      isInternal
    }

    addCommentMutation.mutate({
      commentData,
      files: attachments.length > 0 ? attachments : null
    })
  }

  const handleMention = (userId) => {
    if (!mentions.includes(userId)) {
      setMentions(prev => [...prev, userId])
    }
  }

  const removeMention = (userId) => {
    setMentions(prev => prev.filter(id => id !== userId))
  }

  const formatTimestamp = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: ptBR
      })
    } catch (error) {
      return 'Agora'
    }
  }

  const getMentionedUsers = (mentionIds) => {
    return users.filter(u => mentionIds.includes(u._id))
  }

  return (
    <div className="space-y-6">
      {/* Formulário de novo comentário */}
      {canComment && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
            Novo Comentário
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Texto do comentário */}
            <div>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={4}
                className="w-full input-glass rounded-lg text-white placeholder-white/40 resize-none"
                placeholder="Digite seu comentário..."
              />
            </div>

            {/* Opções */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Visibilidade */}
                <button
                  type="button"
                  onClick={() => setIsInternal(!isInternal)}
                  className={`flex items-center px-3 py-1 rounded-lg text-sm transition-colors ${
                    isInternal 
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-green-500/20 text-green-400'
                  }`}
                >
                  {isInternal ? (
                    <>
                      <EyeSlashIcon className="w-4 h-4 mr-1" />
                      Interno
                    </>
                  ) : (
                    <>
                      <EyeIcon className="w-4 h-4 mr-1" />
                      Visível ao cliente
                    </>
                  )}
                </button>

                {/* Anexos */}
                <button
                  type="button"
                  onClick={() => setShowAttachments(!showAttachments)}
                  className="flex items-center px-3 py-1 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <PaperClipIcon className="w-4 h-4 mr-1" />
                  Anexos ({attachments.length})
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setNewComment('')
                    setMentions([])
                    setAttachments([])
                    setShowAttachments(false)
                  }}
                  disabled={addCommentMutation.isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={addCommentMutation.isLoading}
                  disabled={!newComment.trim() && attachments.length === 0}
                >
                  Comentar
                </Button>
              </div>
            </div>

            {/* Upload de anexos */}
            <AnimatePresence>
              {showAttachments && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-white/10 pt-4"
                >
                  <FileUpload
                    onFileSelect={setAttachments}
                    selectedFiles={attachments}
                    onRemoveFile={(index) => {
                      setAttachments(prev => prev.filter((_, i) => i !== index))
                    }}
                    maxFiles={3}
                    maxSize={50 * 1024 * 1024} // 50MB
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Menções */}
            {mentions.length > 0 && (
              <div className="border-t border-white/10 pt-4">
                <p className="text-sm text-white/60 mb-2">Mencionando:</p>
                <div className="flex flex-wrap gap-2">
                  {getMentionedUsers(mentions).map(mentionedUser => (
                    <span
                      key={mentionedUser._id}
                      className="flex items-center px-2 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full"
                    >
                      @{mentionedUser.name}
                      <button
                        type="button"
                        onClick={() => removeMention(mentionedUser._id)}
                        className="ml-1 text-blue-300 hover:text-blue-200"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de usuários para mencionar */}
            {users.length > 0 && (
              <div className="border-t border-white/10 pt-4">
                <p className="text-sm text-white/60 mb-2">Mencionar usuários:</p>
                <div className="flex flex-wrap gap-2">
                  {users.filter(u => !mentions.includes(u._id) && u._id !== user.id).map(availableUser => (
                    <button
                      key={availableUser._id}
                      type="button"
                      onClick={() => handleMention(availableUser._id)}
                      className="flex items-center px-2 py-1 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-sm rounded-full transition-colors"
                    >
                      @{availableUser.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        </motion.div>
      )}

      {/* Lista de comentários */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <ChatBubbleLeftRightIcon className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">Nenhum comentário ainda</p>
            {canComment && (
              <p className="text-white/40 text-sm mt-2">
                Seja o primeiro a comentar nesta tarefa
              </p>
            )}
          </div>
        ) : (
          comments.map((comment, index) => (
            <motion.div
              key={comment._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`glass-card rounded-xl p-6 ${
                comment.isInternal ? 'border-l-4 border-blue-500/50' : 'border-l-4 border-green-500/50'
              }`}
            >
              {/* Header do comentário */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {comment.author?.profileImage ? (
                    <img
                      src={comment.author.profileImage}
                      alt={comment.author.name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-white/20"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {comment.author?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  <div>
                    <p className="font-medium text-white">
                      {comment.author?.name}
                    </p>
                    <p className="text-xs text-white/60">
                      {formatTimestamp(comment.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {comment.isInternal ? (
                    <span className="flex items-center px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                      <EyeSlashIcon className="w-3 h-3 mr-1" />
                      Interno
                    </span>
                  ) : (
                    <span className="flex items-center px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                      <EyeIcon className="w-3 h-3 mr-1" />
                      Visível ao cliente
                    </span>
                  )}
                </div>
              </div>

              {/* Conteúdo */}
              <div className="space-y-3">
                <p className="text-white/80 whitespace-pre-wrap">
                  {comment.content}
                </p>

                {/* Menções */}
                {comment.mentions && comment.mentions.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {comment.mentions.map(mentionedUser => (
                      <span
                        key={mentionedUser._id}
                        className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full"
                      >
                        @{mentionedUser.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Anexos */}
                {comment.attachments && comment.attachments.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                    {comment.attachments.map((attachment, attachIndex) => (
                      <div key={attachIndex} className="glass-subtle rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          {attachment.mimetype.startsWith('image/') ? (
                            <img
                              src={attachment.url}
                              alt={attachment.originalName}
                              className="w-10 h-10 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                              <DocumentIcon className="w-5 h-5 text-white/60" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-medium truncate">
                              {attachment.originalName}
                            </p>
                            <p className="text-white/60 text-xs">
                              {(attachment.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}

export default TaskComments