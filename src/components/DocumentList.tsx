// 文档列表管理组件
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../utils/auth-context'
import { useApp } from '../utils/app-context'
import { getDocuments, deleteDocument, duplicateDocument, Document } from '../utils/document-api'
import { notification } from '../utils/notification'

interface DocumentListProps {
  onSelectDocument?: (document: Document) => void
  onNewDocument?: () => void
}

interface DocumentListState {
  documents: Document[]
  loading: boolean
  searchTerm: string
  statusFilter: 'ALL' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  sortBy: 'updatedAt' | 'createdAt' | 'title'
  sortOrder: 'desc' | 'asc'
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  selectedDocuments: Set<string>
}

export function DocumentList({ onSelectDocument, onNewDocument }: DocumentListProps) {
  const { state: authState } = useAuth()
  const { dispatch } = useApp()
  
  const [state, setState] = useState<DocumentListState>({
    documents: [],
    loading: false,
    searchTerm: '',
    statusFilter: 'ALL',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      pages: 0
    },
    selectedDocuments: new Set()
  })

  // 加载文档列表
  const loadDocuments = useCallback(async (reset = false) => {
    if (!authState.isAuthenticated) {
      return
    }

    try {
      setState(prev => ({ ...prev, loading: true }))
      
      const params = {
        page: reset ? 1 : state.pagination.page,
        limit: state.pagination.limit,
        search: state.searchTerm || undefined,
        status: state.statusFilter === 'ALL' ? undefined : state.statusFilter
      }

      const response = await getDocuments(params)
      
      setState(prev => ({
        ...prev,
        documents: response.documents,
        pagination: response.pagination,
        loading: false,
        selectedDocuments: new Set() // 清空选择
      }))
    } catch (error) {
      console.error('加载文档列表失败:', error)
      notification.error('加载文档列表失败', {
        details: error instanceof Error ? error.message : '请重试'
      })
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [authState.isAuthenticated, state.searchTerm, state.statusFilter, state.pagination.page, state.pagination.limit])

  // 初始加载
  useEffect(() => {
    loadDocuments(true)
  }, [authState.isAuthenticated])

  // 搜索和过滤变化时重新加载
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (authState.isAuthenticated) {
        loadDocuments(true)
      }
    }, 300) // 防抖

    return () => clearTimeout(timeoutId)
  }, [state.searchTerm, state.statusFilter])

  // 排序后的文档列表
  const sortedDocuments = useMemo(() => {
    return [...state.documents].sort((a, b) => {
      let aValue: any
      let bValue: any
      
      switch (state.sortBy) {
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'createdAt':
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
        case 'updatedAt':
        default:
          aValue = new Date(a.updatedAt)
          bValue = new Date(b.updatedAt)
          break
      }
      
      if (state.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
  }, [state.documents, state.sortBy, state.sortOrder])

  // 处理搜索
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, searchTerm: e.target.value }))
  }, [])

  // 处理状态筛选
  const handleStatusFilter = useCallback((status: DocumentListState['statusFilter']) => {
    setState(prev => ({ ...prev, statusFilter: status }))
  }, [])

  // 处理排序
  const handleSort = useCallback((sortBy: DocumentListState['sortBy']) => {
    setState(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc'
    }))
  }, [])

  // 处理分页
  const handlePageChange = useCallback((page: number) => {
    setState(prev => ({ 
      ...prev, 
      pagination: { ...prev.pagination, page } 
    }))
    loadDocuments()
  }, [loadDocuments])

  // 处理文档选择
  const handleDocumentSelect = useCallback((documentId: string, selected: boolean) => {
    setState(prev => {
      const newSelected = new Set(prev.selectedDocuments)
      if (selected) {
        newSelected.add(documentId)
      } else {
        newSelected.delete(documentId)
      }
      return { ...prev, selectedDocuments: newSelected }
    })
  }, [])

  // 全选/取消全选
  const handleSelectAll = useCallback((selected: boolean) => {
    setState(prev => ({
      ...prev,
      selectedDocuments: selected ? new Set(prev.documents.map(doc => doc.id)) : new Set()
    }))
  }, [])

  // 删除文档
  const handleDeleteDocument = useCallback(async (documentId: string) => {
    if (!confirm('确定要删除这个文档吗？此操作不可撤销。')) {
      return
    }

    try {
      await deleteDocument(documentId)
      notification.success('文档删除成功')
      loadDocuments(true) // 重新加载列表
    } catch (error) {
      console.error('删除文档失败:', error)
      notification.error('删除文档失败', {
        details: error instanceof Error ? error.message : '请重试'
      })
    }
  }, [loadDocuments])

  // 复制文档
  const handleDuplicateDocument = useCallback(async (documentId: string) => {
    try {
      const duplicated = await duplicateDocument(documentId)
      notification.success('文档复制成功', {
        details: `已创建副本: ${duplicated.title}`
      })
      loadDocuments(true) // 重新加载列表
    } catch (error) {
      console.error('复制文档失败:', error)
      notification.error('复制文档失败', {
        details: error instanceof Error ? error.message : '请重试'
      })
    }
  }, [loadDocuments])

  // 批量删除
  const handleBatchDelete = useCallback(async () => {
    if (state.selectedDocuments.size === 0) {
      notification.warning('请先选择要删除的文档')
      return
    }

    if (!confirm(`确定要删除选中的 ${state.selectedDocuments.size} 个文档吗？此操作不可撤销。`)) {
      return
    }

    try {
      const deletePromises = Array.from(state.selectedDocuments).map(id => deleteDocument(id))
      await Promise.all(deletePromises)
      
      notification.success(`成功删除 ${state.selectedDocuments.size} 个文档`)
      loadDocuments(true)
    } catch (error) {
      console.error('批量删除失败:', error)
      notification.error('批量删除失败', {
        details: '部分文档删除失败，请重试'
      })
      loadDocuments(true) // 重新加载以更新状态
    }
  }, [state.selectedDocuments, loadDocuments])

  // 加载单个文档到编辑器
  const handleLoadDocument = useCallback((document: Document) => {
    // 更新编辑器内容
    dispatch({ type: 'UPDATE_EDITOR_CONTENT', payload: document.content })
    
    // 更新模板
    if (document.templateId) {
      dispatch({ type: 'SELECT_TEMPLATE', payload: document.templateId })
    }
    
    // 更新模板变量
    dispatch({ type: 'UPDATE_TEMPLATE_VARIABLES', payload: document.templateVariables })
    
    // 调用父组件的回调
    onSelectDocument?.(document)
    
    notification.success('文档已加载到编辑器', {
      details: document.title
    })
  }, [dispatch, onSelectDocument])

  // 格式化日期
  const formatDate = useCallback((dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays < 7) {
      return `${diffDays}天前`
    } else {
      return date.toLocaleDateString('zh-CN')
    }
  }, [])

  // 获取状态标签样式
  const getStatusStyle = useCallback((status: Document['status']) => {
    switch (status) {
      case 'DRAFT':
        return { color: '#6c757d', background: '#f8f9fa' }
      case 'PUBLISHED':
        return { color: '#28a745', background: '#d4edda' }
      case 'ARCHIVED':
        return { color: '#ffc107', background: '#fff3cd' }
      default:
        return { color: '#6c757d', background: '#f8f9fa' }
    }
  }, [])

  if (!authState.isAuthenticated) {
    return (
      <div className="document-list-container">
        <div className="empty-state">
          <span className="empty-icon">🔐</span>
          <h3>请先登录</h3>
          <p>登录后即可查看和管理您的文档</p>
        </div>
      </div>
    )
  }

  return (
    <div className="document-list-container">
      {/* 工具栏 */}
      <div className="document-toolbar">
        <div className="toolbar-left">
          <button className="new-document-btn" onClick={onNewDocument}>
            <span>➕</span>
            新建文档
          </button>
          
          {state.selectedDocuments.size > 0 && (
            <button className="batch-action-btn delete" onClick={handleBatchDelete}>
              <span>🗑️</span>
              删除选中 ({state.selectedDocuments.size})
            </button>
          )}
        </div>
        
        <div className="toolbar-right">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="搜索文档..."
              value={state.searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
          </div>
        </div>
      </div>

      {/* 过滤器 */}
      <div className="document-filters">
        <div className="filter-group">
          <span className="filter-label">状态:</span>
          {(['ALL', 'DRAFT', 'PUBLISHED', 'ARCHIVED'] as const).map(status => (
            <button
              key={status}
              className={`filter-btn ${state.statusFilter === status ? 'active' : ''}`}
              onClick={() => handleStatusFilter(status)}
            >
              {status === 'ALL' ? '全部' : 
               status === 'DRAFT' ? '草稿' :
               status === 'PUBLISHED' ? '已发布' : '已归档'}
            </button>
          ))}
        </div>
        
        <div className="sort-group">
          <span className="sort-label">排序:</span>
          {[
            { key: 'updatedAt', label: '更新时间' },
            { key: 'createdAt', label: '创建时间' }, 
            { key: 'title', label: '标题' }
          ].map(sort => (
            <button
              key={sort.key}
              className={`sort-btn ${state.sortBy === sort.key ? 'active' : ''}`}
              onClick={() => handleSort(sort.key as DocumentListState['sortBy'])}
            >
              {sort.label}
              {state.sortBy === sort.key && (
                <span className="sort-indicator">
                  {state.sortOrder === 'desc' ? '↓' : '↑'}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 文档列表 */}
      {state.loading ? (
        <div className="loading-state">
          <span className="loading-icon">⏳</span>
          <span>加载中...</span>
        </div>
      ) : state.documents.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📄</span>
          <h3>暂无文档</h3>
          <p>{state.searchTerm ? '没有找到匹配的文档' : '开始创建您的第一个文档吧'}</p>
          {!state.searchTerm && (
            <button className="empty-action-btn" onClick={onNewDocument}>
              创建新文档
            </button>
          )}
        </div>
      ) : (
        <>
          {/* 列表头部 */}
          <div className="document-list-header">
            <label className="select-all-label">
              <input
                type="checkbox"
                checked={state.selectedDocuments.size === state.documents.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
              全选
            </label>
            <span className="document-count">
              共 {state.pagination.total} 个文档
            </span>
          </div>

          {/* 文档列表 */}
          <div className="document-list">
            {sortedDocuments.map(document => (
              <div key={document.id} className="document-item">
                <div className="document-select">
                  <input
                    type="checkbox"
                    checked={state.selectedDocuments.has(document.id)}
                    onChange={(e) => handleDocumentSelect(document.id, e.target.checked)}
                  />
                </div>
                
                <div className="document-content" onClick={() => handleLoadDocument(document)}>
                  <div className="document-header">
                    <h3 className="document-title">{document.title}</h3>
                    <span 
                      className="document-status"
                      style={getStatusStyle(document.status)}
                    >
                      {document.status === 'DRAFT' ? '草稿' :
                       document.status === 'PUBLISHED' ? '已发布' : '已归档'}
                    </span>
                  </div>
                  
                  <div className="document-preview">
                    {document.preview || '无内容预览'}
                  </div>
                  
                  <div className="document-meta">
                    <span className="meta-item">
                      📝 {document.metadata.wordCount} 字
                    </span>
                    <span className="meta-item">
                      🖼️ {document.metadata.imageCount} 图
                    </span>
                    <span className="meta-item">
                      ⏱️ {document.metadata.estimatedReadTime} 分钟
                    </span>
                    <span className="meta-item">
                      📅 {formatDate(document.updatedAt)}
                    </span>
                  </div>
                </div>
                
                <div className="document-actions">
                  <button
                    className="action-btn"
                    onClick={() => handleLoadDocument(document)}
                    title="加载到编辑器"
                  >
                    📝
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => handleDuplicateDocument(document.id)}
                    title="复制文档"
                  >
                    📋
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => handleDeleteDocument(document.id)}
                    title="删除文档"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
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
    </div>
  )
}