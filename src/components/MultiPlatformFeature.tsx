// AI多平台分发功能展示组件 - 商业化设计
import React from 'react'
import '../styles/multi-platform-feature.css'

interface MultiPlatformFeatureProps {
  variant?: 'hero' | 'compact'
}

export function MultiPlatformFeature({ variant = 'hero' }: MultiPlatformFeatureProps) {
  
  if (variant === 'hero') {
    // 首页大横幅展示 - 商业化设计
    return (
      <div className="multi-platform-hero">
        <div className="feature-badge">
          <span className="badge-icon">🆕</span>
          <span className="badge-text">新功能</span>
        </div>
        
        <div className="feature-header">
          <h2 className="feature-title">
            <span className="title-icon">✨</span>
            AI多平台分发，一次创作智能适配
          </h2>
          
          <p className="feature-subtitle">
            一篇文章，AI自动适配5个主流平台，每个平台专属标题和风格
            <br />
            <strong className="highlight">效率提升67%</strong>，让内容覆盖更多人
          </p>
        </div>
        
        <div className="platforms-showcase">
          <div className="platforms-grid">
            <div className="platform-card wechat">
              <div className="platform-icon">📱</div>
              <div className="platform-name">公众号</div>
              <div className="platform-desc">专业排版</div>
            </div>
            
            <div className="platform-card zhihu">
              <div className="platform-icon">📝</div>
              <div className="platform-name">知乎</div>
              <div className="platform-desc">深度内容</div>
            </div>
            
            <div className="platform-card xiaohongshu">
              <div className="platform-icon">🔴</div>
              <div className="platform-name">小红书</div>
              <div className="platform-desc">口语化</div>
            </div>
            
            <div className="platform-card toutiao">
              <div className="platform-icon">📰</div>
              <div className="platform-name">头条</div>
              <div className="platform-desc">新闻化</div>
            </div>
            
            <div className="platform-card weibo">
              <div className="platform-icon">🎈</div>
              <div className="platform-name">微博</div>
              <div className="platform-desc">精简版</div>
            </div>
          </div>
        </div>
        
        <div className="workflow-section">
          <div className="workflow-steps">
            <div className="workflow-step">
              <div className="step-circle">1</div>
              <div className="step-icon">✍️</div>
              <div className="step-label">写好文章</div>
            </div>
            
            <div className="workflow-arrow">→</div>
            
            <div className="workflow-step">
              <div className="step-circle">2</div>
              <div className="step-icon">🤖</div>
              <div className="step-label">AI适配</div>
            </div>
            
            <div className="workflow-arrow">→</div>
            
            <div className="workflow-step">
              <div className="step-circle">3</div>
              <div className="step-icon">👁️</div>
              <div className="step-label">样式预览</div>
            </div>
            
            <div className="workflow-arrow">→</div>
            
            <div className="workflow-step">
              <div className="step-circle">4</div>
              <div className="step-icon">🚀</div>
              <div className="step-label">一键发布</div>
            </div>
          </div>
          
          <div className="time-comparison">
            <div className="time-item current">
              <span className="time-icon">⚡</span>
              <span className="time-label">现在</span>
              <span className="time-value">15分钟</span>
            </div>
            <div className="time-vs">VS</div>
            <div className="time-item traditional">
              <span className="time-icon">🐌</span>
              <span className="time-label">传统</span>
              <span className="time-value">60分钟</span>
            </div>
          </div>
        </div>
        
        <div className="value-props">
          <div className="value-item">
            <div className="value-icon">🎯</div>
            <div className="value-content">
              <div className="value-title">精准适配</div>
              <div className="value-desc">每个平台专属标题和内容风格</div>
            </div>
          </div>
          
          <div className="value-item">
            <div className="value-icon">👁️</div>
            <div className="value-content">
              <div className="value-title">实时预览</div>
              <div className="value-desc">看到真实发布效果再复制</div>
            </div>
          </div>
          
          <div className="value-item">
            <div className="value-icon">⚡</div>
            <div className="value-content">
              <div className="value-title">极速生成</div>
              <div className="value-desc">2分钟完成5个平台的适配</div>
            </div>
          </div>
          
          <div className="value-item">
            <div className="value-icon">💰</div>
            <div className="value-content">
              <div className="value-title">节省成本</div>
              <div className="value-desc">省67%时间，覆盖5倍受众</div>
            </div>
          </div>
        </div>
        
        <div className="cta-section">
          <div className="cta-message">
            <span className="cta-icon">🎁</span>
            <span>现在注册，立即体验AI多平台分发</span>
          </div>
        </div>
      </div>
    )
  }
  
  if (variant === 'compact') {
    // 已登录用户的紧凑展示
    return (
      <div className="multi-platform-compact">
        <div className="compact-badge">
          <span className="badge-pulse">🔥</span>
          <span>HOT</span>
        </div>
        <div className="compact-content">
          <div className="compact-title">
            <span className="feature-icon">🚀</span>
            AI多平台分发已上线
          </div>
          <p className="compact-desc">
            一篇文章智能适配公众号、知乎、小红书、头条、微博，节省67%时间
          </p>
        </div>
        <div className="compact-tags">
          <span className="tag">⚡ 2分钟适配</span>
          <span className="tag">👁️ 样式预览</span>
          <span className="tag">🎯 5大平台</span>
        </div>
      </div>
    )
  }
  
  return null
}

