// 发布模态框组件 - 顶部工具栏发布功能的核心组件
import React, { useState, useEffect, useRef } from 'react'
import { useApp } from '../utils/app-context'
import { PublishStatus } from './PublishStatus'
import { isWeChatAuthorized, getWeChatAccountInfo } from './WeChatConfig'
import { publishToWeChat, imageUrlToBase64 } from '../utils/wechat-api'
import { notification } from '../utils/notification'
import '../styles/publish-auth-status.css'

interface PublishModalProps {
  isOpen: boolean
  onClose: () => void
  currentDocument?: {
    id?: string
    title: string
    content: string
    author: string
  }
}

interface PublishStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
}

interface PublishConfig {
  title: string
  author: string
  summary: string
  pushToFollowers: boolean
  allowComments: boolean
  declareOriginal: boolean
  coverImage: string | null
  showCoverPic: boolean
}

export function PublishModal({ isOpen, onClose, currentDocument }: PublishModalProps) {
  const { state } = useApp()
  const [activeTab, setActiveTab] = useState<'config' | 'history'>('config')
  const [isPublishing, setIsPublishing] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [accountInfo, setAccountInfo] = useState<any>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  
  // 从后端API获取微信配置
  const fetchWeChatConfig = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        // 本地模式，从localStorage读取
        setAccountInfo(getWeChatAccountInfo())
        return
      }
      
      const response = await fetch('/api/auth/wechat-config', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      if (data.success && data.data.config) {
        const config = JSON.parse(data.data.config)
        setAccountInfo(config.accountInfo)
        setIsAuthorized(config.isConnected)
      } else {
        // 后端无配置，使用本地缓存
        setAccountInfo(getWeChatAccountInfo())
      }
    } catch (error) {
      console.error('获取微信配置失败:', error)
      // 降级使用本地缓存
      setAccountInfo(getWeChatAccountInfo())
    }
  }
  
  // 发布配置状态
  const [publishConfig, setPublishConfig] = useState<PublishConfig>({
    title: '',
    author: '',
    summary: '',
    pushToFollowers: false,
    allowComments: true,
    declareOriginal: false,
    coverImage: null,
    showCoverPic: true
  })
  
  // 发布步骤状态
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

  // 当模态框打开时，初始化配置并获取最新的公众号信息
  useEffect(() => {
    if (isOpen && currentDocument) {
      // 从localStorage检查授权状态
      setIsAuthorized(isWeChatAuthorized())
      
      // 从后端API获取最新的公众号配置
      fetchWeChatConfig()
      
      setPublishConfig({
        title: currentDocument.title || state.templates.variables.title || '',
        author: currentDocument.author || state.templates.variables.author || 'Shawn',
        summary: extractSummary(currentDocument.content),
        pushToFollowers: false,
        allowComments: true,
        declareOriginal: false,
        coverImage: null,
        showCoverPic: true
      })
      // 重置发布步骤
      setPublishSteps(prev => prev.map(step => ({ ...step, status: 'pending' })))
      setIsPublishing(false)
      setActiveTab('config')
    }
  }, [isOpen, currentDocument, state.templates.variables])

  // ESC键关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isPublishing) {
        onClose()
      }
    }
    
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, isPublishing, onClose])

  // 防止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // 提取文章摘要（前120字）
  const extractSummary = (content: string): string => {
    if (!content) return ''
    
    // 清理markdown语法
    const cleanContent = content
      .replace(/```[\s\S]*?```/g, '') // 移除代码块
      .replace(/`[^`]+`/g, '') // 移除内联代码
      .replace(/!?\[[^\]]*\]\([^)]*\)/g, '') // 移除图片和链接
      .replace(/[#*>`_~]/g, '') // 移除markdown符号
      .replace(/\s+/g, ' ') // 合并空格
      .trim()
    
    return cleanContent.length > 120 
      ? cleanContent.substring(0, 120) + '...'
      : cleanContent
  }

  // 处理封面图片上传
  const handleCoverUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      notification.error('请选择图片文件')
      return
    }

    // 验证文件大小（微信要求小于2MB）
    if (file.size > 2 * 1024 * 1024) {
      notification.error('封面图片大小不能超过2MB')
      return
    }

    // 读取并预览
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setPublishConfig({ ...publishConfig, coverImage: dataUrl })
    }
    reader.readAsDataURL(file)
  }

  // 真实的发布流程
  const handlePublish = async () => {
    // 检查授权
    if (!isAuthorized) {
      notification.error('请先完成微信公众号授权')
      return
    }
    
    if (!publishConfig.title.trim()) {
      notification.error('请填写文章标题')
      return
    }
    
    if (!currentDocument?.content) {
      notification.error('文章内容不能为空')
      return
    }
    
    setIsPublishing(true)
    
    try {
      // Step 1: 内容验证
      setPublishSteps(prev => prev.map((step, index) => 
        index === 0 ? { ...step, status: 'processing' } : step
      ))
      
      // 获取渲染后的HTML内容（从预览区）
      const previewContent = state.preview.html || currentDocument.content
      
      setPublishSteps(prev => prev.map((step, index) => 
        index === 0 ? { ...step, status: 'completed' } : step
      ))
      
      // Step 2: 上传封面（如果有）
      setPublishSteps(prev => prev.map((step, index) => 
        index === 1 ? { ...step, status: 'processing' } : step
      ))
      
      let coverImageBuffer: string | undefined
      if (publishConfig.coverImage) {
        // 将Data URL转换为base64
        coverImageBuffer = publishConfig.coverImage.split(',')[1]
      }
      
      setPublishSteps(prev => prev.map((step, index) => 
        index === 1 ? { ...step, status: 'completed' } : step
      ))
      
      // Step 3 & 4: 创建并发布文章
      setPublishSteps(prev => prev.map((step, index) => 
        index === 2 ? { ...step, status: 'processing' } : step
      ))
      
      const result = await publishToWeChat({
        title: publishConfig.title,
        author: publishConfig.author,
        content: previewContent,
        digest: publishConfig.summary,
        coverImageBuffer,
        showCoverPic: publishConfig.showCoverPic ? 1 : 0,
        needOpenComment: publishConfig.allowComments ? 1 : 0,
        onlyFansCanComment: 0,
        pushToFollowers: publishConfig.pushToFollowers
      })
      
      if (!result.success) {
        throw new Error(result.message || '发布失败')
      }
      
      setPublishSteps(prev => prev.map((step, index) => 
        index === 2 ? { ...step, status: 'completed' } : 
        index === 3 ? { ...step, status: 'completed' } : step
      ))
      
      setIsPublishing(false)
      
      // 发布成功提示
      notification.success(
        publishConfig.pushToFollowers ? '文章已发布并推送给粉丝！' : '文章已添加到草稿箱！',
        {
          details: result.data?.mediaId ? `草稿ID: ${result.data.mediaId}` : undefined
        }
      )
      
      // 延迟关闭模态框
      setTimeout(() => {
        onClose()
      }, 2000)
      
    } catch (error) {
      console.error('发布失败:', error)
      
      // 标记失败的步骤
      setPublishSteps(prev => prev.map(step => 
        step.status === 'processing' ? {
          ...step,
          status: 'error',
          error: error instanceof Error ? error.message : '发布失败，请重试'
        } : step
      ))
      
      setIsPublishing(false)
      
      notification.error('发布失败', {
        details: error instanceof Error ? error.message : '请检查网络连接和配置'
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="publish-modal-overlay" onClick={isPublishing ? undefined : onClose}>
      <div className="publish-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* 模态框头部 */}
        <div className="publish-modal-header">
          <h2 className="publish-modal-title">📤 发布到微信公众号</h2>
          {!isPublishing && (
            <button 
              className="publish-modal-close"
              onClick={onClose}
              type="button"
              title="关闭 (ESC)"
            >
              ✕
            </button>
          )}
        </div>

        {/* 标签页导航 */}
        <div className="publish-modal-tabs">
          <button
            className={`publish-tab ${activeTab === 'config' ? 'active' : ''}`}
            onClick={() => setActiveTab('config')}
            disabled={isPublishing}
            type="button"
          >
            ✓ 发布配置
          </button>
          <button
            className={`publish-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
            disabled={isPublishing}
            type="button"
          >
            发布历史
          </button>
        </div>

        {/* 模态框内容 */}
        <div className="publish-modal-body">
          {activeTab === 'config' && (
            <div className="publish-config-tab">
              {/* 如果正在发布或已完成，显示进度 */}
              {(isPublishing || publishSteps.some(step => step.status !== 'pending')) ? (
                <div className="publish-progress-section">
                  <PublishStatus steps={publishSteps} />
                  
                  {!isPublishing && publishSteps.every(step => step.status === 'completed') && (
                    <div className="publish-success-message">
                      <div className="success-icon">✅</div>
                      <h3>发布成功！</h3>
                      <p>文章已成功发布到微信公众号</p>
                    </div>
                  )}
                  
                  {!isPublishing && publishSteps.some(step => step.status === 'error') && (
                    <div className="publish-error-actions">
                      <button 
                        className="btn-secondary"
                        onClick={() => {
                          setPublishSteps(prev => prev.map(step => ({ ...step, status: 'pending' })))
                        }}
                        type="button"
                      >
                        重试
                      </button>
                      <button 
                        className="btn-secondary"
                        onClick={onClose}
                        type="button"
                      >
                        关闭
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* 基本信息 */}
                  <div className="publish-section">
                    <h3 className="publish-section-title">📋 基本信息</h3>
                    
                    <div className="publish-form-group">
                      <label className="publish-form-label">
                        标题 <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        className="publish-form-input"
                        value={publishConfig.title}
                        onChange={(e) => setPublishConfig({ ...publishConfig, title: e.target.value })}
                        placeholder="请输入文章标题"
                        maxLength={64}
                      />
                      <div className="publish-form-hint">
                        {publishConfig.title.length}/64
                      </div>
                    </div>
                    
                    <div className="publish-form-group">
                      <label className="publish-form-label">作者</label>
                      <input
                        type="text"
                        className="publish-form-input"
                        value={publishConfig.author}
                        onChange={(e) => setPublishConfig({ ...publishConfig, author: e.target.value })}
                        placeholder="请输入作者名称"
                      />
                    </div>
                    
                    <div className="publish-form-group">
                      <label className="publish-form-label">
                        摘要 <span className="optional">（选填，不超过120字）</span>
                      </label>
                      <textarea
                        className="publish-form-textarea"
                        value={publishConfig.summary}
                        onChange={(e) => setPublishConfig({ ...publishConfig, summary: e.target.value })}
                        placeholder="请输入文章摘要，会显示在分享卡片中"
                        maxLength={120}
                        rows={3}
                      />
                      <div className="publish-form-hint">
                        {publishConfig.summary.length}/120
                      </div>
                    </div>
                    
                    {/* 封面图片 */}
                    <div className="publish-form-group">
                      <label className="publish-form-label">
                        封面图片 <span className="optional">（选填，建议尺寸 900x500，小于2MB）</span>
                      </label>
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleCoverUpload}
                        style={{ display: 'none' }}
                      />
                      <div className="cover-upload-area">
                        {publishConfig.coverImage ? (
                          <div className="cover-preview">
                            <img src={publishConfig.coverImage} alt="封面预览" />
                            <div className="cover-actions">
                              <button
                                type="button"
                                className="btn-change-cover"
                                onClick={() => coverInputRef.current?.click()}
                              >
                                更换封面
                              </button>
                              <button
                                type="button"
                                className="btn-remove-cover"
                                onClick={() => setPublishConfig({ ...publishConfig, coverImage: null })}
                              >
                                移除封面
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="btn-upload-cover"
                            onClick={() => coverInputRef.current?.click()}
                          >
                            <span className="upload-icon">📷</span>
                            <span>点击上传封面图片</span>
                          </button>
                        )}
                      </div>
                      <div className="publish-form-hint" style={{ marginTop: '8px' }}>
                        封面将显示在分享卡片和文章顶部
                      </div>
                    </div>
                  </div>

                  {/* 发布选项 */}
                  <div className="publish-section">
                    <h3 className="publish-section-title">⚙️ 发布选项</h3>
                    
                    <label className="publish-checkbox-item">
                      <input
                        type="checkbox"
                        checked={publishConfig.pushToFollowers}
                        onChange={(e) => setPublishConfig({ ...publishConfig, pushToFollowers: e.target.checked })}
                      />
                      <div className="publish-checkbox-content">
                        <span className="publish-checkbox-label">立即推送给所有粉丝</span>
                        <span className="publish-checkbox-desc">推送后，粉丝会收到订阅号消息通知</span>
                      </div>
                    </label>
                    
                    <label className="publish-checkbox-item">
                      <input
                        type="checkbox"
                        checked={publishConfig.allowComments}
                        onChange={(e) => setPublishConfig({ ...publishConfig, allowComments: e.target.checked })}
                      />
                      <div className="publish-checkbox-content">
                        <span className="publish-checkbox-label">允许留言</span>
                        <span className="publish-checkbox-desc">开启后，读者可以在文章底部留言</span>
                      </div>
                    </label>
                    
                    <label className="publish-checkbox-item">
                      <input
                        type="checkbox"
                        checked={publishConfig.declareOriginal}
                        onChange={(e) => setPublishConfig({ ...publishConfig, declareOriginal: e.target.checked })}
                      />
                      <div className="publish-checkbox-content">
                        <span className="publish-checkbox-label">声明原创</span>
                        <span className="publish-checkbox-desc">声明原创后，其他公众号转载需申请授权</span>
                      </div>
                    </label>
                  </div>

                  {/* 授权状态提示 - 紧凑样式 */}
                  {isAuthorized ? (
                    <div className="publish-auth-status authorized">
                      <span className="status-icon">✓</span>
                      <span className="status-text">
                        已连接：{accountInfo?.name || '未知公众号'}
                      </span>
                    </div>
                  ) : (
                    <div className="publish-auth-status unauthorized">
                      <span className="status-icon">⚠</span>
                      <span className="status-text">
                        未授权，请先在"全局设置"中完成授权
                      </span>
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="publish-modal-actions">
                    <button 
                      className="btn-secondary"
                      onClick={onClose}
                      type="button"
                      disabled={isPublishing}
                    >
                      取消
                    </button>
                    <button 
                      className="btn-primary"
                      onClick={handlePublish}
                      disabled={!publishConfig.title.trim() || !isAuthorized || isPublishing}
                      type="button"
                      title={!isAuthorized ? '请先完成授权' : ''}
                    >
                      {isPublishing ? '发布中...' : '📤 开始发布'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="publish-history-tab">
              <div className="publish-history-empty">
                <div className="empty-icon">📝</div>
                <p>暂无发布历史</p>
                <p className="empty-hint">发布成功后，历史记录会显示在这里</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        /* 模态框遮罩层 */
        .publish-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
          animation: fadeIn 0.2s ease-out;
        }

        /* 模态框容器 */
        .publish-modal-content {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 700px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          animation: slideIn 0.2s ease-out;
        }

        /* 模态框头部 */
        .publish-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid #e5e5e5;
        }

        .publish-modal-title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }

        .publish-modal-close {
          background: none;
          border: none;
          font-size: 24px;
          color: #999;
          cursor: pointer;
          padding: 4px;
          line-height: 1;
          transition: color 0.2s, transform 0.2s;
          border-radius: 4px;
        }

        .publish-modal-close:hover {
          color: #333;
          background: #f5f5f5;
          transform: scale(1.1);
        }

        /* 标签页导航 */
        .publish-modal-tabs {
          display: flex;
          padding: 0 24px;
          border-bottom: 1px solid #e5e5e5;
          background: #fafafa;
        }

        .publish-tab {
          background: none;
          border: none;
          padding: 12px 20px;
          font-size: 14px;
          font-weight: 500;
          color: #666;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
          position: relative;
          top: 1px;
        }

        .publish-tab:hover {
          color: #1e6fff;
        }

        .publish-tab.active {
          color: #1e6fff;
          border-bottom-color: #1e6fff;
          background: white;
        }

        .publish-tab:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* 模态框内容区 */
        .publish-modal-body {
          overflow-y: auto;
          padding: 24px;
          flex: 1;
        }

        /* 发布配置标签页 */
        .publish-config-tab {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* 发布区块 */
        .publish-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .publish-section-title {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #333;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* 表单组 */
        .publish-form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .publish-form-label {
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }

        .publish-form-label .required {
          color: #dc2626;
        }

        .publish-form-label .optional {
          font-weight: 400;
          color: #999;
          font-size: 13px;
        }

        .publish-form-input,
        .publish-form-textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #e5e5e5;
          border-radius: 6px;
          font-size: 14px;
          font-family: inherit;
          transition: border-color 0.2s;
        }

        .publish-form-input:focus,
        .publish-form-textarea:focus {
          outline: none;
          border-color: #1e6fff;
        }

        .publish-form-textarea {
          resize: vertical;
          min-height: 80px;
        }

        .publish-form-hint {
          font-size: 12px;
          color: #999;
          text-align: right;
        }

        /* Checkbox 选项 */
        .publish-checkbox-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px;
          background: #f8f9fa;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .publish-checkbox-item:hover {
          background: #f0f1f3;
        }

        .publish-checkbox-item input[type="checkbox"] {
          margin-top: 2px;
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .publish-checkbox-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        .publish-checkbox-label {
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }

        .publish-checkbox-desc {
          font-size: 13px;
          color: #666;
        }

        /* 封面上传区域 */
        .cover-upload-area {
          margin-top: 8px;
        }

        .btn-upload-cover {
          width: 100%;
          padding: 40px 20px;
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          background: #f9fafb;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-upload-cover:hover {
          border-color: #1e6fff;
          background: #f0f7ff;
        }

        .upload-icon {
          font-size: 48px;
        }

        .btn-upload-cover span:last-child {
          color: #666;
          font-size: 14px;
        }

        .cover-preview {
          position: relative;
          border: 2px solid #e5e5e5;
          border-radius: 8px;
          overflow: hidden;
        }

        .cover-preview img {
          width: 100%;
          height: auto;
          display: block;
        }

        .cover-actions {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          display: flex;
          gap: 0;
        }

        .btn-change-cover,
        .btn-remove-cover {
          flex: 1;
          padding: 12px;
          border: none;
          background: transparent;
          color: white;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-change-cover:hover {
          background: rgba(30, 111, 255, 0.8);
        }

        .btn-remove-cover:hover {
          background: rgba(220, 38, 38, 0.8);
        }

        .btn-change-cover {
          border-right: 1px solid rgba(255, 255, 255, 0.2);
        }

        /* 操作按钮 */
        .publish-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 8px;
        }

        .btn-primary,
        .btn-secondary {
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-primary {
          background: #1e6fff;
          color: white;
        }

        .btn-primary:hover {
          background: #0056d2;
        }

        .btn-primary:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #f5f5f5;
          color: #333;
        }

        .btn-secondary:hover {
          background: #e5e5e5;
        }

        /* 发布进度区域 */
        .publish-progress-section {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* 发布成功消息 */
        .publish-success-message {
          text-align: center;
          padding: 32px 16px;
        }

        .success-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }

        .publish-success-message h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          color: #333;
        }

        .publish-success-message p {
          margin: 0;
          font-size: 14px;
          color: #666;
        }

        /* 发布错误操作 */
        .publish-error-actions {
          display: flex;
          justify-content: center;
          gap: 12px;
        }

        /* 发布历史标签页 */
        .publish-history-tab {
          min-height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .publish-history-empty {
          text-align: center;
          color: #999;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .publish-history-empty p {
          margin: 8px 0;
          font-size: 14px;
        }

        .empty-hint {
          font-size: 13px;
          color: #ccc;
        }

        /* 授权状态提示 */
        .publish-notice {
          padding: 14px 16px;
          border-radius: 8px;
          margin-top: 20px;
          border: 1px solid;
        }

        .publish-notice.success {
          background: #f0fdf4;
          border-color: #86efac;
        }

        .publish-notice.warning {
          background: #fff7ed;
          border-color: #fed7aa;
        }

        .notice-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }

        .notice-icon {
          font-size: 18px;
        }

        .notice-title {
          font-weight: 600;
          font-size: 14px;
        }

        .publish-notice.success .notice-title {
          color: #166534;
        }

        .publish-notice.warning .notice-title {
          color: #9a3412;
        }

        .notice-content {
          font-size: 13px;
          line-height: 1.5;
          margin-left: 26px;
        }

        .publish-notice.success .notice-content {
          color: #166534;
        }

        .publish-notice.warning .notice-content {
          color: #9a3412;
        }

        /* 滚动条样式 */
        .publish-modal-body::-webkit-scrollbar {
          width: 8px;
        }

        .publish-modal-body::-webkit-scrollbar-track {
          background: #f5f5f5;
          border-radius: 4px;
        }

        .publish-modal-body::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 4px;
        }

        .publish-modal-body::-webkit-scrollbar-thumb:hover {
          background: #999;
        }

        /* 动画 */
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* 响应式 */
        @media (max-width: 768px) {
          .publish-modal-content {
            max-width: 100%;
            max-height: 95vh;
            margin: 0 8px;
          }

          .publish-modal-header {
            padding: 16px 20px;
          }

          .publish-modal-body {
            padding: 20px;
          }

          .publish-section {
            gap: 12px;
          }

          .publish-checkbox-item {
            padding: 12px;
          }
        }
      `}</style>
    </div>
  )
}

