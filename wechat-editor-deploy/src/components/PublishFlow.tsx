import React, { useState } from 'react'
import { useApp } from '../utils/app-context'
import { QRCodeGenerator } from './QRCodeGenerator'
import { PublishStatus } from './PublishStatus'

interface PublishStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
}

export function PublishFlow() {
  const { state } = useApp()
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishSteps, setPublishSteps] = useState<PublishStep[]>([
    {
      id: 'validate',
      title: '内容验证',
      description: '检查文章内容和配置',
      status: 'pending'
    },
    {
      id: 'upload-assets',
      title: '上传素材',
      description: '上传图片到微信素材库',
      status: 'pending'
    },
    {
      id: 'create-article',
      title: '创建图文',
      description: '生成微信图文消息',
      status: 'pending'
    },
    {
      id: 'publish',
      title: '发布文章',
      description: '发布到微信公众号',
      status: 'pending'
    }
  ])

  const [previewUrl, setPreviewUrl] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  // 生成预览
  const generatePreview = () => {
    const previewData = {
      title: state.templates.variables.title,
      content: state.editor.content,
      template: state.templates.current?.id,
      variables: state.templates.variables,
      timestamp: Date.now()
    }
    
    // 模拟生成预览URL
    const url = `${window.location.origin}/preview/${btoa(JSON.stringify(previewData))}`
    setPreviewUrl(url)
    setShowPreview(true)
  }

  // 模拟发布流程
  const startPublish = async () => {
    setIsPublishing(true)
    
    for (let i = 0; i < publishSteps.length; i++) {
      // 更新当前步骤为处理中
      setPublishSteps(prev => prev.map((step, index) => 
        index === i ? { ...step, status: 'processing' } : step
      ))
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000))
      
      // 模拟成功/失败
      const success = Math.random() > 0.1 // 90%成功率
      
      setPublishSteps(prev => prev.map((step, index) => 
        index === i ? { 
          ...step, 
          status: success ? 'completed' : 'error',
          error: success ? undefined : '发布失败，请检查网络连接和权限设置'
        } : step
      ))
      
      if (!success) {
        setIsPublishing(false)
        return
      }
    }
    
    setIsPublishing(false)
    
    // 发布成功，添加到历史记录
    const publishRecord = {
      id: Date.now().toString(),
      title: state.templates.variables.title || '未命名文章',
      publishTime: new Date(),
      status: 'published',
      url: `https://mp.weixin.qq.com/s/${Math.random().toString(36).substr(2, 9)}`
    }
    
    // 这里应该调用 dispatch 添加到发布历史
    console.log('发布成功:', publishRecord)
  }

  return (
    <div className="publish-flow">
      <div className="publish-header">
        <h3 className="section-title">🚀 发布到微信公众号</h3>
        <div className="publish-summary">
          <div className="summary-item">
            <span className="summary-label">当前模板:</span>
            <span className="summary-value">{state.templates.current?.name}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">文章标题:</span>
            <span className="summary-value">{state.templates.variables.title || '未设置'}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">字数统计:</span>
            <span className="summary-value">{state.editor.content.length} 字</span>
          </div>
        </div>
      </div>

      {/* 预览功能 */}
      <div className="publish-section">
        <h4 className="section-subtitle">📱 手机预览</h4>
        <div className="preview-actions">
          <button 
            className="action-btn secondary"
            onClick={generatePreview}
            disabled={!state.editor.content}
          >
            生成预览链接
          </button>
          {showPreview && (
            <div className="preview-result">
              <QRCodeGenerator url={previewUrl} />
              <div className="preview-info">
                <p>扫描二维码在手机微信中预览</p>
                <div className="preview-link">
                  <input 
                    type="text" 
                    value={previewUrl} 
                    readOnly 
                    className="link-input"
                  />
                  <button 
                    className="copy-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(previewUrl)
                      alert('链接已复制!')
                    }}
                  >
                    复制
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 发布设置 */}
      <div className="publish-section">
        <h4 className="section-subtitle">⚙️ 发布设置</h4>
        <div className="publish-config">
          <label className="config-item">
            <input type="checkbox" defaultChecked />
            <span>发布后自动推送给关注用户</span>
          </label>
          <label className="config-item">
            <input type="checkbox" defaultChecked />
            <span>开启留言功能</span>
          </label>
          <label className="config-item">
            <input type="checkbox" />
            <span>设为原创文章</span>
          </label>
        </div>
      </div>

      {/* 发布流程 */}
      <div className="publish-section">
        <h4 className="section-subtitle">📤 发布流程</h4>
        
        {!isPublishing && publishSteps.every(step => step.status === 'pending') && (
          <div className="publish-start">
            <button 
              className="action-btn primary large"
              onClick={startPublish}
              disabled={!state.editor.content || !state.templates.variables.title}
            >
              开始发布到微信公众号
            </button>
            <p className="publish-note">
              发布前请确保已在"设置"中配置好微信公众号授权
            </p>
          </div>
        )}

        {(isPublishing || publishSteps.some(step => step.status !== 'pending')) && (
          <PublishStatus steps={publishSteps} />
        )}
      </div>

      {/* 发布历史 */}
      <div className="publish-section">
        <h4 className="section-subtitle">📋 发布历史</h4>
        <div className="publish-history">
          <div className="history-item">
            <div className="history-info">
              <div className="history-title">欢迎使用公众号排版工具</div>
              <div className="history-meta">
                <span className="history-time">2025-08-30 14:30</span>
                <span className="history-status success">发布成功</span>
              </div>
            </div>
            <div className="history-actions">
              <button className="history-btn">查看</button>
              <button className="history-btn">数据</button>
            </div>
          </div>
          
          <div className="empty-history">
            <div className="empty-icon">📝</div>
            <p>暂无发布历史</p>
          </div>
        </div>
      </div>
    </div>
  )
}