import React from 'react'
import { useApp } from '../utils/app-context'

export function PublishGuide() {
  const { state } = useApp()
  
  return (
    <div className="publish-guide">
      <div className="guide-header">
        <h3>📖 发布指南</h3>
      </div>
      
      <div className="guide-content">
        <div className="guide-section">
          <h4>🎯 当前模板使用说明</h4>
          {state.templates.current?.usage ? (
            <div className="template-usage" dangerouslySetInnerHTML={{
              __html: state.templates.current.usage.replace(/\n/g, '<br/>')
            }} />
          ) : (
            <p>选择模板后显示使用说明</p>
          )}
        </div>
        
        <div className="guide-section">
          <h4>🚀 如何发布到微信公众号</h4>
          <div className="publish-steps">
            <div className="step">
              <span className="step-number">1</span>
              <div className="step-content">
                <h5>复制HTML代码</h5>
                <p>点击预览区域的"复制HTML"按钮，将完整的HTML代码复制到剪贴板</p>
              </div>
            </div>
            
            <div className="step">
              <span className="step-number">2</span>
              <div className="step-content">
                <h5>打开公众号后台</h5>
                <p>登录微信公众号后台，进入"素材管理" → "图文消息" → "新建图文消息"</p>
              </div>
            </div>
            
            <div className="step">
              <span className="step-number">3</span>
              <div className="step-content">
                <h5>粘贴HTML内容</h5>
                <p>在编辑器中切换到"HTML"模式，粘贴刚才复制的HTML代码</p>
              </div>
            </div>
            
            <div className="step">
              <span className="step-number">4</span>
              <div className="step-content">
                <h5>预览和发布</h5>
                <p>切回正常编辑模式，预览效果，确认无误后保存并发布</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="guide-section">
          <h4>💡 注意事项</h4>
          <ul className="tips-list">
            <li><strong>图片地址</strong>: 确保所有图片都使用https://开头的永久链接</li>
            <li><strong>链接跳转</strong>: 微信内只能跳转到已认证的域名</li>
            <li><strong>字符限制</strong>: 单篇文章不超过20万字符</li>
            <li><strong>样式保持</strong>: 复制的HTML包含完整样式，无需额外调整</li>
          </ul>
        </div>
        
        <div className="guide-section">
          <h4>🔧 高级功能</h4>
          <div className="advanced-features">
            <div className="feature">
              <h5>固定资源管理</h5>
              <p>设置品牌LOGO、二维码等固定元素，每次使用模板时自动插入</p>
            </div>
            <div className="feature">
              <h5>模板变量</h5>
              <p>填写文章标题、作者、日期等信息，自动应用到文章头部和尾部</p>
            </div>
            <div className="feature">
              <h5>实时预览</h5>
              <p>编辑时实时预览最终效果，所见即所得</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}