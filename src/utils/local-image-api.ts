// 本地图片存储API - 替代服务器图片存储
import { getStorageAdapter } from './storage-adapter'
import { LocalStorageUtils, generateId } from './local-storage-utils'
import { ImageInfo, ImageUploadResponse, BatchImageUploadResponse } from './image-api'

// 本地图片信息扩展接口
interface LocalImageInfo extends ImageInfo {
  data: string // base64数据
  compressed?: boolean // 是否已压缩
  originalSize?: number // 原始文件大小
}

// 图片处理配置
const IMAGE_CONFIG = {
  maxSize: 2 * 1024 * 1024, // 2MB，超过此大小会压缩
  maxDimension: 1920, // 最大宽度或高度
  quality: 0.8, // 压缩质量
  supportedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
}

class LocalImageManager {
  private utils: LocalStorageUtils | null = null
  private initialized = false
  
  async initialize() {
    if (this.initialized) return
    
    try {
      const adapter = await getStorageAdapter()
      if (adapter.constructor.name !== 'LocalStorageAdapter' && 
          adapter.constructor.name !== 'HybridStorageAdapter') {
        throw new Error('本地图片存储只能在本地存储模式下使用')
      }
      
      // 获取LocalStorageAdapter实例
      const localAdapter = adapter.constructor.name === 'HybridStorageAdapter' 
        ? (adapter as any).getCurrentAdapter()
        : adapter
      
      this.utils = new LocalStorageUtils(localAdapter)
      this.initialized = true
      
      console.log('本地图片管理器已初始化')
    } catch (error) {
      console.error('本地图片管理器初始化失败:', error)
      throw error
    }
  }
  
  // 压缩图片
  private async compressImage(file: File): Promise<{ data: string; compressed: boolean; finalSize: number }> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        try {
          // 计算压缩后的尺寸
          let { width, height } = img
          const maxDim = IMAGE_CONFIG.maxDimension
          
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = (height * maxDim) / width
              width = maxDim
            } else {
              width = (width * maxDim) / height
              height = maxDim
            }
          }
          
          canvas.width = width
          canvas.height = height
          
          // 绘制并压缩
          ctx!.fillStyle = '#FFFFFF'
          ctx!.fillRect(0, 0, width, height)
          ctx!.drawImage(img, 0, 0, width, height)
          
          const quality = file.size > IMAGE_CONFIG.maxSize ? IMAGE_CONFIG.quality : 0.95
          const compressedData = canvas.toDataURL(
            file.type.includes('png') ? 'image/png' : 'image/jpeg', 
            quality
          )
          
          const finalSize = Math.round(compressedData.length * 0.75) // base64大小估算
          const wasCompressed = finalSize < file.size
          
          resolve({
            data: compressedData,
            compressed: wasCompressed,
            finalSize
          })
        } catch (error) {
          reject(error)
        }
      }
      
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = URL.createObjectURL(file)
    })
  }
  
  // 将File转换为base64
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
  
  // 验证文件类型
  private validateFile(file: File): boolean {
    if (!IMAGE_CONFIG.supportedTypes.includes(file.type)) {
      throw new Error(`不支持的文件类型: ${file.type}`)
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB限制
      throw new Error('文件太大，最大支持10MB')
    }
    
    return true
  }
  
  // 上传单个图片（本地存储）
  async uploadImage(file: File): Promise<ImageInfo> {
    await this.initialize()
    this.validateFile(file)
    
    const imageId = generateId()
    const filename = `${imageId}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    
    try {
      // 处理图片
      const { data, compressed, finalSize } = await this.compressImage(file)
      
      // 创建图片记录
      const imageInfo: LocalImageInfo = {
        id: imageId,
        filename,
        originalName: file.name,
        size: finalSize,
        mimetype: file.type,
        url: `/local-image/${imageId}`, // 本地URL标识
        uploadedBy: 'local-user',
        uploadedAt: new Date().toISOString(),
        data,
        compressed,
        originalSize: file.size
      }
      
      // 保存到IndexedDB
      await this.utils!.put('images', imageInfo)
      
      console.log(`图片已保存到本地存储: ${filename} (${compressed ? '已压缩' : '原始'})`)
      
      // 返回标准接口格式
      const { data: _, ...publicInfo } = imageInfo
      return publicInfo as ImageInfo
    } catch (error) {
      console.error('本地图片存储失败:', error)
      throw new Error(`图片存储失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
  
  // 批量上传图片
  async uploadImages(files: File[]): Promise<ImageInfo[]> {
    await this.initialize()
    
    const results: ImageInfo[] = []
    const errors: string[] = []
    
    for (const file of files) {
      try {
        const result = await this.uploadImage(file)
        results.push(result)
      } catch (error) {
        errors.push(`${file.name}: ${error instanceof Error ? error.message : '上传失败'}`)
      }
    }
    
    if (errors.length > 0) {
      console.warn('批量上传部分失败:', errors)
    }
    
    return results
  }
  
  // 删除图片
  async deleteImage(filename: string): Promise<void> {
    await this.initialize()
    
    // 从filename提取imageId
    const imageId = filename.split('_')[0]
    
    const deleted = await this.utils!.delete('images', imageId)
    if (!deleted) {
      throw new Error('图片未找到')
    }
    
    console.log(`图片已从本地删除: ${filename}`)
  }
  
  // 获取图片信息
  async getImageInfo(filename: string): Promise<ImageInfo> {
    await this.initialize()
    
    const imageId = filename.split('_')[0]
    const imageInfo = await this.utils!.get<LocalImageInfo>('images', imageId)
    
    if (!imageInfo) {
      throw new Error('图片未找到')
    }
    
    // 返回标准接口格式（不包含data）
    const { data: _, ...publicInfo } = imageInfo
    return publicInfo as ImageInfo
  }
  
  // 获取图片数据（用于显示）
  async getImageData(imageId: string): Promise<string> {
    await this.initialize()
    
    const imageInfo = await this.utils!.get<LocalImageInfo>('images', imageId)
    
    if (!imageInfo) {
      throw new Error('图片未找到')
    }
    
    return imageInfo.data
  }
  
  // 获取所有图片列表
  async getAllImages(): Promise<ImageInfo[]> {
    await this.initialize()
    
    const allImages = await this.utils!.getAll<LocalImageInfo>('images')
    
    // 返回标准接口格式
    return allImages.map(img => {
      const { data: _, ...publicInfo } = img
      return publicInfo as ImageInfo
    })
  }
  
  // 清理过期或未使用的图片
  async cleanupUnusedImages(referencedImageIds: string[]): Promise<number> {
    await this.initialize()
    
    const allImages = await this.utils!.getAll<LocalImageInfo>('images')
    let deletedCount = 0
    
    for (const image of allImages) {
      if (!referencedImageIds.includes(image.id)) {
        await this.utils!.delete('images', image.id)
        deletedCount++
      }
    }
    
    console.log(`清理了 ${deletedCount} 个未使用的图片`)
    return deletedCount
  }
}

