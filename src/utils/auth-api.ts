// 认证API工具函数
// 与后端API通信的统一接口

// 在生产环境使用相对路径（通过Nginx代理），开发环境直连后端
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL 
  ? import.meta.env.VITE_API_BASE_URL + '/api'
  : (import.meta.env.DEV ? 'http://localhost:3002/api' : '/api')

export interface User {
  id: string
  username: string
  email: string
  avatar?: string
  isAdmin?: boolean
  aiUsageCount?: number
  aiUsageLimit?: number
  preferences: {
    theme: 'light' | 'dark'
    autoSave: boolean
    defaultTemplate: string
  }
  brandSettings: {
    logo?: string
    qrcode?: string
    dividers: string[]
    brandColors: string[]
    customCSS: string
  }
  createdAt: string
  updatedAt?: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

// 获取存储的token
export function getStoredToken(): string | null {
  return localStorage.getItem('auth_token')
}

// 存储token
export function storeToken(token: string): void {
  localStorage.setItem('auth_token', token)
}

// 清除token
export function clearStoredToken(): void {
  localStorage.removeItem('auth_token')
}

// 创建请求头
function createHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  
  const token = getStoredToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  
  return headers
}

// 导出获取认证头的函数（用于其他模块）
export function getAuthHeaders(): Record<string, string> {
  return createHeaders()
}

// 通用API请求函数
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...createHeaders(),
      ...options.headers
    }
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

// 用户注册
export async function registerUser(data: {
  username: string
  email: string
  password: string
}): Promise<AuthResponse> {
  const result = await apiRequest<ApiResponse<AuthResponse>>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data)
  })
  
  if (!result.success) {
    throw new Error(result.error || '注册失败')
  }
  
  return result.data!
}

// 用户登录
export async function loginUser(data: {
  email: string
  password: string
}): Promise<AuthResponse> {
  const result = await apiRequest<ApiResponse<AuthResponse>>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data)
  })
  
  if (!result.success) {
    throw new Error(result.error || '登录失败')
  }
  
  return result.data!
}

// 获取用户信息
export async function getUserProfile(): Promise<User> {
  const result = await apiRequest<ApiResponse<User>>('/auth/profile')
  
  if (!result.success) {
    throw new Error(result.error || '获取用户信息失败')
  }
  
  return result.data!
}

// 更新用户信息
export async function updateUserProfile(data: Partial<Pick<User, 'username' | 'avatar' | 'preferences' | 'brandSettings'>>): Promise<User> {
  const result = await apiRequest<ApiResponse<User>>('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data)
  })
  
  if (!result.success) {
    throw new Error(result.error || '更新用户信息失败')
  }
  
  return result.data!
}

// 验证token有效性
export async function verifyToken(): Promise<{ valid: boolean; user?: User }> {
  try {
    const result = await apiRequest<ApiResponse<{ valid: boolean; user: User }>>('/auth/verify', {
      method: 'POST'
    })
    
    return result.success ? result.data! : { valid: false }
  } catch (error) {
    return { valid: false }
  }
}

// 检查用户是否已登录
export function isAuthenticated(): boolean {
  return !!getStoredToken()
}
// AI使用次数API
export async function getAIUsage(): Promise<{
  used: number
  limit: number
  remaining: number
  canUse: boolean
  isAdmin: boolean
}> {
  const response = await fetch(`${API_BASE_URL}/ai/usage`, {
    method: 'GET',
    headers: getAuthHeaders()
  })
  
  if (!response.ok) {
    throw new Error('获取AI使用情况失败')
  }
  
  const result: ApiResponse = await response.json()
  if (!result.success || !result.data) {
    throw new Error(result.error || '获取AI使用情况失败')
  }
  
  return result.data
}

export async function incrementAIUsage(): Promise<{
  success: boolean
  used: number
  remaining: number
  message?: string
}> {
  const response = await fetch(`${API_BASE_URL}/ai/usage/increment`, {
    method: 'POST',
    headers: getAuthHeaders()
  })
  
  const result: ApiResponse = await response.json()
  
  if (!response.ok) {
    throw new Error(result.error || 'AI使用次数已达上限')
  }
  
  if (!result.success || !result.data) {
    throw new Error(result.error || '更新AI使用次数失败')
  }
  
  return result.data
}
