// 图片管理API工具函数 - 纯本地存储模式
import * as localAPI from './local-image-api'

// 图片信息接口
export interface ImageInfo {
  id: string
  filename: string
  originalName: string
  size: number
  mimetype: string
  url: string
  uploadedBy: string
  uploadedAt: string
  width?: number
  height?: number
}

export interface ImageUploadResponse {
  success: boolean
  message: string
  data: ImageInfo
}

export interface BatchImageUploadResponse {
  success: boolean
  message: string
  data: ImageInfo[]
  errors: string[]
}

// 上传单个图片
export async function uploadImage(file: File): Promise<ImageInfo> {
  return await localAPI.uploadImage(file)
}

// 批量上传图片
export async function uploadImages(files: File[]): Promise<ImageInfo[]> {
  return await localAPI.uploadImages(files)
}

// 删除图片
export async function deleteImage(filename: string): Promise<void> {
  return await localAPI.deleteImage(filename)
}

// 获取图片信息
export async function getImageInfo(filename: string): Promise<ImageInfo> {
  return await localAPI.getImageInfo(filename)
}

// 获取完整图片URL
export function getImageUrl(url: string | undefined): string {
  if (!url) return ''
  return localAPI.getImageUrl(url)
}

// 创建预览URL
export async function createPreviewUrl(file: File): Promise<string> {
  return await localAPI.createPreviewUrl(file)
}