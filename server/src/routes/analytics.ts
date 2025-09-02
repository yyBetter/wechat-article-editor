// 统计数据API路由
import express from 'express'
import { authenticateToken } from '../middleware/auth'
import { trackEvent, getUsageStats, exportAnalyticsReport, AnalyticsEvent } from '../utils/analytics'
import { createSuccessResponse, createErrorResponse } from '../utils/validation'
import logger from '../utils/logger'

const router = express.Router()

// 记录用户行为事件
router.post('/track', async (req, res) => {
  try {
    const { event, properties } = req.body
    
    if (!event || !Object.values(AnalyticsEvent).includes(event)) {
      return res.status(400).json(createErrorResponse('无效的事件类型'))
    }
    
    await trackEvent({
      event,
      userId: req.user?.id, // 可能为空（匿名用户）
      sessionId: req.headers['x-session-id'] as string,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      properties
    })
    
    res.json(createSuccessResponse({ tracked: true }))
  } catch (error) {
    logger.error('Track event error:', error)
    res.status(500).json(createErrorResponse('记录事件失败'))
  }
})

// 获取使用统计（管理员功能）
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // 简单的管理员权限检查（可以扩展）
    const isAdmin = req.user?.email === process.env.ADMIN_EMAIL
    if (!isAdmin) {
      return res.status(403).json(createErrorResponse('权限不足'))
    }
    
    const days = parseInt(req.query.days as string) || 30
    const stats = await getUsageStats(days)
    
    res.json(createSuccessResponse(stats))
  } catch (error) {
    logger.error('Get stats error:', error)
    res.status(500).json(createErrorResponse('获取统计数据失败'))
  }
})

// 导出统计报告（管理员功能）
router.get('/report', authenticateToken, async (req, res) => {
  try {
    const isAdmin = req.user?.email === process.env.ADMIN_EMAIL
    if (!isAdmin) {
      return res.status(403).json(createErrorResponse('权限不足'))
    }
    
    const days = parseInt(req.query.days as string) || 30
    const report = await exportAnalyticsReport(days)
    
    // 设置下载响应头
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="analytics-report-${new Date().toISOString().split('T')[0]}.json"`)
    
    res.json(report)
  } catch (error) {
    logger.error('Export report error:', error)
    res.status(500).json(createErrorResponse('导出报告失败'))
  }
})

// 获取公开的基础统计（不需要认证）
router.get('/public-stats', async (req, res) => {
  try {
    const stats = await getUsageStats(30)
    
    // 只返回公开的统计信息
    const publicStats = {
      totalUsers: stats.totalUsers,
      documentsCreated: stats.documentsCreated,
      mostPopularTemplate: stats.templateStats[0] || null,
      generatedAt: new Date().toISOString()
    }
    
    res.json(createSuccessResponse(publicStats))
  } catch (error) {
    logger.error('Get public stats error:', error)
    res.status(500).json(createErrorResponse('获取公开统计失败'))
  }
})

export default router