// 全局实例
const localImageManager = new LocalImageManager()

// 导出与原API兼容的函数接口
export async function uploadImage(file: File): Promise<ImageInfo> {
  try {
    return await localImageManager.uploadImage(file)
  } catch (error) {
    throw error
  }
}

export async function uploadImages(files: File[]): Promise<ImageInfo[]> {
  try {
    return await localImageManager.uploadImages(files)
  } catch (error) {
    throw error
  }
}

export async function deleteImage(filename: string): Promise<void> {
  try {
    await localImageManager.deleteImage(filename)
  } catch (error) {
    throw error
  }
}

export async function getImageInfo(filename: string): Promise<ImageInfo> {
  try {
    return await localImageManager.getImageInfo(filename)
  } catch (error) {
    throw error
  }
}

// 本地图片URL处理 - 与原API兼容
export function getImageUrl(imageUrl: string): string {
  // 如果是本地图片URL，需要特殊处理
  if (imageUrl.startsWith('/local-image/')) {
    return imageUrl // 返回标识符，实际显示时需要通过getImageData获取
  }
  
  // 如果是完整URL，直接返回
  if (imageUrl.startsWith('http')) {
    return imageUrl
  }
  
  // 其他情况，按本地图片处理
  return imageUrl
}

// 从文件生成预览URL（与原API兼容）
export function createPreviewUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// 本地特有功能导出
export {
  localImageManager,
  IMAGE_CONFIG
}

// 用于在组件中获取本地图片数据的Hook辅助函数
export async function getLocalImageData(imageUrl: string): Promise<string | null> {
  if (!imageUrl.startsWith('/local-image/')) {
    return null // 不是本地图片
  }
  
  try {
    const imageId = imageUrl.replace('/local-image/', '')
    return await localImageManager.getImageData(imageId)
  } catch (error) {
    console.error('获取本地图片数据失败:', error)
    return null
  }
}