const express = require('express');
const path = require('path');
const fs = require('fs');
const { protect, authorize } = require('../middleware/auth');
const { uploadSingle, uploadMultiple, deleteFile, getFileInfo } = require('../middleware/upload');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(protect);

// @route   POST /api/uploads/single
// @desc    Upload de arquivo único
// @access  Private
router.post('/single', uploadSingle('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo enviado'
      });
    }

    const fileInfo = getFileInfo(req.file);

    res.status(200).json({
      success: true,
      message: 'Arquivo enviado com sucesso',
      file: fileInfo
    });

  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   POST /api/uploads/multiple
// @desc    Upload de múltiplos arquivos
// @access  Private
router.post('/multiple', uploadMultiple('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo enviado'
      });
    }

    const filesInfo = req.files.map(file => getFileInfo(file));

    res.status(200).json({
      success: true,
      message: `${req.files.length} arquivo(s) enviado(s) com sucesso`,
      files: filesInfo
    });

  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   POST /api/uploads/profile-image
// @desc    Upload de foto de perfil
// @access  Private
router.post('/profile-image', uploadSingle('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhuma imagem enviada'
      });
    }

    // Verificar se é imagem
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        error: 'Arquivo deve ser uma imagem'
      });
    }

    const fileInfo = getFileInfo(req.file);

    res.status(200).json({
      success: true,
      message: 'Foto de perfil enviada com sucesso',
      file: fileInfo
    });

  } catch (error) {
    console.error('Erro no upload da foto de perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   POST /api/uploads/client-logo
// @desc    Upload de logo do cliente
// @access  Private (Admin)
router.post('/client-logo', [
  authorize('admin'),
  uploadSingle('logo')
], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum logo enviado'
      });
    }

    // Verificar se é imagem
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        error: 'Logo deve ser uma imagem'
      });
    }

    const fileInfo = getFileInfo(req.file);

    res.status(200).json({
      success: true,
      message: 'Logo do cliente enviado com sucesso',
      file: fileInfo
    });

  } catch (error) {
    console.error('Erro no upload do logo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   GET /api/uploads/info/:filename
// @desc    Obter informações de um arquivo
// @access  Private
router.get('/info/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const { folder = 'others' } = req.query;

    const filePath = path.join(__dirname, '../../uploads', folder, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Arquivo não encontrado'
      });
    }

    const stats = fs.statSync(filePath);
    const fileInfo = {
      filename,
      folder,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      url: `/uploads/${folder}/${filename}`
    };

    res.status(200).json({
      success: true,
      file: fileInfo
    });

  } catch (error) {
    console.error('Erro ao obter informações do arquivo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   DELETE /api/uploads/:filename
// @desc    Deletar arquivo
// @access  Private (Admin)
router.delete('/:filename', authorize('admin'), async (req, res) => {
  try {
    const { filename } = req.params;
    const { folder = 'others' } = req.query;

    const filePath = path.join(__dirname, '../../uploads', folder, filename);

    const deleted = deleteFile(filePath);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Arquivo não encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Arquivo deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @route   GET /api/uploads/stats
// @desc    Estatísticas de uploads
// @access  Private (Admin)
router.get('/stats', authorize('admin'), async (req, res) => {
  try {
    const uploadsPath = path.join(__dirname, '../../uploads');
    
    const getDirectoryStats = (dirPath) => {
      if (!fs.existsSync(dirPath)) return { count: 0, size: 0 };
      
      const files = fs.readdirSync(dirPath);
      let totalSize = 0;
      let count = 0;

      files.forEach(file => {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          totalSize += stats.size;
          count++;
        }
      });

      return { count, size: totalSize };
    };

    const folders = ['images', 'videos', 'documents', 'others'];
    const stats = {};

    folders.forEach(folder => {
      const folderPath = path.join(uploadsPath, folder);
      stats[folder] = getDirectoryStats(folderPath);
    });

    const totalStats = Object.values(stats).reduce(
      (acc, curr) => ({
        count: acc.count + curr.count,
        size: acc.size + curr.size
      }),
      { count: 0, size: 0 }
    );

    res.status(200).json({
      success: true,
      data: {
        byFolder: stats,
        total: totalStats
      }
    });

  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;