// 认证工具函数
import bcrypt from 'bcryptjs'
import jwt, { SignOptions } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'
const JWT_EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN || '7d'

// 密码加密
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

// 密码验证
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// 生成JWT Token
export function generateToken(payload: { userId: string; email: string }): string {
  const options: any = { 
    expiresIn: JWT_EXPIRES_IN
  }
  return jwt.sign(payload, JWT_SECRET, options)
}

// 验证JWT Token
export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string }
    return decoded
  } catch (error) {
    return null
  }
}

// 从Authorization header提取token
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7) // 移除 "Bearer " 前缀
}