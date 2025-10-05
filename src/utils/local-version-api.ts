// 本地版本历史API - 替代服务器版本存储
import { getStorageAdapter } from './storage-adapter'
import { LocalStorageUtils, generateId } from './local-storage-utils'
import {
  DocumentVersion,
  DocumentVersionListResponse,
  VersionRestoreResponse,
  CreateVersionResponse,
  compareVersions,
  formatVersionTime,
  getChangeTypeInfo
} from './version-api'

// 本地版本管理器
class LocalVersionManager {
  private utils: LocalStorageUtils | null = null
  private initialized = false
  
  async initialize() {
    if (this.initialized) return
    
    try {
      const adapter = await getStorageAdapter()
      if (adapter.constructor.name !== 'LocalStorageAdapter' && 
          adapter.constructor.name !== 'HybridStorageAdapter') {
        throw new Error('本地版本存储只能在本地存储模式下使用')
      }
      
      // 获取LocalStorageAdapter实例
      const localAdapter = adapter.constructor.name === 'HybridStorageAdapter' 
        ? (adapter as any).getCurrentAdapter()
        : adapter
      
      this.utils = new LocalStorageUtils(localAdapter)
      this.initialized = true
      
      console.log('本地版本管理器已初始化')
    } catch (error) {
      console.error('本地版本管理器初始化失败:', error)
      throw error
    }
  }
  
