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

  const content = state.editor.content

  // 生成标题
  const handleGenerateTitles = async () => {
    if (!content) return
    setCurrentTask('标题生成')
    setShowResults(true)
    const results = await generateTitles(content)
    setTitles(results)
    setCurrentTask('')
  }

  // 使用标题
  const handleUseTitle = (title: string) => {
    dispatch({
      type: 'UPDATE_VARIABLES',
      payload: { title }
    })
  }

  // 生成摘要
  const handleGenerateSummary = async () => {
    if (!content) return
    setCurrentTask('摘要生成')
    setShowResults(true)
    const result = await generateSummary(content, 100)
    setSummary(result)
    setCurrentTask('')
  }

  // 生成大纲
  const handleGenerateOutline = async () => {
    const topic = prompt('请输入文章主题：')
    if (!topic) return

    setCurrentTask('大纲生成')
    const outline = await generateOutline(topic, 'tutorial')
    if (outline) {
      // 将大纲转换为 Markdown 格式
      let markdownOutline = `# ${topic}\n\n`
      outline.outline.forEach((node, i) => {
        markdownOutline += `## ${i + 1}. ${node.title}\n\n`
        markdownOutline += `${node.description}\n\n`
        if (node.children) {
          node.children.forEach((child, j) => {
            markdownOutline += `### ${i + 1}.${j + 1} ${child.title}\n\n`
            markdownOutline += `${child.description}\n\n`
          })
        }
      })
      
      // 插入到编辑器
      dispatch({
        type: 'UPDATE_CONTENT',
        payload: markdownOutline
      })
    }
    setCurrentTask('')
  }

  // 润色选中文本
  const handlePolish = async () => {
    const selection = window.getSelection()?.toString()
    if (!selection) {
      alert('请先选中要润色的文本')
      return
    }

    setCurrentTask('文本润色')
    const polished = await polishText(selection, 'professional')
    if (polished && polished !== selection) {
      // 替换选中的文本
      const newContent = content.replace(selection, polished)
      dispatch({
        type: 'UPDATE_CONTENT',
        payload: newContent
      })
    }
    setCurrentTask('')
  }

  return (
    <div className="ai-assistant">
      <div className="ai-header">
        <h3>🤖 AI 写作助手</h3>
        <p className="ai-desc">使用 AI 提升写作效率</p>
      </div>

      <div className="ai-actions">
        <button
          type="button"
          className="ai-action-btn"
          onClick={handleGenerateTitles}
          disabled={loading || !content}
          title="根据内容生成5个吸引眼球的标题"
        >
          <span className="btn-icon">✨</span>
          <span className="btn-text">生成标题</span>
        </button>

        <button
          type="button"
          className="ai-action-btn"
          onClick={handleGenerateSummary}
          disabled={loading || !content}
          title="提取核心内容生成摘要"
        >
          <span className="btn-icon">📝</span>
          <span className="btn-text">生成摘要</span>
        </button>

        <button
          type="button"
          className="ai-action-btn"
          onClick={handleGenerateOutline}
          disabled={loading}
          title="根据主题生成文章大纲"
        >
          <span className="btn-icon">📋</span>
          <span className="btn-text">生成大纲</span>
        </button>

        <button
          type="button"
          className="ai-action-btn"
          onClick={handlePolish}
          disabled={loading || !content}
          title="润色选中的文本"
        >
          <span className="btn-icon">🎨</span>
          <span className="btn-text">润色文字</span>
        </button>
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
                <button
                  type="button"
                  className="copy-btn"
                  onClick={() => navigator.clipboard.writeText(summary)}
                >
                  复制
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            className="close-results-btn"
            onClick={() => {
              setShowResults(false)
              setTitles([])
              setSummary('')
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
        }

        .ai-header {
          margin-bottom: 16px;
        }

        .ai-header h3 {
          margin: 0 0 4px 0;
          font-size: 16px;
          color: #333;
        }

        .ai-desc {
          margin: 0;
          font-size: 12px;
          color: #999;
        }

        .ai-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .ai-action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ai-action-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .ai-action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-icon {
          font-size: 16px;
        }

        .btn-text {
          flex: 1;
          text-align: left;
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
          padding: 4px 12px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }

        .use-btn:hover {
          background: #5568d3;
        }

        .summary-box {
          padding: 12px;
          background: #f8f9fa;
          border-radius: 6px;
          position: relative;
        }

        .summary-box p {
          margin: 0 0 8px 0;
          font-size: 13px;
          color: #333;
          line-height: 1.6;
        }

        .copy-btn {
          padding: 4px 12px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }

        .copy-btn:hover {
          background: #059669;
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

