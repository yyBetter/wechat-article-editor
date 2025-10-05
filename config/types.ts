// 环境配置类型定义
export type Environment = 'development' | 'staging' | 'production'

export interface AppConfig {
  // 环境标识
  env: Environment
  
  // API配置
  api: {
    baseUrl: string
    timeout: number
    retries: number
  }
  
  // 数据库配置
  database: {
    provider: 'sqlite' | 'postgresql'
    url: string
    ssl?: boolean
    poolSize?: number
  }
  
  // 微信公众号配置
  wechat: {
    sandbox: boolean  // 是否使用测试号
    validateSignature: boolean  // 是否验证签名
    strictMode?: boolean  // 严格模式（生产环境）
  }
  
  // AI服务配置
  ai: {
    provider: 'deepseek'
    apiKey: string
    usageLimit: number | null  // null表示无限制
    logPrompts?: boolean  // 是否记录prompts
    cacheEnabled?: boolean  // 是否启用缓存
  }
  
  // 功能开关
  features: {
    analytics: boolean  // 统计分析
    errorTracking: boolean  // 错误追踪
    performanceMonitoring: boolean  // 性能监控
  }
  
  // 安全配置
  security: {
    rateLimit: boolean  // API限流
    corsOrigins: string[]  // 允许的CORS来源
    allowedDomains: string[]  // 允许的域名
  }
  
  // 日志配置
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error'
    prettyPrint: boolean  // 是否格式化输出
  }
}