  // 计算版本元数据
  private calculateVersionMetadata(content: string): DocumentVersion['metadata'] {
    // 使用统一的字数统计函数（与编辑器保持一致）
    const wordCount = this.countWords(content)
    
    // 图片数量统计
    const imageMatches = content.match(/!\[.*?\]\(.*?\)/g) || []
    const imageCount = imageMatches.length
    
    // 估算阅读时间
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
  
  // 获取文档当前版本号
  private async getCurrentVersionNumber(documentId: string): Promise<number> {
    try {
      const versions = await this.utils!.findByIndex<DocumentVersion>('versions', 'documentId', documentId)
      if (versions.length === 0) return 1
      
      // 找到最大版本号
      const maxVersion = Math.max(...versions.map(v => v.versionNumber || 0))
      return maxVersion + 1
    } catch (error) {
      console.error('获取版本号失败:', error)
      return 1
    }
  }
  
  // 自动创建版本记录（用于自动保存）
  async createAutoVersion(documentId: string, document: {
    title: string
    content: string
    templateId: string
    templateVariables: Record<string, any>
  }): Promise<DocumentVersion> {
    await this.initialize()
    
    const versionId = generateId()
    const versionNumber = await this.getCurrentVersionNumber(documentId)
    const now = new Date().toISOString()
    
    const version: DocumentVersion = {
      id: versionId,
      title: document.title,
      content: document.content,
      templateId: document.templateId,
      templateVariables: document.templateVariables,
      changeType: 'AUTO_SAVE',
      changeReason: '自动保存',
      metadata: this.calculateVersionMetadata(document.content),
      versionNumber,
      createdAt: now
    }
    
    try {
      await this.utils!.put('versions', version)
      
      // 清理旧版本（保留最近50个自动保存版本）
      await this.cleanupOldVersions(documentId, 'AUTO_SAVE', 50)
      
      console.log(`创建自动版本: 文档${documentId} v${versionNumber}`)
      return version
    } catch (error) {
      console.error('创建自动版本失败:', error)
      throw new Error(`创建版本失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
  
  // 清理旧版本
  private async cleanupOldVersions(documentId: string, changeType: DocumentVersion['changeType'], keepCount: number) {
    try {
      const versions = await this.utils!.findByIndex<DocumentVersion>('versions', 'documentId', documentId)
      const filteredVersions = versions
        .filter(v => v.changeType === changeType)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      
      if (filteredVersions.length > keepCount) {
        const versionsToDelete = filteredVersions.slice(keepCount)
        for (const version of versionsToDelete) {
          await this.utils!.delete('versions', version.id)
        }
        console.log(`清理了 ${versionsToDelete.length} 个旧版本记录`)
      }
    } catch (error) {
      console.warn('清理旧版本失败:', error)
    }
  }
  
  // 获取文档版本历史列表
  async getDocumentVersions(
    documentId: string,
    params: { page?: number; limit?: number } = {}
  ): Promise<DocumentVersionListResponse> {
    await this.initialize()
    
    const { page = 1, limit = 15 } = params
    
    try {
      // 获取文档信息
      const document = await this.utils!.get('documents', documentId)
      if (!document) {
        throw new Error('文档未找到')
      }
      
      // 获取所有版本记录
      const allVersions = await this.utils!.findByIndex<DocumentVersion>('versions', 'documentId', documentId)
      
      // 按创建时间倒序排列
      allVersions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      
      const total = allVersions.length
      const pages = Math.ceil(total / limit)
      const offset = (page - 1) * limit
      const versions = allVersions.slice(offset, offset + limit)
      
      // 为版本添加序号（从最新开始）
      const versionsWithNumbers = versions.map((version, index) => ({
        ...version,
        versionNumber: total - offset - index
      }))
      
      console.log(`获取文档版本列表: 文档${documentId}, ${versions.length}/${total} 项`)
      
      return {
        versions: versionsWithNumbers,
        pagination: {
          page,
          limit,
          total,
          pages
        },
        document: {
          id: document.id,
          title: document.title,
          currentVersion: total + 1 // 当前版本号
        }
      }
    } catch (error) {
      console.error('获取版本历史失败:', error)
      throw new Error(`获取版本历史失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
  
  // 获取特定版本的详细内容
  async getVersionDetail(documentId: string, versionId: string): Promise<DocumentVersion> {
    await this.initialize()
    
    try {
      const version = await this.utils!.get<DocumentVersion>('versions', versionId)
      
      if (!version) {
        throw new Error('版本记录未找到')
      }
      
      // 验证版本是否属于指定文档
      const allVersions = await this.utils!.findByIndex<DocumentVersion>('versions', 'documentId', documentId)
      const belongsToDocument = allVersions.some(v => v.id === versionId)
      
      if (!belongsToDocument) {
        throw new Error('版本记录不属于该文档')
      }
      
      console.log(`获取版本详情: 文档${documentId}, 版本${versionId}`)
      return version
    } catch (error) {
      console.error('获取版本详情失败:', error)
      throw new Error(`获取版本详情失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
  
  // 恢复到指定版本
  async restoreToVersion(documentId: string, versionId: string): Promise<VersionRestoreResponse> {
    await this.initialize()
    
    try {
      // 获取要恢复的版本
      const targetVersion = await this.utils!.get<DocumentVersion>('versions', versionId)
      if (!targetVersion) {
        throw new Error('目标版本未找到')
      }
      
      // 获取当前文档
      const currentDocument = await this.utils!.get('documents', documentId)
      if (!currentDocument) {
        throw new Error('文档未找到')
      }
      
      // 创建恢复前的版本快照
      await this.createAutoVersion(documentId, {
        title: currentDocument.title,
        content: currentDocument.content,
        templateId: currentDocument.templateId,
        templateVariables: currentDocument.templateVariables
      })
      
      // 更新文档内容为目标版本
      const restoredDocument = {
        ...currentDocument,
        title: targetVersion.title,
        content: targetVersion.content || '',
        templateId: targetVersion.templateId || currentDocument.templateId,
        templateVariables: targetVersion.templateVariables || currentDocument.templateVariables,
        updatedAt: new Date().toISOString()
      }
      
      await this.utils!.put('documents', restoredDocument)
      
      // 创建恢复版本记录
      const restoreVersion: DocumentVersion = {
        id: generateId(),
        title: targetVersion.title,
        content: targetVersion.content,
        templateId: targetVersion.templateId,
        templateVariables: targetVersion.templateVariables,
        changeType: 'RESTORE',
        changeReason: `恢复到版本 #${targetVersion.versionNumber}`,
        metadata: this.calculateVersionMetadata(targetVersion.content || ''),
        versionNumber: await this.getCurrentVersionNumber(documentId),
        createdAt: new Date().toISOString()
      }
      
      await this.utils!.put('versions', restoreVersion)
      
      console.log(`恢复文档版本: 文档${documentId} -> 版本${versionId}`)
      
      return {
        document: {
          id: restoredDocument.id,
          title: restoredDocument.title,
          content: restoredDocument.content,
          templateId: restoredDocument.templateId,
          templateVariables: restoredDocument.templateVariables,
          status: restoredDocument.status,
          metadata: restoredDocument.metadata,
          createdAt: restoredDocument.createdAt,
          updatedAt: restoredDocument.updatedAt
        },
        message: `已恢复到版本 #${targetVersion.versionNumber}`
      }
    } catch (error) {
      console.error('版本恢复失败:', error)
      throw new Error(`版本恢复失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
  
  // 手动创建版本快照
  async createVersionSnapshot(documentId: string, reason: string = '手动保存'): Promise<CreateVersionResponse> {
    await this.initialize()
    
    try {
      // 获取当前文档
      const document = await this.utils!.get('documents', documentId)
      if (!document) {
        throw new Error('文档未找到')
      }
      
      const versionId = generateId()
      const versionNumber = await this.getCurrentVersionNumber(documentId)
      const now = new Date().toISOString()
      
      const version: DocumentVersion = {
        id: versionId,
        title: document.title,
        content: document.content,
        templateId: document.templateId,
        templateVariables: document.templateVariables,
        changeType: 'MANUAL_SAVE',
        changeReason: reason,
        metadata: this.calculateVersionMetadata(document.content),
        versionNumber,
        createdAt: now
      }
      
      await this.utils!.put('versions', version)
      
      console.log(`创建手动版本快照: 文档${documentId} v${versionNumber}`)
      
      return {
        version,
        message: `版本快照已创建 #${versionNumber}`
      }
    } catch (error) {
      console.error('创建版本快照失败:', error)
      throw new Error(`创建版本快照失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
  
  // 删除版本记录
  async deleteVersion(documentId: string, versionId: string): Promise<{ message: string; deletedVersionId: string }> {
    await this.initialize()
    
    try {
      const version = await this.utils!.get<DocumentVersion>('versions', versionId)
      if (!version) {
        throw new Error('版本记录未找到')
      }
      
      // 验证版本属于指定文档
      const allVersions = await this.utils!.findByIndex<DocumentVersion>('versions', 'documentId', documentId)
      const belongsToDocument = allVersions.some(v => v.id === versionId)
      
      if (!belongsToDocument) {
        throw new Error('版本记录不属于该文档')
      }
      
      await this.utils!.delete('versions', versionId)
      
      console.log(`删除版本记录: 文档${documentId}, 版本${versionId}`)
      
      return {
        message: `版本记录 #${version.versionNumber} 已删除`,
        deletedVersionId: versionId
      }
    } catch (error) {
      console.error('删除版本记录失败:', error)
      throw new Error(`删除版本记录失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
  
  // 获取版本统计信息
  async getVersionStats(documentId?: string): Promise<{
    totalVersions: number
    byChangeType: Record<string, number>
    recentActivity: Array<{ date: string; count: number }>
  }> {
    await this.initialize()
    
    try {
      let allVersions: DocumentVersion[]
      
      if (documentId) {
        allVersions = await this.utils!.findByIndex<DocumentVersion>('versions', 'documentId', documentId)
      } else {
        allVersions = await this.utils!.getAll<DocumentVersion>('versions')
      }
      
      // 按变更类型统计
      const byChangeType = allVersions.reduce((acc, version) => {
        acc[version.changeType] = (acc[version.changeType] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      // 最近7天活动统计
      const now = new Date()
      const recentActivity = []
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        
        const count = allVersions.filter(version => 
          version.createdAt.startsWith(dateStr)
        ).length
        
        recentActivity.push({ date: dateStr, count })
      }
      
      return {
        totalVersions: allVersions.length,
        byChangeType,
        recentActivity
      }
    } catch (error) {
      console.error('获取版本统计失败:', error)
      return {
        totalVersions: 0,
        byChangeType: {},
        recentActivity: []
      }
    }
  }
}

// 全局实例
const localVersionManager = new LocalVersionManager()

// 导出与原API兼容的函数接口
export async function getDocumentVersions(
  documentId: string,
  params: { page?: number; limit?: number } = {}
): Promise<DocumentVersionListResponse> {
  return await localVersionManager.getDocumentVersions(documentId, params)
}

export async function getVersionDetail(documentId: string, versionId: string): Promise<DocumentVersion> {
  return await localVersionManager.getVersionDetail(documentId, versionId)
}

export async function restoreToVersion(documentId: string, versionId: string): Promise<VersionRestoreResponse> {
  return await localVersionManager.restoreToVersion(documentId, versionId)
}

export async function createVersionSnapshot(documentId: string, reason: string = '手动保存'): Promise<CreateVersionResponse> {
  return await localVersionManager.createVersionSnapshot(documentId, reason)
}

export async function deleteVersion(documentId: string, versionId: string): Promise<{ message: string; deletedVersionId: string }> {
  return await localVersionManager.deleteVersion(documentId, versionId)
}

// 本地特有功能导出
export {
  localVersionManager
}

// 自动版本创建（由自动保存系统调用）
export async function createAutoSaveVersion(documentId: string, document: {
  title: string
  content: string
  templateId: string
  templateVariables: Record<string, any>
}): Promise<DocumentVersion> {
  return await localVersionManager.createAutoVersion(documentId, document)
}