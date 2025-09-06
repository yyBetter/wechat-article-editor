// 文档版本历史API工具函数 - 支持本地和服务器存储
import { getStoredToken } from './auth-api'
import { getStorageConfig } from './storage-adapter'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002') + '/api'

// 动态导入本地版本API（避免循环依赖）
async function getLocalVersionAPI() {
  const localAPI = await import('./local-version-api')
  return localAPI
}

// 文档版本接口类型定义
export interface DocumentVersion {
  id: string
  title: string
  content?: string // 详细版本才有完整内容
  templateId?: string
  templateVariables?: Record<string, any>
  changeType: 'AUTO_SAVE' | 'MANUAL_SAVE' | 'RESTORE'
  changeReason: string
  metadata: {
    wordCount: number
    imageCount: number
    estimatedReadTime: number
  }
  versionNumber?: number
  createdAt: string
}

export interface DocumentVersionListResponse {
  versions: DocumentVersion[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  document: {
    id: string
    title: string
    currentVersion: number
  }
}

export interface VersionRestoreResponse {
  document: {
    id: string
    title: string
    content: string
    templateId: string
    templateVariables: Record<string, any>
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
    metadata: {
      wordCount: number
      imageCount: number
      estimatedReadTime: number
    }
    createdAt: string
    updatedAt: string
  }
  message: string
}

export interface CreateVersionResponse {
  version: DocumentVersion
  message: string
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
    if (response.status === 401) {
      throw new Error('认证失败，请重新登录')
    }
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const result = await response.json()
  
  if (!result.success) {
    throw new Error(result.error || '请求失败')
  }

  return result.data
}

// 获取文档版本历史列表
export async function getDocumentVersions(
  documentId: string,
  params: { page?: number; limit?: number } = {}
): Promise<DocumentVersionListResponse> {
  const config = getStorageConfig()
  
  // 如果是本地或混合模式，使用本地存储
  if (config.mode === 'local' || config.mode === 'hybrid') {
    try {
      const localAPI = await getLocalVersionAPI()
      return await localAPI.getDocumentVersions(documentId, params)
    } catch (error) {
      console.error('本地版本列表获取失败，降级到服务器模式:', error)
      // 如果本地获取失败且是混合模式，降级到服务器
      if (config.mode === 'hybrid') {
        // 继续执行服务器逻辑
      } else {
        throw error
      }
    }
  }
  
  // 服务器存储逻辑
  const searchParams = new URLSearchParams()
  
  if (params.page) searchParams.append('page', params.page.toString())
  if (params.limit) searchParams.append('limit', params.limit.toString())
  
  const queryString = searchParams.toString()
  const endpoint = `/documents/${documentId}/versions${queryString ? `?${queryString}` : ''}`
  
  return apiRequest<DocumentVersionListResponse>(endpoint)
}

// 获取特定版本的详细内容
export async function getVersionDetail(
  documentId: string, 
  versionId: string
): Promise<DocumentVersion> {
  const config = getStorageConfig()
  
  // 如果是本地或混合模式，使用本地存储
  if (config.mode === 'local' || config.mode === 'hybrid') {
    try {
      const localAPI = await getLocalVersionAPI()
      return await localAPI.getVersionDetail(documentId, versionId)
    } catch (error) {
      console.error('本地版本详情获取失败，尝试服务器模式:', error)
      // 如果本地获取失败且是混合模式，尝试服务器
      if (config.mode === 'hybrid') {
        // 继续执行服务器逻辑
      } else {
        throw error
      }
    }
  }
  
  // 服务器存储逻辑
  return apiRequest<DocumentVersion>(`/documents/${documentId}/versions/${versionId}`)
}

// 恢复到特定版本
export async function restoreToVersion(
  documentId: string,
  versionId: string
): Promise<VersionRestoreResponse> {
  const config = getStorageConfig()
  
  // 如果是本地或混合模式，使用本地存储
  if (config.mode === 'local' || config.mode === 'hybrid') {
    try {
      const localAPI = await getLocalVersionAPI()
      return await localAPI.restoreToVersion(documentId, versionId)
    } catch (error) {
      console.error('本地版本恢复失败，降级到服务器模式:', error)
      // 如果本地恢复失败且是混合模式，降级到服务器
      if (config.mode === 'hybrid') {
        // 继续执行服务器逻辑
      } else {
        throw error
      }
    }
  }
  
  // 服务器存储逻辑
  return apiRequest<VersionRestoreResponse>(`/documents/${documentId}/versions/${versionId}/restore`, {
    method: 'POST'
  })
}

// 手动创建版本快照
export async function createVersionSnapshot(
  documentId: string,
  reason: string = '手动保存'
): Promise<CreateVersionResponse> {
  const config = getStorageConfig()
  
  // 如果是本地或混合模式，使用本地存储
  if (config.mode === 'local' || config.mode === 'hybrid') {
    try {
      const localAPI = await getLocalVersionAPI()
      return await localAPI.createVersionSnapshot(documentId, reason)
    } catch (error) {
      console.error('本地版本快照创建失败，降级到服务器模式:', error)
      // 如果本地创建失败且是混合模式，降级到服务器
      if (config.mode === 'hybrid') {
        // 继续执行服务器逻辑
      } else {
        throw error
      }
    }
  }
  
  // 服务器存储逻辑
  return apiRequest<CreateVersionResponse>(`/documents/${documentId}/versions`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  })
}

