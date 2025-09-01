// 后端服务入口文件
// 设计原则：完全独立运行，不影响前端现有功能

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import authRoutes from './routes/auth'
import documentRoutes from './routes/documents'

// 加载环境变量
dotenv.config()

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.PORT || 3002

// 中间件配置
app.use(helmet()) // 安全头
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}))
app.use(express.json({ limit: '10mb' })) // 支持较大的文档内容
app.use(express.urlencoded({ extended: true }))

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'wechat-editor-backend'
  })
})

// API路由
app.get('/api/status', (req, res) => {
  res.json({ 
    message: 'WeChat Editor Backend API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth/*',
      documents: '/api/documents/*', 
      versions: '/api/versions/*'
    }
  })
})

// 认证路由
app.use('/api/auth', authRoutes)

// 文档管理路由
app.use('/api/documents', documentRoutes)

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  })
})

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' })
})

// 启动服务器
async function startServer() {
  try {
    // 连接数据库
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`)
      console.log(`📊 Health check: http://localhost:${PORT}/health`)
      console.log(`🔧 API status: http://localhost:${PORT}/api/status`)
      console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL}`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...')
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server...')
  await prisma.$disconnect()
  process.exit(0)
})

startServer()