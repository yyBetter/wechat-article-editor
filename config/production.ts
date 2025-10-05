// 生产环境配置
import { AppConfig } from './types'

export const productionConfig: AppConfig = {
  env: 'production',
  
  api: {
    baseUrl: process.env.VITE_API_BASE_URL || 'https://api.yourdomain.com',
    timeout: 5000,  // 5秒
    retries: 3,  // 重试3次
  },
  
  database: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL!,
    ssl: true,
    poolSize: 50,
  },
  
  wechat: {
    sandbox: false,  // 真实公众号
    validateSignature: true,  // 必须验证签名
    strictMode: true,  // 严格模式
  },
  
  ai: {
    provider: 'deepseek',
    apiKey: process.env.DEEPSEEK_API_KEY!,
    usageLimit: 100000,  // 每天10万次
    logPrompts: false,  // 不记录（隐私保护）
    cacheEnabled: true,  // 启用缓存
  },
  
  features: {
    analytics: true,  // 启用统计
    errorTracking: true,  // 启用错误追踪（Sentry）
    performanceMonitoring: true,  // 启用性能监控
  },
  
  security: {
    rateLimit: true,  // 严格限流
    corsOrigins: ['https://yourdomain.com'],
    allowedDomains: ['yourdomain.com'],
  },
  
  logging: {
    level: 'warn',  // 只记录警告和错误
    prettyPrint: false,
  },
}

// 生产环境安全检查
if (!process.env.DATABASE_URL) {
  throw new Error('❌ DATABASE_URL is required in production')
}

if (!process.env.DEEPSEEK_API_KEY) {
  throw new Error('❌ DEEPSEEK_API_KEY is required in production')
}
