// AI多平台分发组件
import React, { useState, useCallback } from 'react'
import { notification } from '../../utils/notification'
import { PlatformStylePreview } from './PlatformStylePreview'
import '../../styles/multi-platform-adapter.css'

interface PlatformVersion {
  platform: string
  title: string
  content: string
  tips: string[]
  status: 'pending' | 'adapting' | 'ready' | 'error'
}

interface MultiPlatformAdapterProps {
  originalTitle: string
  originalContent: string
  onClose: () => void
}

// 平台配置
const PLATFORMS = [
  {
    id: 'wechat',
    name: '公众号',
    icon: '📱',
    description: '专业排版，适合长文阅读',
    color: '#07c160'
  },
  {
    id: 'zhihu',
    name: '知乎',
    icon: '📝',
    description: '问题式标题，深度内容',
    color: '#0084ff'
  },
  {
    id: 'xiaohongshu',
    name: '小红书',
    icon: '🔴',
    description: '口语化表达，多图展示',
    color: '#ff2442'
  },
  {
    id: 'toutiao',
    name: '头条',
    icon: '📰',
    description: '新闻化标题，快速阅读',
    color: '#e4393c'
  },
  {
    id: 'weibo',
    name: '微博',
    icon: '🎈',
    description: '精简版本，突出亮点',
    color: '#e6162d'
  }
]

