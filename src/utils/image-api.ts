// 图片上传API工具函数 - 支持本地和服务器存储
import { getStoredToken } from './auth-api'
import { getStorageConfig } from './storage-adapter'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002') + '/api'

// 动态导入本地图片API（避免循环依赖）
async function getLocalImageAPI() {
  const localAPI = await import('./local-image-api')
  return localAPI
}

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
  const config = getStorageConfig()
  
  // 如果是本地或混合模式，使用本地存储
  if (config.mode === 'local' || config.mode === 'hybrid') {
    try {
      const localAPI = await getLocalImageAPI()
      return await localAPI.uploadImage(file)
    } catch (error) {
      console.error('本地图片上传失败，降级到服务器模式:', error)
      // 如果本地上传失败且是混合模式，降级到服务器
      if (config.mode === 'hybrid') {
        // 继续执行服务器上传逻辑
      } else {
        throw error
      }
    }
  }
  
  // 服务器存储逻辑
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
  const config = getStorageConfig()
  
  // 如果是本地或混合模式，使用本地存储
  if (config.mode === 'local' || config.mode === 'hybrid') {
    try {
      const localAPI = await getLocalImageAPI()
      return await localAPI.uploadImages(files)
    } catch (error) {
      console.error('本地批量上传失败，降级到服务器模式:', error)
      // 如果本地上传失败且是混合模式，降级到服务器
      if (config.mode === 'hybrid') {
        // 继续执行服务器上传逻辑
      } else {
        throw error
      }
    }
  }
  
  // 服务器存储逻辑
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
  const config = getStorageConfig()
  
  // 如果是本地或混合模式，使用本地存储
  if (config.mode === 'local' || config.mode === 'hybrid') {
    try {
      const localAPI = await getLocalImageAPI()
      return await localAPI.deleteImage(filename)
    } catch (error) {
      console.error('本地图片删除失败，尝试服务器模式:', error)
      // 如果本地删除失败且是混合模式，尝试服务器删除
      if (config.mode === 'hybrid') {
        // 继续执行服务器删除逻辑
      } else {
        throw error
      }
    }
  }
  
  // 服务器存储逻辑
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
  const config = getStorageConfig()
  
  // 如果是本地或混合模式，使用本地存储
  if (config.mode === 'local' || config.mode === 'hybrid') {
    try {
      const localAPI = await getLocalImageAPI()
      return await localAPI.getImageInfo(filename)
    } catch (error) {
      console.error('本地图片信息获取失败，尝试服务器模式:', error)
      // 如果本地获取失败且是混合模式，尝试服务器
      if (config.mode === 'hybrid') {
        // 继续执行服务器获取逻辑
      } else {
        throw error
      }
    }
  }
  
  // 服务器存储逻辑
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
  const config = getStorageConfig()
  
  // 本地图片URL处理
  if (imageUrl.startsWith('/local-image/')) {
    return imageUrl // 本地图片返回标识符，由LocalImage组件处理
  }
  
  // 完整URL直接返回
  if (imageUrl.startsWith('http')) {
    return imageUrl
  }
  
  // 服务器相对路径处理
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