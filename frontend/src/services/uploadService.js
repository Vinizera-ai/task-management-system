import { upload } from './apiClient'

export const uploadService = {
  // Upload de arquivo único
  async uploadSingle(file, onProgress = null) {
    const formData = new FormData()
    formData.append('file', file)
    
    return await upload('/uploads/single', formData, onProgress)
  },

  // Upload de múltiplos arquivos
  async uploadMultiple(files, onProgress = null) {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })
    
    return await upload('/uploads/multiple', formData, onProgress)
  },

  // Upload de foto de perfil
  async uploadProfileImage(file, onProgress = null) {
    const formData = new FormData()
    formData.append('profileImage', file)
    
    return await upload('/uploads/profile-image', formData, onProgress)
  },

  // Upload de logo do cliente
  async uploadClientLogo(file, clientId, onProgress = null) {
    const formData = new FormData()
    formData.append('logo', file)
    formData.append('clientId', clientId)
    
    return await upload('/uploads/client-logo', formData, onProgress)
  },

  // Obter informações de um arquivo
  async getFileInfo(filename, folder = 'others') {
    return await get(`/uploads/info/${filename}`, { folder })
  },

  // Deletar arquivo
  async deleteFile(filename, folder = 'others') {
    return await del(`/uploads/${filename}`, { folder })
  },

  // Estatísticas de uploads
  async getUploadStats() {
    return await get('/uploads/stats')
  }
}