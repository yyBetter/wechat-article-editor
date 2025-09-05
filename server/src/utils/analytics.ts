// 使用量统计分析系统
import { PrismaClient } from '@prisma/client'
import logger from './logger'

const prisma = new PrismaClient()

// 统计事件类型
export enum AnalyticsEvent {
  // 用户行为
  USER_REGISTER = 'user_register',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  
  // 文档操作
  DOCUMENT_CREATE = 'document_create',
  DOCUMENT_SAVE = 'document_save',
  DOCUMENT_EXPORT = 'document_export',
  DOCUMENT_DELETE = 'document_delete',
  
  // 模板使用
  TEMPLATE_SELECT = 'template_select',
  TEMPLATE_CHANGE = 'template_change',
  
  // 功能使用
  IMAGE_UPLOAD = 'image_upload',
  COPY_HTML = 'copy_html',
  PREVIEW_VIEW = 'preview_view',
  
  // 页面访问
  PAGE_VIEW = 'page_view',
  SESSION_START = 'session_start',
  SESSION_END = 'session_end'
}

// 统计数据接口
interface AnalyticsData {
  event: AnalyticsEvent
  userId?: string
  sessionId?: string
  ip?: string
  userAgent?: string
  properties?: Record<string, any>
  timestamp?: Date
}

// 记录统计事件
export async function trackEvent(data: AnalyticsData) {
  try {
    const event = await prisma.analyticsEvent.create({
      data: {
        eventType: data.event,
        eventData: data.properties ? JSON.stringify(data.properties) : '{}',
        userId: data.userId,
        sessionId: data.sessionId,
        ipAddress: data.ip,
        userAgent: data.userAgent
      }
    })
    
    logger.info(`Analytics event recorded: ${data.event}`, {
      eventId: event.id,
      userId: data.userId,
      source: 'analytics'
    })
    
    return event
  } catch (error) {
    logger.error('Failed to record analytics event', {
      error: error instanceof Error ? error.message : 'Unknown error',
      event: data.event,
      userId: data.userId
    })
  }
}

// 获取使用统计
export async function getUsageStats(days: number = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  try {
    // 总用户数
    const totalUsers = await prisma.user.count()
    
    // 活跃用户数
    const activeUsers = await prisma.analyticsEvent.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: startDate },
        userId: { not: null }
      },
      _count: true
    })
    
    // 文档创建数
    const documentsCreated = await prisma.analyticsEvent.count({
      where: {
        eventType: AnalyticsEvent.DOCUMENT_CREATE,
        createdAt: { gte: startDate }
      }
    })
    
    // 模板使用统计
    const templateStats = await prisma.analyticsEvent.groupBy({
      by: ['eventData'],
      where: {
        eventType: AnalyticsEvent.TEMPLATE_SELECT,
        createdAt: { gte: startDate }
      },
      _count: true
    })
    
    // 每日活跃用户
    const dailyActiveUsers = await prisma.$queryRaw`
      SELECT DATE(createdAt) as date, COUNT(DISTINCT userId) as users
      FROM analytics_events 
      WHERE createdAt >= ${startDate} AND userId IS NOT NULL
      GROUP BY DATE(createdAt)
      ORDER BY date DESC
    `
    
    // 页面访问量
    const pageViews = await prisma.analyticsEvent.count({
      where: {
        eventType: AnalyticsEvent.PAGE_VIEW,
        createdAt: { gte: startDate }
      }
    })
    
    return {
      totalUsers,
      activeUsers: activeUsers.length,
      documentsCreated,
      pageViews,
      templateStats: templateStats.map(stat => ({
        template: stat.eventData ? JSON.parse(stat.eventData as string) : null,
        count: stat._count
      })),
      dailyActiveUsers,
      period: `${days} days`
    }
  } catch (error) {
    logger.error('Failed to get usage stats', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    throw error
  }
}

// 实时统计中间件
export function analyticsMiddleware() {
  return async (req: any, res: any, next: any) => {
    // 记录页面访问
    if (req.method === 'GET') {
      await trackEvent({
        event: AnalyticsEvent.PAGE_VIEW,
        userId: req.user?.id,
        sessionId: req.sessionID || req.headers['x-session-id'],
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        properties: {
          path: req.path,
          query: req.query,
          referer: req.headers.referer
        }
      })
    }
    
    next()
  }
}

// 导出统计报告
export async function exportAnalyticsReport(days: number = 30) {
  const stats = await getUsageStats(days)
  
  const report = {
    generatedAt: new Date().toISOString(),
    period: `${days} days`,
    summary: {
      totalUsers: stats.totalUsers,
      activeUsers: stats.activeUsers,
      documentsCreated: stats.documentsCreated,
      pageViews: stats.pageViews,
      conversionRate: stats.totalUsers > 0 ? (stats.activeUsers / stats.totalUsers * 100).toFixed(2) + '%' : '0%'
    },
    templatePopularity: stats.templateStats,
    dailyActivity: stats.dailyActiveUsers
  }
  
  return report
}