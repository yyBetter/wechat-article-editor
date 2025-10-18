// 平台样式预览组件 - 模拟各平台真实样式
import React from 'react'
import '../../styles/platform-preview.css'

interface PlatformStylePreviewProps {
  platform: 'wechat' | 'zhihu' | 'xiaohongshu' | 'toutiao' | 'weibo'
  title: string
  content: string
}

export function PlatformStylePreview({ platform, title, content }: PlatformStylePreviewProps) {
  // 将Markdown转换为HTML的简单处理
  const renderContent = (text: string) => {
    return text
      .split('\n')
      .map((line, index) => {
        // 标题
        if (line.startsWith('## ')) {
          return <h3 key={index} className="preview-h3">{line.replace('## ', '')}</h3>
        }
        if (line.startsWith('# ')) {
          return <h2 key={index} className="preview-h2">{line.replace('# ', '')}</h2>
        }
        
        // 列表
        if (line.startsWith('• ') || line.startsWith('- ')) {
          return <li key={index} className="preview-li">{line.replace(/^[•\-]\s/, '')}</li>
        }
        
        // 粗体
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        
        // 空行
        if (!line.trim()) {
          return <br key={index} />
        }
        
        // 普通段落
        return <p key={index} className="preview-p" dangerouslySetInnerHTML={{ __html: line }} />
      })
  }

  // 公众号样式
  if (platform === 'wechat') {
    return (
      <div className="platform-preview wechat-preview">
        <div className="preview-header">
          <div className="preview-avatar">👤</div>
          <div className="preview-author">
            <div className="author-name">我的公众号</div>
            <div className="publish-time">刚刚</div>
          </div>
        </div>
        <div className="preview-body">
          <h1 className="preview-title wechat-title">{title}</h1>
          <div className="preview-meta">
            <span>阅读 999</span>
            <span>在看 99</span>
          </div>
          <div className="preview-content wechat-content">
            {renderContent(content)}
          </div>
          <div className="preview-footer wechat-footer">
            <div className="footer-actions">
              <button className="action-btn">👍 赞</button>
              <button className="action-btn">💬 评论</button>
              <button className="action-btn">👀 在看</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 知乎样式
  if (platform === 'zhihu') {
    return (
      <div className="platform-preview zhihu-preview">
        <div className="preview-header">
          <div className="preview-avatar">👤</div>
          <div className="preview-author">
            <div className="author-name">知乎用户</div>
            <div className="author-desc">职业认证 · 资深从业者</div>
          </div>
          <button className="follow-btn">+ 关注</button>
        </div>
        <div className="preview-body">
          <h1 className="preview-title zhihu-title">{title}</h1>
          <div className="preview-content zhihu-content">
            {renderContent(content)}
          </div>
          <div className="preview-footer zhihu-footer">
            <div className="footer-actions">
              <button className="action-btn">👍 赞同 123</button>
              <button className="action-btn">💬 评论 45</button>
              <button className="action-btn">⭐ 收藏</button>
              <button className="action-btn">🔗 分享</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 小红书样式
  if (platform === 'xiaohongshu') {
    return (
      <div className="platform-preview xiaohongshu-preview">
        <div className="preview-header">
          <div className="preview-avatar">👤</div>
          <div className="preview-author">
            <div className="author-name">小红书用户</div>
            <div className="author-desc">分享生活 💕</div>
          </div>
          <button className="follow-btn">+ 关注</button>
        </div>
        <div className="preview-body">
          <div className="preview-images">
            <div className="image-placeholder">📷 图片1</div>
            <div className="image-placeholder">📷 图片2</div>
            <div className="image-placeholder">📷 图片3</div>
          </div>
          <h2 className="preview-title xiaohongshu-title">{title}</h2>
          <div className="preview-content xiaohongshu-content">
            {renderContent(content)}
          </div>
          <div className="preview-tags">
            <span className="tag">#AI工具</span>
            <span className="tag">#效率提升</span>
            <span className="tag">#干货分享</span>
          </div>
          <div className="preview-footer xiaohongshu-footer">
            <div className="footer-actions">
              <button className="action-btn">❤️ 123</button>
              <button className="action-btn">💬 45</button>
              <button className="action-btn">⭐ 678</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 头条样式
  if (platform === 'toutiao') {
    return (
      <div className="platform-preview toutiao-preview">
        <div className="preview-header">
          <h1 className="preview-title toutiao-title">{title}</h1>
          <div className="preview-meta">
            <span className="author-name">作者名</span>
            <span className="publish-time">刚刚</span>
            <span className="read-count">999阅读</span>
          </div>
        </div>
        <div className="preview-body">
          <div className="preview-content toutiao-content">
            {renderContent(content)}
          </div>
          <div className="preview-footer toutiao-footer">
            <div className="footer-actions">
              <button className="action-btn">👍 点赞</button>
              <button className="action-btn">💬 评论</button>
              <button className="action-btn">🔗 分享</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 微博样式
  if (platform === 'weibo') {
    return (
      <div className="platform-preview weibo-preview">
        <div className="preview-header">
          <div className="preview-avatar">👤</div>
          <div className="preview-author">
            <div className="author-name">微博用户 ✓</div>
            <div className="publish-time">刚刚 来自 iPhone客户端</div>
          </div>
          <button className="follow-btn">+ 关注</button>
        </div>
        <div className="preview-body">
          <div className="preview-content weibo-content">
            <div className="weibo-text">
              <strong>{title}</strong>
              <br /><br />
              {renderContent(content)}
            </div>
            <div className="weibo-images">
              <div className="image-placeholder">📷</div>
              <div className="image-placeholder">📷</div>
              <div className="image-placeholder">📷</div>
            </div>
          </div>
          <div className="preview-footer weibo-footer">
            <div className="footer-actions">
              <button className="action-btn">🔁 转发 12</button>
              <button className="action-btn">💬 评论 34</button>
              <button className="action-btn">👍 点赞 567</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

