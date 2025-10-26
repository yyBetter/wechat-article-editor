// AI写作工作室模态框
import React, { useState, useEffect } from 'react'
import { getAllStylePresets, StylePreset } from '../../utils/style-presets'
import { getAuthHeaders } from '../../utils/auth-api'
import { notification } from '../../utils/notification'
import '../../styles/ai-studio.css'

interface AIStudioModalProps {
  isOpen: boolean
  onClose: () => void
  initialContent?: string
  onApply: (content: string) => void
}

export function AIStudioModal({ isOpen, onClose, initialContent = '', onApply }: AIStudioModalProps) {
  const [currentTab, setCurrentTab] = useState<'rewrite' | 'optimize'>('rewrite')
  const [selectedStyle, setSelectedStyle] = useState<string>('liurun')
  const [content, setContent] = useState(initialContent)
  const [result, setResult] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<{
    step: number
    message: string
  }>({ step: 0, message: '' })

  const styles = getAllStylePresets()

  // 当初始内容变化时更新
  useEffect(() => {
    if (initialContent) {
      setContent(initialContent)
    }
  }, [initialContent])

  // ESC键关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isProcessing) {
        onClose()
      }
    }
    
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, isProcessing, onClose])

  // 风格化改写
  const handleRewrite = async () => {
    if (!content.trim()) {
      notification.error('请输入要改写的内容')
      return
    }

    setIsProcessing(true)
    setResult('')
    setProgress({ step: 1, message: '📊 分析内容风格...' })

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002'
      
      // 模拟步骤2
      setTimeout(() => {
        setProgress({ step: 2, message: '✍️ AI正在改写中...' })
      }, 1000)

      const response = await fetch(`${API_BASE_URL}/api/ai-studio/rewrite`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content,
          styleId: selectedStyle
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '改写失败')
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || '改写失败')
      }

      setProgress({ step: 3, message: '✅ 改写完成！' })
      setResult(data.data.rewrittenContent)
      
      notification.success('改写成功', {
        details: `原文${data.data.stats.originalLength}字 → 新版${data.data.stats.rewrittenLength}字`
      })

    } catch (error) {
      console.error('改写失败:', error)
      notification.error('改写失败', {
        details: error instanceof Error ? error.message : '请检查网络连接'
      })
      setProgress({ step: 0, message: '' })
    } finally {
      setIsProcessing(false)
    }
  }

  // 应用到编辑器
  const handleApply = () => {
    if (!result) {
      notification.warning('没有可应用的内容')
      return
    }

    onApply(result)
    notification.success('已应用到编辑器')
    onClose()
  }

  // 复制结果
  const handleCopy = async () => {
    if (!result) return

    try {
      await navigator.clipboard.writeText(result)
      notification.success('已复制到剪贴板')
    } catch (error) {
      notification.error('复制失败')
    }
  }

  if (!isOpen) return null

  return (
    <div className="ai-studio-overlay" onClick={isProcessing ? undefined : onClose}>
      <div className="ai-studio-modal" onClick={(e) => e.stopPropagation()}>
        {/* 头部 */}
        <div className="ai-studio-header">
          <div className="ai-studio-title">
            <span className="ai-studio-icon">✨</span>
            <h2>AI写作工作室</h2>
          </div>
          {!isProcessing && (
            <button className="ai-studio-close" onClick={onClose} title="关闭 (ESC)">
              ✕
            </button>
          )}
        </div>

        {/* 标签页 */}
        <div className="ai-studio-tabs">
          <button
            className={`ai-studio-tab ${currentTab === 'rewrite' ? 'active' : ''}`}
            onClick={() => setCurrentTab('rewrite')}
            disabled={isProcessing}
          >
            ✍️ 风格改写
          </button>
          <button
            className={`ai-studio-tab ${currentTab === 'optimize' ? 'active' : ''}`}
            onClick={() => setCurrentTab('optimize')}
            disabled={isProcessing}
          >
            🎯 内容优化
          </button>
        </div>

        {/* 内容区 */}
        <div className="ai-studio-content">
          {currentTab === 'rewrite' && (
            <div className="ai-studio-rewrite">
              {/* 风格选择 */}
              <div className="style-selector-section">
                <h3 className="section-title">选择写作风格</h3>
                <div className="style-grid">
                  {styles.map((style: StylePreset) => (
                    <div
                      key={style.id}
                      className={`style-card ${selectedStyle === style.id ? 'selected' : ''}`}
                      onClick={() => setSelectedStyle(style.id)}
                    >
                      <div className="style-avatar">{style.avatar}</div>
                      <div className="style-info">
                        <div className="style-name">{style.name}</div>
                        <div className="style-author">{style.author}</div>
                      </div>
                      <div className="style-description">{style.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 输入输出区 */}
              <div className="content-section">
                <div className="input-output-grid">
                  {/* 输入区 */}
                  <div className="content-panel">
                    <div className="panel-header">
                      <h3>📝 原始内容</h3>
                      <span className="word-count">{content.length} 字</span>
                    </div>
                    <textarea
                      className="content-textarea"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="在这里输入或粘贴要改写的内容..."
                      disabled={isProcessing}
                    />
                  </div>

                  {/* 输出区 */}
                  <div className="content-panel">
                    <div className="panel-header">
                      <h3>✨ 改写结果</h3>
                      {result && (
                        <div className="panel-actions">
                          <span className="word-count">{result.length} 字</span>
                          <button
                            className="action-btn"
                            onClick={handleCopy}
                            title="复制"
                          >
                            📋
                          </button>
                        </div>
                      )}
                    </div>
                    {isProcessing ? (
                      <div className="processing-state">
                        <div className="processing-animation">
                          <div className="ai-avatar-group">
                            <div className="ai-avatar bounce">🎩</div>
                            <div className="ai-avatar bounce delay-1">✍️</div>
                            <div className="ai-avatar bounce delay-2">📚</div>
                          </div>
                          <div className="processing-message">{progress.message}</div>
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{ width: `${(progress.step / 3) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : result ? (
                      <div className="content-textarea result-display">
                        {result}
                      </div>
                    ) : (
                      <div className="empty-state">
                        <div className="empty-icon">✨</div>
                        <p>点击下方"开始改写"按钮</p>
                        <p className="empty-hint">AI将按照选定风格改写内容</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="action-bar">
                <button
                  className="btn-secondary"
                  onClick={onClose}
                  disabled={isProcessing}
                >
                  取消
                </button>
                <div className="action-right">
                  {result && (
                    <button
                      className="btn-success"
                      onClick={handleApply}
                      disabled={isProcessing}
                    >
                      ✅ 应用到编辑器
                    </button>
                  )}
                  <button
                    className="btn-primary"
                    onClick={handleRewrite}
                    disabled={isProcessing || !content.trim()}
                  >
                    {isProcessing ? '⏳ 处理中...' : '🚀 开始改写'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentTab === 'optimize' && (
            <div className="ai-studio-optimize">
              <div className="coming-soon">
                <div className="coming-soon-icon">🚧</div>
                <h3>内容优化功能</h3>
                <p>AI将分析文章质量，提供99条优化建议</p>
                <p className="coming-soon-hint">即将上线，敬请期待...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

