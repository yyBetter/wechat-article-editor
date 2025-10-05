// 测试环境配置
import { AppConfig } from './types'

export const stagingConfig: AppConfig = {
  env: 'staging',
  
  api: {
    baseUrl: process.env.VITE_API_BASE_URL || 'https://staging-api.yourdomain.com',
    timeout: 10000,  // 10秒
    retries: 2,  // 重试2次
  },
  
  database: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/staging_db',
    ssl: false,
    poolSize: 10,
  },
  
  wechat: {
    sandbox: false,  // 使用真实公众号（团队测试号）
    validateSignature: true,  // 验证签名
  },
  
  ai: {
    provider: 'deepseek',
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    usageLimit: 1000,  // 每天1000次
    logPrompts: true,  // 记录prompts
    cacheEnabled: true,
  },
  
  features: {
    analytics: true,  // 启用统计
    errorTracking: true,  // 启用错误追踪
    performanceMonitoring: true,  // 启用性能监控
  },
  
  security: {
    rateLimit: true,  // 启用限流
    corsOrigins: [
      'https://staging.yourdomain.com',
      'http://localhost:3001',  // 允许本地调试
    ],
    allowedDomains: ['staging.yourdomain.com'],
  },
  
  logging: {
    level: 'info',
    prettyPrint: false,
  },
}
