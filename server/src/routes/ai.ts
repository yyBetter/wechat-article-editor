// AI使用次数管理API
import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken } from '../middleware/auth'
import { createSuccessResponse, createErrorResponse } from '../utils/validation'

const router = express.Router()
const prisma = new PrismaClient()

// 获取AI使用情况
router.get('/usage', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json(createErrorResponse('未授权'))
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        aiUsageCount: true,
        aiUsageLimit: true,
        aiUsageResetAt: true,
        isAdmin: true
      }
    })

    if (!user) {
      return res.status(404).json(createErrorResponse('用户不存在'))
    }

    // 计算剩余次数
    const remaining = user.isAdmin ? -1 : Math.max(0, user.aiUsageLimit - user.aiUsageCount)
    const canUse = user.isAdmin || user.aiUsageCount < user.aiUsageLimit

    res.json(createSuccessResponse({
      used: user.aiUsageCount,
      limit: user.isAdmin ? -1 : user.aiUsageLimit, // -1表示无限
      remaining,
      canUse,
      isAdmin: user.isAdmin,
      resetAt: user.aiUsageResetAt
    }))
  } catch (error: any) {
    console.error('Get AI usage error:', error)
    res.status(500).json(createErrorResponse('获取AI使用情况失败'))
  }
})

// 增加AI使用次数
router.post('/usage/increment', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json(createErrorResponse('未授权'))
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        aiUsageCount: true,
        aiUsageLimit: true,
        isAdmin: true
      }
    })

    if (!user) {
      return res.status(404).json(createErrorResponse('用户不存在'))
    }

    // 管理员无限制
    if (user.isAdmin) {
      return res.json(createSuccessResponse({
        success: true,
        message: '管理员账号，无使用限制',
        used: user.aiUsageCount,
        remaining: -1
      }))
    }

    // 检查是否已达上限
    if (user.aiUsageCount >= user.aiUsageLimit) {
      return res.status(403).json(createErrorResponse(
        `AI使用次数已达上限（${user.aiUsageLimit}次），请联系管理员`,
        'USAGE_LIMIT_EXCEEDED'
      ))
    }

    // 增加使用次数
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        aiUsageCount: user.aiUsageCount + 1
      },
      select: {
        aiUsageCount: true,
        aiUsageLimit: true
      }
    })

    const remaining = Math.max(0, updated.aiUsageLimit - updated.aiUsageCount)

    res.json(createSuccessResponse({
      success: true,
      used: updated.aiUsageCount,
      limit: updated.aiUsageLimit,
      remaining,
      message: remaining === 0 ? '这是您的最后一次使用机会' : `剩余 ${remaining} 次`
    }))
  } catch (error: any) {
    console.error('Increment AI usage error:', error)
    res.status(500).json(createErrorResponse('更新AI使用次数失败'))
  }
})

// 重置AI使用次数（仅管理员）
router.post('/usage/reset/:targetUserId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId
    const { targetUserId } = req.params

    if (!userId) {
      return res.status(401).json(createErrorResponse('未授权'))
    }

    // 检查是否为管理员
    const admin = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true }
    })

    if (!admin?.isAdmin) {
      return res.status(403).json(createErrorResponse('仅管理员可以重置使用次数'))
    }

    // 重置目标用户的使用次数
    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        aiUsageCount: 0,
        aiUsageResetAt: new Date()
      }
    })

    res.json(createSuccessResponse({
      success: true,
      message: '使用次数已重置'
    }))
  } catch (error: any) {
    console.error('Reset AI usage error:', error)
    res.status(500).json(createErrorResponse('重置AI使用次数失败'))
  }
})

export default router
