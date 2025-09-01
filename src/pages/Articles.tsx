// 文章管理页面组件 - 专门的文章列表和管理界面
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../utils/auth-context'
import { useApp } from '../utils/app-context'
import { AuthModal } from '../components/auth/AuthModal'
import { UserMenu } from '../components/auth/UserMenu'
import { getDocuments, deleteDocument, batchUpdateMetadata } from '../utils/document-api'
import { notification } from '../utils/notification'
import '../styles/articles.css'

// 字数统计函数 - 与服务端保持一致
function countWords(content: string): number {
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

interface Document {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  templateId?: string
  templateVariables?: any
  metadata?: {
    wordCount: number
    imageCount: number
    readTime: number
  }
}

interface SortOption {
  field: 'updatedAt' | 'createdAt' | 'title' | 'wordCount'
  direction: 'asc' | 'desc'
  label: string
}

const SORT_OPTIONS: SortOption[] = [
  { field: 'updatedAt', direction: 'desc', label: '最近更新' },
  { field: 'createdAt', direction: 'desc', label: '创建时间' },
  { field: 'title', direction: 'asc', label: '标题 A-Z' },
  { field: 'wordCount', direction: 'desc', label: '字数排序' }
]

export function Articles() {
  const navigate = useNavigate()
  const { state: authState, login } = useAuth()
  const { dispatch } = useApp()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOption, setSortOption] = useState<SortOption>(SORT_OPTIONS[0])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // 加载文档列表
  useEffect(() => {
    if (authState.isAuthenticated) {
      loadDocuments()
    }
  }, [authState.isAuthenticated])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const response = await getDocuments()
      console.log('Articles API响应:', response)
      const documents = response.documents || []
      setDocuments(documents)
    } catch (error) {
      console.error('加载文档失败:', error)
      notification.error('加载文档失败')
    } finally {
      setLoading(false)
    }
  }

  // 处理认证成功
  const handleAuthSuccess = (user: any, token: string) => {
    login(user, token)
    if (user.brandSettings) {
      dispatch({
        type: 'UPDATE_FIXED_ASSETS',
        payload: user.brandSettings
      })
    }
    setAuthModalOpen(false)
  }

  // 返回首页
  const handleBackToHome = () => {
    navigate('/')
  }

  // 创建新文章
  const handleNewArticle = () => {
    dispatch({ type: 'UPDATE_EDITOR_CONTENT', payload: '' })
    dispatch({ type: 'UPDATE_TEMPLATE_VARIABLES', payload: { title: '' } })
    navigate('/editor')
  }

  // 编辑文章
  const handleEditArticle = (documentId: string) => {
    // 清理当前编辑器状态，避免显示上一个文档的内容
    dispatch({ type: 'UPDATE_EDITOR_CONTENT', payload: '' })
    dispatch({ type: 'UPDATE_TEMPLATE_VARIABLES', payload: { title: '加载中...' } })
    navigate(`/editor/${documentId}`)
  }

  // 删除文章
  const handleDeleteArticle = async (documentId: string) => {
    if (!window.confirm('确定要删除这篇文章吗？此操作无法撤销。')) {
      return
    }

    try {
      const response = await deleteDocument(documentId)
      if (response.success) {
        notification.success('文章已删除')
        loadDocuments() // 重新加载列表
      } else {
        notification.error('删除失败')
      }
    } catch (error) {
      console.error('删除文章失败:', error)
      notification.error('删除文章失败')
    }
  }

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return
    
    if (!window.confirm(`确定要删除选中的 ${selectedIds.size} 篇文章吗？此操作无法撤销。`)) {
      return
    }

    try {
      const deletePromises = Array.from(selectedIds).map(id => deleteDocument(id))
      await Promise.all(deletePromises)
      notification.success(`已删除 ${selectedIds.size} 篇文章`)
      setSelectedIds(new Set())
      loadDocuments()
    } catch (error) {
      console.error('批量删除失败:', error)
      notification.error('批量删除失败')
    }
  }

  // 批量更新metadata
  const handleBatchUpdateMetadata = async () => {
    if (!window.confirm('确定要重新计算所有文章的字数统计吗？这将更新所有文章的metadata。')) {
      return
    }

    try {
      setLoading(true)
      const response = await batchUpdateMetadata()
      console.log('批量更新结果:', response)
      notification.success('所有文章的字数统计已更新')
      loadDocuments() // 重新加载数据
    } catch (error) {
      console.error('批量更新metadata失败:', error)
      notification.error('批量更新失败')
    } finally {
      setLoading(false)
    }
  }

  // 切换选择
  const toggleSelection = (documentId: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(documentId)) {
      newSelected.delete(documentId)
    } else {
      newSelected.add(documentId)
    }
    setSelectedIds(newSelected)
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAndSortedDocuments.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredAndSortedDocuments.map(doc => doc.id)))
    }
  }

  // 过滤和排序文档
  const filteredAndSortedDocuments = React.useMemo(() => {
    let filtered = documents.filter(doc => 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchQuery.toLowerCase())
    )

    filtered.sort((a, b) => {
      const { field, direction } = sortOption
      let aValue = a[field]
      let bValue = b[field]

      if (field === 'wordCount') {
        aValue = a.metadata?.wordCount || 0
        bValue = b.metadata?.wordCount || 0
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return direction === 'asc' ? aValue - bValue : bValue - aValue
      }

      return direction === 'asc' 
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue))
    })

    return filtered
  }, [documents, searchQuery, sortOption])

  // 未登录状态
  if (!authState.isAuthenticated) {
    return (
      <div className="articles-page">
        <header className="articles-header">
          <div className="header-content">
            <div className="header-left">
              <button className="back-btn" onClick={handleBackToHome}>
                ← 返回首页
              </button>
              <h1>文章管理</h1>
            </div>
            <UserMenu onOpenAuthModal={() => setAuthModalOpen(true)} />
          </div>
        </header>

        <main className="articles-main">
          <div className="auth-prompt">
            <div className="auth-prompt-content">
              <h2>请先登录</h2>
              <p>登录后即可查看和管理您的所有文章</p>
              <button 
                className="login-btn"
                onClick={() => setAuthModalOpen(true)}
              >
                立即登录
              </button>
            </div>
          </div>
        </main>

        <AuthModal 
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      </div>
    )
  }

  return (
    <div className="articles-page">
      {/* 顶部导航栏 */}
      <header className="articles-header">
        <div className="header-content">
          <div className="header-left">
            <button className="back-btn" onClick={handleBackToHome}>
              ← 返回首页
            </button>
            <h1>文章管理</h1>
            <span className="article-count">({filteredAndSortedDocuments.length} 篇文章)</span>
          </div>
          <div className="header-right">
            <button className="new-article-btn" onClick={handleNewArticle}>
              + 新建文章
            </button>
            <UserMenu onOpenAuthModal={() => setAuthModalOpen(true)} />
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="articles-main">
        <div className="articles-container">
          {/* 工具栏 */}
          <div className="articles-toolbar">
            <div className="toolbar-left">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="搜索文章标题或内容..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
              
              <select
                value={`${sortOption.field}-${sortOption.direction}`}
                onChange={(e) => {
                  const [field, direction] = e.target.value.split('-')
                  setSortOption(SORT_OPTIONS.find(opt => 
                    opt.field === field && opt.direction === direction
                  )!)
                }}
                className="sort-select"
              >
                {SORT_OPTIONS.map(option => (
                  <option 
                    key={`${option.field}-${option.direction}`}
                    value={`${option.field}-${option.direction}`}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="toolbar-right">
              <button 
                className="update-metadata-btn"
                onClick={handleBatchUpdateMetadata}
                disabled={loading}
                style={{
                  marginRight: '10px',
                  padding: '6px 12px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? '更新中...' : '🔄 重算字数'}
              </button>
              
              {selectedIds.size > 0 && (
                <div className="batch-actions">
                  <span className="selected-count">已选择 {selectedIds.size} 项</span>
                  <button 
                    className="batch-delete-btn"
                    onClick={handleBatchDelete}
                  >
                    批量删除
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 文章列表 */}
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>加载中...</p>
            </div>
          ) : filteredAndSortedDocuments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>
                {searchQuery ? '未找到匹配的文章' : '还没有文章'}
              </h3>
              <p>
                {searchQuery 
                  ? '尝试使用其他关键词搜索'
                  : '创建您的第一篇文章开始使用'
                }
              </p>
              {!searchQuery && (
                <button className="create-first-btn" onClick={handleNewArticle}>
                  创建文章
                </button>
              )}
            </div>
          ) : (
            <div className="articles-list">
              {/* 列表头部 */}
              <div className="list-header">
                <div className="header-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredAndSortedDocuments.length}
                    onChange={toggleSelectAll}
                  />
                </div>
                <div className="header-title">标题</div>
                <div className="header-stats">统计</div>
                <div className="header-date">更新时间</div>
                <div className="header-actions">操作</div>
              </div>

              {/* 文章项目 */}
              {filteredAndSortedDocuments.map((doc) => (
                <div key={doc.id} className="article-item">
                  <div className="item-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(doc.id)}
                      onChange={() => toggleSelection(doc.id)}
                    />
                  </div>
                  
                  <div className="item-content" onClick={() => handleEditArticle(doc.id)}>
                    <div className="item-title">
                      <h3>{doc.title || '无标题'}</h3>
                      <div className="item-preview">
                        {doc.content ? 
                          doc.content.substring(0, 120).replace(/[#*>`]/g, '') + '...' : 
                          '暂无内容'
                        }
                      </div>
                    </div>
                  </div>
                  
                  <div className="item-stats">
                    <span className="stat-item">
                      📝 {doc.metadata?.wordCount ?? 0} 字
                    </span>
                    <span className="stat-item">
                      🖼️ {doc.metadata?.imageCount ?? 0} 图
                    </span>
                  </div>
                  
                  <div className="item-date">
                    <div className="date-primary">
                      {new Date(doc.updatedAt).toLocaleDateString('zh-CN')}
                    </div>
                    <div className="date-secondary">
                      {new Date(doc.updatedAt).toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  
                  <div className="item-actions">
                    <button 
                      className="edit-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditArticle(doc.id)
                      }}
                    >
                      编辑
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteArticle(doc.id)
                      }}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 认证弹窗 */}
      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  )
}