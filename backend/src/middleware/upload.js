const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

// Configuração de storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    
    // Criar diretório se não existir
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    // Criar subpastas por tipo
    let subfolder = 'others';
    if (file.mimetype.startsWith('image/')) {
      subfolder = 'images';
    } else if (file.mimetype.startsWith('video/')) {
      subfolder = 'videos';
    } else if (file.mimetype.includes('pdf') || file.mimetype.includes('document')) {
      subfolder = 'documents';
    }
    
    const subPath = path.join(uploadPath, subfolder);
    if (!fs.existsSync(subPath)) {
      fs.mkdirSync(subPath, { recursive: true });
    }
    
    cb(null, subPath);
  },
  filename: (req, file, cb) => {
    // Gerar nome único mantendo extensão original
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    const sanitizedName = file.originalname
      .replace(ext, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 50);
    
    const filename = `${Date.now()}_${uniqueId}_${sanitizedName}${ext}`;
    cb(null, filename);
  }
});

// Filtro de tipos de arquivo
const fileFilter = (req, file, cb) => {
  // Tipos permitidos
  const allowedTypes = [
    // Imagens
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Vídeos
    'video/mp4',
    'video/mov',
    'video/avi',
    'video/wmv',
    'video/quicktime',
    // Documentos
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}`), false);
  }
};

// Configuração do multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 209715200, // 200MB
    files: 10 // Máximo 10 arquivos por vez
  }
});

// Middleware para redimensionar imagens
const resizeImage = async (req, res, next) => {
  if (!req.files && !req.file) {
    return next();
  }

  const files = req.files || [req.file];
  
  try {
    for (const file of files) {
      if (file && file.mimetype.startsWith('image/') && file.mimetype !== 'image/svg+xml') {
        const inputPath = file.path;
        const outputPath = inputPath.replace(/(\.[^.]+)$/, '_optimized$1');
        
        // Redimensionar e otimizar imagem
        await sharp(inputPath)
          .resize(2000, 2000, { 
            fit: 'inside',
            withoutEnlargement: true 
          })
          .jpeg({ 
            quality: 85,
            progressive: true 
          })
          .png({ 
            quality: 85,
            compressionLevel: 6 
          })
          .toFile(outputPath);
        
        // Substituir arquivo original pelo otimizado
        fs.unlinkSync(inputPath);
        fs.renameSync(outputPath, inputPath);
        
        // Atualizar informações do arquivo
        const stats = fs.statSync(inputPath);
        file.size = stats.size;
      }
    }
    
    next();
  } catch (error) {
    console.error('Erro ao processar imagem:', error);
    next(error);
  }
};

// Middleware para validar arquivo único
const uploadSingle = (fieldName) => {
  return [
    upload.single(fieldName),
    resizeImage
  ];
};

// Middleware para múltiplos arquivos
const uploadMultiple = (fieldName, maxCount = 10) => {
  return [
    upload.array(fieldName, maxCount),
    resizeImage
  ];
};

// Middleware para múltiplos campos
const uploadFields = (fields) => {
  return [
    upload.fields(fields),
    resizeImage
  ];
};

// Função para deletar arquivo
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    return false;
  }
};

// Função para obter informações do arquivo
const getFileInfo = (file) => {
  return {
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path,
    url: `/uploads/${path.basename(path.dirname(file.path))}/${file.filename}`
  };
};

// Função para validar tamanho de arquivo
const validateFileSize = (size, maxSize = 209715200) => {
  return size <= maxSize;
};

// Função para obter extensão segura
const getSafeExtension = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', 
                       '.mp4', '.mov', '.avi', '.wmv', '.pdf', '.doc', 
                       '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv'];
  
  return allowedExts.includes(ext) ? ext : '.unknown';
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  resizeImage,
  deleteFile,
  getFileInfo,
  validateFileSize,
  getSafeExtension
};