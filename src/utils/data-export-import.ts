// 数据导入导出工具 - 支持本地数据的备份和迁移
import { getStorageAdapter } from './storage-adapter'
import { LocalStorageUtils, formatStorageSize } from './local-storage-utils'
import { Document } from './document-api'
import { DocumentVersion } from './version-api'
import { ImageInfo } from './image-api'

// 导出数据类型定义
export interface ExportData {
  version: string
  exportedAt: string
  exportedBy: string
  metadata: {
    totalDocuments: number
    totalVersions: number
    totalImages: number
    totalSize: number
  }
  documents: Document[]
  versions: DocumentVersion[]
  images: Array<ImageInfo & { data?: string }> // 本地图片包含数据
  settings?: Record<string, any>
}

// 导出选项
export interface ExportOptions {
  includeDocuments?: boolean
  includeVersions?: boolean
  includeImages?: boolean
  includeImageData?: boolean // 是否包含图片数据
  includeSettings?: boolean
  documentIds?: string[] // 只导出指定文档
  dateRange?: {
    from: string
    to: string
  }
  compression?: boolean
}

// 导入选项
export interface ImportOptions {
  overwriteExisting?: boolean
  mergeMode?: 'skip' | 'overwrite' | 'rename'
  validateData?: boolean
  onProgress?: (progress: { current: number; total: number; step: string }) => void
}

// 导入结果
export interface ImportResult {
  success: boolean
  imported: {
    documents: number
    versions: number
    images: number
  }
  skipped: {
    documents: number
    versions: number
    images: number
  }
  errors: string[]
  warnings: string[]
}

class DataManager {
  private utils: LocalStorageUtils | null = null
  private initialized = false

  async initialize() {
    if (this.initialized) return

    try {
      const adapter = await getStorageAdapter()
      this.utils = new LocalStorageUtils(adapter)
      this.initialized = true
      console.log('数据管理器已初始化')
    } catch (error) {
      console.error('数据管理器初始化失败:', error)
      throw error
    }
  }

  // 导出数据
  async exportData(options: ExportOptions = {}): Promise<ExportData> {
    await this.initialize()

    const {
      includeDocuments = true,
      includeVersions = true,
      includeImages = true,
      includeImageData = true,
      includeSettings = true,
      documentIds,
      dateRange
    } = options

    console.log('开始导出数据...', options)

    const exportData: ExportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      exportedBy: 'WeChat Editor Local Storage',
      metadata: {
        totalDocuments: 0,
        totalVersions: 0,
        totalImages: 0,
        totalSize: 0
      },
      documents: [],
      versions: [],
      images: []
    }