// 删除版本记录
export async function deleteVersion(
  documentId: string,
  versionId: string
): Promise<{ message: string; deletedVersionId: string }> {
  const config = getStorageConfig()
  
  // 如果是本地或混合模式，使用本地存储
  if (config.mode === 'local' || config.mode === 'hybrid') {
    try {
      const localAPI = await getLocalVersionAPI()
      return await localAPI.deleteVersion(documentId, versionId)
    } catch (error) {
      console.error('本地版本删除失败，尝试服务器模式:', error)
      // 如果本地删除失败且是混合模式，尝试服务器
      if (config.mode === 'hybrid') {
        // 继续执行服务器逻辑
      } else {
        throw error
      }
    }
  }
  
  // 服务器存储逻辑
  return apiRequest<{ message: string; deletedVersionId: string }>(
    `/documents/${documentId}/versions/${versionId}`,
    {
      method: 'DELETE'
    }
  )
}

// 比较两个版本的差异（工具函数，用于前端比较）
export function compareVersions(
  oldVersion: DocumentVersion,
  newVersion: DocumentVersion
) {
  const changes = {
    title: oldVersion.title !== newVersion.title,
    content: oldVersion.content !== newVersion.content,
    template: oldVersion.templateId !== newVersion.templateId,
    variables: JSON.stringify(oldVersion.templateVariables) !== JSON.stringify(newVersion.templateVariables),
    metadata: {
      wordCountChange: (newVersion.metadata.wordCount || 0) - (oldVersion.metadata.wordCount || 0),
      imageCountChange: (newVersion.metadata.imageCount || 0) - (oldVersion.metadata.imageCount || 0),
      readTimeChange: (newVersion.metadata.estimatedReadTime || 0) - (oldVersion.metadata.estimatedReadTime || 0)
    }
  }
  
  return {
    ...changes,
    hasChanges: changes.title || changes.content || changes.template || changes.variables,
    summary: {
      totalChanges: Object.values({
        title: changes.title,
        content: changes.content,
        template: changes.template,
        variables: changes.variables
      }).filter(Boolean).length,
      ...changes.metadata
    }
  }
}

// 格式化版本创建时间
export function formatVersionTime(createdAt: string): string {
  const date = new Date(createdAt)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffMinutes < 1) {
    return '刚刚'
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`
  } else if (diffHours < 24) {
    return `${diffHours}小时前`
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

// 获取变更类型的显示文本和样式
export function getChangeTypeInfo(changeType: DocumentVersion['changeType']) {
  switch (changeType) {
    case 'AUTO_SAVE':
      return {
        label: '自动保存',
        color: '#28a745',
        icon: '💾'
      }
    case 'MANUAL_SAVE':
      return {
        label: '手动保存',
        color: '#007bff',
        icon: '📝'
      }
    case 'RESTORE':
      return {
        label: '版本恢复',
        color: '#ffc107',
        icon: '🔄'
      }
    default:
      return {
        label: '未知类型',
        color: '#6c757d',
        icon: '❓'
      }
  }
}