// Dashboard首页组件 - 现代化 AI 写作工具主页
import React, { useState, useEffect } from 'react'
import '../styles/dashboard.css'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../utils/auth-context'
import { useApp } from '../utils/app-context'
import { LocalAuthModal } from '../components/auth/LocalAuthModal'
import { UserMenu } from '../components/auth/UserMenu'
import { getDocuments } from '../utils/document-api'
import { notification } from '../utils/notification'
import { StorageStatusMonitor } from '../components/StorageStatusMonitor'
import { IncognitoWarning } from '../components/IncognitoWarning'

// 字数统计函数 - 与服务端保持一致
function countWords(content: string): number {
  if (!content || content.trim() === '') return 0
  
  let cleanContent = content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]+`/g, ' ')
    .replace(/!?\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^>\s*/gm, '')
    .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
  
  if (!cleanContent) return 0
  
  const chineseChars = (cleanContent.match(/[\u4e00-\u9fa5]/g) || []).length
  const englishWords = cleanContent
    .replace(/[\u4e00-\u9fa5]/g, ' ')
    .replace(/[^a-zA-Z\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1)
    .length
  
  return chineseChars + englishWords
}

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
      
      const totalWords = documents.reduce((sum: number, doc: any) => {
        return sum + (doc.metadata?.wordCount ?? 0)
      }, 0)
      
      setStats({
        totalDocuments: documents.length,
        totalWords,
        recentDocuments: documents.slice(0, 5)
      })
    } catch (error) {
      console.error('加载统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAuthSuccess = async (user: any) => {
    localStorage.setItem('current_user', JSON.stringify(user))
    const token = user.token || 'local-token'
    login(user, token)
    
    if (user.brandSettings) {
      dispatch({
        type: 'UPDATE_FIXED_ASSETS',
        payload: user.brandSettings
      })
    }
    
    setAuthModalOpen(false)
  }

  const handleNewArticle = () => {
    if (!authState.isAuthenticated) {
      setAuthModalOpen(true)
      return
    }
    
    dispatch({ type: 'UPDATE_EDITOR_CONTENT', payload: '' })
    dispatch({ type: 'UPDATE_TEMPLATE_VARIABLES', payload: { title: '' } })
    navigate('/editor')
  }

  const handleEditArticle = (documentId: string) => {
    dispatch({ type: 'UPDATE_EDITOR_CONTENT', payload: '' })
    dispatch({ type: 'UPDATE_TEMPLATE_VARIABLES', payload: { title: '加载中...' } })
    navigate(`/editor/${documentId}`)
  }

  const handleViewAllArticles = () => {
    navigate('/articles')
  }

  return (
    <>
      <IncognitoWarning />
      
      <div className="dashboard-v2">
        {/* 顶部导航栏 - 简约现代 */}
        <header className="nav-header">
          <div className="nav-container">
            <div className="nav-left">
              <div className="brand">
                <span className="brand-icon">✨</span>
                <span className="brand-name">AI 写作助手</span>
              </div>
            </div>
            <div className="nav-right">
              <UserMenu onOpenAuthModal={() => setAuthModalOpen(true)} />
            </div>
          </div>
        </header>

        {/* 主要内容 */}
        <main className="main-content">
          {!authState.isAuthenticated ? (
            /* 未登录 - Hero Section */
            <>
              {/* Hero 区域 */}
              <section className="hero-section-v2">
                <div className="hero-container">
                  <div className="hero-content-v2">
                    {/* 标签 */}
                    <div className="hero-badge-v2">
                      <span className="badge-dot"></span>
                      <span>AI 驱动的智能写作工具</span>
                    </div>
                    
                    {/* 主标题 */}
                    <h1 className="hero-title-v2">
                      AI 写作助手
                      <br />
                      <span className="gradient-text">让创作更简单</span>
                    </h1>
                    
                    {/* 副标题 */}
                    <p className="hero-subtitle-v2">
                      学习你的写作风格，生成专业内容，一键适配多平台
                      <br />
                      3 位 AI 数字员工全天候为您服务
                    </p>
                    
                    {/* CTA 按钮 */}
                    <div className="hero-cta-v2">
                      <button 
                        className="cta-primary-v2"
                        onClick={() => setAuthModalOpen(true)}
                      >
                        <span>开始创作</span>
                        <span className="cta-arrow">→</span>
                      </button>
                      <button 
                        className="cta-secondary-v2"
                        onClick={() => {
                          document.querySelector('.features-section-v2')?.scrollIntoView({ 
                            behavior: 'smooth' 
                          })
                        }}
                      >
                        了解功能
                      </button>
                    </div>
                    
                    {/* 特性标签 */}
                    <div className="hero-features-v2">
                      <div className="feature-tag">🤖 AI 学习风格</div>
                      <div className="feature-tag">🎤 语音转文章</div>
                      <div className="feature-tag">🚀 多平台适配</div>
                      <div className="feature-tag">✨ 智能优化</div>
                    </div>
                  </div>
                </div>
                
                {/* 背景装饰 */}
                <div className="hero-bg-decoration">
                  <div className="bg-circle bg-circle-1"></div>
                  <div className="bg-circle bg-circle-2"></div>
                  <div className="bg-circle bg-circle-3"></div>
                </div>
              </section>

              {/* 功能展示区域 */}
              <section className="features-section-v2">
                <div className="features-container">
                  <div className="section-header-v2">
                    <h2 className="section-title-v2">强大的 AI 写作能力</h2>
                    <p className="section-subtitle-v2">
                      3 位 AI 数字员工，为您提供全方位的写作支持
                    </p>
                  </div>
                  
                  <div className="features-grid">
                    {/* 功能卡片 1 - AI 写作工作室 */}
                    <div className="feature-card-v2">
                      <div className="feature-icon-wrapper">
                        <div className="feature-icon-v2">✨</div>
                      </div>
                      <h3 className="feature-title-v2">AI 写作工作室</h3>
                      <p className="feature-desc-v2">
                        风格化改写、内容优化。阿强（笔杆子）帮你写出符合品牌风格的专业内容。
                      </p>
                      <ul className="feature-list-v2">
                        <li>学习 10+ 种大师写作风格</li>
                        <li>自动分析并记住你的风格</li>
                        <li>一键风格转换和优化</li>
                      </ul>
                    </div>

                    {/* 功能卡片 2 - AI 语音转文章 */}
                    <div className="feature-card-v2 feature-card-highlight">
                      <div className="card-badge">独家功能</div>
                      <div className="feature-icon-wrapper">
                        <div className="feature-icon-v2">🎤</div>
                      </div>
                      <h3 className="feature-title-v2">AI 语音转文章</h3>
                      <p className="feature-desc-v2">
                        录音秒变专业文章。说出你的想法，AI 自动整理成结构清晰的文章。
                      </p>
                      <ul className="feature-list-v2">
                        <li>支持长时间连续录音</li>
                        <li>智能分段和格式化</li>
                        <li>自动生成标题和大纲</li>
                      </ul>
                    </div>

                    {/* 功能卡片 3 - 智能写作助手 */}
                    <div className="feature-card-v2">
                      <div className="feature-icon-wrapper">
                        <div className="feature-icon-v2">🤖</div>
                      </div>
                      <h3 className="feature-title-v2">智能写作助手</h3>
                      <p className="feature-desc-v2">
                        小美（资料库）+ 丧彪（主编）联手，为你提供素材支持和质量把关。
                      </p>
                      <ul className="feature-list-v2">
                        <li>AI 标题生成和优化</li>
                        <li>智能封面图设计</li>
                        <li>错别字检查和修正</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              {/* 平台适配展示 */}
              <section className="platforms-section-v2">
                <div className="platforms-container">
                  <div className="section-header-v2">
                    <h2 className="section-title-v2">一键适配多平台</h2>
                    <p className="section-subtitle-v2">
                      同一篇文章，自动改写成适合不同平台的风格
                    </p>
                  </div>
                  
                  <div className="platforms-grid">
                    <div className="platform-item">
                      <div className="platform-icon">📱</div>
                      <div className="platform-name">微信公众号</div>
                    </div>
                    <div className="platform-item">
                      <div className="platform-icon">💡</div>
                      <div className="platform-name">知乎</div>
                    </div>
                    <div className="platform-item">
                      <div className="platform-icon">📸</div>
                      <div className="platform-name">小红书</div>
                    </div>
                    <div className="platform-item">
                      <div className="platform-icon">📰</div>
                      <div className="platform-name">今日头条</div>
                    </div>
                    <div className="platform-item">
                      <div className="platform-icon">🐦</div>
                      <div className="platform-name">微博</div>
                    </div>
                  </div>
                </div>
              </section>

              {/* 底部 CTA */}
              <section className="cta-section-v2">
                <div className="cta-container-v2">
                  <h2 className="cta-title-v2">准备好开始了吗？</h2>
                  <p className="cta-text-v2">立即登录，体验 AI 赋能的写作新方式</p>
                  <button 
                    className="cta-button-final"
                    onClick={() => setAuthModalOpen(true)}
                  >
                    免费开始使用
                  </button>
                </div>
              </section>
            </>
          ) : (
            /* 已登录 - 工作台 */
            <>
              {/* 欢迎区域 */}
              <section className="workspace-welcome">
                <div className="workspace-container">
                  <div className="welcome-header">
                    <div className="welcome-text">
                      <h2 className="welcome-title">
                        欢迎回来，{authState.user?.email?.split('@')[0] || '用户'}！
                      </h2>
                      <p className="welcome-subtitle">继续你的创作之旅</p>
                    </div>
                    <button 
                      className="new-article-btn"
                      onClick={handleNewArticle}
                    >
                      <span className="btn-icon">✨</span>
                      <span>新建文章</span>
                    </button>
                  </div>
                  
                  {/* 统计卡片 */}
                  <div className="stats-cards">
                    <div className="stat-card-v2">
                      <div className="stat-icon-v2">📄</div>
                      <div className="stat-info">
                        <div className="stat-value">{stats.totalDocuments}</div>
                        <div className="stat-label">篇文章</div>
                      </div>
                    </div>
                    
                    <div className="stat-card-v2">
                      <div className="stat-icon-v2">✍️</div>
                      <div className="stat-info">
                        <div className="stat-value">{stats.totalWords.toLocaleString()}</div>
                        <div className="stat-label">总字数</div>
                      </div>
                    </div>
                    
                    <div className="stat-card-v2">
                      <div className="stat-icon-v2">🎨</div>
                      <div className="stat-info">
                        <div className="stat-value">{stats.recentDocuments.length}</div>
                        <div className="stat-label">最近文章</div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* 最近文章 */}
              {stats.recentDocuments.length > 0 && (
                <section className="recent-section">
                  <div className="recent-container">
                    <div className="recent-header">
                      <h3 className="recent-title">最近文章</h3>
                      <button 
                        className="view-all-btn"
                        onClick={handleViewAllArticles}
                      >
                        查看全部 →
                      </button>
                    </div>
                    
                    <div className="recent-grid">
                      {stats.recentDocuments.map((doc: any) => (
                        <div 
                          key={doc.id} 
                          className="recent-card"
                          onClick={() => handleEditArticle(doc.id)}
                        >
                          <div className="recent-card-header">
                            <h4 className="recent-card-title">
                              {doc.title || '无标题'}
                            </h4>
                            <div className="recent-card-date">
                              {new Date(doc.updatedAt).toLocaleDateString('zh-CN')}
                            </div>
                          </div>
                          
                          <div className="recent-card-meta">
                            <span className="meta-badge">
                              📝 {doc.metadata?.wordCount ?? 0} 字
                            </span>
                            <span className="meta-badge">
                              🖼️ {doc.metadata?.imageCount ?? 0} 图
                            </span>
                          </div>
                          
                          <div className="recent-card-preview">
                            {doc.content ? 
                              doc.content.substring(0, 80).replace(/[#*>`\n]/g, '').trim() + '...' : 
                              '暂无内容'
                            }
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}
            </>
          )}
        </main>

        {/* 页脚 */}
        <footer className="footer-v2">
          <div className="footer-container">
            <p className="footer-text">
              © 2024 AI 写作助手 · 让创作更简单
            </p>
          </div>
        </footer>
      </div>

      {/* 认证弹窗 */}
      <LocalAuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* 存储监控 */}
      <StorageStatusMonitor />
    </>
  )
}