    try {
      // 导出文档
      if (includeDocuments) {
        let documents = await this.utils!.getAll<Document>('documents')

        // 按文档ID筛选
        if (documentIds && documentIds.length > 0) {
          documents = documents.filter(doc => documentIds.includes(doc.id))
        }

        // 按日期筛选
        if (dateRange) {
          documents = documents.filter(doc => {
            const docDate = new Date(doc.updatedAt)
            return docDate >= new Date(dateRange.from) && docDate <= new Date(dateRange.to)
          })
        }

        exportData.documents = documents
        exportData.metadata.totalDocuments = documents.length

        console.log(`导出了 ${documents.length} 个文档`)
      }

      // 导出版本历史
      if (includeVersions) {
        let versions = await this.utils!.getAll<DocumentVersion>('versions')

        // 如果有文档ID限制，只导出相关版本
        if (documentIds && documentIds.length > 0) {
          versions = versions.filter(version => {
            // 需要通过版本记录找到对应的文档ID
            return exportData.documents.some(doc => doc.id === version.id)
          })
        }

        // 按日期筛选
        if (dateRange) {
          versions = versions.filter(version => {
            const versionDate = new Date(version.createdAt)
            return versionDate >= new Date(dateRange.from) && versionDate <= new Date(dateRange.to)
          })
        }

        exportData.versions = versions
        exportData.metadata.totalVersions = versions.length

        console.log(`导出了 ${versions.length} 个版本记录`)
      }

      // 导出图片
      if (includeImages) {
        let images = await this.utils!.getAll<ImageInfo & { data?: string }>('images')

        // 是否包含图片数据
        if (includeImageData) {
          // 图片数据已经在IndexedDB中，直接导出
          console.log(`导出了 ${images.length} 个图片（包含数据）`)
        } else {
          // 移除图片数据，只导出元信息
          images = images.map(img => {
            const { data, ...imageInfo } = img
            return imageInfo
          })
          console.log(`导出了 ${images.length} 个图片（仅元信息）`)
        }

        exportData.images = images
        exportData.metadata.totalImages = images.length
      }

      // 导出设置
      if (includeSettings) {
        try {
          const settings = {
            storageConfig: localStorage.getItem('storage_config'),
            userPreferences: localStorage.getItem('user_preferences'),
            templateSettings: localStorage.getItem('template_settings')
          }
          exportData.settings = settings
        } catch (error) {
          console.warn('导出设置失败:', error)
        }
      }

      // 计算总大小
      exportData.metadata.totalSize = JSON.stringify(exportData).length

      console.log('数据导出完成:', exportData.metadata)
      return exportData
    } catch (error) {
      console.error('数据导出失败:', error)
      throw new Error(`数据导出失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 导入数据
  async importData(data: ExportData, options: ImportOptions = {}): Promise<ImportResult> {
    await this.initialize()

    const {
      overwriteExisting = false,
      mergeMode = 'skip',
      validateData = true,
      onProgress
    } = options

    console.log('开始导入数据...', { dataVersion: data.version, options })

    const result: ImportResult = {
      success: false,
      imported: { documents: 0, versions: 0, images: 0 },
      skipped: { documents: 0, versions: 0, images: 0 },
      errors: [],
      warnings: []
    }

    try {
      // 数据验证
      if (validateData) {
        const validation = await this.validateImportData(data)
        if (!validation.valid) {
          result.errors.push(...validation.errors)
          return result
        }
        if (validation.warnings.length > 0) {
          result.warnings.push(...validation.warnings)
        }
      }

      const totalItems = data.documents.length + data.versions.length + data.images.length
      let currentItem = 0

      // 导入文档
      for (const document of data.documents) {
        try {
          const existing = await this.utils!.get<Document>('documents', document.id)

          if (existing && !overwriteExisting) {
            if (mergeMode === 'skip') {
              result.skipped.documents++
              continue
            } else if (mergeMode === 'rename') {
              document.id = `${document.id}_imported_${Date.now()}`
              document.title = `${document.title} (导入)`
            }
          }

          await this.utils!.put('documents', document)
          result.imported.documents++

        } catch (error) {
          result.errors.push(`导入文档 ${document.title} 失败: ${error}`)
        }

        currentItem++
        onProgress?.({ current: currentItem, total: totalItems, step: '导入文档' })
      }

      // 导入版本历史
      for (const version of data.versions) {
        try {
          const existing = await this.utils!.get<DocumentVersion>('versions', version.id)

          if (existing && !overwriteExisting && mergeMode === 'skip') {
            result.skipped.versions++
            continue
          }

          if (existing && mergeMode === 'rename') {
            version.id = `${version.id}_imported_${Date.now()}`
          }

          await this.utils!.put('versions', version)
          result.imported.versions++

        } catch (error) {
          result.errors.push(`导入版本记录失败: ${error}`)
        }

        currentItem++
        onProgress?.({ current: currentItem, total: totalItems, step: '导入版本历史' })
      }

      // 导入图片
      for (const image of data.images) {
        try {
          const existing = await this.utils!.get('images', image.id)

          if (existing && !overwriteExisting && mergeMode === 'skip') {
            result.skipped.images++
            continue
          }

          if (existing && mergeMode === 'rename') {
            image.id = `${image.id}_imported_${Date.now()}`
            image.filename = `imported_${image.filename}`
          }

          await this.utils!.put('images', image)
          result.imported.images++

        } catch (error) {
          result.errors.push(`导入图片 ${image.filename} 失败: ${error}`)
        }

        currentItem++
        onProgress?.({ current: currentItem, total: totalItems, step: '导入图片' })
      }

      // 导入设置
      if (data.settings) {
        try {
          Object.entries(data.settings).forEach(([key, value]) => {
            if (value && typeof value === 'string') {
              localStorage.setItem(key, value)
            }
          })
          result.warnings.push('已导入应用设置')
        } catch (error) {
          result.warnings.push(`导入设置失败: ${error}`)
        }
      }

      result.success = result.errors.length === 0

      console.log('数据导入完成:', result)
      return result

    } catch (error) {
      console.error('数据导入失败:', error)
      result.errors.push(`导入失败: ${error instanceof Error ? error.message : '未知错误'}`)
      return result
    }
  }

  // 验证导入数据
  private async validateImportData(data: ExportData): Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
  }> {
    const errors: string[] = []
    const warnings: string[] = []

    // 检查数据格式版本
    if (!data.version || data.version !== '1.0.0') {
      warnings.push(`数据版本不匹配: ${data.version}，可能存在兼容性问题`)
    }

    // 检查必要字段
    if (!data.exportedAt) {
      errors.push('缺少导出时间信息')
    }

    if (!data.metadata) {
      errors.push('缺少元数据信息')
    }

    // 检查数据完整性
    if (data.documents) {
      for (const doc of data.documents) {
        if (!doc.id || !doc.title || !doc.content === undefined) {
          errors.push(`文档数据不完整: ${doc.id || '未知ID'}`)
        }
      }
    }

    if (data.versions) {
      for (const version of data.versions) {
        if (!version.id || !version.changeType) {
          errors.push(`版本数据不完整: ${version.id || '未知ID'}`)
        }
      }
    }

    if (data.images) {
      for (const image of data.images) {
        if (!image.id || !image.filename) {
          errors.push(`图片数据不完整: ${image.id || '未知ID'}`)
        }
      }
    }

    // 检查存储空间
    const estimatedSize = JSON.stringify(data).length
    try {
      const quota = await navigator.storage?.estimate()
      if (quota && quota.quota) {
        const availableSpace = quota.quota - (quota.usage || 0)
        if (estimatedSize > availableSpace) {
          errors.push(`存储空间不足: 需要 ${formatStorageSize(estimatedSize)}，可用 ${formatStorageSize(availableSpace)}`)
        }
      }
    } catch (error) {
      warnings.push('无法检查存储空间配额')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  // 下载导出文件
  async downloadExport(data: ExportData, filename?: string): Promise<void> {
    const jsonData = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonData], { type: 'application/json' })

    const defaultFilename = `wechat-editor-backup-${new Date().toISOString().split('T')[0]}.json`
    const finalFilename = filename || defaultFilename

    // 创建下载链接
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = finalFilename

    // 触发下载
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // 释放URL
    URL.revokeObjectURL(url)

    console.log(`数据已下载: ${finalFilename} (${formatStorageSize(jsonData.length)})`)
  }

  // 从文件读取导入数据
  async readImportFile(file: File): Promise<ExportData> {
    return new Promise((resolve, reject) => {
      if (!file.type.includes('json') && !file.name.endsWith('.json')) {
        reject(new Error('请选择有效的JSON文件'))
        return
      }

      const reader = new FileReader()

      reader.onload = (event) => {
        try {
          const jsonData = JSON.parse(event.target?.result as string)
          resolve(jsonData)
        } catch (error) {
          reject(new Error('文件格式错误，无法解析JSON数据'))
        }
      }

      reader.onerror = () => {
        reject(new Error('文件读取失败'))
      }

      reader.readAsText(file)
    })
  }

  // 获取导出预览信息
  async getExportPreview(options: ExportOptions = {}): Promise<{
    estimatedSize: string
    itemCounts: {
      documents: number
      versions: number
      images: number
    }
    timeRange: {
      earliest: string
      latest: string
    } | null
  }> {
    await this.initialize()

    // 临时导出以获取大小估算（不包含实际图片数据）
    const previewData = await this.exportData({
      ...options,
      includeImageData: false
    })

    // 计算时间范围
    let timeRange = null
    const allDates = [
      ...previewData.documents.map(d => d.updatedAt),
      ...previewData.versions.map(v => v.createdAt)
    ].filter(Boolean).sort()

    if (allDates.length > 0) {
      timeRange = {
        earliest: allDates[0],
        latest: allDates[allDates.length - 1]
      }
    }

    return {
      estimatedSize: formatStorageSize(JSON.stringify(previewData).length),
      itemCounts: {
        documents: previewData.documents.length,
        versions: previewData.versions.length,
        images: previewData.images.length
      },
      timeRange
    }
  }
}

// 全局实例
const dataManager = new DataManager()

// 导出函数接口
export async function exportData(options?: ExportOptions): Promise<ExportData> {
  return await dataManager.exportData(options)
}

export async function importData(data: ExportData, options?: ImportOptions): Promise<ImportResult> {
  return await dataManager.importData(data, options)
}

export async function downloadExport(data: ExportData, filename?: string): Promise<void> {
  return await dataManager.downloadExport(data, filename)
}

export async function readImportFile(file: File): Promise<ExportData> {
  return await dataManager.readImportFile(file)
}

export async function getExportPreview(options?: ExportOptions): Promise<{
  estimatedSize: string
  itemCounts: { documents: number; versions: number; images: number }
  timeRange: { earliest: string; latest: string } | null
}> {
  return await dataManager.getExportPreview(options)
}

export { dataManager }