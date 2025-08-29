// 主应用组件
import React from 'react'
import { AppProvider, useApp } from './utils/app-context'
import { Editor } from './components/Editor'
import { Preview } from './components/Preview'
import { TemplateSelector } from './components/TemplateSelector'
import { PublishGuide } from './components/PublishGuide'
import { PublishFlow } from './components/PublishFlow'
import { Settings } from './components/Settings'
import './App.css'
import './styles/sidebar.css'
import './styles/publish.css'

function AppContent() {
  const { state, dispatch } = useApp()
  
  // 切换侧边栏
  const toggleSidebar = () => {
    dispatch({ 
      type: 'SET_UI_STATE', 
      payload: { sidebarOpen: !state.ui.sidebarOpen }
    })
  }
  
  // 切换面板
  const switchPanel = (panel: 'editor' | 'templates' | 'assets' | 'export' | 'guide' | 'settings') => {
    dispatch({ 
      type: 'SET_UI_STATE', 
      payload: { activePanel: panel }
    })
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
              onClick={() => switchPanel('export')}
              title="导出设置"
            >
              📤 导出
            </button>
          </div>
        </div>
      </header>
      
      {/* 主要内容区域 */}
      <div className="app-main">
        {/* 左侧边栏 */}
        {state.ui.sidebarOpen && (
          <aside className="app-sidebar">
            {/* 侧边栏标签 */}
            <nav className="sidebar-nav">
              <button
                type="button"
                className={`nav-tab ${state.ui.activePanel === 'templates' ? 'active' : ''}`}
                onClick={() => switchPanel('templates')}
                title="选择和设置模板"
              >
                🎨 模板
              </button>
              <button
                type="button"
                className={`nav-tab ${state.ui.activePanel === 'guide' ? 'active' : ''}`}
                onClick={() => switchPanel('guide')}
                title="查看发布步骤和使用说明"
              >
                📖 发布
              </button>
              <button
                type="button"
                className={`nav-tab ${state.ui.activePanel === 'settings' ? 'active' : ''}`}
                onClick={() => switchPanel('settings')}
                title="全局设置和品牌配置"
              >
                ⚙️ 设置
              </button>
            </nav>
            
            {/* 侧边栏内容 */}
            <div className="sidebar-content">
              {state.ui.activePanel === 'templates' && <TemplateSelector />}
              {state.ui.activePanel === 'settings' && <Settings />}
              {state.ui.activePanel === 'guide' && <PublishFlow />}
            </div>
          </aside>
        )}
        
        {/* 编辑器区域 */}
        <div className="editor-section">
          <Editor />
        </div>
        
        {/* 预览区域 */}
        <div className="preview-section">
          <Preview />
        </div>
      </div>
      
      {/* 底部状态栏 */}
      <footer className="app-footer">
        <div className="footer-left">
          <span className="status-text">
            {state.editor.isChanged ? '有未保存的更改' : '所有更改已保存'}
          </span>
        </div>
        
        <div className="footer-right">
          <span className="version-info">v1.0.0</span>
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}