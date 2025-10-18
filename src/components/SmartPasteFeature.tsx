// 智能粘贴功能展示组件
import React from 'react'
import '../styles/smart-paste-feature.css'

interface SmartPasteFeatureProps {
  variant?: 'hero' | 'compact' | 'guide'
  onClose?: () => void
}

export function SmartPasteFeature({ variant = 'hero', onClose }: SmartPasteFeatureProps) {
  
  if (variant === 'hero') {
    // 首页大横幅展示
    return (
      <div className="smart-paste-hero">
        <div className="smart-paste-badge">
          <span className="badge-pulse">🆕</span>
          <span className="badge-text">新功能</span>
        </div>
        
        <div className="smart-paste-content">
          <h2 className="smart-paste-title">
            <span className="title-icon">✨</span>
            智能粘贴，一秒成型
          </h2>
          
          <p className="smart-paste-description">
            从飞书、Notion、Word直接复制，自动转换为精美Markdown
            <br />
            告别手动调格式，专注内容创作
          </p>
          
          <div className="platform-support">
            <span className="platform-label">支持平台：</span>
            <div className="platform-icons">
              <span className="platform-icon" title="飞书">📱 飞书</span>
              <span className="platform-icon" title="Notion">📝 Notion</span>
              <span className="platform-icon" title="Word">📄 Word</span>
              <span className="platform-icon" title="Google Docs">🔷 Docs</span>
              <span className="platform-icon" title="更多">➕ 更多</span>
            </div>
          </div>
        </div>
        
        <div className="smart-paste-demo">
          <div className="demo-flow">
            <div className="demo-step">
              <div className="step-number">1</div>
              <div className="step-icon">📋</div>
              <div className="step-text">在飞书编辑</div>
            </div>
            
            <div className="demo-arrow">→</div>
            
            <div className="demo-step">
              <div className="step-number">2</div>
              <div className="step-icon">📄</div>
              <div className="step-text">Ctrl+C 复制</div>
            </div>
            
            <div className="demo-arrow">→</div>
            
            <div className="demo-step">
              <div className="step-number">3</div>
              <div className="step-icon">✨</div>
              <div className="step-text">智能转换</div>
            </div>
            
            <div className="demo-arrow">→</div>
            
            <div className="demo-step">
              <div className="step-number">4</div>
              <div className="step-icon">🎨</div>
              <div className="step-text">选择模板</div>
            </div>
          </div>
          
          <div className="demo-time">
            <span className="time-badge">⏱️ 仅需 1 秒</span>
            <span className="time-comparison">传统方式需要 5-10 分钟</span>
          </div>
        </div>
      </div>
    )
  }
  
  if (variant === 'compact') {
    // 已登录用户的紧凑展示
    return (
      <div className="smart-paste-compact">
        <div className="compact-icon">✨</div>
        <div className="compact-content">
          <div className="compact-title">
            <span className="new-badge">NEW</span>
            智能粘贴功能上线
          </div>
          <p className="compact-description">
            支持从飞书、Notion、Word等平台直接复制内容，自动转换格式
          </p>
        </div>
        <div className="compact-features">
          <span className="feature-tag">🚀 10倍提效</span>
          <span className="feature-tag">✨ 自动识别</span>
          <span className="feature-tag">🎯 精准转换</span>
        </div>
      </div>
    )
  }
  
  if (variant === 'guide') {
    // 编辑器内的引导卡片
    return (
      <div className="smart-paste-guide">
        <button className="guide-close" onClick={onClose} title="关闭引导">
          ✕
        </button>
        
        <div className="guide-header">
          <span className="guide-icon">💡</span>
          <h3 className="guide-title">快速上手：智能粘贴</h3>
        </div>
        
        <div className="guide-content">
          <div className="guide-step">
            <span className="step-badge">1</span>
            <div className="step-info">
              <strong>从其他平台复制内容</strong>
              <p>飞书、Notion、Word、Google Docs 都支持</p>
            </div>
          </div>
          
          <div className="guide-step">
            <span className="step-badge">2</span>
            <div className="step-info">
              <strong>粘贴到编辑器</strong>
              <p>Ctrl+V（Mac: Cmd+V），自动识别格式</p>
            </div>
          </div>
          
          <div className="guide-step">
            <span className="step-badge">3</span>
            <div className="step-info">
              <strong>查看转换结果</strong>
              <p>格式自动转换为Markdown，支持标题、列表、表格等</p>
            </div>
          </div>
        </div>
        
        <div className="guide-footer">
          <div className="guide-tip">
            <span className="tip-icon">💡</span>
            <span>支持图片、表格、代码块等丰富格式</span>
          </div>
          <button className="guide-action" onClick={onClose}>
            知道了，开始创作
          </button>
        </div>
      </div>
    )
  }
  
  return null
}

