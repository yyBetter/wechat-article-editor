// 后端服务入口文件
// 设计原则：生产就绪，安全可靠，性能优化

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import dotenv from 'dotenv'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import { RateLimiterMemory } from 'rate-limiter-flexible'
import logger, { requestLoggerConfig, logError, logSecurityEvent } from './utils/logger'
import authRoutes from './routes/auth'
import documentRoutes from './routes/documents'
import uploadRoutes from './routes/uploads'
import analyticsRoutes from './routes/analytics'
import wechatRoutes from './routes/wechat'
import aiRoutes from './routes/ai'
import voiceRoutes from './routes/voice'
import styleRoutes from './routes/style'
import platformRoutes from './routes/platform'
import { analyticsMiddleware } from './utils/analytics'

// 加载环境变量
dotenv.config()

// 速率限制配置 - 开发环境放宽限制
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production'

const rateLimiter = new RateLimiterMemory({
  points: isDevelopment ? 1000 : 100, // 开发环境1000次，生产环境100次
  duration: 900, // 15分钟时间窗口
})

// 登录限制器（更严格）- 开发环境放宽
const loginLimiter = new RateLimiterMemory({
  points: isDevelopment ? 100 : 5, // 开发环境100次，生产环境5次
  duration: 900,
  blockDuration: isDevelopment ? 0 : 900, // 开发环境不阻塞，生产环境阻塞15分钟
})

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.PORT || 3002

// 输出速率限制配置
console.log('🔒 速率限制配置:', {
  environment: isDevelopment ? 'development' : 'production',
  generalLimit: isDevelopment ? '1000 requests/15min' : '100 requests/15min',
  loginLimit: isDevelopment ? '100 attempts/15min' : '5 attempts/15min',
  blockDuration: isDevelopment ? '无阻塞' : '15分钟'
})

// 速率限制中间件
const rateLimitMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    await rateLimiter.consume(req.ip || 'unknown')
    next()
  } catch (rejRes: any) {
    const remainingTime = Math.round(rejRes.msBeforeNext / 1000) || 1
    logSecurityEvent('rate_limit_exceeded', { ip: req.ip, path: req.path }, 'medium')
    res.status(429).json({
      error: '请求过于频繁，请稍后重试',
      retryAfter: remainingTime
    })
  }
}

// 登录速率限制中间件
const loginRateLimitMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    await loginLimiter.consume(req.ip || 'unknown')
    next()
  } catch (rejRes: any) {
    const remainingTime = Math.round(rejRes.msBeforeNext / 1000) || 1
    logSecurityEvent('login_rate_limit_exceeded', { ip: req.ip, email: req.body?.email }, 'high')
    res.status(429).json({
      error: '登录尝试次数过多，请稍后重试',
      retryAfter: remainingTime
    })
  }
}

// 中间件配置
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}))

app.use(compression()) // Gzip压缩
app.use(morgan(requestLoggerConfig.format, { stream: requestLoggerConfig.stream })) // 请求日志

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3001',
    'http://localhost:3001', // 开发环境前端
    'http://localhost:3002'  // 后端自身，用于图片访问
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// 静态文件服务配置 - 允许跨域访问图片
app.use('/api/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res, path) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET')
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
  }
}))

app.use(express.json({ limit: '50mb' })) // 支持较大的文档内容和图片
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// 全局速率限制
app.use(rateLimitMiddleware)

// 使用量统计中间件（在路由之前）
app.use(analyticsMiddleware())

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

// 认证路由（带登录限制）
app.use('/api/auth/login', loginRateLimitMiddleware)
app.use('/api/auth/register', loginRateLimitMiddleware)
app.use('/api/auth', authRoutes)

// 文档管理路由
app.use('/api/documents', documentRoutes)

// 微信公众号发布路由
app.use('/api/wechat', wechatRoutes)

// 上传管理路由
app.use('/api/uploads', uploadRoutes)

// 统计数据路由
app.use('/api/analytics', analyticsRoutes)

// AI使用次数管理路由
app.use('/api/ai', aiRoutes)

// AI语音转文字路由
app.use('/api/voice', voiceRoutes)

// AI风格分析路由
app.use('/api/ai', styleRoutes)

// AI多平台适配路由
app.use('/api/ai', platformRoutes)

// 静态文件服务 - 为上传的图片提供访问路径（带缓存策略）
app.use('/api/uploads/images', express.static(path.join(__dirname, '../uploads/images'), {
  maxAge: '1y', // 缓存1年
  etag: true,
  lastModified: true
}))

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