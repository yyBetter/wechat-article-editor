// Markdown编辑器组件
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { useApp } from '../utils/app-context'
import { TemplateEngine } from '../utils/template-engine'
import { templates } from '../templates'

// 防抖Hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

const templateEngine = new TemplateEngine(templates)

export function Editor() {
  const { state, dispatch } = useApp()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [displayContent, setDisplayContent] = useState('')
  
  // 缓存base64图片映射，避免重复处理
  const base64Cache = useRef<Map<string, string>>(new Map())
  
  // 防抖处理显示内容更新，减少频繁的状态更新
  const debouncedDisplayContent = useDebounce(displayContent, 150)
  
  // 转换显示内容，将长的base64图片替换为简化占位符
  const convertDisplayContent = useCallback((content: string) => {
    let counter = 0
    return content.replace(
      /!\[([^\]]*)\]\(data:image\/[^;]+;base64,[A-Za-z0-9+/=]+\)/g,
      (match, alt) => {
        // 缓存完整的base64图片数据
        const key = `img_${counter++}`
        base64Cache.current.set(key, match)
        return `![${alt}](🖼️ ${key})`
      }
    )
  }, [])

  // 转换编辑内容，将简化占位符还原为实际内容
  const convertEditContent = useCallback((displayContent: string) => {
    // 使用缓存的数据快速还原
    return displayContent.replace(
      /!\[([^\]]*)\]\(🖼️ (img_\d+)\)/g,
      (match, alt, key) => {
        const cachedImage = base64Cache.current.get(key)
        return cachedImage || match
      }
    )
  }, [])
  
  // 处理内容变化 - 立即更新显示，延迟更新实际内容
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDisplayContent = e.target.value
    setDisplayContent(newDisplayContent)
  }, [])
  
  // 防抖更新实际内容，避免频繁处理
  useEffect(() => {
    const actualContent = convertEditContent(debouncedDisplayContent)
    dispatch({ type: 'UPDATE_EDITOR_CONTENT', payload: actualContent })
  }, [debouncedDisplayContent, convertEditContent, dispatch])
  
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
    const selectedText = displayContent.substring(start, end)
    
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
    
    const newDisplayContent = 
      displayContent.substring(0, start) +
      newText +
      displayContent.substring(end)
    
    setDisplayContent(newDisplayContent)
    
    // 转换为实际内容并更新
    const actualContent = convertEditContent(newDisplayContent)
    dispatch({ type: 'UPDATE_EDITOR_CONTENT', payload: actualContent })
    
    // 重新聚焦并设置光标位置
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + newText.length, start + newText.length)
    }, 10)
  }, [displayContent, convertEditContent, dispatch])

  // 同步显示内容
  useEffect(() => {
    setDisplayContent(convertDisplayContent(state.editor.content))
  }, [state.editor.content, convertDisplayContent])

  // 将文件转换为Base64
  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }, [])

  // 处理图片文件上传
  const handleImageUpload = useCallback(async (file: File) => {
    try {
      // 验证文件大小 (限制5MB)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        alert('图片文件过大，请选择小于5MB的图片')
        return
      }

      setIsUploading(true)

      // 转换为Base64格式
      const base64Url = await fileToBase64(file)
      
      // 插入图片Markdown语法
      const textarea = textareaRef.current
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const fileName = file.name.replace(/\.[^/.]+$/, "") // 去掉扩展名作为alt文本
        
        // 创建实际的base64图片markdown
        const actualImageMarkdown = `![${fileName}](${base64Url})`
        
        // 生成唯一的缓存key
        const cacheKey = `img_${Date.now()}`
        base64Cache.current.set(cacheKey, actualImageMarkdown)
        
        // 创建显示用的简化版本
        const displayImageMarkdown = `![${fileName}](🖼️ ${cacheKey})`
        
        // 只更新显示内容，实际内容通过防抖机制自动更新
        const newDisplayContent = 
          displayContent.substring(0, start) +
          displayImageMarkdown +
          displayContent.substring(end)
        setDisplayContent(newDisplayContent)
        
        // 重新聚焦
        setTimeout(() => {
          textarea.focus()
          textarea.setSelectionRange(start + displayImageMarkdown.length, start + displayImageMarkdown.length)
        }, 10)
      }
    } catch (error) {
      console.error('图片上传失败:', error)
      alert('图片上传失败，请重试')
    } finally {
      setIsUploading(false)
    }
  }, [displayContent, fileToBase64])

  // 处理文件选择
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file)
    }
    // 清空input以便重复选择同一文件
    e.target.value = ''
  }, [handleImageUpload])

  // 处理剪贴板粘贴
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items)
    const imageItem = items.find(item => item.type.startsWith('image/'))
    
    if (imageItem) {
      e.preventDefault()
      const file = imageItem.getAsFile()
      if (file) {
        handleImageUpload(file)
      }
    }
  }, [handleImageUpload])

  // 处理拖拽
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    // 只有当离开整个编辑器区域时才设置为false
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(file => file.type.startsWith('image/'))
    
    if (imageFile) {
      handleImageUpload(imageFile)
    }
  }, [handleImageUpload])

  // 优化图片按钮点击
  const handleImageButtonClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])
  
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
            onClick={handleImageButtonClick}
            title="插入图片 (支持截图粘贴)"
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
      <div 
        className={`editor-wrapper ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <textarea
          ref={textareaRef}
          value={displayContent}
          onChange={handleContentChange}
          onPaste={handlePaste}
          placeholder="在此输入你的文章内容... 📝 支持 Ctrl+V 粘贴截图、拖拽图片文件"
          className="editor-textarea"
          spellCheck={false}
        />
        
        {/* 拖拽提示层 */}
        {isDragging && (
          <div className="drag-overlay">
            <div className="drag-message">
              <span className="drag-icon">📸</span>
              <span>拖放图片到这里</span>
            </div>
          </div>
        )}
        
        {/* 上传状态提示 */}
        {isUploading && (
          <div className="upload-overlay">
            <div className="upload-message">
              <span className="upload-icon">⏳</span>
              <span>正在处理图片...</span>
            </div>
          </div>
        )}
        
        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
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