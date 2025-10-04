/**
 * AI 写作助手面板
 * 提供快捷的 AI 功能入口
 */

import React, { useState } from 'react'
import { useApp } from '../../utils/app-context'
import { useAI } from '../../hooks/useAI'
import { TitleSuggestion } from '../../services/ai/ai-service'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

export function AIAssistant() {
  const { state, dispatch } = useApp()
  const { loading, generateTitles, generateSummary, generateOutline, polishText } = useAI()
  
  const [showResults, setShowResults] = useState(false)
  const [currentTask, setCurrentTask] = useState<string>('')
  const [titles, setTitles] = useState<TitleSuggestion[]>([])
  const [summary, setSummary] = useState<string>('')
  const [outline, setOutline] = useState<string>('')
  const [polishedText, setPolishedText] = useState<{ original: string; polished: string } | null>(null)
  const [polishStyle, setPolishStyle] = useState<'professional' | 'casual' | 'concise' | 'vivid'>('professional')
  const [selectedText, setSelectedText] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [modalContent, setModalContent] = useState<{
    type: 'outline' | 'polish' | 'summary'
    data: any
  } | null>(null)

  const content = state.editor.content

  // 配置 marked 选项
  marked.setOptions({
    breaks: true,
    gfm: true,
  })

  // 渲染 Markdown 为 HTML
  const renderMarkdown = (markdown: string): string => {
    try {
      const html = marked(markdown) as string
      return DOMPurify.sanitize(html)
    } catch (error) {
      console.error('Markdown 渲染失败:', error)
      return markdown
    }
  }

  // 清空所有结果
  const clearAllResults = () => {
    setTitles([])
    setSummary('')
    setOutline('')
    setPolishedText(null)
  }

  // 生成标题
  const handleGenerateTitles = async () => {
    if (!content) return
    clearAllResults() // 清空之前的结果
    setCurrentTask('标题生成')
    setShowResults(true)
    const results = await generateTitles(content)
    setTitles(results)
    setCurrentTask('')
  }

  // 使用标题
  const handleUseTitle = (title: string) => {
    dispatch({
      type: 'UPDATE_TEMPLATE_VARIABLES',
      payload: { title }
    })
    // 显示成功提示
    const notification = document.createElement('div')
    notification.textContent = '✅ 标题已应用'
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: #10b981;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `
    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 2000)
  }

  // 生成摘要
  const handleGenerateSummary = async () => {
    if (!content) return
    clearAllResults() // 清空之前的结果
    setCurrentTask('摘要生成')
    setShowResults(true)
    const result = await generateSummary(content, 100)
    setSummary(result)
    setCurrentTask('')
  }

  // 使用摘要（插入到编辑器开头）
  const handleUseSummary = () => {
    const newContent = `> ${summary}\n\n${content}`
    dispatch({
      type: 'UPDATE_EDITOR_CONTENT',
      payload: newContent
    })
    // 显示成功提示
    const notification = document.createElement('div')
    notification.textContent = '✅ 摘要已插入到文章开头'
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: #10b981;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `
    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 2000)
    setShowResults(false)
    clearAllResults()
  }

  // 生成大纲
  const handleGenerateOutline = async () => {
    const topic = prompt('请输入文章主题：')
    if (!topic) return

    clearAllResults() // 清空之前的结果
    setCurrentTask('大纲生成')
    const outlineResult = await generateOutline(topic, 'tutorial')
    if (outlineResult) {
      // 将大纲转换为 Markdown 格式
      let markdownOutline = `# ${topic}\n\n`
      outlineResult.outline.forEach((node, i) => {
        markdownOutline += `## ${i + 1}. ${node.title}\n\n`
        markdownOutline += `${node.description}\n\n`
        if (node.children) {
          node.children.forEach((child, j) => {
            markdownOutline += `### ${i + 1}.${j + 1} ${child.title}\n\n`
            markdownOutline += `${child.description}\n\n`
          })
        }
      })
      setOutline(markdownOutline)
      // 使用模态框展示
      setModalContent({ type: 'outline', data: markdownOutline })
      setShowModal(true)
    }
    setCurrentTask('')
  }

  // 使用大纲
  const handleUseOutline = () => {
    dispatch({
      type: 'UPDATE_EDITOR_CONTENT',
      payload: outline
    })
    // 显示成功提示
    const notification = document.createElement('div')
    notification.textContent = '✅ 大纲已应用到编辑器'
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: #10b981;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `
    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 2000)
    setShowResults(false)
    clearAllResults()
  }

  // 润色选中文本
  const handlePolish = async (style?: 'professional' | 'casual' | 'concise' | 'vivid') => {
    const selection = window.getSelection()?.toString()
    if (!selection) {
      alert('💡 请先在编辑器中选中要润色的文字')
      return
    }

    clearAllResults() // 清空之前的结果
    setSelectedText(selection)
    const styleToUse = style || polishStyle
    setPolishStyle(styleToUse)
    setCurrentTask('文本润色')
    const polished = await polishText(selection, styleToUse)
    if (polished && polished !== selection) {
      const data = { original: selection, polished, style: styleToUse }
      setPolishedText({ original: selection, polished })
      // 使用模态框展示
      setModalContent({ type: 'polish', data })
      setShowModal(true)
    }
    setCurrentTask('')
  }

  // 重新润色（使用不同风格）
  const handleRepolish = async (style: 'professional' | 'casual' | 'concise' | 'vivid') => {
    if (!selectedText) return
    setPolishStyle(style)
    setCurrentTask('文本润色')
    const polished = await polishText(selectedText, style)
    if (polished && polished !== selectedText) {
      const data = { original: selectedText, polished, style }
      setPolishedText({ original: selectedText, polished })
      // 更新模态框内容
      setModalContent({ type: 'polish', data })
    }
    setCurrentTask('')
  }

  // 使用润色后的文本
  const handleUsePolished = () => {
    if (!polishedText) return
    const newContent = content.replace(polishedText.original, polishedText.polished)
    dispatch({
      type: 'UPDATE_EDITOR_CONTENT',
      payload: newContent
    })
    // 显示成功提示
    const notification = document.createElement('div')
    notification.textContent = '✅ 润色后的文本已应用'
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: #10b981;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `
    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 2000)
    setShowResults(false)
    clearAllResults()
  }

  return (
    <div className="ai-assistant">
      <div className="ai-header">
        <h3>🤖 AI 写作助手</h3>
        <p className="ai-desc">按写作流程为你提供智能辅助</p>
      </div>

      {/* 阶段1：构思阶段 */}
      <div className="workflow-section">
        <div className="section-header">
          <span className="section-icon">💡</span>
          <span className="section-title">构思阶段</span>
        </div>
        <div className="section-desc">还没开始写？先从这里开始</div>
        <button
          type="button"
          className={`workflow-btn ${loading ? 'loading' : ''}`}
          onClick={handleGenerateOutline}
          disabled={loading}
        >
          <span className="btn-icon">📋</span>
          <div className="btn-content">
            <div className="btn-title">生成文章大纲</div>
            <div className="btn-desc">输入主题，AI帮你搭建框架</div>
          </div>
        </button>
      </div>

      {/* 阶段2：写作阶段 */}
      <div className="workflow-section">
        <div className="section-header">
          <span className="section-icon">✍️</span>
          <span className="section-title">写作阶段</span>
        </div>
        <div className="section-desc">选中文字，选择风格润色</div>
        <div className="polish-grid">
          <button
            type="button"
            className={`polish-style-btn ${loading ? 'loading' : ''}`}
            onClick={() => handlePolish('professional')}
            disabled={loading || !content}
          >
            <span className="style-icon">🎯</span>
            <div className="style-info">
              <div className="style-name">专业正式</div>
              <div className="style-hint">商务、学术</div>
            </div>
          </button>
          <button
            type="button"
            className={`polish-style-btn ${loading ? 'loading' : ''}`}
            onClick={() => handlePolish('casual')}
            disabled={loading || !content}
          >
            <span className="style-icon">😊</span>
            <div className="style-info">
              <div className="style-name">轻松亲切</div>
              <div className="style-hint">朋友圈、日常</div>
            </div>
          </button>
          <button
            type="button"
            className={`polish-style-btn ${loading ? 'loading' : ''}`}
            onClick={() => handlePolish('concise')}
            disabled={loading || !content}
          >
            <span className="style-icon">✂️</span>
            <div className="style-info">
              <div className="style-name">简洁精炼</div>
              <div className="style-hint">新闻、快讯</div>
            </div>
          </button>
          <button
            type="button"
            className={`polish-style-btn ${loading ? 'loading' : ''}`}
            onClick={() => handlePolish('vivid')}
            disabled={loading || !content}
          >
            <span className="style-icon">✨</span>
            <div className="style-info">
              <div className="style-name">生动形象</div>
              <div className="style-hint">故事、散文</div>
            </div>
          </button>
        </div>
      </div>

      {/* 阶段3：完善阶段 */}
      <div className="workflow-section">
        <div className="section-header">
          <span className="section-icon">✨</span>
          <span className="section-title">完善阶段</span>
        </div>
        <div className="section-desc">
          文章写完了？添加标题和摘要
          {(!content || content.length < 50) && (
            <span className="requirement-badge">需要50字+</span>
          )}
        </div>
        <div className="finalize-buttons">
          <button
            type="button"
            className={`workflow-btn ${loading ? 'loading' : ''}`}
            onClick={handleGenerateTitles}
            disabled={loading || !content || content.length < 50}
          >
            <span className="btn-icon">🎯</span>
            <div className="btn-content">
              <div className="btn-title">生成标题</div>
              <div className="btn-desc">5个吸引眼球的选择</div>
            </div>
          </button>
          <button
            type="button"
            className={`workflow-btn ${loading ? 'loading' : ''}`}
            onClick={handleGenerateSummary}
            disabled={loading || !content || content.length < 100}
          >
            <span className="btn-icon">📝</span>
            <div className="btn-content">
              <div className="btn-title">生成摘要</div>
              <div className="btn-desc">提炼核心内容</div>
            </div>
          </button>
        </div>
      </div>

      {/* 加载状态 */}
      {loading && currentTask && (
        <div className="ai-loading">
          <div className="loading-spinner"></div>
          <p>正在{currentTask}中...</p>
        </div>
      )}

      {/* 全屏模态框 */}
      {showModal && modalContent && (
        <div className="ai-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="ai-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {modalContent.type === 'outline' && '📋 文章大纲预览'}
                {modalContent.type === 'polish' && '🎨 文本对比'}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {modalContent.type === 'outline' && (
              <div className="modal-body">
                <div className="modal-comparison">
                  <div className="modal-compare-side">
                    <div className="modal-compare-header">
                      <span className="modal-compare-icon">📄</span>
                      <span className="modal-compare-title">当前内容</span>
                    </div>
                    <div 
                      className="modal-compare-text original markdown-body"
                      dangerouslySetInnerHTML={{ 
                        __html: content ? renderMarkdown(content) : '<p style="color: #999; font-style: italic;">（编辑器为空，将直接替换）</p>' 
                      }}
                    />
                  </div>
                  
                  <div className="modal-compare-divider">
                    <div className="modal-divider-line"></div>
                    <div className="modal-divider-arrow">→</div>
                    <div className="modal-divider-line"></div>
                  </div>
                  
                  <div className="modal-compare-side">
                    <div className="modal-compare-header">
                      <span className="modal-compare-icon">📋</span>
                      <span className="modal-compare-title">生成的大纲</span>
                    </div>
                    <div 
                      className="modal-compare-text polished markdown-body"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(modalContent.data) }}
                    />
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button className="modal-btn cancel" onClick={() => setShowModal(false)}>
                    取消
                  </button>
                  <button className="modal-btn primary" onClick={() => {
                    handleUseOutline()
                    setShowModal(false)
                  }}>
                    {content ? '✅ 替换为此大纲' : '✅ 使用此大纲'}
                  </button>
                </div>
              </div>
            )}

            {modalContent.type === 'polish' && (
              <div className="modal-body">
                <div className="modal-style-badge">
                  当前风格: <span className="badge-text">
                    {modalContent.data.style === 'professional' && '🎯 专业'}
                    {modalContent.data.style === 'casual' && '😊 轻松'}
                    {modalContent.data.style === 'concise' && '✂️ 简洁'}
                    {modalContent.data.style === 'vivid' && '✨ 生动'}
                  </span>
                </div>
                
                <div className="modal-comparison">
                  <div className="modal-compare-side">
                    <div className="modal-compare-header">
                      <span className="modal-compare-icon">📄</span>
                      <span className="modal-compare-title">原文</span>
                    </div>
                    <div 
                      className="modal-compare-text original markdown-body"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(modalContent.data.original) }}
                    />
                  </div>
                  
                  <div className="modal-compare-divider">
                    <div className="modal-divider-line"></div>
                    <div className="modal-divider-arrow">→</div>
                    <div className="modal-divider-line"></div>
                  </div>
                  
                  <div className="modal-compare-side">
                    <div className="modal-compare-header">
                      <span className="modal-compare-icon">✨</span>
                      <span className="modal-compare-title">润色后</span>
                    </div>
                    <div 
                      className="modal-compare-text polished markdown-body"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(modalContent.data.polished) }}
                    />
                  </div>
                </div>
                
                <div className="repolish-section-modal">
                  <div className="repolish-label">不满意？换个风格试试：</div>
                  <div className="repolish-buttons-modal">
                    {(['professional', 'casual', 'concise', 'vivid'] as const).map((style) => (
                      style !== modalContent.data.style && (
                        <button
                          key={style}
                          className="repolish-btn-modal"
                          onClick={() => handleRepolish(style)}
                          disabled={loading}
                        >
                          {style === 'professional' && '🎯 专业'}
                          {style === 'casual' && '😊 轻松'}
                          {style === 'concise' && '✂️ 简洁'}
                          {style === 'vivid' && '✨ 生动'}
                        </button>
                      )
                    ))}
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button className="modal-btn cancel" onClick={() => setShowModal(false)}>
                    取消
                  </button>
                  <button className="modal-btn primary" onClick={() => {
                    handleUsePolished()
                    setShowModal(false)
                  }}>
                    ✅ 应用润色
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 结果展示 */}
      {showResults && !loading && (
        <div className="ai-results">
          {/* 标题结果 */}
          {titles.length > 0 && (
            <div className="result-section">
              <h4>📌 推荐标题</h4>
              <div className="titles-list">
                {titles.map((item, index) => (
                  <div key={index} className="title-item">
                    <div className="title-header">
                      <span className="title-style">{item.style}</span>
                      <span className="title-score">⭐ {item.score}</span>
                    </div>
                    <p className="title-text">{item.title}</p>
                    <button
                      type="button"
                      className="use-btn"
                      onClick={() => handleUseTitle(item.title)}
                    >
                      使用
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 摘要结果 */}
          {summary && (
            <div className="result-section">
              <div className="result-header">
                <h4>📝 文章摘要</h4>
                <div className="current-style">
                  <span className="style-badge">AI 生成</span>
                </div>
              </div>
              <div className="summary-display">
                <div className="summary-content">
                  <div className="summary-icon">💡</div>
                  <p className="summary-text">{summary}</p>
                </div>
                <div className="summary-hint">
                  💡 摘要会以引用格式插入到文章开头
                </div>
              </div>
              <div className="action-buttons">
                <button
                  type="button"
                  className="copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(summary)
                    const notification = document.createElement('div')
                    notification.textContent = '✅ 已复制到剪贴板'
                    notification.style.cssText = `
                      position: fixed;
                      top: 80px;
                      left: 50%;
                      transform: translateX(-50%);
                      background: #10b981;
                      color: white;
                      padding: 12px 24px;
                      border-radius: 8px;
                      font-size: 14px;
                      z-index: 10000;
                      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    `
                    document.body.appendChild(notification)
                    setTimeout(() => notification.remove(), 2000)
                  }}
                >
                  📋 复制
                </button>
                <button
                  type="button"
                  className="use-btn"
                  onClick={handleUseSummary}
                >
                  ✅ 插入到开头
                </button>
              </div>
            </div>
          )}

          {/* 大纲结果 */}
          {outline && (
            <div className="result-section">
              <div className="result-header">
                <h4>📋 文章大纲预览</h4>
                <div className="current-style">
                  <span className="style-badge">AI 生成</span>
                </div>
              </div>
              <div className="polish-comparison">
                <div className="compare-side">
                  <div className="compare-header">
                    <span className="compare-icon">📄</span>
                    <span className="compare-title">当前内容</span>
                  </div>
                  <div className="compare-text original">
                    {content || '（编辑器为空，将直接替换）'}
                  </div>
                </div>
                
                <div className="compare-divider">
                  <div className="divider-line"></div>
                  <div className="divider-arrow">→</div>
                  <div className="divider-line"></div>
                </div>
                
                <div className="compare-side">
                  <div className="compare-header">
                    <span className="compare-icon">📋</span>
                    <span className="compare-title">生成的大纲</span>
                  </div>
                  <div className="compare-text polished" style={{ whiteSpace: 'pre-wrap' }}>
                    {outline}
                  </div>
                </div>
              </div>
              
              <div className="action-buttons">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowResults(false)
                    clearAllResults()
                  }}
                >
                  取消
                </button>
                <button
                  type="button"
                  className="use-btn"
                  onClick={handleUseOutline}
                >
                  {content ? '✅ 替换为此大纲' : '✅ 使用此大纲'}
                </button>
              </div>
            </div>
          )}

          {/* 润色结果 */}
          {polishedText && (
            <div className="result-section">
              <div className="result-header">
                <h4>🎨 文本对比</h4>
                <div className="current-style">
                  当前风格: <span className="style-badge">{
                    polishStyle === 'professional' ? '🎯 专业' :
                    polishStyle === 'casual' ? '😊 轻松' :
                    polishStyle === 'concise' ? '✂️ 简洁' :
                    '✨ 生动'
                  }</span>
                </div>
              </div>
              <div className="polish-comparison">
                <div className="compare-side">
                  <div className="compare-header">
                    <span className="compare-icon">📄</span>
                    <span className="compare-title">原文</span>
                  </div>
                  <div className="compare-text original">{polishedText.original}</div>
                </div>
                
                <div className="compare-divider">
                  <div className="divider-line"></div>
                  <div className="divider-arrow">→</div>
                  <div className="divider-line"></div>
                </div>
                
                <div className="compare-side">
                  <div className="compare-header">
                    <span className="compare-icon">✨</span>
                    <span className="compare-title">润色后</span>
                  </div>
                  <div className="compare-text polished">{polishedText.polished}</div>
                </div>
              </div>
              
              {/* 换个风格试试 */}
              <div className="repolish-section">
                <div className="repolish-label">不满意？换个风格试试：</div>
                <div className="repolish-buttons">
                  {(['professional', 'casual', 'concise', 'vivid'] as const).map((style) => (
                    style !== polishStyle && (
                      <button
                        key={style}
                        type="button"
                        className="repolish-btn"
                        onClick={() => handleRepolish(style)}
                        disabled={loading}
                      >
                        {style === 'professional' && '🎯 专业'}
                        {style === 'casual' && '😊 轻松'}
                        {style === 'concise' && '✂️ 简洁'}
                        {style === 'vivid' && '✨ 生动'}
                      </button>
                    )
                  ))}
                </div>
              </div>
              
              <div className="action-buttons">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowResults(false)
                    clearAllResults()
                  }}
                >
                  取消
                </button>
                <button
                  type="button"
                  className="use-btn"
                  onClick={handleUsePolished}
                >
                  ✅ 应用润色
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            className="close-results-btn"
            onClick={() => {
              setShowResults(false)
              clearAllResults()
            }}
          >
            关闭
          </button>
        </div>
      )}

      <style>{`
        .ai-assistant {
          padding: 16px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          height: 100%;
        }

        .ai-header {
          margin-bottom: 20px;
          text-align: center;
        }

        .ai-header h3 {
          margin: 0 0 6px 0;
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }

        .ai-desc {
          margin: 0;
          font-size: 13px;
          color: #999;
        }

        /* 工作流阶段 */
        .workflow-section {
          margin-bottom: 20px;
          padding: 16px;
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
          border-radius: 12px;
          border: 2px solid #f0f0f0;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }

        .section-icon {
          font-size: 20px;
        }

        .section-title {
          font-size: 15px;
          font-weight: 600;
          color: #333;
        }

        .section-desc {
          font-size: 12px;
          color: #999;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .requirement-badge {
          display: inline-block;
          padding: 2px 6px;
          background: #fef3c7;
          border: 1px solid #fcd34d;
          color: #92400e;
          font-size: 10px;
          border-radius: 4px;
          font-weight: 600;
        }

        /* 通用按钮样式 */
        .workflow-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .workflow-btn:hover:not(:disabled) {
          border-color: #667eea;
          background: #f5f3ff;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
        }

        .workflow-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .workflow-btn.loading::after {
          content: '';
          position: absolute;
          right: 12px;
          width: 16px;
          height: 16px;
          border: 2px solid #e5e7eb;
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .workflow-btn .btn-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .btn-content {
          flex: 1;
          text-align: left;
        }

        .btn-title {
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin-bottom: 2px;
        }

        .btn-desc {
          font-size: 11px;
          color: #999;
        }

        /* 润色风格网格 */
        .polish-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .polish-style-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .polish-style-btn:hover:not(:disabled) {
          border-color: #667eea;
          background: #f5f3ff;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
        }

        .polish-style-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .polish-style-btn.loading::after {
          content: '';
          position: absolute;
          right: 8px;
          top: 8px;
          width: 14px;
          height: 14px;
          border: 2px solid #e5e7eb;
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .style-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .style-info {
          flex: 1;
          text-align: left;
        }

        .style-name {
          font-size: 13px;
          font-weight: 600;
          color: #333;
          margin-bottom: 2px;
        }

        .style-hint {
          font-size: 10px;
          color: #999;
        }

        /* 完善阶段按钮 */
        .finalize-buttons {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .ai-loading {
          margin-top: 16px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 6px;
          text-align: center;
        }

        .loading-spinner {
          width: 24px;
          height: 24px;
          border: 3px solid #f0f0f0;
          border-top-color: #667eea;
          border-radius: 50%;
          margin: 0 auto 8px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .ai-loading p {
          margin: 0;
          font-size: 13px;
          color: #666;
        }

        .ai-results {
          margin-top: 16px;
        }

        .result-section {
          margin-bottom: 16px;
        }

        .result-section h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: #333;
        }

        .titles-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .title-item {
          padding: 12px;
          background: #f8f9fa;
          border-radius: 6px;
          position: relative;
        }

        .title-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .title-style {
          font-size: 11px;
          color: #667eea;
          font-weight: 600;
        }

        .title-score {
          font-size: 11px;
          color: #ff6b6b;
        }

        .title-text {
          margin: 0 0 8px 0;
          font-size: 13px;
          color: #333;
          line-height: 1.5;
        }

        .use-btn {
          padding: 6px 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);
        }

        .use-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(102, 126, 234, 0.4);
        }

        .use-btn:active {
          transform: translateY(0);
        }

        .polish-comparison {
          padding: 12px;
          background: #f8f9fa;
          border-radius: 6px;
        }

        /* 摘要显示 */
        .summary-display {
          padding: 16px;
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          border: 2px solid #6ee7b7;
          border-radius: 12px;
          margin-bottom: 16px;
        }

        .summary-content {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .summary-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .summary-text {
          flex: 1;
          margin: 0;
          font-size: 14px;
          color: #065f46;
          line-height: 1.8;
          font-weight: 500;
        }

        .summary-hint {
          font-size: 11px;
          color: #059669;
          text-align: center;
          padding: 8px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 6px;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .copy-btn {
          padding: 6px 16px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .copy-btn:hover {
          transform: translateY(-1px);
          background: #059669;
        }

        .cancel-btn {
          padding: 6px 16px;
          background: #e5e7eb;
          color: #666;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cancel-btn:hover {
          background: #d1d5db;
        }



        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .result-header h4 {
          margin: 0;
        }

        .current-style {
          font-size: 12px;
          color: #666;
        }

        .style-badge {
          display: inline-block;
          padding: 4px 10px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px;
          font-weight: 600;
          font-size: 11px;
        }

        .polish-comparison {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }

        .compare-side {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .compare-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #666;
        }

        .compare-icon {
          font-size: 16px;
        }

        .compare-title {
          font-size: 12px;
        }

        .compare-text {
          flex: 1;
          padding: 12px;
          border-radius: 8px;
          font-size: 13px;
          line-height: 1.8;
          min-height: 120px;
          max-height: 400px;
          overflow-y: auto;
        }

        .compare-text.original {
          background: #fff7ed;
          border: 2px solid #fed7aa;
          color: #92400e;
        }

        .compare-text.polished {
          background: #ecfdf5;
          border: 2px solid #6ee7b7;
          color: #065f46;
        }

        /* 自定义滚动条 */
        .compare-text::-webkit-scrollbar {
          width: 8px;
        }

        .compare-text::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 4px;
        }

        .compare-text::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }

        .compare-text::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3);
        }

        .compare-divider {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        .divider-line {
          width: 2px;
          flex: 1;
          background: linear-gradient(180deg, transparent, #667eea, transparent);
        }

        .divider-arrow {
          font-size: 20px;
          color: #667eea;
          font-weight: bold;
        }

        .repolish-section {
          margin-bottom: 16px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px dashed #d1d5db;
        }

        .repolish-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .repolish-buttons {
          display: flex;
          gap: 8px;
        }

        .repolish-btn {
          flex: 1;
          padding: 8px 12px;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #666;
          cursor: pointer;
          transition: all 0.2s;
        }

        .repolish-btn:hover:not(:disabled) {
          border-color: #667eea;
          background: #f5f3ff;
          color: #667eea;
          transform: translateY(-1px);
        }

        .repolish-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* 响应式调整 */
        @media (max-width: 768px) {
          .polish-comparison {
            grid-template-columns: 1fr;
            grid-template-rows: auto auto auto;
          }

          .compare-divider {
            flex-direction: row;
            height: auto;
          }

          .divider-line {
            height: 2px;
            width: 100%;
            background: linear-gradient(90deg, transparent, #667eea, transparent);
          }

          .divider-arrow {
            transform: rotate(90deg);
          }

          .styles-buttons {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .close-results-btn {
          width: 100%;
          padding: 8px;
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          font-size: 13px;
          color: #666;
          cursor: pointer;
          margin-top: 8px;
        }

        .close-results-btn:hover {
          background: #f8f9fa;
        }

        /* 全屏模态框 */
        .ai-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .ai-modal-content {
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 1200px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 2px solid #f0f0f0;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #333;
        }

        .modal-close {
          width: 36px;
          height: 36px;
          border: none;
          background: #f0f0f0;
          border-radius: 8px;
          font-size: 20px;
          color: #666;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-close:hover {
          background: #e5e7eb;
          color: #333;
        }

        .modal-body {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
        }

        .modal-style-badge {
          text-align: center;
          margin-bottom: 20px;
          font-size: 14px;
          color: #666;
        }

        .modal-style-badge .badge-text {
          display: inline-block;
          padding: 6px 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 20px;
          font-weight: 600;
          font-size: 14px;
          margin-left: 8px;
        }

        .modal-comparison {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 20px;
          margin-bottom: 24px;
        }

        .modal-compare-side {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .modal-compare-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #666;
        }

        .modal-compare-icon {
          font-size: 20px;
        }

        .modal-compare-title {
          font-size: 14px;
        }

        .modal-compare-text {
          flex: 1;
          padding: 20px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.8;
          min-height: 400px;
          max-height: 50vh;
          overflow-y: auto;
        }

        .modal-compare-text.original {
          background: #fff7ed;
          border: 2px solid #fed7aa;
          color: #92400e;
        }

        .modal-compare-text.polished {
          background: #ecfdf5;
          border: 2px solid #6ee7b7;
          color: #065f46;
        }

        /* Markdown 渲染样式 */
        .markdown-body h1 {
          font-size: 24px;
          font-weight: bold;
          margin: 16px 0 12px 0;
          line-height: 1.3;
          border-bottom: 2px solid currentColor;
          padding-bottom: 8px;
        }

        .markdown-body h2 {
          font-size: 20px;
          font-weight: bold;
          margin: 20px 0 10px 0;
          line-height: 1.4;
          border-left: 4px solid currentColor;
          padding-left: 12px;
        }

        .markdown-body h3 {
          font-size: 18px;
          font-weight: 600;
          margin: 16px 0 8px 0;
          line-height: 1.4;
        }

        .markdown-body h4 {
          font-size: 16px;
          font-weight: 600;
          margin: 12px 0 6px 0;
        }

        .markdown-body p {
          margin: 12px 0;
          line-height: 1.8;
        }

        .markdown-body ul,
        .markdown-body ol {
          margin: 12px 0;
          padding-left: 24px;
        }

        .markdown-body li {
          margin: 6px 0;
          line-height: 1.6;
        }

        .markdown-body blockquote {
          margin: 12px 0;
          padding: 12px 16px;
          border-left: 4px solid currentColor;
          background: rgba(0, 0, 0, 0.03);
          font-style: italic;
        }

        .markdown-body code {
          background: rgba(0, 0, 0, 0.08);
          padding: 2px 6px;
          border-radius: 3px;
          font-family: Monaco, Menlo, monospace;
          font-size: 13px;
        }

        .markdown-body pre {
          background: rgba(0, 0, 0, 0.05);
          padding: 12px;
          border-radius: 6px;
          overflow-x: auto;
          margin: 12px 0;
        }

        .markdown-body pre code {
          background: none;
          padding: 0;
        }

        .markdown-body strong {
          font-weight: bold;
        }

        .markdown-body em {
          font-style: italic;
        }

        .markdown-body hr {
          border: none;
          height: 2px;
          background: currentColor;
          opacity: 0.2;
          margin: 20px 0;
        }

        .markdown-body a {
          color: #1e6fff;
          text-decoration: underline;
        }

        .markdown-body img {
          max-width: 100%;
          height: auto;
          margin: 12px 0;
          border-radius: 4px;
        }

        /* 自定义滚动条 */
        .modal-compare-text::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .modal-compare-text::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 4px;
        }

        .modal-compare-text::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }

        .modal-compare-text::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3);
        }

        .modal-compare-divider {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-width: 40px;
        }

        .modal-divider-line {
          width: 3px;
          flex: 1;
          background: linear-gradient(180deg, transparent, #667eea, transparent);
        }

        .modal-divider-arrow {
          font-size: 28px;
          color: #667eea;
          font-weight: bold;
        }

        .repolish-section-modal {
          margin-bottom: 24px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 12px;
          border: 2px dashed #d1d5db;
        }

        .repolish-label {
          font-size: 13px;
          color: #666;
          margin-bottom: 12px;
          font-weight: 500;
          text-align: center;
        }

        .repolish-buttons-modal {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .repolish-btn-modal {
          padding: 10px 20px;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #666;
          cursor: pointer;
          transition: all 0.2s;
        }

        .repolish-btn-modal:hover:not(:disabled) {
          border-color: #667eea;
          background: #f5f3ff;
          color: #667eea;
          transform: translateY(-2px);
        }

        .repolish-btn-modal:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding-top: 20px;
          border-top: 2px solid #f0f0f0;
        }

        .modal-btn {
          padding: 12px 32px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .modal-btn.cancel {
          background: #f0f0f0;
          color: #666;
        }

        .modal-btn.cancel:hover {
          background: #e5e7eb;
        }

        .modal-btn.primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .modal-btn.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
        }

        /* 响应式 */
        @media (max-width: 768px) {
          .modal-comparison {
            grid-template-columns: 1fr;
            grid-template-rows: auto auto auto;
          }

          .modal-compare-divider {
            flex-direction: row;
            min-width: auto;
            height: 40px;
          }

          .modal-divider-line {
            height: 3px;
            width: 100%;
            background: linear-gradient(90deg, transparent, #667eea, transparent);
          }

          .modal-divider-arrow {
            transform: rotate(90deg);
          }

          .modal-compare-text {
            min-height: 200px;
          }
        }
      `}</style>
    </div>
  )
}

