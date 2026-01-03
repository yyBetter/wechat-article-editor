// 文档管理API工具函数 - 纯本地存储模式
import * as localAPI from './local-document-api'

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

// 获取文档列表
export async function getDocuments(params: DocumentListParams = {}): Promise<DocumentListResponse> {
  return await localAPI.getDocuments(params)
}

// 获取单个文档
export async function getDocument(id: string): Promise<Document> {
  return await localAPI.getDocument(id)
}

// 创建文档
export async function createDocument(data: CreateDocumentRequest): Promise<Document> {
  return await localAPI.createDocument(data)
}

// 更新文档
export async function updateDocument(id: string, data: UpdateDocumentRequest): Promise<Document> {
  return await localAPI.updateDocument(id, data)
}

// 删除文档
export async function deleteDocument(id: string): Promise<{ message: string }> {
  return await localAPI.deleteDocument(id)
}

// 批量更新所有文档的metadata
export async function batchUpdateMetadata(): Promise<{ message: string; updatedCount: number }> {
  return await localAPI.batchUpdateMetadata()
}

// 复制文档
export async function duplicateDocument(id: string): Promise<Document> {
  return await localAPI.duplicateDocument(id)
}

// 保存当前编辑内容为文档
export async function saveCurrentContent(data: {
  title: string
  content: string
  templateId: string
  templateVariables: Record<string, any>
  documentId?: string
}): Promise<Document> {
  return await localAPI.saveCurrentContent(data)
}