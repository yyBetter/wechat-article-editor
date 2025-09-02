// 图片上传API工具函数
import { getStoredToken } from './auth-api'

const API_BASE_URL = 'http://localhost:3002/api'

// 图片信息接口类型定义
export interface ImageInfo {
  id: string
  filename: string
  originalName: string
  size: number
  mimetype: string
  url: string
  uploadedBy: string
  uploadedAt: string
}

export interface ImageUploadResponse {
  success: boolean
  data?: ImageInfo
  message?: string
  error?: string
}

export interface BatchImageUploadResponse {
  success: boolean
  data?: ImageInfo[]
  message?: string
  error?: string
}

// 创建请求头
function createHeaders(): Record<string, string> {
  const headers: Record<string, string> = {}
  
  const token = getStoredToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  
  return headers
}

// 上传单个图片
export async function uploadImage(file: File): Promise<ImageInfo> {
  const formData = new FormData()
  formData.append('image', file)
  
  const response = await fetch(`${API_BASE_URL}/uploads/image`, {
    method: 'POST',
    headers: createHeaders(),
    body: formData
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const result: ImageUploadResponse = await response.json()
  
  if (!result.success) {
    throw new Error(result.error || '图片上传失败')
  }

  return result.data!
}

// 批量上传图片
export async function uploadImages(files: File[]): Promise<ImageInfo[]> {
  const formData = new FormData()
  files.forEach(file => {
    formData.append('images', file)
  })
  
  const response = await fetch(`${API_BASE_URL}/uploads/images`, {
    method: 'POST',
    headers: createHeaders(),
    body: formData
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const result: BatchImageUploadResponse = await response.json()
  
  if (!result.success) {
    throw new Error(result.error || '批量上传失败')
  }

  return result.data!
}

// 删除图片
export async function deleteImage(filename: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/uploads/image/${filename}`, {
    method: 'DELETE',
    headers: createHeaders()
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const result = await response.json()
  
  if (!result.success) {
    throw new Error(result.error || '删除图片失败')
  }
}

// 获取图片信息
export async function getImageInfo(filename: string): Promise<ImageInfo> {
  const response = await fetch(`${API_BASE_URL}/uploads/image/${filename}/info`, {
    headers: createHeaders()
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const result = await response.json()
  
  if (!result.success) {
    throw new Error(result.error || '获取图片信息失败')
  }

  return result.data
}

// 生成图片完整访问URL
export function getImageUrl(imageUrl: string): string {
  if (imageUrl.startsWith('http')) {
    return imageUrl
  }
  return `${API_BASE_URL.replace('/api', '')}${imageUrl}`
}

// 从文件生成预览URL（客户端预览用）
export function createPreviewUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}