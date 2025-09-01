// 认证中间件
import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import { extractTokenFromHeader, verifyToken } from '../utils/auth'
import { createErrorResponse } from '../utils/validation'

const prisma = new PrismaClient()

// 扩展Request类型以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        username: string
      }
    }
  }
}

// 认证中间件 - 验证JWT并加载用户信息
export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractTokenFromHeader(req.headers.authorization)
    
    if (!token) {
      return res.status(401).json(createErrorResponse('未提供认证令牌', 'NO_TOKEN'))
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return res.status(401).json(createErrorResponse('无效的认证令牌', 'INVALID_TOKEN'))
    }

    // 从数据库获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, username: true }
    })

    if (!user) {
      return res.status(401).json(createErrorResponse('用户不存在', 'USER_NOT_FOUND'))
    }

    req.user = user
    next()
  } catch (error) {
    console.error('Authentication error:', error)
    res.status(500).json(createErrorResponse('认证服务器错误'))
  }
}

// 可选认证中间件 - 如果提供token则验证，否则继续
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractTokenFromHeader(req.headers.authorization)
    
    if (token) {
      const decoded = verifyToken(token)
      if (decoded) {
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, email: true, username: true }
        })
        if (user) {
          req.user = user
        }
      }
    }
    
    next()
  } catch (error) {
    // 可选认证失败时继续执行，不返回错误
    console.warn('Optional auth failed:', error)
    next()
  }
}