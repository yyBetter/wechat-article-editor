// 开发环境配置
import { AppConfig } from './types'

export const developmentConfig: AppConfig = {
  env: 'development',
  
  api: {
    baseUrl: 'http://localhost:3002',
    timeout: 30000,  // 30秒，方便调试
    retries: 0,  // 不重试，快速失败
  },
  
  database: {
    provider: 'sqlite',
    url: 'file:./prisma/dev.db',
  },
  
  wechat: {
    sandbox: true,  // 使用测试号
    validateSignature: false,  // 开发环境不验证签名
  },
  
  ai: {
    provider: 'deepseek',
    apiKey: process.env.VITE_DEEPSEEK_API_KEY || '',
    usageLimit: null,  // 开发环境无限制
    logPrompts: true,  // 记录prompts用于调试
  },
  
  features: {
    analytics: false,  // 关闭统计
    errorTracking: false,  // 关闭错误追踪
    performanceMonitoring: false,  // 关闭性能监控
  },
  
  security: {
    rateLimit: false,  // 不限流
    corsOrigins: ['http://localhost:3001', 'http://localhost:5173'],
    allowedDomains: ['localhost'],
  },
  
  logging: {
    level: 'debug',  // 详细日志
    prettyPrint: true,  // 格式化输出
  },
}
