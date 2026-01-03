// 本地文档存储API - 替代服务器文档存储
import { getStorageAdapter } from './storage-adapter'
import { LocalStorageUtils, generateId } from './local-storage-utils'
import {
  Document,
  DocumentListResponse,
  CreateDocumentRequest,
  UpdateDocumentRequest,
  DocumentListParams
} from './document-api'

// 本地文档管理器
class LocalDocumentManager {
  private utils: LocalStorageUtils | null = null
  private initialized = false

  async initialize() {
    if (this.initialized) return

    try {
      const adapter = await getStorageAdapter()
      this.utils = new LocalStorageUtils(adapter)
      this.initialized = true

      console.log('本地文档管理器已初始化')
    } catch (error) {
      console.error('本地文档管理器初始化失败:', error)
      throw error
    }
  }

  // 计算文档元数据
  private calculateMetadata(content: string): Document['metadata'] {
    // 使用统一的字数统计函数（与编辑器保持一致）
    const wordCount = this.countWords(content)

    // 图片数量统计
    const imageMatches = content.match(/!\[.*?\]\(.*?\)/g) || []
    const imageCount = imageMatches.length

    // 估算阅读时间（中文200字/分钟，英文250词/分钟）
    const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 200))

    return {
      wordCount,
      imageCount,
      estimatedReadTime
    }
  }

  // 字数统计工具 - 与 word-counter.ts 保持一致
  private countWords(content: string): number {
    if (!content || content.trim() === '') return 0

    // 移除 markdown 语法字符，但保留文字内容
    let cleanContent = content
      // 移除代码块
      .replace(/```[\s\S]*?```/g, ' ')
      // 移除内联代码
      .replace(/`[^`]+`/g, ' ')
      // 移除图片和链接语法
      .replace(/!?\[[^\]]*\]\([^)]*\)/g, ' ')
      // 移除标题符号
      .replace(/^#{1,6}\s+/gm, '')
      // 移除列表符号
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      // 移除引用符号
      .replace(/^>\s*/gm, '')
      // 移除加粗、斜体符号
      .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1')
      // 移除多余空格和换行
      .replace(/\s+/g, ' ')
      .trim()

    if (!cleanContent) return 0

    // 统计中文字符
    const chineseChars = (cleanContent.match(/[\u4e00-\u9fa5]/g) || []).length

    // 统计英文单词（不包括单独的数字和符号）
    const englishWords = cleanContent
      .replace(/[\u4e00-\u9fa5]/g, ' ') // 移除中文
      .replace(/[^a-zA-Z\s]/g, ' ') // 只保留英文字母
      .split(/\s+/)
      .filter(word => word.length > 1) // 只统计长度>1的单词
      .length

    return chineseChars + englishWords
  }

  // 生成文档预览
  private generatePreview(content: string, maxLength = 200): string {
    const plainText = content
      .replace(/```[\s\S]*?```/g, '[代码块]') // 替换代码块
      .replace(/!\[.*?\]\(.*?\)/g, '[图片]') // 替换图片
      .replace(/#{1,6}\s*/g, '') // 移除标题标记
      .replace(/[*_`]/g, '') // 移除格式化标记
      .replace(/>\s*/g, '') // 移除引用标记
      .replace(/\n+/g, ' ') // 换行变空格
      .trim()

    return plainText.length > maxLength
      ? plainText.substring(0, maxLength) + '...'
      : plainText
  }

  // 获取文档列表
  async getDocuments(params: DocumentListParams = {}): Promise<DocumentListResponse> {
    await this.initialize()

    const { page = 1, limit = 20, search, status } = params

    try {
      // 获取所有文档
      let allDocuments = await this.utils!.getAll<Document>('documents')

      // 按更新时间倒序排列
      allDocuments.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )

      // 状态筛选
      if (status) {
        allDocuments = allDocuments.filter(doc => doc.status === status)
      }

      // 搜索筛选
      if (search) {
        const searchLower = search.toLowerCase()
        allDocuments = allDocuments.filter(doc =>
          doc.title.toLowerCase().includes(searchLower) ||
          doc.content.toLowerCase().includes(searchLower)
        )
      }

      const total = allDocuments.length
      const pages = Math.ceil(total / limit)
      const offset = (page - 1) * limit
      const documents = allDocuments.slice(offset, offset + limit)

      // 为列表项生成预览（不包含完整content）
      const documentsWithPreview = documents.map(doc => ({
        ...doc,
        preview: this.generatePreview(doc.content),
        content: undefined // 列表不返回完整内容
      })) as Document[]

      console.log(`获取本地文档列表: ${documents.length}/${total} 项`)

      return {
        documents: documentsWithPreview,
        pagination: {
          page,
          limit,
          total,
          pages
        }
      }
    } catch (error) {
      console.error('获取本地文档列表失败:', error)
      throw new Error(`获取文档列表失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 获取单个文档（包含完整内容）
  async getDocument(id: string): Promise<Document> {
    await this.initialize()

    try {
      const document = await this.utils!.get<Document>('documents', id)

      if (!document) {
        throw new Error('文档未找到')
      }

      console.log(`获取本地文档: ${document.title}`)
      return document
    } catch (error) {
      console.error('获取本地文档失败:', error)
      throw new Error(`获取文档失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 创建文档
  async createDocument(data: CreateDocumentRequest): Promise<Document> {
    await this.initialize()

    const documentId = generateId()
    const now = new Date().toISOString()

    const document: Document = {
      id: documentId,
      title: data.title || '未命名文档',
      content: data.content || '',
      templateId: data.templateId || 'simple-doc',
      templateVariables: data.templateVariables || {},
      status: data.status || 'DRAFT',
      metadata: this.calculateMetadata(data.content || ''),
      preview: this.generatePreview(data.content || ''),
      createdAt: now,
      updatedAt: now
    }

    try {
      await this.utils!.put('documents', document)

      console.log(`创建本地文档: ${document.title}`)
      return document
    } catch (error) {
      console.error('创建本地文档失败:', error)
      throw new Error(`创建文档失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 更新文档
  async updateDocument(id: string, data: UpdateDocumentRequest): Promise<Document> {
    await this.initialize()

    try {
      const existingDoc = await this.utils!.get<Document>('documents', id)

      if (!existingDoc) {
        throw new Error('文档未找到')
      }

      const updatedDocument: Document = {
        ...existingDoc,
        ...data,
        id, // 确保ID不被覆盖
        metadata: data.content !== undefined
          ? this.calculateMetadata(data.content)
          : existingDoc.metadata,
        preview: data.content !== undefined
          ? this.generatePreview(data.content)
          : existingDoc.preview,
        updatedAt: new Date().toISOString(),
        createdAt: existingDoc.createdAt // 保持原创建时间
      }

      await this.utils!.put('documents', updatedDocument)

      console.log(`更新本地文档: ${updatedDocument.title}`)
      return updatedDocument
    } catch (error) {
      console.error('更新本地文档失败:', error)
      throw new Error(`更新文档失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 删除文档
  async deleteDocument(id: string): Promise<{ message: string }> {
    await this.initialize()

    try {
      const document = await this.utils!.get<Document>('documents', id)

      if (!document) {
        throw new Error('文档未找到')
      }

      await this.utils!.delete('documents', id)

      // 同时删除相关的版本历史
      try {
        const allVersions = await this.utils!.findByIndex('versions', 'documentId', id)
        for (const version of allVersions) {
          await this.utils!.delete('versions', version.id)
        }
        console.log(`删除了 ${allVersions.length} 个相关版本记录`)
      } catch (versionError) {
        console.warn('删除版本记录时出错:', versionError)
      }

      console.log(`删除本地文档: ${document.title}`)
      return { message: `文档 "${document.title}" 已删除` }
    } catch (error) {
      console.error('删除本地文档失败:', error)
      throw new Error(`删除文档失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 复制文档
  async duplicateDocument(id: string): Promise<Document> {
    await this.initialize()

    try {
      const originalDoc = await this.utils!.get<Document>('documents', id)

      if (!originalDoc) {
        throw new Error('源文档未找到')
      }

      const duplicatedDoc = await this.createDocument({
        title: `${originalDoc.title} - 副本`,
        content: originalDoc.content,
        templateId: originalDoc.templateId,
        templateVariables: originalDoc.templateVariables,
        status: 'DRAFT'
      })

      console.log(`复制本地文档: ${originalDoc.title} -> ${duplicatedDoc.title}`)
      return duplicatedDoc
    } catch (error) {
      console.error('复制本地文档失败:', error)
      throw new Error(`复制文档失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 批量更新元数据（维护功能）
  async batchUpdateMetadata(): Promise<{ message: string; updatedCount: number }> {
    await this.initialize()

    try {
      const allDocuments = await this.utils!.getAll<Document>('documents')
      let updatedCount = 0

      for (const doc of allDocuments) {
        const newMetadata = this.calculateMetadata(doc.content)
        const newPreview = this.generatePreview(doc.content)

        // 只有元数据变化时才更新
        const metadataChanged = JSON.stringify(newMetadata) !== JSON.stringify(doc.metadata)
        const previewChanged = newPreview !== doc.preview

        if (metadataChanged || previewChanged) {
          await this.utils!.put('documents', {
            ...doc,
            metadata: newMetadata,
            preview: newPreview,
            updatedAt: new Date().toISOString()
          })
          updatedCount++
        }
      }

      console.log(`批量更新元数据完成: ${updatedCount}/${allDocuments.length} 个文档`)
      return {
        message: `已更新 ${updatedCount} 个文档的元数据`,
        updatedCount
      }
    } catch (error) {
      console.error('批量更新元数据失败:', error)
      throw new Error(`批量更新失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 获取存储统计信息
  async getStorageStats(): Promise<{
    totalDocuments: number
    totalSize: number
    byStatus: Record<string, number>
    recentActivity: Array<{ date: string; count: number }>
  }> {
    await this.initialize()

    try {
      const allDocuments = await this.utils!.getAll<Document>('documents')

      // 按状态统计
      const byStatus = allDocuments.reduce((acc, doc) => {
        acc[doc.status] = (acc[doc.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // 估算总大小
      const totalSize = JSON.stringify(allDocuments).length

      // 最近7天活动统计
      const now = new Date()
      const recentActivity = []

      for (let i = 6; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]

        const count = allDocuments.filter(doc =>
          doc.updatedAt.startsWith(dateStr)
        ).length

        recentActivity.push({ date: dateStr, count })
      }

      return {
        totalDocuments: allDocuments.length,
        totalSize,
        byStatus,
        recentActivity
      }
    } catch (error) {
      console.error('获取存储统计失败:', error)
      return {
        totalDocuments: 0,
        totalSize: 0,
        byStatus: {},
        recentActivity: []
      }
    }
  }
}

// 全局实例
const localDocumentManager = new LocalDocumentManager()

// 导出与原API兼容的函数接口
export async function getDocuments(params: DocumentListParams = {}): Promise<DocumentListResponse> {
  return await localDocumentManager.getDocuments(params)
}

export async function getDocument(id: string): Promise<Document> {
  return await localDocumentManager.getDocument(id)
}

export async function createDocument(data: CreateDocumentRequest): Promise<Document> {
  return await localDocumentManager.createDocument(data)
}

export async function updateDocument(id: string, data: UpdateDocumentRequest): Promise<Document> {
  return await localDocumentManager.updateDocument(id, data)
}

export async function deleteDocument(id: string): Promise<{ message: string }> {
  return await localDocumentManager.deleteDocument(id)
}

export async function duplicateDocument(id: string): Promise<Document> {
  return await localDocumentManager.duplicateDocument(id)
}

export async function batchUpdateMetadata(): Promise<{ message: string; updatedCount: number }> {
  return await localDocumentManager.batchUpdateMetadata()
}

// 保存当前编辑内容为文档 - 兼容原API
export async function saveCurrentContent(data: {
  title: string
  content: string
  templateId: string
  templateVariables: Record<string, any>
  documentId?: string
}): Promise<Document> {
  if (data.documentId) {
    // 更新现有文档
    return await localDocumentManager.updateDocument(data.documentId, {
      title: data.title,
      content: data.content,
      templateId: data.templateId,
      templateVariables: data.templateVariables
    })
  } else {
    // 创建新文档
    return await localDocumentManager.createDocument({
      title: data.title,
      content: data.content,
      templateId: data.templateId,
      templateVariables: data.templateVariables,
      status: 'DRAFT'
    })
  }
}

// 本地特有功能导出
export {
  localDocumentManager
}