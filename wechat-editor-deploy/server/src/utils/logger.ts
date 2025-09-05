// 日志工具 - 生产环境日志管理
import winston from 'winston'
import path from 'path'

const logLevel = process.env.LOG_LEVEL || 'info'
const logFile = process.env.LOG_FILE || path.join(__dirname, '../../logs/app.log')

// 创建Winston日志实例
const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
      let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`
      
      // 添加堆栈信息（如果有错误）
      if (stack) {
        logMessage += `\n${stack}`
      }
      
      // 添加元数据
      if (Object.keys(meta).length > 0) {
        logMessage += `\nMeta: ${JSON.stringify(meta, null, 2)}`
      }
      
      return logMessage
    })
  ),
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
})

// 生产环境添加文件日志
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: logFile,
    maxsize: 10485760, // 10MB
    maxFiles: 5,
    tailable: true
  }))
  
  // 错误日志单独文件
  logger.add(new winston.transports.File({
    filename: logFile.replace('.log', '.error.log'),
    level: 'error',
    maxsize: 10485760, // 10MB
    maxFiles: 5,
    tailable: true
  }))
}

// 请求日志中间件配置
export const requestLoggerConfig = {
  format: ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms',
  stream: {
    write: (message: string) => {
      logger.info(message.trim(), { source: 'request' })
    }
  }
}

// 错误日志助手
export const logError = (error: Error, context?: any) => {
  logger.error(error.message, {
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  })
}

// 用户操作日志
export const logUserAction = (userId: string, action: string, details?: any) => {
  logger.info(`User action: ${action}`, {
    userId,
    action,
    details,
    source: 'user_action',
    timestamp: new Date().toISOString()
  })
}

// 系统性能日志
export const logPerformance = (operation: string, duration: number, meta?: any) => {
  logger.info(`Performance: ${operation}`, {
    operation,
    duration: `${duration}ms`,
    meta,
    source: 'performance',
    timestamp: new Date().toISOString()
  })
}

// 安全事件日志
export const logSecurityEvent = (event: string, details: any, severity: 'low' | 'medium' | 'high' = 'medium') => {
  const logLevel = severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info'
  
  logger.log(logLevel, `Security event: ${event}`, {
    event,
    details,
    severity,
    source: 'security',
    timestamp: new Date().toISOString()
  })
}

export default logger