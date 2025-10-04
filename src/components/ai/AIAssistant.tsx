/**
 * AI 写作助手面板
 * 提供快捷的 AI 功能入口
 */

import React, { useState } from 'react'
import { useApp } from '../../utils/app-context'
import { useAI } from '../../hooks/useAI'
import { TitleSuggestion } from '../../services/ai/ai-service'

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

  const content = state.editor.content

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
    setShowResults(true)
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
    setShowResults(true)
    const polished = await polishText(selection, styleToUse)
    if (polished && polished !== selection) {
      setPolishedText({ original: selection, polished })
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
      setPolishedText({ original: selectedText, polished })
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
              <h4>📝 文章摘要</h4>
              <div className="summary-box">
                <p>{summary}</p>
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
                    复制
                  </button>
                  <button
                    type="button"
                    className="use-btn"
                    onClick={handleUseSummary}
                  >
                    插入到文章开头
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 大纲结果 */}
          {outline && (
            <div className="result-section">
              <h4>📋 文章大纲</h4>
              <div className="outline-box">
                <pre className="outline-preview">{outline}</pre>
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
                    替换编辑器内容
                  </button>
                </div>
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

        .summary-box, .outline-box, .polish-comparison {
          padding: 12px;
          background: #f8f9fa;
          border-radius: 6px;
        }

        .summary-box p {
          margin: 0 0 12px 0;
          font-size: 13px;
          color: #333;
          line-height: 1.6;
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

        .outline-preview {
          margin: 0 0 12px 0;
          padding: 12px;
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          font-size: 12px;
          line-height: 1.6;
          max-height: 300px;
          overflow-y: auto;
          white-space: pre-wrap;
          font-family: inherit;
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
          min-height: 80px;
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
      `}</style>
    </div>
  )
}

