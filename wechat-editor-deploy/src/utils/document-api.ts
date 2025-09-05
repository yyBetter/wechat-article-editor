// 文档管理API工具函数
import { getStoredToken } from './auth-api'

const API_BASE_URL = 'http://localhost:3002/api'

// 文档接口类型定义
export interface Document {
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
  preview?: string
  createdAt: string
  updatedAt: string
}

export interface DocumentListResponse {
  documents: Document[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface CreateDocumentRequest {
  title?: string
  content?: string
  templateId?: string
  templateVariables?: Record<string, any>
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
}

export interface UpdateDocumentRequest {
  title?: string
  content?: string
  templateId?: string
  templateVariables?: Record<string, any>
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
}

export interface DocumentListParams {
  page?: number
  limit?: number
  search?: string
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
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
      // Token过期，可以触发重新登录
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

// 获取文档列表
export async function getDocuments(params: DocumentListParams = {}): Promise<DocumentListResponse> {
  const searchParams = new URLSearchParams()
  
  if (params.page) searchParams.append('page', params.page.toString())
  if (params.limit) searchParams.append('limit', params.limit.toString())
  if (params.search) searchParams.append('search', params.search)
  if (params.status) searchParams.append('status', params.status)
  
  const queryString = searchParams.toString()
  const endpoint = `/documents${queryString ? `?${queryString}` : ''}`
  
  const response = await apiRequest<DocumentListResponse>(endpoint)
  console.log('Raw API response:', response)
  return response
}

// 获取单个文档
export async function getDocument(id: string): Promise<Document> {
  const response = await apiRequest<Document>(`/documents/${id}`)
  console.log('Get document response:', response)
  return response
}

// 创建文档
export async function createDocument(data: CreateDocumentRequest): Promise<Document> {
  return apiRequest<Document>('/documents', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

// 更新文档
export async function updateDocument(id: string, data: UpdateDocumentRequest): Promise<Document> {
  return apiRequest<Document>(`/documents/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

// 删除文档
export async function deleteDocument(id: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/documents/${id}`, {
    method: 'DELETE'
  })
}

// 批量更新所有文档的metadata
export async function batchUpdateMetadata(): Promise<{ message: string; updatedCount: number }> {
  return apiRequest<{ message: string; updatedCount: number }>('/documents/batch-update-metadata', {
    method: 'POST',
    body: JSON.stringify({})
  })
}

// 复制文档
export async function duplicateDocument(id: string): Promise<Document> {
  return apiRequest<Document>(`/documents/${id}/duplicate`, {
    method: 'POST'
  })
}

// 保存当前编辑内容为文档
export async function saveCurrentContent(data: {
  title: string
  content: string
  templateId: string
  templateVariables: Record<string, any>
  documentId?: string
}): Promise<Document> {
  if (data.documentId) {
    // 更新现有文档
    return updateDocument(data.documentId, {
      title: data.title,
      content: data.content,
      templateId: data.templateId,
      templateVariables: data.templateVariables
    })
  } else {
    // 创建新文档
    return createDocument({
      title: data.title,
      content: data.content,
      templateId: data.templateId,
      templateVariables: data.templateVariables,
      status: 'DRAFT'
    })
  }
}