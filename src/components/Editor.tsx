// Markdown编辑器组件
import React, { useCallback, useEffect, useRef } from 'react'
import { useApp } from '../utils/app-context'
import { TemplateEngine } from '../utils/template-engine'
import { templates } from '../templates'

const templateEngine = new TemplateEngine(templates)

export function Editor() {
  const { state, dispatch } = useApp()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // 处理内容变化
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value
    dispatch({ type: 'UPDATE_EDITOR_CONTENT', payload: content })
  }, [dispatch])
  
  // 自动更新预览
  useEffect(() => {
    if (state.templates.current && state.editor.content) {
      try {
        // 分析内容并推荐模板
        const analysis = templateEngine.analyzeContent(state.editor.content)
        
        // 如果当前没有手动选择模板，使用推荐模板
        if (state.templates.current.id !== analysis.suggestedTemplate) {
          const recommendedTemplate = templates.find(t => t.id === analysis.suggestedTemplate)
          if (recommendedTemplate && !state.templates.variables.title) {
            dispatch({ type: 'SELECT_TEMPLATE', payload: analysis.suggestedTemplate })
          }
        }
        
        // 合并模板变量和品牌资源
        const combinedVariables = {
          ...state.templates.variables,
          brandColors: state.assets.fixedAssets.brandColors,
          logo: state.assets.fixedAssets.logo,
          qrcode: state.assets.fixedAssets.qrcode,
          divider: state.assets.fixedAssets.watermark
        }
        
        // 渲染预览
        const { html, css } = templateEngine.renderTemplate(
          state.templates.current.id,
          state.editor.content,
          combinedVariables
        )
        
        dispatch({ type: 'SET_PREVIEW_HTML', payload: html })
      } catch (error) {
        console.error('Preview rendering error:', error)
      }
    }
  }, [state.editor.content, state.templates.current, state.templates.variables, dispatch])
  
  // 插入Markdown语法辅助函数
  const insertMarkdown = useCallback((syntax: string, placeholder = '') => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = state.editor.content.substring(start, end)
    
    let newText = ''
    switch (syntax) {
      case 'bold':
        newText = `**${selectedText || '粗体文字'}**`
        break
      case 'italic':
        newText = `*${selectedText || '斜体文字'}*`
        break
      case 'heading':
        newText = `## ${selectedText || '标题'}`
        break
      case 'link':
        newText = `[${selectedText || '链接文字'}](https://example.com)`
        break
      case 'image':
        newText = `![${selectedText || '图片描述'}](图片链接)`
        break
      case 'quote':
        newText = `> ${selectedText || '引用内容'}`
        break
      case 'list':
        newText = `- ${selectedText || '列表项'}`
        break
      case 'code':
        newText = `\`${selectedText || '代码'}\``
        break
      default:
        newText = selectedText
    }
    
    const newContent = 
      state.editor.content.substring(0, start) +
      newText +
      state.editor.content.substring(end)
    
    dispatch({ type: 'UPDATE_EDITOR_CONTENT', payload: newContent })
    
    // 重新聚焦并设置光标位置
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + newText.length, start + newText.length)
    }, 10)
  }, [state.editor.content, dispatch])
  
  return (
    <div className="editor-container">
      {/* 工具栏 */}
      <div className="editor-toolbar">
        <div className="toolbar-group">
          <button 
            type="button"
            onClick={() => insertMarkdown('bold')}
            title="粗体 (Ctrl+B)"
            className="toolbar-btn"
          >
            <strong>B</strong>
          </button>
          
          <button 
            type="button"
            onClick={() => insertMarkdown('italic')}
            title="斜体 (Ctrl+I)"
            className="toolbar-btn"
          >
            <em>I</em>
          </button>
          
          <button 
            type="button"
            onClick={() => insertMarkdown('heading')}
            title="标题"
            className="toolbar-btn"
          >
            H2
          </button>
          
          <button 
            type="button"
            onClick={() => insertMarkdown('link')}
            title="链接"
            className="toolbar-btn"
          >
            🔗
          </button>
          
          <button 
            type="button"
            onClick={() => insertMarkdown('image')}
            title="图片"
            className="toolbar-btn"
          >
            🖼️
          </button>
        </div>
        
        <div className="toolbar-group">
          <button 
            type="button"
            onClick={() => insertMarkdown('list')}
            title="列表"
            className="toolbar-btn"
          >
            📋
          </button>
          
          <button 
            type="button"
            onClick={() => insertMarkdown('quote')}
            title="引用"
            className="toolbar-btn"
          >
            💬
          </button>
          
          <button 
            type="button"
            onClick={() => insertMarkdown('code')}
            title="代码"
            className="toolbar-btn"
          >
            💻
          </button>
        </div>
      </div>
      
      {/* 编辑器 */}
      <div className="editor-wrapper">
        <textarea
          ref={textareaRef}
          value={state.editor.content}
          onChange={handleContentChange}
          placeholder="在此输入你的文章内容..."
          className="editor-textarea"
          spellCheck={false}
        />
        
        {/* 状态栏 */}
        <div className="editor-status">
          <span className="status-item">
            字数: {state.editor.content.length}
          </span>
          <span className="status-item">
            {state.editor.isChanged ? '未保存' : '已保存'}
          </span>
        </div>
      </div>
    </div>
  )
}