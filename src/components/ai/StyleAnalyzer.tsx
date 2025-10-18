// AI风格分析组件
import React, { useState, useEffect, useCallback } from 'react'
import { notification } from '../../utils/notification'
import '../../styles/style-analyzer.css'

interface Article {
  id: string
  title: string
  content: string
  createdAt: string
  wordCount: number
}

interface StyleProfile {
  analyzed: boolean
  articleCount: number
  analyzedAt: string
  profile: {
    vocabulary: string[]
    sentencePatterns: string[]
    emojiUsage: string[]
    tone: string
    writingHabits: string[]
  }
  summary: string
}

export function StyleAnalyzer() {
  const [articles, setArticles] = useState<Article[]>([])
  const [selectedArticles, setSelectedArticles] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [styleProfile, setStyleProfile] = useState<StyleProfile | null>(null)
  const [step, setStep] = useState<'select' | 'analyzing' | 'complete'>('select')

  // 加载用户文章
  useEffect(() => {
    loadArticles()
    loadStyleProfile()
  }, [])

  const loadArticles = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('auth_token')
      
      const response = await fetch('/api/documents', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('获取文章失败')

      const data = await response.json()
      const articleList = data.documents || []
      
      setArticles(articleList)
      
      // 默认选择最近10篇
      const defaultSelected = articleList.slice(0, 10).map((a: Article) => a.id)
      setSelectedArticles(defaultSelected)
      
    } catch (error: any) {
      console.error('加载文章失败:', error)
      notification.error('加载文章失败')
    } finally {
      setIsLoading(false)
    }
  }

  const loadStyleProfile = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      
      const response = await fetch('/api/ai/style-profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.profile) {
          setStyleProfile(data.profile)
          setStep('complete')
        }
      }
    } catch (error) {
      console.error('加载风格配置失败:', error)
    }
  }

  // 切换文章选择
  const toggleArticle = useCallback((id: string) => {
    setSelectedArticles(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }, [])

  // 全选/取消全选
  const toggleSelectAll = useCallback(() => {
    if (selectedArticles.length === articles.length) {
      setSelectedArticles([])
    } else {
      setSelectedArticles(articles.map(a => a.id))
    }
  }, [articles, selectedArticles])

  // 开始分析
  const startAnalysis = async () => {
    if (selectedArticles.length < 3) {
      notification.error('请至少选择3篇文章进行分析')
      return
    }

    if (selectedArticles.length > 20) {
      notification.error('最多选择20篇文章')
      return
    }

    try {
      setIsAnalyzing(true)
      setStep('analyzing')
      
      const token = localStorage.getItem('auth_token')
      
      const response = await fetch('/api/ai/analyze-style', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          articleIds: selectedArticles
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '分析失败')
      }

      const data = await response.json()
      setStyleProfile(data.profile)
      setStep('complete')
      
      notification.success('✅ 风格分析完成！AI已学会你的写作风格')
      
    } catch (error: any) {
      console.error('风格分析失败:', error)
      notification.error('❌ ' + error.message)
      setStep('select')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // 重新分析
  const resetAnalysis = () => {
    setStep('select')
    setStyleProfile(null)
  }

  return (
    <div className="style-analyzer">
      {/* 标题和说明 */}
      <div className="analyzer-header">
        <h2 className="analyzer-title">
          <span className="title-icon">🎨</span>
          AI风格学习
        </h2>
        <p className="analyzer-description">
          让AI学习你的写作风格，生成的内容将完全符合你的个人特色
        </p>
      </div>

      {/* 步骤1: 选择文章 */}
      {step === 'select' && (
        <div className="analyzer-step">
          <div className="step-header">
            <h3 className="step-title">
              <span className="step-number">1</span>
              选择文章用于学习
            </h3>
            <p className="step-hint">
              建议选择10-15篇代表你风格的文章，AI将深度学习你的写作特点
            </p>
          </div>

          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>正在加载文章...</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <p className="empty-message">你还没有发布文章</p>
              <p className="empty-hint">至少发布3篇文章后才能使用风格学习功能</p>
            </div>
          ) : (
            <>
              <div className="articles-controls">
                <div className="selected-count">
                  已选择 <strong>{selectedArticles.length}</strong> 篇文章
                  {selectedArticles.length < 3 && (
                    <span className="count-warning">（至少3篇）</span>
                  )}
                </div>
                <button 
                  className="btn-select-all"
                  onClick={toggleSelectAll}
                >
                  {selectedArticles.length === articles.length ? '取消全选' : '全选'}
                </button>
              </div>

              <div className="articles-list">
                {articles.map(article => (
                  <div 
                    key={article.id}
                    className={`article-item ${selectedArticles.includes(article.id) ? 'selected' : ''}`}
                    onClick={() => toggleArticle(article.id)}
                  >
                    <div className="article-checkbox">
                      {selectedArticles.includes(article.id) ? '✅' : '⬜'}
                    </div>
                    <div className="article-info">
                      <h4 className="article-title">{article.title || '无标题'}</h4>
                      <div className="article-meta">
                        <span className="meta-item">
                          📝 {article.wordCount || 0} 字
                        </span>
                        <span className="meta-item">
                          📅 {new Date(article.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="step-actions">
                <button 
                  className="btn-primary btn-large"
                  onClick={startAnalysis}
                  disabled={selectedArticles.length < 3}
                >
                  <span className="btn-icon">🤖</span>
                  <span>开始分析（{selectedArticles.length}篇文章）</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* 步骤2: 分析中 */}
      {step === 'analyzing' && (
        <div className="analyzer-step analyzing">
          <div className="analyzing-animation">
            <div className="analyzing-icon">🤖</div>
            <h3 className="analyzing-title">AI正在深度学习你的写作风格...</h3>
            <p className="analyzing-description">
              分析中：{selectedArticles.length} 篇文章
            </p>
          </div>

          <div className="analyzing-progress">
            <div className="progress-item">
              <span className="progress-icon">📖</span>
              <span className="progress-text">阅读文章内容</span>
            </div>
            <div className="progress-item">
              <span className="progress-icon">🔍</span>
              <span className="progress-text">分析词汇和句式</span>
            </div>
            <div className="progress-item">
              <span className="progress-icon">😊</span>
              <span className="progress-text">学习表达习惯</span>
            </div>
            <div className="progress-item">
              <span className="progress-icon">✨</span>
              <span className="progress-text">生成风格模型</span>
            </div>
          </div>

          <div className="analyzing-hint">
            预计需要 30-60 秒，请耐心等待...
          </div>
        </div>
      )}

      {/* 步骤3: 完成 */}
      {step === 'complete' && styleProfile && (
        <div className="analyzer-step complete">
          <div className="complete-header">
            <div className="complete-icon">🎉</div>
            <h3 className="complete-title">风格学习完成！</h3>
            <p className="complete-description">
              AI已深入学习你的写作风格，生成内容将完全符合你的个人特色
            </p>
          </div>

          <div className="style-profile">
            <div className="profile-section">
              <h4 className="section-title">
                <span className="section-icon">📊</span>
                分析统计
              </h4>
              <div className="profile-stats">
                <div className="stat-item">
                  <span className="stat-label">分析文章</span>
                  <span className="stat-value">{styleProfile.articleCount} 篇</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">分析时间</span>
                  <span className="stat-value">
                    {new Date(styleProfile.analyzedAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h4 className="section-title">
                <span className="section-icon">✨</span>
                你的风格特征
              </h4>
              <div className="style-summary">
                {styleProfile.summary}
              </div>
            </div>

            <div className="profile-section">
              <h4 className="section-title">
                <span className="section-icon">💬</span>
                语气特点
              </h4>
              <div className="profile-detail">
                <span className="detail-badge tone">{styleProfile.profile.tone}</span>
              </div>
            </div>

            {styleProfile.profile.emojiUsage.length > 0 && (
              <div className="profile-section">
                <h4 className="section-title">
                  <span className="section-icon">😊</span>
                  常用emoji
                </h4>
                <div className="profile-detail">
                  {styleProfile.profile.emojiUsage.map((emoji, index) => (
                    <span key={index} className="detail-badge emoji">{emoji}</span>
                  ))}
                </div>
              </div>
            )}

            {styleProfile.profile.vocabulary.length > 0 && (
              <div className="profile-section">
                <h4 className="section-title">
                  <span className="section-icon">📝</span>
                  常用词汇
                </h4>
                <div className="profile-detail">
                  {styleProfile.profile.vocabulary.slice(0, 15).map((word, index) => (
                    <span key={index} className="detail-badge word">{word}</span>
                  ))}
                </div>
              </div>
            )}

            {styleProfile.profile.writingHabits.length > 0 && (
              <div className="profile-section">
                <h4 className="section-title">
                  <span className="section-icon">✍️</span>
                  写作习惯
                </h4>
                <ul className="habits-list">
                  {styleProfile.profile.writingHabits.map((habit, index) => (
                    <li key={index} className="habit-item">
                      <span className="habit-bullet">•</span>
                      <span className="habit-text">{habit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="complete-actions">
            <button className="btn-secondary" onClick={resetAnalysis}>
              🔄 重新分析
            </button>
            <div className="action-hint">
              💡 AI将在所有内容生成中自动应用你的风格
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

