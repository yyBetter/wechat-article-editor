// 图片上传API路由
import express from 'express'
import multer, { diskStorage } from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { authenticateToken } from '../middleware/auth'
import { createSuccessResponse, createErrorResponse } from '../utils/validation'

// Extend Express Request interface to include multer file properties
declare global {
  namespace Express {
    interface Request {
      file?: any
      files?: any
    }
  }
}

const router = express.Router()

// 确保uploads目录存在
const uploadsDir = path.join(__dirname, '../../uploads/images')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// 配置multer存储
const storage = diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir)
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名：时间戳-随机字符串-原始文件名
    const timestamp = Date.now()
    const randomString = crypto.randomBytes(8).toString('hex')
    const originalName = file.originalname
    const ext = path.extname(originalName)
    const nameWithoutExt = path.basename(originalName, ext)
    
    // 清理文件名，移除特殊字符
    const safeName = nameWithoutExt.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')
    const filename = `${timestamp}-${randomString}-${safeName}${ext}`
    
    cb(null, filename)
  }
})

// 文件过滤器
const fileFilter = (req: any, file: any, cb: any) => {
  // 检查文件类型
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('不支持的文件类型。请上传 JPG, PNG, GIF 或 WebP 格式的图片'))
  }
}

// 创建multer实例
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB 限制
  }
})

// 上传单个图片
router.post('/image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(createErrorResponse('未找到上传的文件'))
    }

    const userId = req.user!.id
    const file = req.file
    
    // 构建图片URL
    const imageUrl = `/api/uploads/images/${file.filename}`
    
    // 返回图片信息
    const imageInfo = {
      id: crypto.randomUUID(),
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: imageUrl,
      uploadedBy: userId,
      uploadedAt: new Date().toISOString()
    }

    console.log(`✅ 图片上传成功: ${file.originalname} -> ${file.filename} (${(file.size / 1024).toFixed(1)}KB)`)
    
    res.json(createSuccessResponse(imageInfo, '图片上传成功'))
  } catch (error) {
    console.error('图片上传失败:', error)
    res.status(500).json(createErrorResponse('图片上传失败: ' + (error as Error).message))
  }
})

// 批量上传图片
router.post('/images', authenticateToken, upload.array('images', 10), async (req, res) => {
  try {
    const files = req.files as any[]
    
    if (!files || files.length === 0) {
      return res.status(400).json(createErrorResponse('未找到上传的文件'))
    }

    const userId = req.user!.id
    
    const uploadedImages = files.map(file => {
      const imageUrl = `/api/uploads/images/${file.filename}`
      
      return {
        id: crypto.randomUUID(),
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        url: imageUrl,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString()
      }
    })

    console.log(`✅ 批量上传成功: ${files.length} 个文件`)
    
    res.json(createSuccessResponse(uploadedImages, `成功上传 ${files.length} 个图片`))
  } catch (error) {
    console.error('批量上传失败:', error)
    res.status(500).json(createErrorResponse('批量上传失败: ' + (error as Error).message))
  }
})

// 删除图片
router.delete('/image/:filename', authenticateToken, async (req, res) => {
  try {
    const { filename } = req.params
    const filePath = path.join(uploadsDir, filename)
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json(createErrorResponse('图片不存在'))
    }
    
    // 删除文件
    fs.unlinkSync(filePath)
    
    console.log(`🗑️ 图片删除成功: ${filename}`)
    res.json(createSuccessResponse({ filename }, '图片删除成功'))
  } catch (error) {
    console.error('图片删除失败:', error)
    res.status(500).json(createErrorResponse('图片删除失败: ' + (error as Error).message))
  }
})

// 获取图片信息
router.get('/image/:filename/info', authenticateToken, async (req, res) => {
  try {
    const { filename } = req.params
    const filePath = path.join(uploadsDir, filename)
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json(createErrorResponse('图片不存在'))
    }
    
    // 获取文件统计信息
    const stats = fs.statSync(filePath)
    const imageUrl = `/api/uploads/images/${filename}`
    
    const imageInfo = {
      filename: filename,
      size: stats.size,
      url: imageUrl,
      createdAt: stats.birthtime.toISOString(),
      modifiedAt: stats.mtime.toISOString()
    }
    
    res.json(createSuccessResponse(imageInfo))
  } catch (error) {
    console.error('获取图片信息失败:', error)
    res.status(500).json(createErrorResponse('获取图片信息失败: ' + (error as Error).message))
  }
})

export default router