export function MultiPlatformAdapter({ originalTitle, originalContent, onClose }: MultiPlatformAdapterProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['wechat', 'zhihu'])
  const [platformVersions, setPlatformVersions] = useState<Record<string, PlatformVersion>>({})
  const [isAdapting, setIsAdapting] = useState(false)
  const [currentStep, setCurrentStep] = useState<'select' | 'adapting' | 'result'>('select')
  const [viewMode, setViewMode] = useState<'text' | 'preview'>('preview') // 默认显示样式预览

  // 切换平台选择
  const togglePlatform = useCallback((platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    )
  }, [])

  // 开始适配
  const startAdapting = async () => {
    if (selectedPlatforms.length === 0) {
      notification.error('请至少选择一个平台')
      return
    }

    try {
      setIsAdapting(true)
      setCurrentStep('adapting')
      
      // 初始化所有平台状态
      const initialVersions: Record<string, PlatformVersion> = {}
      selectedPlatforms.forEach(platformId => {
        const platform = PLATFORMS.find(p => p.id === platformId)!
        initialVersions[platformId] = {
          platform: platform.name,
          title: originalTitle,
          content: originalContent,
          tips: [],
          status: 'pending'
        }
      })
      setPlatformVersions(initialVersions)

      const token = localStorage.getItem('token')

      // 逐个平台适配
      for (const platformId of selectedPlatforms) {
        // 更新状态为适配中
        setPlatformVersions(prev => ({
          ...prev,
          [platformId]: { ...prev[platformId], status: 'adapting' }
        }))

        try {
          const response = await fetch('/api/ai/adapt-platform', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              platform: platformId,
              title: originalTitle,
              content: originalContent
            })
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || '适配失败')
          }

          const data = await response.json()

          // 更新适配结果
          setPlatformVersions(prev => ({
            ...prev,
            [platformId]: {
              ...prev[platformId],
              title: data.title,
              content: data.content,
              tips: data.tips || [],
              status: 'ready'
            }
          }))

        } catch (error: any) {
          console.error(`${platformId} 适配失败:`, error)
          setPlatformVersions(prev => ({
            ...prev,
            [platformId]: { ...prev[platformId], status: 'error' }
          }))
        }
      }

      setCurrentStep('result')
      notification.success('✅ 多平台适配完成！')

    } catch (error: any) {
      console.error('平台适配失败:', error)
      notification.error('❌ ' + error.message)
    } finally {
      setIsAdapting(false)
    }
  }

  // 复制到剪贴板
  const copyToClipboard = useCallback((platformId: string) => {
    const version = platformVersions[platformId]
    if (!version) return

    const text = `${version.title}\n\n${version.content}`
    
    navigator.clipboard.writeText(text).then(() => {
      notification.success(`✅ 已复制${version.platform}版本`)
    }).catch(() => {
      notification.error('复制失败')
    })
  }, [platformVersions])

  // 导出所有版本
  const exportAll = useCallback(() => {
    const allText = Object.entries(platformVersions)
      .map(([platformId, version]) => {
        const platform = PLATFORMS.find(p => p.id === platformId)
        return `${'='.repeat(50)}\n${platform?.icon} ${version.platform}版本\n${'='.repeat(50)}\n\n标题：${version.title}\n\n${version.content}\n\n`
      })
      .join('\n')

    const blob = new Blob([allText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `多平台版本_${new Date().toLocaleDateString()}.txt`
    a.click()
    URL.revokeObjectURL(url)

    notification.success('✅ 已导出所有版本')
  }, [platformVersions])

  // 重新适配
  const resetAdapter = () => {
    setCurrentStep('select')
    setPlatformVersions({})
  }

  return (
    <div className="multi-platform-adapter-overlay">
      <div className="multi-platform-adapter-modal">
        {/* 头部 */}
        <div className="adapter-header">
          <div className="header-content">
            <h2 className="adapter-title">
              <span className="title-icon">🚀</span>
              AI多平台分发
            </h2>
            <p className="adapter-subtitle">
              一次创作，智能适配多个平台，提升内容分发效率
            </p>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="adapter-body">
          {/* 步骤1: 选择平台 */}
          {currentStep === 'select' && (
            <div className="step-content">
              <div className="original-preview">
                <h3 className="section-title">
                  <span className="section-icon">📄</span>
                  原始内容
                </h3>
                <div className="original-content">
                  <h4 className="original-title">{originalTitle}</h4>
                  <div className="original-text">
                    {originalContent.substring(0, 200)}
                    {originalContent.length > 200 && '...'}
                  </div>
                  <div className="original-stats">
                    <span>📝 {originalContent.length} 字</span>
                  </div>
                </div>
              </div>

              <div className="platform-selection">
                <h3 className="section-title">
                  <span className="section-icon">🎯</span>
                  选择目标平台
                </h3>
                <p className="section-hint">
                  选择你要分发的平台，AI将自动适配内容风格和格式
                </p>

                <div className="platforms-grid">
                  {PLATFORMS.map(platform => (
                    <div
                      key={platform.id}
                      className={`platform-card ${selectedPlatforms.includes(platform.id) ? 'selected' : ''}`}
                      onClick={() => togglePlatform(platform.id)}
                      style={{ '--platform-color': platform.color } as React.CSSProperties}
                    >
                      <div className="platform-checkbox">
                        {selectedPlatforms.includes(platform.id) ? '✅' : '⬜'}
                      </div>
                      <div className="platform-icon">{platform.icon}</div>
                      <div className="platform-info">
                        <h4 className="platform-name">{platform.name}</h4>
                        <p className="platform-description">{platform.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="step-actions">
                <button className="btn-secondary" onClick={onClose}>
                  取消
                </button>
                <button 
                  className="btn-primary"
                  onClick={startAdapting}
                  disabled={selectedPlatforms.length === 0}
                >
                  <span className="btn-icon">🤖</span>
                  <span>开始适配（{selectedPlatforms.length}个平台）</span>
                </button>
              </div>
            </div>
          )}

          {/* 步骤2: 适配中 */}
          {currentStep === 'adapting' && (
            <div className="step-content adapting">
              <div className="adapting-animation">
                <div className="adapting-icon">🤖</div>
                <h3 className="adapting-title">AI正在智能适配各平台...</h3>
                <p className="adapting-description">
                  正在为 {selectedPlatforms.length} 个平台生成专属版本
                </p>
              </div>

              <div className="adapting-platforms">
                {selectedPlatforms.map(platformId => {
                  const platform = PLATFORMS.find(p => p.id === platformId)!
                  const version = platformVersions[platformId]
                  const status = version?.status || 'pending'

                  return (
                    <div key={platformId} className={`adapting-platform ${status}`}>
                      <span className="platform-icon">{platform.icon}</span>
                      <span className="platform-name">{platform.name}</span>
                      <span className="status-indicator">
                        {status === 'pending' && '⏳ 等待中'}
                        {status === 'adapting' && '⚡ 适配中...'}
                        {status === 'ready' && '✅ 完成'}
                        {status === 'error' && '❌ 失败'}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="adapting-hint">
                预计需要 {selectedPlatforms.length * 15}-{selectedPlatforms.length * 30} 秒...
              </div>
            </div>
          )}

          {/* 步骤3: 结果展示 */}
          {currentStep === 'result' && (
            <div className="step-content result">
              <div className="result-header">
                <div className="result-success">
                  <span className="success-icon">🎉</span>
                  <div className="success-content">
                    <h3 className="success-title">多平台适配完成！</h3>
                    <p className="success-description">
                      已为 {Object.keys(platformVersions).length} 个平台生成专属版本
                    </p>
                  </div>
                </div>

                <div className="result-actions">
                  <div className="view-mode-toggle">
                    <button 
                      className={`toggle-btn ${viewMode === 'preview' ? 'active' : ''}`}
                      onClick={() => setViewMode('preview')}
                    >
                      👁️ 样式预览
                    </button>
                    <button 
                      className={`toggle-btn ${viewMode === 'text' ? 'active' : ''}`}
                      onClick={() => setViewMode('text')}
                    >
                      📝 文本内容
                    </button>
                  </div>
                  <div className="action-buttons">
                    <button className="btn-secondary" onClick={resetAdapter}>
                      🔄 重新适配
                    </button>
                    <button className="btn-primary" onClick={exportAll}>
                      📥 导出全部
                    </button>
                  </div>
                </div>
              </div>

              <div className="platform-versions">
                {Object.entries(platformVersions).map(([platformId, version]) => {
                  const platform = PLATFORMS.find(p => p.id === platformId)!
                  
                  if (version.status !== 'ready') return null

                  return (
                    <div key={platformId} className="version-card">
                      <div 
                        className="version-header"
                        style={{ '--platform-color': platform.color } as React.CSSProperties}
                      >
                        <div className="version-platform">
                          <span className="platform-icon">{platform.icon}</span>
                          <span className="platform-name">{platform.name}版本</span>
                        </div>
                        <button 
                          className="copy-btn"
                          onClick={() => copyToClipboard(platformId)}
                        >
                          📋 复制
                        </button>
                      </div>

                      <div className="version-content">
                        {viewMode === 'preview' ? (
                          // 样式预览模式
                          <div className="preview-mode">
                            <PlatformStylePreview
                              platform={platformId as any}
                              title={version.title}
                              content={version.content}
                            />
                            {version.tips.length > 0 && (
                              <div className="version-tips">
                                <label className="version-label">
                                  <span className="tips-icon">💡</span>
                                  适配建议
                                </label>
                                <ul className="tips-list">
                                  {version.tips.map((tip, index) => (
                                    <li key={index}>{tip}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ) : (
                          // 文本内容模式
                          <>
                            <div className="version-title-section">
                              <label className="version-label">标题</label>
                              <h4 className="version-title">{version.title}</h4>
                            </div>

                            <div className="version-text-section">
                              <label className="version-label">内容</label>
                              <div className="version-text">
                                {version.content.split('\n').map((line, index) => (
                                  <p key={index}>{line || '\u00A0'}</p>
                                ))}
                              </div>
                            </div>

                            {version.tips.length > 0 && (
                              <div className="version-tips">
                                <label className="version-label">
                                  <span className="tips-icon">💡</span>
                                  适配建议
                                </label>
                                <ul className="tips-list">
                                  {version.tips.map((tip, index) => (
                                    <li key={index}>{tip}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

