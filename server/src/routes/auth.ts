// 认证API路由
import express from 'express'
import { PrismaClient } from '@prisma/client'
import { hashPassword, verifyPassword, generateToken } from '../utils/auth'
import { registerSchema, loginSchema, createSuccessResponse, createErrorResponse } from '../utils/validation'
import { authenticateToken } from '../middleware/auth'

const router = express.Router()
const prisma = new PrismaClient()

// 用户注册
router.post('/register', async (req, res) => {
  try {
    // 验证输入数据
    const validatedData = registerSchema.parse(req.body)
    const { username, email, password } = validatedData

    // 检查邮箱是否已存在
    const existingEmail = await prisma.user.findUnique({
      where: { email }
    })
    if (existingEmail) {
      return res.status(400).json(createErrorResponse('该邮箱已被注册', 'EMAIL_EXISTS'))
    }

    // 检查用户名是否已存在
    const existingUsername = await prisma.user.findUnique({
      where: { username }
    })
    if (existingUsername) {
      return res.status(400).json(createErrorResponse('该用户名已被使用', 'USERNAME_EXISTS'))
    }

    // 加密密码
    const hashedPassword = await hashPassword(password)

    // 创建用户
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        preferences: JSON.stringify({
          theme: 'light',
          autoSave: true,
          defaultTemplate: 'simple-doc'
        }),
        brandSettings: JSON.stringify({
          logo: null,
          qrcode: null,
          dividers: [],
          brandColors: ['#1e6fff', '#333333', '#666666'],
          customCSS: ''
        })
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        isAdmin: true,
        aiUsageCount: true,
        aiUsageLimit: true,
        preferences: true,
        brandSettings: true,
        createdAt: true
      }
    })

    // 生成JWT token
    const token = generateToken({ userId: newUser.id, email: newUser.email })

    // 解析JSON字段
    const userData = {
      ...newUser,
      preferences: JSON.parse(newUser.preferences),
      brandSettings: JSON.parse(newUser.brandSettings)
    }

    res.status(201).json(createSuccessResponse({
      user: userData,
      token
    }))
  } catch (error: any) {
    console.error('Register error:', error)
    
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse(
        error.errors[0]?.message || '输入数据格式错误',
        'VALIDATION_ERROR'
      ))
    }
    
    res.status(500).json(createErrorResponse('注册失败，请稍后重试'))
  }
})

// 用户登录
router.post('/login', async (req, res) => {
  try {
    // 验证输入数据
    const validatedData = loginSchema.parse(req.body)
    const { email, password } = validatedData

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        username: true,
        email: true,
        password: true,
        avatar: true,
        isAdmin: true,
        aiUsageCount: true,
        aiUsageLimit: true,
        preferences: true,
        brandSettings: true,
        createdAt: true
      }
    })

    if (!user) {
      return res.status(401).json(createErrorResponse(
        '该邮箱尚未注册，请先注册账号', 
        'USER_NOT_FOUND'
      ))
    }

    // 验证密码
    const isPasswordValid = await verifyPassword(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json(createErrorResponse(
        '密码错误，请检查后重试', 
        'INVALID_PASSWORD'
      ))
    }

    // 生成JWT token
    const token = generateToken({ userId: user.id, email: user.email })

    // 准备返回数据（移除密码）
    const { password: _, ...userWithoutPassword } = user
    const userData = {
      ...userWithoutPassword,
      preferences: JSON.parse(user.preferences),
      brandSettings: JSON.parse(user.brandSettings)
    }

    res.json(createSuccessResponse({
      user: userData,
      token
    }))
  } catch (error: any) {
    console.error('Login error:', error)
    
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse(
        error.errors[0]?.message || '输入数据格式错误',
        'VALIDATION_ERROR'
      ))
    }
    
    res.status(500).json(createErrorResponse('登录失败，请稍后重试'))
  }
})

// 获取当前用户信息
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        isAdmin: true,
        aiUsageCount: true,
        aiUsageLimit: true,
        preferences: true,
        brandSettings: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      return res.status(404).json(createErrorResponse('用户不存在', 'USER_NOT_FOUND'))
    }

    // 解析JSON字段
    const userData = {
      ...user,
      preferences: JSON.parse(user.preferences),
      brandSettings: JSON.parse(user.brandSettings)
    }

    res.json(createSuccessResponse(userData))
  } catch (error) {
    console.error('Profile error:', error)
    res.status(500).json(createErrorResponse('获取用户信息失败'))
  }
})

// 更新用户信息
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { username, avatar, preferences, brandSettings } = req.body
    const userId = req.user!.id

    // 如果更新用户名，检查是否已存在
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          id: { not: userId }
        }
      })
      if (existingUser) {
        return res.status(400).json(createErrorResponse('该用户名已被使用', 'USERNAME_EXISTS'))
      }
    }

    // 准备更新数据
    const updateData: any = {}
    if (username !== undefined) updateData.username = username
    if (avatar !== undefined) updateData.avatar = avatar
    if (preferences !== undefined) updateData.preferences = JSON.stringify(preferences)
    if (brandSettings !== undefined) updateData.brandSettings = JSON.stringify(brandSettings)

    // 更新用户信息
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        isAdmin: true,
        aiUsageCount: true,
        aiUsageLimit: true,
        preferences: true,
        brandSettings: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // 解析JSON字段
    const userData = {
      ...updatedUser,
      preferences: JSON.parse(updatedUser.preferences),
      brandSettings: JSON.parse(updatedUser.brandSettings)
    }

    res.json(createSuccessResponse(userData))
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json(createErrorResponse('更新用户信息失败'))
  }
})

// Token验证接口
router.post('/verify', authenticateToken, async (req, res) => {
  res.json(createSuccessResponse({
    valid: true,
    user: req.user
  }))
})

// 保存微信公众号配置
router.put('/wechat-config', authenticateToken, async (req, res) => {
  try {
    const { appId, appSecret, isConnected, accountInfo } = req.body
    const userId = req.user!.id

    if (!appId || !appSecret) {
      return res.status(400).json(createErrorResponse('请提供AppID和AppSecret'))
    }

    // 保存配置
    const wechatConfig = {
      appId,
      appSecret,
      isConnected: !!isConnected,
      accountInfo: accountInfo || null
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        wechatConfig: JSON.stringify(wechatConfig)
      },
      select: {
        id: true,
        wechatConfig: true
      }
    })

    res.json(createSuccessResponse({
      config: JSON.parse(updatedUser.wechatConfig)
    }))
  } catch (error) {
    console.error('Save WeChat config error:', error)
    res.status(500).json(createErrorResponse('保存微信配置失败'))
  }
})

// 获取微信公众号配置
router.get('/wechat-config', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        wechatConfig: true
      }
    })

    if (!user) {
      return res.status(404).json(createErrorResponse('用户不存在'))
    }

    const config = JSON.parse(user.wechatConfig)
    
    // 不返回AppSecret给前端（安全考虑）
    res.json(createSuccessResponse({
      config: {
        appId: config.appId,
        isConnected: config.isConnected,
        accountInfo: config.accountInfo
      }
    }))
  } catch (error) {
    console.error('Get WeChat config error:', error)
    res.status(500).json(createErrorResponse('获取微信配置失败'))
  }
})

export default router