// 统一配置入口
import { Environment, AppConfig } from './types'
import { developmentConfig } from './development'
import { stagingConfig } from './staging'
import { productionConfig } from './production'

// 获取当前环境
const getEnvironment = (): Environment => {
  // 前端：从Vite环境变量获取
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const mode = import.meta.env.MODE as string
    if (mode === 'staging' || mode === 'production') {
      return mode as Environment
    }
    return 'development'
  }
  
  // 后端：从Node环境变量获取
  if (typeof process !== 'undefined' && process.env) {
    const nodeEnv = process.env.NODE_ENV as string
    if (nodeEnv === 'staging' || nodeEnv === 'production') {
      return nodeEnv as Environment
    }
    return 'development'
  }
  
  // 默认：开发环境
  return 'development'
}

const ENV = getEnvironment()

// 配置映射
const configs: Record<Environment, AppConfig> = {
  development: developmentConfig,
  staging: stagingConfig,
  production: productionConfig,
}

// 导出当前环境的配置
export const config = configs[ENV]

// 导出环境判断函数
export const isDevelopment = (): boolean => ENV === 'development'
export const isStaging = (): boolean => ENV === 'staging'
export const isProduction = (): boolean => ENV === 'production'
export const getEnv = (): Environment => ENV

// 打印当前环境信息（仅开发环境）
if (isDevelopment() && typeof console !== 'undefined') {
  console.log('🌍 Current Environment:', ENV)
  console.log('📦 API Base URL:', config.api.baseUrl)
  console.log('💾 Database:', config.database.provider)
  console.log('🔧 Features:', Object.entries(config.features)
    .filter(([, enabled]) => enabled)
    .map(([name]) => name)
    .join(', ') || 'None')
}

// 导出类型
export type { Environment, AppConfig } from './types'
