// 主应用组件
import React, { useState } from 'react'
import { AppProvider, useApp } from './utils/app-context'
import { AuthProvider, useAuth } from './utils/auth-context'
import { Editor } from './components/Editor'
import { Preview } from './components/Preview'
import { TemplateSelector } from './components/TemplateSelector'
import { PublishGuide } from './components/PublishGuide'
import { PublishFlow } from './components/PublishFlow'
import { Settings } from './components/Settings'
import { LocalAuthModal } from './components/auth/LocalAuthModal'
import { UserMenu } from './components/auth/UserMenu'
import './App.css'
import './styles/sidebar.css'
import './styles/publish.css'

function AppContent() {
  const { state, dispatch } = useApp()
  const { state: authState, login } = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  
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
            className="sidebar-toggle"
            onClick={toggleSidebar}
            title={state.ui.sidebarOpen ? '隐藏侧边栏' : '显示侧边栏'}
          >
            ☰
          </button>
          <h1 className="app-title">公众号排版工具</h1>
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
              className="header-btn"
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

      {/* 本地认证弹窗 */}
      <LocalAuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  )
}