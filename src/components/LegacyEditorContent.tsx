// 旧版编辑器内容组件 - 不包含Context提供器的版本
import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../utils/app-context'
import { useAuth } from '../utils/auth-context'
import { Editor } from './Editor'
import { Preview } from './Preview'
import { TemplateSelector } from './TemplateSelector'
import { PublishGuide } from './PublishGuide'
import { PublishFlow } from './PublishFlow'
import { Settings } from './Settings'
import { AuthModal } from './auth/AuthModal'
import { UserMenu } from './auth/UserMenu'
import { getDocument, saveCurrentContent } from '../utils/document-api'
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
  const [loading, setLoading] = useState(false)
  const [previousUserId, setPreviousUserId] = useState<string | null>(authState.user?.id || null)
  const [isSavingBeforeLogout, setIsSavingBeforeLogout] = useState(false)

  // 监听认证状态变化，处理账号切换的情况
  useEffect(() => {
    const currentUserId = authState.user?.id || null
    const wasAuthenticated = previousUserId !== null
    const isNowAuthenticated = currentUserId !== null
    const userChanged = previousUserId && currentUserId && previousUserId !== currentUserId
    const userLoggedOut = wasAuthenticated && !isNowAuthenticated
    
    // 如果用户切换账号或登出，且编辑器有内容
    if ((userChanged || userLoggedOut) && !isSavingBeforeLogout) {
      const hasContent = state.editor.content.trim().length > 0 || (state.templates.variables.title && state.templates.variables.title.trim().length > 0)
      
      if (hasContent && previousUserId) {
        console.log('检测到账号切换，准备保存当前内容...')
        // 自动保存并跳转首页
        handleAccountSwitch()
      } else if (userChanged || userLoggedOut) {
        console.log('账号切换且无内容，直接跳转首页')
        // 没有内容，直接跳转首页
        dispatch({ type: 'UPDATE_EDITOR_CONTENT', payload: '' })
        dispatch({ type: 'UPDATE_TEMPLATE_VARIABLES', payload: { title: '' } })
        navigate('/')
      }
    }
    
    // 更新上一次的用户ID
    if (currentUserId !== previousUserId) {
      setPreviousUserId(currentUserId)
    }
  }, [authState.user?.id, authState.isAuthenticated])

  // 根据URL参数加载文档
  useEffect(() => {
    if (documentId && authState.isAuthenticated) {
      // 立即清理编辑器状态
      dispatch({ type: 'UPDATE_EDITOR_CONTENT', payload: '' })
      dispatch({ type: 'UPDATE_TEMPLATE_VARIABLES', payload: { title: '加载中...' } })
      loadDocument(documentId)
    }
  }, [documentId, authState.isAuthenticated])

  // 处理账号切换：自动保存并跳转首页
  const handleAccountSwitch = async () => {
    try {
      setIsSavingBeforeLogout(true)
      
      // 显示保存提示
      notification.info('检测到账号切换，正在保存当前内容...')
      
      // 保存当前内容到原账号（使用存储的token）
      const currentContent = {
        title: state.templates.variables.title || '未命名文档',
        content: state.editor.content || '',
        templateId: state.templates.current?.id || 'simple-doc',
        templateVariables: state.templates.variables
      }
      
      await saveCurrentContent(currentContent)
      notification.success('当前内容已保存到原账号')
      
      // 清理编辑器状态
      dispatch({ type: 'UPDATE_EDITOR_CONTENT', payload: '' })
      dispatch({ type: 'UPDATE_TEMPLATE_VARIABLES', payload: { title: '' } })
      
      // 跳转到首页
      navigate('/')
      
    } catch (error) {
      console.error('保存失败:', error)
      notification.error('保存失败，但已跳转到首页')
      
      // 即使保存失败，也要跳转到首页避免数据混乱
      dispatch({ type: 'UPDATE_EDITOR_CONTENT', payload: '' })
      dispatch({ type: 'UPDATE_TEMPLATE_VARIABLES', payload: { title: '' } })
      navigate('/')
    } finally {
      setIsSavingBeforeLogout(false)
    }
  }

  // 加载指定文档
  const loadDocument = async (id: string) => {
    try {
      setLoading(true)
      const doc = await getDocument(id)
      if (doc) {
        console.log('加载的文档数据:', doc)
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
            {loading ? '加载中...' : documentId ? `编辑: ${state.templates.variables?.title || '无标题'}` : '公众号排版工具'}
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
              onClick={() => navigate('/articles')}
              title="文章管理"
            >
              📄 文章管理
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
                className={`nav-tab ${state.ui.activePanel === 'templates' ? 'active' : ''}`}
                onClick={() => switchPanel('templates')}
                title="模板选择"
              >
                🎨 模板
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
              {/* 模板选择 */}
              {state.ui.activePanel === 'templates' && (
                <div className="content-group">
                  <div className="sub-content">
                    <TemplateSelector />
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