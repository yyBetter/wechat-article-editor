// 数据验证工具
import { z } from 'zod'

// 用户注册验证
export const registerSchema = z.object({
  username: z.string()
    .min(2, '用户名至少2个字符')
    .max(20, '用户名不超过20个字符')
    .regex(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, '用户名只能包含字母、数字、下划线和中文'),
  email: z.string()
    .email('请输入有效的邮箱地址'),
  password: z.string()
    .min(6, '密码至少6个字符')
    .max(50, '密码不超过50个字符')
})

// 用户登录验证
export const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码')
})

// 用户信息更新验证
export const updateProfileSchema = z.object({
  username: z.string()
    .min(2, '用户名至少2个字符')
    .max(20, '用户名不超过20个字符')
    .regex(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, '用户名只能包含字母、数字、下划线和中文')
    .optional(),
  avatar: z.string().url('头像必须是有效的URL').optional(),
  preferences: z.record(z.any()).optional(),
  brandSettings: z.record(z.any()).optional()
})

// 通用响应类型
export type ApiResponse<T = any> = {
  success: boolean
  data?: T
  error?: string
  code?: string
  message?: string
}

// 创建成功响应
export function createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message }
}

// 创建错误响应
export function createErrorResponse(error: string, code?: string): ApiResponse {
  return { success: false, error, code }
}