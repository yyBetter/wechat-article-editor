// 微信公众号发布API调用工具
import { getAuthHeaders } from './auth-api'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export interface WeChatPublishConfig {
  title: string
  author?: string
  content: string
  digest?: string
  coverImageUrl?: string
  coverImageBuffer?: string
  showCoverPic?: number
  needOpenComment?: number
  onlyFansCanComment?: number
  pushToFollowers?: boolean
}

export interface WeChatPublishResult {
  success: boolean
  data?: {
    mediaId: string
    publishId?: string
    msgDataId?: string
  }
  message?: string
}

/**
 * 测试微信API连接
 */
export async function testWeChatConnection(): Promise<{
  success: boolean
  message: string
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/wechat/test`, {
      method: 'GET',
      headers: getAuthHeaders()
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error('测试微信连接失败:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '连接失败'
    }
  }
}

/**
 * 上传封面图片到微信
 */
export async function uploadCoverImage(
  imageUrl?: string,
  imageBuffer?: string
): Promise<{
  success: boolean
  data?: {
    mediaId: string
    url?: string
  }
  message?: string
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/wechat/upload-cover`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageUrl,
        imageBuffer,
        imageType: 'image/jpeg'
      })
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error('上传封面失败:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '上传失败'
    }
  }
}

/**
 * 发布文章到微信公众号（完整流程）
 */
export async function publishToWeChat(
  config: WeChatPublishConfig
): Promise<WeChatPublishResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/wechat/publish-article`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('发布失败:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '发布失败'
    }
  }
}

/**
 * 将图片URL转换为base64
 */
export async function imageUrlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        // 移除 data:image/jpeg;base64, 前缀
        const base64Data = base64.split(',')[1]
        resolve(base64Data)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('图片转base64失败:', error)
    throw error
  }
}
