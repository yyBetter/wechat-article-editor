// AI使用次数管理工具
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 检查用户是否可以使用AI功能
 * @param userId 用户ID
 * @returns 是否可以使用（true=可以，false=已达上限）
 */
export async function checkAIUsage(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        aiUsageCount: true,
        aiUsageLimit: true,
        isAdmin: true
      }
    })

    if (!user) {
      return false
    }

    // 管理员无限制
    if (user.isAdmin) {
      return true
    }

    // 检查是否超限
    return user.aiUsageCount < user.aiUsageLimit
  } catch (error) {
    console.error('检查AI使用次数失败:', error)
    return false
  }
}

/**
 * 增加AI使用次数
 * @param userId 用户ID
 * @param feature AI功能名称（用于统计）
 */
export async function incrementAIUsage(userId: string, feature: string = 'unknown'): Promise<void> {
  try {
    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true, aiUsageCount: true }
    })

    // 管理员不计数
    if (user?.isAdmin) {
      console.log(`[AI Usage] 管理员用户 ${userId} 使用 ${feature}，不计数`)
      return
    }

    // 增加使用次数
    await prisma.user.update({
      where: { id: userId },
      data: {
        aiUsageCount: {
          increment: 1
        }
      }
    })

    console.log(`[AI Usage] 用户 ${userId} 使用 ${feature}，当前次数: ${user?.aiUsageCount + 1}`)
  } catch (error) {
    console.error('增加AI使用次数失败:', error)
  }
}

/**
 * 重置用户AI使用次数
 * @param userId 用户ID
 */
export async function resetAIUsage(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        aiUsageCount: 0,
        aiUsageResetAt: new Date()
      }
    })

    console.log(`[AI Usage] 已重置用户 ${userId} 的AI使用次数`)
  } catch (error) {
    console.error('重置AI使用次数失败:', error)
  }
}

/**
 * 获取用户AI使用情况
 * @param userId 用户ID
 */
export async function getAIUsage(userId: string): Promise<{
  count: number
  limit: number
  remaining: number
  isAdmin: boolean
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        aiUsageCount: true,
        aiUsageLimit: true,
        isAdmin: true
      }
    })

    if (!user) {
      return { count: 0, limit: 0, remaining: 0, isAdmin: false }
    }

    return {
      count: user.aiUsageCount,
      limit: user.aiUsageLimit,
      remaining: user.isAdmin ? -1 : Math.max(0, user.aiUsageLimit - user.aiUsageCount),
      isAdmin: user.isAdmin
    }
  } catch (error) {
    console.error('获取AI使用情况失败:', error)
    return { count: 0, limit: 0, remaining: 0, isAdmin: false }
  }
}

