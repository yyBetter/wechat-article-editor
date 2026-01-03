// 版本管理API工具函数 - 纯本地存储模式
import * as localAPI from './local-version-api'
import { Document } from './document-api'

export interface DocumentVersion {
    id: string
    documentId?: string
    title: string
    content: string
    templateId: string
    templateVariables: Record<string, any>
    versionNumber: number
    changeType: 'AUTO_SAVE' | 'MANUAL_SAVE' | 'RESTORE'
    changeReason?: string
    metadata: {
        wordCount: number
        imageCount: number
        estimatedReadTime: number
    }
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
    document: Document
    message: string
}

export interface CreateVersionResponse {
    version: DocumentVersion
    message: string
}

// 获取文档版本历史列表
export async function getDocumentVersions(
    documentId: string,
    params: { page?: number; limit?: number } = {}
): Promise<DocumentVersionListResponse> {
    return await localAPI.getDocumentVersions(documentId, params)
}

// 获取特定版本的详细内容
export async function getVersionDetail(documentId: string, versionId: string): Promise<DocumentVersion> {
    return await localAPI.getVersionDetail(documentId, versionId)
}

// 恢复到指定版本
export async function restoreToVersion(documentId: string, versionId: string): Promise<VersionRestoreResponse> {
    return await localAPI.restoreToVersion(documentId, versionId)
}

// 手动创建版本快照
export async function createVersionSnapshot(documentId: string, reason: string = '手动保存'): Promise<CreateVersionResponse> {
    return await localAPI.createVersionSnapshot(documentId, reason)
}

// 删除版本记录
export async function deleteVersion(documentId: string, versionId: string): Promise<{ message: string; deletedVersionId: string }> {
    return await localAPI.deleteVersion(documentId, versionId)
}

// 自动版本创建（由自动保存系统调用）
export async function createAutoSaveVersion(documentId: string, document: {
    title: string
    content: string
    templateId: string
    templateVariables: Record<string, any>
}): Promise<DocumentVersion> {
    return await localAPI.createAutoSaveVersion(documentId, document)
}

// 格式化版本时间
export function formatVersionTime(dateStr: string): string {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    })
}

// 获取变更类型描述
export function getChangeTypeInfo(type: DocumentVersion['changeType']): { label: string; icon: string; color: string } {
    switch (type) {
        case 'AUTO_SAVE':
            return { label: '自动保存', icon: '⏱️', color: '#6c757d' }
        case 'MANUAL_SAVE':
            return { label: '手动快照', icon: '📸', color: '#007bff' }
        case 'RESTORE':
            return { label: '版本恢复', icon: '🔄', color: '#28a745' }
        default:
            return { label: '未知状态', icon: '❓', color: '#6c757d' }
    }
}

// 比较两个版本的差异（简化版）
export function compareVersions(oldContent: string, newContent: string): {
    added: number
    removed: number
    percentChanged: number
} {
    const oldLen = oldContent.length || 0
    const newLen = newContent.length || 0
    const added = Math.max(0, newLen - oldLen)
    const removed = Math.max(0, oldLen - newLen)
    const percentChanged = oldLen === 0 ? 100 : Math.round((Math.abs(newLen - oldLen) / oldLen) * 100)

    return { added, removed, percentChanged }
}
