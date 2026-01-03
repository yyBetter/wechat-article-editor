// 版本历史管理组件
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useApp } from '../utils/app-context'
import {
  getDocumentVersions,
  getVersionDetail,
  restoreToVersion,
  createVersionSnapshot,
  deleteVersion,
  compareVersions,
  formatVersionTime,
  getChangeTypeInfo,
  DocumentVersion,
  DocumentVersionListResponse
} from '../utils/version-api'
import { notification } from '../utils/notification'

interface VersionHistoryProps {
  documentId: string | null
  onRestoreVersion?: (document: any) => void
  onClose?: () => void
}

interface VersionHistoryState {
  versions: DocumentVersion[]
  loading: boolean
  selectedVersion: DocumentVersion | null
  comparing: boolean
  compareVersions: [DocumentVersion | null, DocumentVersion | null]
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
  } | null
  showVersionDetail: boolean
}

export function VersionHistory({ documentId, onRestoreVersion, onClose }: VersionHistoryProps) {
  const { dispatch } = useApp()

  const [state, setState] = useState<VersionHistoryState>({
    versions: [],
    loading: false,
    selectedVersion: null,
    comparing: false,
    compareVersions: [null, null],
    pagination: {
      page: 1,
      limit: 15,
      total: 0,
      pages: 0
    },
    document: null,
    showVersionDetail: false
  })

  // 加载版本历史列表
  const loadVersions = useCallback(async (reset = false) => {
    if (!documentId) {
      return
    }

    try {
      setState(prev => ({ ...prev, loading: true }))

      const params = {
        page: reset ? 1 : state.pagination.page,
        limit: state.pagination.limit
      }

      const response = await getDocumentVersions(documentId, params)

      setState(prev => ({
        ...prev,
        versions: response.versions,
        pagination: response.pagination,
        document: response.document,
        loading: false
      }))
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [documentId, state.pagination.page, state.pagination.limit])

  // 初始加载和文档ID变化时重新加载
  useEffect(() => {
    if (documentId) {
      loadVersions(true)
    }
  }, [documentId])

  // 查看版本详情
  const handleViewVersion = useCallback(async (version: DocumentVersion) => {
    if (!documentId || !version.id) return

    try {
      setState(prev => ({ ...prev, loading: true }))

      const versionDetail = await getVersionDetail(documentId, version.id)

      setState(prev => ({
        ...prev,
        selectedVersion: versionDetail,
        showVersionDetail: true,
        loading: false
      }))
    } catch (error) {
      console.error('加载版本详情失败:', error)
      notification.error('加载版本详情失败', {
        details: error instanceof Error ? error.message : '请重试'
      })
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [documentId])

  // 恢复到指定版本
  const handleRestoreVersion = useCallback(async (version: DocumentVersion) => {
    if (!documentId || !version.id) return

    const confirmed = confirm(
      `确定要恢复到版本 #${version.versionNumber}？\n\n` +
      `版本时间: ${formatVersionTime(version.createdAt)}\n` +
      `变更原因: ${version.changeReason}\n\n` +
      `恢复操作会将当前版本保存到历史记录中。`
    )

    if (!confirmed) return

    try {
      setState(prev => ({ ...prev, loading: true }))

      const result = await restoreToVersion(documentId, version.id)

      // 更新编辑器内容
      if (result.document) {
        dispatch({ type: 'UPDATE_EDITOR_CONTENT', payload: result.document.content })

        if (result.document.templateId) {
          dispatch({ type: 'SELECT_TEMPLATE', payload: result.document.templateId })
        }

        if (result.document.templateVariables) {
          dispatch({ type: 'UPDATE_TEMPLATE_VARIABLES', payload: result.document.templateVariables })
        }
      }

      // 调用父组件回调
      onRestoreVersion?.(result.document)

      // 重新加载版本列表
      await loadVersions(true)

      notification.success('版本恢复成功', {
        details: result.message
      })

      setState(prev => ({ ...prev, loading: false, showVersionDetail: false, selectedVersion: null }))
    } catch (error) {
      console.error('恢复版本失败:', error)
      notification.error('恢复版本失败', {
        details: error instanceof Error ? error.message : '请重试'
      })
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [documentId, dispatch, onRestoreVersion, loadVersions])

  // 创建手动版本快照
  const handleCreateSnapshot = useCallback(async () => {
    if (!documentId) return

    const reason = prompt('请输入版本保存原因:', '手动保存重要版本')
    if (!reason) return

    try {
      setState(prev => ({ ...prev, loading: true }))

      const result = await createVersionSnapshot(documentId, reason)

      notification.success('版本快照创建成功', {
        details: result.message
      })

      // 重新加载版本列表
      await loadVersions(true)

      setState(prev => ({ ...prev, loading: false }))
    } catch (error) {
      console.error('创建版本快照失败:', error)
      notification.error('创建版本快照失败', {
        details: error instanceof Error ? error.message : '请重试'
      })
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [documentId, loadVersions])

  // 删除版本记录
  const handleDeleteVersion = useCallback(async (version: DocumentVersion) => {
    if (!documentId || !version.id) return

    const confirmed = confirm(
      `确定要删除版本 #${version.versionNumber}？\n\n` +
      `版本时间: ${formatVersionTime(version.createdAt)}\n` +
      `变更原因: ${version.changeReason}\n\n` +
      `此操作不可撤销！`
    )

    if (!confirmed) return

    try {
      await deleteVersion(documentId, version.id)

      notification.success('版本记录删除成功')

      // 重新加载版本列表
      await loadVersions(true)
    } catch (error) {
      console.error('删除版本失败:', error)
      notification.error('删除版本失败', {
        details: error instanceof Error ? error.message : '请重试'
      })
    }
  }, [documentId, loadVersions])

  // 分页处理
  const handlePageChange = useCallback((page: number) => {
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, page }
    }))
    loadVersions()
  }, [loadVersions])

  // 渲染版本列表项
  const renderVersionItem = useCallback((version: DocumentVersion, index: number) => {
    const typeInfo = getChangeTypeInfo(version.changeType)
    const isSelected = state.selectedVersion?.id === version.id

    return (
      <div
        key={version.id}
        className={`version-item ${isSelected ? 'selected' : ''}`}
      >
        <div className="version-header">
          <div className="version-info">
            <span className="version-number">
              #{version.versionNumber || (state.pagination.total - index)}
            </span>
            <span
              className="version-type"
              style={{ background: typeInfo.color }}
              title={version.changeReason}
            >
              {typeInfo.icon} {typeInfo.label}
            </span>
          </div>

          <div className="version-time">
            {formatVersionTime(version.createdAt)}
          </div>
        </div>

        <div className="version-content">
          <div className="version-title">{version.title}</div>
          <div className="version-reason">{version.changeReason}</div>
        </div>

        <div className="version-metadata">
          <span className="meta-item">📝 {version.metadata.wordCount} 字</span>
          <span className="meta-item">🖼️ {version.metadata.imageCount} 图</span>
          <span className="meta-item">⏱️ {version.metadata.estimatedReadTime} 分钟</span>
        </div>

        <div className="version-actions">
          <button
            className="action-btn view"
            onClick={() => handleViewVersion(version)}
            title="查看版本详情"
          >
            👁️
          </button>
          <button
            className="action-btn restore"
            onClick={() => handleRestoreVersion(version)}
            title="恢复到此版本"
          >
            🔄
          </button>
          <button
            className="action-btn delete"
            onClick={() => handleDeleteVersion(version)}
            title="删除版本记录"
          >
            🗑️
          </button>
        </div>
      </div>
    )
  }, [state.selectedVersion, state.pagination.total, handleViewVersion, handleRestoreVersion, handleDeleteVersion])

  // 版本详情模态框
  const renderVersionDetail = useMemo(() => {
    if (!state.showVersionDetail || !state.selectedVersion) return null

    const version = state.selectedVersion
    const typeInfo = getChangeTypeInfo(version.changeType)

    return (
      <div className="version-detail-modal">
        <div className="version-detail-content">
          <div className="modal-header">
            <h3>版本详情 #{version.versionNumber}</h3>
            <button
              className="close-btn"
              onClick={() => setState(prev => ({
                ...prev,
                showVersionDetail: false,
                selectedVersion: null
              }))}
            >
              ✕
            </button>
          </div>

          <div className="modal-body">
            <div className="version-meta-info">
              <div className="meta-row">
                <span className="meta-label">变更类型:</span>
                <span
                  className="meta-value version-type-badge"
                  style={{ background: typeInfo.color }}
                >
                  {typeInfo.icon} {typeInfo.label}
                </span>
              </div>
              <div className="meta-row">
                <span className="meta-label">变更时间:</span>
                <span className="meta-value">{formatVersionTime(version.createdAt)}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">变更原因:</span>
                <span className="meta-value">{version.changeReason}</span>
              </div>
            </div>

            <div className="version-content-preview">
              <h4>标题</h4>
              <div className="content-text title-text">{version.title}</div>

              <h4>内容预览</h4>
              <div className="content-text content-preview">
                {version.content ?
                  version.content.substring(0, 300) +
                  (version.content.length > 300 ? '...' : '')
                  : '无内容'}
              </div>
            </div>

            <div className="version-actions-detail">
              <button
                className="detail-action-btn restore-btn"
                onClick={() => handleRestoreVersion(version)}
              >
                🔄 恢复到此版本
              </button>
              <button
                className="detail-action-btn delete-btn"
                onClick={() => handleDeleteVersion(version)}
              >
                🗑️ 删除版本记录
              </button>
            </div>
          </div>
        </div>

        <div
          className="modal-backdrop"
          onClick={() => setState(prev => ({
            ...prev,
            showVersionDetail: false,
            selectedVersion: null
          }))}
        />
      </div>
    )
  }, [state.showVersionDetail, state.selectedVersion, handleRestoreVersion, handleDeleteVersion])


  if (!documentId) {
    return (
      <div className="version-history-container">
        <div className="empty-state">
          <span className="empty-icon">📄</span>
          <h3>请先选择文档</h3>
          <p>选择一个文档以查看其版本历史</p>
        </div>
      </div>
    )
  }

  return (
    <div className="version-history-container">
      {/* 工具栏 */}
      <div className="version-toolbar">
        <div className="toolbar-left">
          <h3 className="toolbar-title">
            📚 版本历史
            {state.document && (
              <span className="current-doc-info">
                - {state.document.title}
              </span>
            )}
          </h3>
        </div>

        <div className="toolbar-right">
          <button
            className="toolbar-btn create-snapshot"
            onClick={handleCreateSnapshot}
            disabled={state.loading}
            title="创建当前版本的手动快照"
          >
            📸 创建快照
          </button>

          {onClose && (
            <button
              className="toolbar-btn close-btn"
              onClick={onClose}
              title="关闭版本历史"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 版本列表 */}
      {state.loading ? (
        <div className="loading-state">
          <span className="loading-icon">⏳</span>
          <span>加载版本历史中...</span>
        </div>
      ) : state.versions.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📋</span>
          <h3>暂无版本历史</h3>
          <p>文档的变更历史将在这里显示</p>
          <button
            className="empty-action-btn"
            onClick={handleCreateSnapshot}
          >
            创建第一个版本快照
          </button>
        </div>
      ) : (
        <>
          {/* 当前版本指示器 */}
          {state.document && (
            <div className="current-version-indicator">
              <span className="current-version-badge">
                当前版本 #{state.document.currentVersion}
              </span>
              <span className="version-count">
                共 {state.pagination.total} 个历史版本
              </span>
            </div>
          )}

          {/* 版本列表 */}
          <div className="version-list">
            {state.versions.map((version, index) =>
              renderVersionItem(version, index)
            )}
          </div>

          {/* 分页 */}
          {state.pagination.pages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                disabled={state.pagination.page === 1}
                onClick={() => handlePageChange(state.pagination.page - 1)}
              >
                上一页
              </button>

              <div className="page-info">
                第 {state.pagination.page} 页 / 共 {state.pagination.pages} 页
              </div>

              <button
                className="page-btn"
                disabled={state.pagination.page === state.pagination.pages}
                onClick={() => handlePageChange(state.pagination.page + 1)}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}

      {/* 版本详情模态框 */}
      {renderVersionDetail}
    </div>
  )
}