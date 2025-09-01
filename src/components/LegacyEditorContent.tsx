// 旧版编辑器内容组件 - 不包含Context提供器的版本
import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../utils/app-context'
import { useAuth } from '../utils/auth-context'
import { Editor } from './Editor'
import { Preview } from './Preview'
import { TemplateSelector } from './TemplateSelector'
import { DocumentList } from './DocumentList'
import { VersionHistory } from './VersionHistory'
import { PublishGuide } from './PublishGuide'
import { PublishFlow } from './PublishFlow'
import { Settings } from './Settings'
import { AuthModal } from './auth/AuthModal'
import { UserMenu } from './auth/UserMenu'
import { getDocument } from '../utils/document-api'
import { notification } from '../utils/notification'
import '../App.css'
import '../styles/sidebar.css'
import '../styles/publish.css'

export function LegacyEditorContent() {
  const navigate = useNavigate()
  const { documentId } = useParams<{ documentId?: string }>()
  const { state, dispatch } = useApp()
  const { state: authState, login } = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [versionHistoryDocument, setVersionHistoryDocument] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // 根据URL参数加载文档
  useEffect(() => {
    if (documentId && authState.isAuthenticated) {
      loadDocument(documentId)
    }
  }, [documentId, authState.isAuthenticated])

  // 加载指定文档
  const loadDocument = async (id: string) => {
    try {
      setLoading(true)
      const response = await getDocument(id)
      if (response.success && response.document) {
        const doc = response.document
        dispatch({ type: 'UPDATE_EDITOR_CONTENT', payload: doc.content || '' })
        dispatch({ 
          type: 'UPDATE_TEMPLATE_VARIABLES', 
          payload: { 
            title: doc.title || '',
            ...doc.templateVariables 
          }
        })
        if (doc.templateId) {
          // 这里可以根据需要设置模板
        }
        notification.success(`已加载文档: ${doc.title}`)
      }
    } catch (error) {
      console.error('加载文档失败:', error)
      notification.error('加载文档失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 返回首页
  const handleBackToHome = () => {
    navigate('/')
  }
  
  // 切换侧边栏
  const toggleSidebar = () => {
    dispatch({ 
      type: 'SET_UI_STATE', 
      payload: { sidebarOpen: !state.ui.sidebarOpen }
    })
  }
  
  // 切换面板
  const switchPanel = (panel: 'editor' | 'templates' | 'documents' | 'assets' | 'export' | 'guide' | 'settings') => {
    dispatch({ 
      type: 'SET_UI_STATE', 
      payload: { activePanel: panel }
    })
  }
  
  // 切换预览显示
  const togglePreview = () => {
    dispatch({ 
      type: 'SET_UI_STATE', 
      payload: { showPreview: !state.ui.showPreview }
    })
  }

  // 处理认证成功
  const handleAuthSuccess = (user: any, token: string) => {
    console.log('用户登录成功:', user)
    
    // 重要：调用AuthContext的login方法更新认证状态
    login(user, token)
    
    // 同步用户的品牌设置到现有的AppState
    if (user.brandSettings) {
      dispatch({
        type: 'UPDATE_FIXED_ASSETS',
        payload: user.brandSettings
      })
    }
  }

  // 显示版本历史
  const handleShowVersionHistory = (documentId: string) => {
    setVersionHistoryDocument(documentId)
    switchPanel('documents') // 确保在文档面板中
  }

  // 关闭版本历史
  const handleCloseVersionHistory = () => {
    setVersionHistoryDocument(null)
  }

  // 版本恢复后的处理
  const handleVersionRestore = (document: any) => {
    console.log('版本恢复成功:', document.title)
    // 可以添加额外的UI反馈
  }
  
  return (
    <div className={`app ${state.ui.theme}`}>
      {/* 顶部导航栏 */}
      <header className="app-header">
        <div className="header-left">
          <button 
            type="button"
            className="header-btn back-btn"
            onClick={handleBackToHome}
            title="返回首页"
          >
            ← 首页
          </button>
          <button 
            type="button"
            className="sidebar-toggle"
            onClick={toggleSidebar}
            title={state.ui.sidebarOpen ? '隐藏侧边栏' : '显示侧边栏'}
          >
            ☰
          </button>
          <h1 className="app-title">
            {loading ? '加载中...' : documentId ? `编辑: ${state.templateVariables?.title || '无标题'}` : '公众号排版工具'}
          </h1>
        </div>
        
        <div className="header-right">
          <div className="template-info">
            {state.templates.current && (
              <span className="current-template">
                当前模板: {state.templates.current.name}
              </span>
            )}
          </div>
          
          <div className="header-actions">
            <button 
              type="button"
              className="header-btn preview-toggle"
              onClick={togglePreview}
              title={state.ui.showPreview ? '隐藏预览' : '显示预览'}
            >
              {state.ui.showPreview ? '📱 隐藏预览' : '👁️ 显示预览'}
            </button>
            
            <button 
              type="button"
              className="header-btn"
              onClick={() => switchPanel('export')}
              title="导出设置"
            >
              📤 导出
            </button>
            
            {/* 用户菜单 */}
            <UserMenu onOpenAuthModal={() => setAuthModalOpen(true)} />
          </div>
        </div>
      </header>
      
      {/* 主要内容区域 */}
      <div className="app-main">
        {/* 左侧边栏 */}
        {state.ui.sidebarOpen && (
          <aside className="app-sidebar">
            {/* 简化的侧边栏导航 */}
            <nav className="sidebar-nav">
              <button
                type="button"
                className={`nav-tab ${['templates', 'documents'].includes(state.ui.activePanel) ? 'active' : ''}`}
                onClick={() => switchPanel('templates')}
                title="模板选择和文档管理"
              >
                📝 创作
              </button>
              <button
                type="button"
                className={`nav-tab ${['guide', 'settings'].includes(state.ui.activePanel) ? 'active' : ''}`}
                onClick={() => switchPanel('guide')}
                title="发布指南和设置"
              >
                ⚙️ 更多
              </button>
            </nav>
            
            {/* 侧边栏内容 */}
            <div className="sidebar-content">
              {/* 创作组合 - 模板和文档 */}
              {['templates', 'documents'].includes(state.ui.activePanel) && (
                <div className="content-group">
                  {/* 子菜单 */}
                  <div className="sub-nav">
                    <button
                      className={`sub-nav-btn ${state.ui.activePanel === 'templates' ? 'active' : ''}`}
                      onClick={() => switchPanel('templates')}
                    >
                      🎨 选择模板
                    </button>
                    <button
                      className={`sub-nav-btn ${state.ui.activePanel === 'documents' ? 'active' : ''}`}
                      onClick={() => switchPanel('documents')}
                    >
                      📄 我的文档
                    </button>
                  </div>
                  
                  {/* 子内容 */}
                  <div className="sub-content">
                    {state.ui.activePanel === 'templates' && <TemplateSelector />}
                    {state.ui.activePanel === 'documents' && (
                      <>
                        {versionHistoryDocument ? (
                          <VersionHistory 
                            documentId={versionHistoryDocument}
                            onRestoreVersion={handleVersionRestore}
                            onClose={handleCloseVersionHistory}
                          />
                        ) : (
                          <DocumentList 
                            onNewDocument={() => {
                              dispatch({ type: 'UPDATE_EDITOR_CONTENT', payload: '' })
                              dispatch({ type: 'UPDATE_TEMPLATE_VARIABLES', payload: { title: '' } })
                              switchPanel('templates')
                            }}
                            onShowVersionHistory={handleShowVersionHistory}
                          />
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {/* 更多组合 - 发布和设置 */}
              {['guide', 'settings'].includes(state.ui.activePanel) && (
                <div className="content-group">
                  <div className="sub-nav">
                    <button
                      className={`sub-nav-btn ${state.ui.activePanel === 'guide' ? 'active' : ''}`}
                      onClick={() => switchPanel('guide')}
                    >
                      📖 发布指南
                    </button>
                    <button
                      className={`sub-nav-btn ${state.ui.activePanel === 'settings' ? 'active' : ''}`}
                      onClick={() => switchPanel('settings')}
                    >
                      🔧 全局设置
                    </button>
                  </div>
                  
                  <div className="sub-content">
                    {state.ui.activePanel === 'guide' && <PublishFlow />}
                    {state.ui.activePanel === 'settings' && <Settings />}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
        
        {/* 编辑器区域 */}
        <div className="editor-section">
          <Editor />
        </div>
        
        {/* 预览区域 */}
        {state.ui.showPreview && (
          <div className={`preview-section ${!state.ui.showPreview ? 'collapsed' : ''}`}>
            <Preview />
          </div>
        )}
      </div>
      
      {/* 底部状态栏 */}
      <footer className="app-footer">
        <div className="footer-left">
          <span className="status-text">
            {authState.isAuthenticated ? 
              `已登录用户: ${authState.user?.email || '未知用户'}` : 
              '未登录 - 部分功能限制'
            }
          </span>
        </div>
        
        <div className="footer-right">
          <span className="version-info">v1.0.0</span>
        </div>
      </footer>

      {/* 认证弹窗 */}
      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  )
}