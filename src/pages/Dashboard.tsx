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
                      <span className="gradient-text">你的 AI 写作团队</span>
                    </h1>
                    
                    {/* 副标题 */}
                    <p className="hero-subtitle-v2">
                      理解你的思考与表达方式，与你一起，将想法写成好文章
                    </p>
                    
                    {/* 产品演示输入框 */}
                    <div className="hero-demo-box">
                      <div className="demo-input-area">
                        <div className="demo-placeholder">
                          描述你的创作需求，比如：第一期公众号实现日常的读书笔记
                        </div>
                        <div className="demo-toolbar">
                          <button className="demo-btn">
                            <span>🎨</span>
                            <span>启发模式</span>
                          </button>
                          <button className="demo-btn demo-btn-primary">
                            <span>📱</span>
                            <span>公众号风格・洞察</span>
                          </button>
                          <div className="demo-actions">
                            <button className="demo-icon-btn">💡</button>
                            <button className="demo-icon-btn">🔄</button>
                          </div>
                        </div>
                      </div>
                      <div className="demo-suggestions">
                        <span className="demo-tag">推荐模板</span>
                        <div className="demo-template-chip">
                          <span>📱</span>
                          <span>公众号文章・洞察</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* CTA 按钮 */}
                    <div className="hero-cta-v2">
                      <button 
                        className="cta-primary-v2"
                        onClick={() => setAuthModalOpen(true)}
                      >
                        <span>立即开始创作</span>
                        <span className="cta-arrow">→</span>
                      </button>
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

              {/* 灵感发现区域 */}
              <section className="inspiration-section-v2">
                <div className="inspiration-container">
                  <div className="section-header-v2">
                    <h2 className="section-title-v2">灵感发现</h2>
                    <p className="section-subtitle-v2">
                      看看其他同学们的创作成果，找到属于你的灵感点
                    </p>
                  </div>
                  
                  {/* 分类标签 */}
                  <div className="inspiration-tabs">
                    <button className="inspo-tab active">公众号文章</button>
                    <button className="inspo-tab">科技探讨</button>
                    <button className="inspo-tab">访谈对话</button>
                    <button className="inspo-tab">日常笔记</button>
                    <button className="inspo-tab">新手指南</button>
                    <button className="inspo-tab">短文翻新</button>
                    <button className="inspo-tab">历史节目</button>
                  </div>
                  
                  {/* 案例卡片 */}
                  <div className="inspiration-grid">
                    <div className="inspo-card">
                      <div className="inspo-header">
                        <span className="inspo-badge">📱 教程总结</span>
                      </div>
                      <h3 className="inspo-title">如果再上一次学，我可能做错选择？</h3>
                      <div className="inspo-meta">
                        <span className="inspo-stat">👁️ 1 观点</span>
                        <span className="inspo-stat">📝 5447 字</span>
                      </div>
                      <div className="inspo-author">
                        <div className="author-avatar">👤</div>
                        <span className="author-name">roadbee</span>
                      </div>
                    </div>

                    <div className="inspo-card">
                      <div className="inspo-header">
                        <span className="inspo-badge">✨ 多平台笔记</span>
                      </div>
                      <h3 className="inspo-title">未来几年，哪位语音模型会脱颖而出？</h3>
                      <div className="inspo-meta">
                        <span className="inspo-stat">👁️ 1 观点</span>
                        <span className="inspo-stat">📝 4301 字</span>
                      </div>
                      <div className="inspo-author">
                        <div className="author-avatar">👤</div>
                        <span className="author-name">Shawn YANG</span>
                      </div>
                    </div>

                    <div className="inspo-card">
                      <div className="inspo-header">
                        <span className="inspo-badge">🎯 一键生成</span>
                      </div>
                      <h3 className="inspo-title">半年时间，我可能挣来一半左边10W+，玩坏了主流的三家视频策划</h3>
                      <div className="inspo-meta">
                        <span className="inspo-stat">👁️ 16 观点</span>
                        <span className="inspo-stat">📝 3266 字</span>
                      </div>
                      <div className="inspo-author">
                        <div className="author-avatar">👤</div>
                        <span className="author-name">Sisen Chen</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* AI 写作团队 - 头像卡片风格 */}
              <section className="team-section-v3">
                <div className="team-container-v3">
                  <div className="section-header-v2">
                    <h2 className="section-title-v2">你的写作团队</h2>
                    <p className="section-subtitle-v2">
                      AI 写作助手 是由多个 AI 专家组成的协作团队，你雇得起的专家团，他们会完成彼此的任务
                    </p>
                  </div>
                  
                  <div className="team-avatars-grid">
                    <div className="team-avatar-card">
                      <div className="avatar-circle">✍️</div>
                      <h4 className="avatar-name">阿强</h4>
                      <p className="avatar-role">笔杆子专家</p>
                      <div className="avatar-tags">
                        <span className="avatar-tag">细致校对</span>
                        <span className="avatar-tag">风格改写</span>
                        <span className="avatar-tag">新代评论</span>
                      </div>
                    </div>

                    <div className="team-avatar-card">
                      <div className="avatar-circle">💡</div>
                      <h4 className="avatar-name">小帅</h4>
                      <p className="avatar-role">创意策划</p>
                      <div className="avatar-tags">
                        <span className="avatar-tag">头脑风暴</span>
                        <span className="avatar-tag">策略规划</span>
                      </div>
                    </div>

                    <div className="team-avatar-card">
                      <div className="avatar-circle">🎯</div>
                      <h4 className="avatar-name">民勋</h4>
                      <p className="avatar-role">编辑</p>
                      <div className="avatar-tags">
                        <span className="avatar-tag">读者策略</span>
                        <span className="avatar-tag">素材检索</span>
                        <span className="avatar-tag">数据核验</span>
                      </div>
                    </div>

                    <div className="team-avatar-card">
                      <div className="avatar-circle">📚</div>
                      <h4 className="avatar-name">小美</h4>
                      <p className="avatar-role">研究员</p>
                      <div className="avatar-tags">
                        <span className="avatar-tag">深度研究</span>
                        <span className="avatar-tag">专家访谈</span>
                      </div>
                    </div>

                    <div className="team-avatar-card">
                      <div className="avatar-circle">👔</div>
                      <h4 className="avatar-name">阿珍</h4>
                      <p className="avatar-role">风格顾问室核师</p>
                      <div className="avatar-tags">
                        <span className="avatar-tag">排序分析</span>
                        <span className="avatar-tag">语言形式</span>
                        <span className="avatar-tag">风格定义</span>
                      </div>
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

              {/* 快速开始区域 */}
              <section className="quick-start-section">
                <div className="quick-start-container">
                  <div className="section-header-v2">
                    <h2 className="section-title-v2">快速开始</h2>
                    <p className="section-subtitle-v2">
                      选择模板，立即开始创作
                    </p>
                  </div>
                  
                  <div className="quick-start-grid">
                    <div className="quick-start-card" onClick={handleNewArticle}>
                      <div className="quick-icon">📱</div>
                      <h3 className="quick-title">公众号文章</h3>
                      <p className="quick-desc">适合深度内容，适配公众号风格</p>
                      <div className="quick-features">
                        <span className="quick-tag">洞察分析</span>
                        <span className="quick-tag">专业排版</span>
                      </div>
                    </div>

                    <div className="quick-start-card" onClick={handleNewArticle}>
                      <div className="quick-icon">🎤</div>
                      <h3 className="quick-title">语音转文章</h3>
                      <p className="quick-desc">说出想法，AI 自动整理成文章</p>
                      <div className="quick-features">
                        <span className="quick-tag">快速创作</span>
                        <span className="quick-tag">智能分段</span>
                      </div>
                    </div>

                    <div className="quick-start-card" onClick={handleNewArticle}>
                      <div className="quick-icon">✨</div>
                      <h3 className="quick-title">AI 风格改写</h3>
                      <p className="quick-desc">学习大师风格，优化你的文章</p>
                      <div className="quick-features">
                        <span className="quick-tag">风格学习</span>
                        <span className="quick-tag">内容优化</span>
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
