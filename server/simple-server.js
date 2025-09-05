// 简化版后端服务 - 快速修复登录问题
const express = require('express')
const cors = require('cors')
const path = require('path')
const multer = require('multer')
const fs = require('fs')

const app = express()
const PORT = 3002

// 确保上传目录存在
const uploadsDir = path.join(__dirname, 'uploads/images')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// 中间件
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}))

app.use(express.json({ limit: '10mb' }))

// 静态文件服务
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
  }
}))

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/api/status', (req, res) => {
  res.json({ message: '简化版API服务运行中', version: '1.0.0-simple' })
})

// 模拟登录API
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body
  
  console.log('登录尝试:', { email, password: password ? '***' : 'empty' })
  
  // 简单验证
  if (!email || !password) {
    return res.status(400).json({ error: '邮箱和密码不能为空' })
  }
  
  // 模拟成功登录
  res.json({
    message: '登录成功',
    user: {
      id: 'user-001',
      email: email,
      name: '测试用户'
    },
    token: 'mock-jwt-token-' + Date.now()
  })
})

// 文档保存API
app.put('/api/documents/:id', (req, res) => {
  const { id } = req.params
  const { title, content, templateId } = req.body
  
  console.log('保存文档:', { id, title: title?.substring(0, 50) })
  
  res.json({
    message: '文档保存成功',
    document: {
      id: id,
      title: title || '未命名文档',
      content: content || '',
      templateId: templateId || 'simple-doc',
      updatedAt: new Date().toISOString()
    }
  })
})

// 图片上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 15)
    const ext = path.extname(file.originalname)
    cb(null, `${timestamp}-${randomStr}-${file.originalname}`)
  }
})

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
})

// 图片上传API
app.post('/api/uploads/images', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '没有上传文件' })
  }
  
  const imageUrl = `http://localhost:3002/api/uploads/images/${req.file.filename}`
  
  console.log('图片上传成功:', req.file.filename)
  
  res.json({
    message: '图片上传成功',
    imageUrl: imageUrl,
    filename: req.file.filename,
    size: req.file.size
  })
})

// 启动服务
app.listen(PORT, () => {
  console.log(`🚀 简化版服务运行在 http://localhost:${PORT}`)
  console.log(`📊 健康检查: http://localhost:${PORT}/health`)
  console.log(`🌐 CORS已启用`)
})