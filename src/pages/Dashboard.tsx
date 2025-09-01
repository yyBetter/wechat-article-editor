// Dashboard首页组件 - To C产品的主入口页面
import React, { useState, useEffect } from 'react'
import '../styles/dashboard.css'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../utils/auth-context'
import { useApp } from '../utils/app-context'
import { AuthModal } from '../components/auth/AuthModal'
import { UserMenu } from '../components/auth/UserMenu'
import { getDocuments } from '../utils/document-api'
import { notification } from '../utils/notification'

interface DashboardStats {
  totalDocuments: number
  totalWords: number
  recentDocuments: any[]
}

export function Dashboard() {
  const navigate = useNavigate()
  const { state: authState, login } = useAuth()
  const { dispatch } = useApp()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [stats, setStats] = useState<DashboardStats>({
    totalDocuments: 0,
    totalWords: 0,
    recentDocuments: []
  })
  const [loading, setLoading] = useState(false)

  // 加载用户数据统计
  useEffect(() => {
    if (authState.isAuthenticated) {
      loadDashboardStats()
    }
  }, [authState.isAuthenticated])

  const loadDashboardStats = async () => {
    try {
      setLoading(true)
      const response = await getDocuments()
      const documents = response.documents || []
      
      const totalWords = documents.reduce((sum: number, doc: any) => 
        sum + (doc.metadata?.wordCount || 0), 0
      )
      
      setStats({
        totalDocuments: documents.length,
        totalWords,
        recentDocuments: documents.slice(0, 5) // 取前5篇最近文章
      })
    } catch (error) {
      console.error('加载统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 处理认证成功
  const handleAuthSuccess = (user: any, token: string) => {
    console.log('用户登录成功:', user)
    login(user, token)
    
    if (user.brandSettings) {
      dispatch({
        type: 'UPDATE_FIXED_ASSETS',
        payload: user.brandSettings
      })
    }
    setAuthModalOpen(false)
  }

  // 创建新文章
  const handleNewArticle = () => {
    // 清空编辑器内容
    dispatch({ type: 'UPDATE_EDITOR_CONTENT', payload: '' })
    dispatch({ type: 'UPDATE_TEMPLATE_VARIABLES', payload: { title: '' } })
    
    // 跳转到编辑器页面
    navigate('/editor')
  }

  // 编辑现有文章
  const handleEditArticle = (documentId: string) => {
    navigate(`/editor/${documentId}`)
  }

  // 查看所有文章
  const handleViewAllArticles = () => {
    navigate('/articles')
  }

  return (
    <div className="dashboard">
      {/* 顶部导航栏 */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="app-title">📝 公众号排版工具</h1>
          </div>
          <div className="header-right">
            <UserMenu onOpenAuthModal={() => setAuthModalOpen(true)} />
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="dashboard-main">
        <div className="dashboard-container">
          {/* 欢迎区域 */}
          <section className="welcome-section">
            <div className="welcome-content">
              <h2>
                {authState.isAuthenticated ? 
                  `欢迎回来，${authState.user?.email?.split('@')[0] || '用户'}！` : 
                  '开始创作你的第一篇文章'
                }
              </h2>
              <p className="welcome-subtitle">
                {authState.isAuthenticated ? 
                  '继续你的创作之旅，打造专业的公众号内容' : 
                  '使用专业的排版工具，让你的文章脱颖而出'
                }
              </p>
            </div>
            
            {/* 快速操作按钮 */}
            <div className="quick-actions">
              <button 
                className="action-btn primary"
                onClick={handleNewArticle}
              >
                <span className="btn-icon">✨</span>
                <span>新建文章</span>
              </button>
              
              {authState.isAuthenticated && (
                <button 
                  className="action-btn secondary"
                  onClick={handleViewAllArticles}
                >
                  <span className="btn-icon">📚</span>
                  <span>管理文章</span>
                </button>
              )}
            </div>
          </section>

          {/* 统计卡片区域 */}
          {authState.isAuthenticated && (
            <section className="stats-section">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">📄</div>
                  <div className="stat-content">
                    <div className="stat-number">{stats.totalDocuments}</div>
                    <div className="stat-label">篇文章</div>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">✍️</div>
                  <div className="stat-content">
                    <div className="stat-number">{stats.totalWords.toLocaleString()}</div>
                    <div className="stat-label">总字数</div>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">🎨</div>
                  <div className="stat-content">
                    <div className="stat-number">{stats.recentDocuments.length}</div>
                    <div className="stat-label">最近文章</div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 最近文章区域 */}
          {authState.isAuthenticated && stats.recentDocuments.length > 0 && (
            <section className="recent-articles-section">
              <div className="section-header">
                <h3>最近文章</h3>
                <button 
                  className="view-all-link"
                  onClick={handleViewAllArticles}
                >
                  查看全部 →
                </button>
              </div>
              
              <div className="articles-grid">
                {stats.recentDocuments.map((doc: any) => (
                  <div key={doc.id} className="article-card" onClick={() => handleEditArticle(doc.id)}>
                    <div className="article-header">
                      <h4 className="article-title">{doc.title || '无标题'}</h4>
                      <div className="article-date">
                        {new Date(doc.updatedAt).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                    
                    <div className="article-meta">
                      <span className="meta-item">
                        📝 {doc.metadata?.wordCount || 0} 字
                      </span>
                      <span className="meta-item">
                        🖼️ {doc.metadata?.imageCount || 0} 图
                      </span>
                    </div>
                    
                    <div className="article-preview">
                      {doc.content ? 
                        doc.content.substring(0, 100).replace(/[#*>`]/g, '') + '...' : 
                        '暂无内容'
                      }
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 访客状态提示 */}
          {!authState.isAuthenticated && (
            <section className="guest-section">
              <div className="guest-card">
                <div className="guest-icon">👋</div>
                <div className="guest-content">
                  <h3>立即登录，享受完整功能</h3>
                  <ul className="feature-list">
                    <li>✅ 文章云端同步保存</li>
                    <li>✅ 版本历史管理</li>
                    <li>✅ 多模板自由切换</li>
                    <li>✅ 品牌元素自定义</li>
                  </ul>
                  <button 
                    className="login-btn"
                    onClick={() => setAuthModalOpen(true)}
                  >
                    🔐 立即登录
                  </button>
                </div>
              </div>
            </section>
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