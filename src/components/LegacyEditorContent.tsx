// 旧版编辑器内容组件 - 不包含Context提供器的版本
import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../utils/app-context'
import { useAuth } from '../utils/auth-context'
import { Editor } from './Editor'
import { Preview } from './Preview'
import { PublishModal } from './PublishModal'
import { LocalAuthModal } from './auth/LocalAuthModal'
import { UserMenu } from './auth/UserMenu'
import { getDocument, saveCurrentContent } from '../utils/document-api'
import { notification } from '../utils/notification'
import { AIAssistant } from './ai/AIAssistant'
import '../App.css'
import '../styles/sidebar.css'
import '../styles/publish.css'
import '../styles/settings.css'

export function LegacyEditorContent() {
  const navigate = useNavigate()
  const { documentId } = useParams<{ documentId?: string }>()
  const { state, dispatch } = useApp()
  const { state: authState, login } = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [publishModalOpen, setPublishModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [previousUserId, setPreviousUserId] = useState<string | null>(authState.user?.id || null)
  const [isSavingBeforeLogout, setIsSavingBeforeLogout] = useState(false)
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(documentId || null)

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

  // 根据URL参数加载文档或初始化新建
  useEffect(() => {
    if (documentId && authState.isAuthenticated) {
      // 编辑现有文档：立即清理编辑器状态并加载
      dispatch({ type: 'UPDATE_EDITOR_CONTENT', payload: '' })
      dispatch({ type: 'UPDATE_TEMPLATE_VARIABLES', payload: { title: '加载中...' } })
      setCurrentDocumentId(documentId) // 设置当前文档ID
      loadDocument(documentId)
    } else if (!documentId && authState.isAuthenticated) {
      // 飞书模式：新建文档从空白开始
      setCurrentDocumentId(null) // 清空文档ID
      dispatch({ type: 'RESET_DOCUMENT' }) // 使用 RESET_DOCUMENT 确保完全重置状态
      console.log('🆕 初始化新建文档模式（空白）')
    } else {
      // 未认证状态
      setCurrentDocumentId(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            ...doc.templateVariables,
            title: doc.title || ''
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

  // 处理认证成功（本地登录）
  const handleAuthSuccess = async (user: any) => {
    console.log('用户登录成功（本地模式）:', user)
    
    // 存储用户信息到localStorage（重要！）
    localStorage.setItem('current_user', JSON.stringify(user))
    
    // 调用 AuthContext 的 login 方法，会自动初始化存储适配器
    login(user, 'local-token')
    
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
          {/* 已隐藏：侧边栏切换按钮（AI助手已隐藏） */}
          {/* <button 
            type="button"
            className="sidebar-toggle"
            onClick={toggleSidebar}
            title={state.ui.sidebarOpen ? '隐藏侧边栏' : '显示侧边栏'}
          >
            ☰
          </button> */}
          <h1 className="app-title">
            {loading ? '加载中...' : documentId ? `编辑: ${state.templates.variables?.title || '无标题'}` : '公众号排版工具'}
          </h1>
        </div>
        
        <div className="header-right">
          <div className="header-actions">
            <button 
              type="button"
              className="header-btn preview-toggle"
              onClick={togglePreview}
              title={state.ui.showPreview ? '隐藏预览' : '显示预览'}
            >
              {state.ui.showPreview ? '📱 隐藏预览' : '👁️ 显示预览'}
            </button>
            
            {/* 已隐藏：发布到微信按钮 */}
            {/* <button 
              type="button"
              className="header-btn publish-btn"
              onClick={() => setPublishModalOpen(true)}
              disabled={!state.editor.content || !state.templates.variables.title}
              title={!state.editor.content || !state.templates.variables.title ? '请先编辑内容和填写标题' : '发布到微信公众号'}
            >
              📤 发布到微信
            </button> */}
            
            <button 
              type="button"
              className="header-btn"
              onClick={() => navigate('/articles')}
              title="文章管理"
            >
              📄 文章管理
            </button>
            
            {/* 用户菜单 */}
            <UserMenu onOpenAuthModal={() => setAuthModalOpen(true)} />
          </div>
        </div>
      </header>
      
      {/* 主要内容区域 */}
      <div className="app-main">
        {/* 已隐藏：左侧 AI 助手面板 */}
        {/* {state.ui.sidebarOpen && (
          <aside className="app-sidebar">
            <div className="sidebar-content">
              <AIAssistant />
            </div>
          </aside>
        )} */}

        {/* 编辑器区域 */}
        <div className="editor-section">
          <Editor currentDocumentId={currentDocumentId} />
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

      {/* 本地认证弹窗 */}
      <LocalAuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* 发布模态框 */}
      <PublishModal
        isOpen={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        currentDocument={{
          id: currentDocumentId || undefined,
          title: state.templates.variables.title || '',
          content: state.editor.content,
          author: state.templates.variables.author || 'Shawn'
        }}
      />
    </div>
  )
}