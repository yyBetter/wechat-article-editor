import React, { useState } from 'react'
import { useApp } from '../utils/app-context'
import { Editor } from '../components/Editor'
import { Preview } from '../components/Preview'
import '../App.css'
import '../styles/sidebar.css'
import '../styles/settings.css'

export function EditorPage() {
    const { state, dispatch } = useApp()
    const [loading] = useState(false)

    // 切换侧边栏
    // const toggleSidebar = () => {
    //   dispatch({ 
    //     type: 'SET_UI_STATE', 
    //     payload: { sidebarOpen: !state.ui.sidebarOpen }
    //   })
    // }

    // 切换预览显示
    const togglePreview = () => {
        dispatch({
            type: 'SET_UI_STATE',
            payload: { showPreview: !state.ui.showPreview }
        })
    }

    return (
        <div className={`app ${state.ui.theme}`}>
            {/* 顶部导航栏 */}
            <header className="app-header">
                <div className="header-left">
                    <h1 className="app-title">
                        {loading ? '加载中...' : '公众号排版工具'}
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
                    </div>
                </div>
            </header>

            {/* 主要内容区域 */}
            <div className="app-main">
                {/* 编辑器区域 */}
                <div className="editor-section">
                    <Editor currentDocumentId={null} />
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
                        本地模式 - 数据存储在浏览器中
                    </span>
                </div>

                <div className="footer-right">
                    <span className="version-info">v2.0.0 Pure</span>
                </div>
            </footer>
        </div>
    )
}
