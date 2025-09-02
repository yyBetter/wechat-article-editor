// Markdown编辑器组件 - 高性能优化版本
import React, { useCallback, useEffect, useRef, useState, useMemo, memo } from 'react'
import { useApp } from '../utils/app-context'
import { useAuth } from '../utils/auth-context'
import { useAutoSave } from '../hooks/useAutoSave'
import { TemplateEngine } from '../utils/template-engine'
import { templates } from '../templates'
import { notification } from '../utils/notification'
import { uploadImage, getImageUrl } from '../utils/image-api'

// 防抖Hook - 优化性能
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

// 移除ImageManager类，现在使用服务器端图片存储

const templateEngine = new TemplateEngine(templates)

// 使用 React.memo 优化组件渲染性能
export const Editor = memo(function Editor() {
  const { state, dispatch } = useApp()
  const { state: authState } = useAuth()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // 自动保存功能
  const autoSave = useAutoSave(
    state.templates.variables.title || '未命名文档',
    state.editor.content,
    state.templates.current?.id || 'simple-doc',
    state.templates.variables,
    {
      enabled: authState.isAuthenticated,
      onSave: (document) => {
        console.log('文档已自动保存:', document.title)
        // 可以显示保存成功通知
        notification.success('文档已自动保存')
      },
      onError: (error) => {
        console.error('自动保存失败:', error)
        notification.error('自动保存失败: ' + error.message)
      }
    }
  )
  const [displayContent, setDisplayContent] = useState('')
  const [isManualSaving, setIsManualSaving] = useState(false)
  
  // 移除图片映射管理，现在使用直接URL
  
  // 优化防抖延迟，减少用户输入延迟感知
  const debouncedDisplayContent = useDebounce(displayContent, 100)

  // 手动保存功能
  const handleManualSave = useCallback(async () => {
    if (!authState.isAuthenticated || isManualSaving) {
      return
    }

    try {
      setIsManualSaving(true)
      
      // 调用自动保存的手动保存方法
      await autoSave.save()
      
      notification.success('文档已手动保存', {
        details: 'Cmd+S 快捷键保存成功'
      })
    } catch (error) {
      console.error('手动保存失败:', error)
      notification.error('手动保存失败', {
        details: error instanceof Error ? error.message : '请重试'
      })
    } finally {
      setIsManualSaving(false)
    }
  }, [authState.isAuthenticated, isManualSaving, autoSave])

  // 键盘快捷键监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+S (Mac) 或 Ctrl+S (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault() // 阻止浏览器默认保存行为
        handleManualSave()
      }
    }

    // 添加全局键盘监听
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleManualSave])
  
  // 移除图片还原函数，现在直接使用URL，无需还原
  
  // 移除base64转换函数，现在直接使用URL
  
  // 处理用户输入变化
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDisplayContent = e.target.value
    setDisplayContent(newDisplayContent)
    
    // 直接同步到实际内容（普通输入不做转换）
    dispatch({ type: 'UPDATE_EDITOR_CONTENT', payload: newDisplayContent })
  }, [dispatch])
  
  // 移除防抖更新，改为直接同步（在handleContentChange中）
  
  // 使用显示内容进行预览，确保包含占位符
  const debouncedPreviewContent = useDebounce(displayContent, 300)
  
  // 分离模板分析和预览渲染，优化性能
  const templateAnalysis = useMemo(() => {
    if (!debouncedPreviewContent) return null
    try {
      return templateEngine.analyzeContent(debouncedPreviewContent)
    } catch (error) {
      console.error('Template analysis error:', error)
      return null
    }
  }, [debouncedPreviewContent])
  
  // 自动模板推荐（仅在分析结果变化时执行）
  useEffect(() => {
    if (templateAnalysis && state.templates.current) {
      const { suggestedTemplate } = templateAnalysis
      if (state.templates.current.id !== suggestedTemplate) {
        const recommendedTemplate = templates.find(t => t.id === suggestedTemplate)
        if (recommendedTemplate && !state.templates.variables.title) {
          dispatch({ type: 'SELECT_TEMPLATE', payload: suggestedTemplate })
        }
      }
    }
  }, [templateAnalysis, state.templates.current, state.templates.variables.title, dispatch])
  
  // 预览渲染（仅在相关依赖变化时执行）
  const previewData = useMemo(() => {
    if (!state.templates.current || !debouncedPreviewContent) {
      return null
    }
    
    try {
      // 合并模板变量和品牌资源
      const combinedVariables = {
        ...state.templates.variables,
        brandColors: state.assets.fixedAssets.brandColors,
        logo: state.assets.fixedAssets.logo,
        qrcode: state.assets.fixedAssets.qrcode,
        divider: state.assets.fixedAssets.watermark
      }
      
      // 直接使用内容渲染，无需还原图片
      return templateEngine.renderTemplate(
        state.templates.current.id,
        debouncedPreviewContent,
        combinedVariables
      )
    } catch (error) {
      console.error('Preview rendering error:', error)
      return null
    }
  }, [
    state.templates.current,
    debouncedPreviewContent,
    state.templates.variables,
    state.assets.fixedAssets
  ])
  
  // 更新预览HTML（仅在需要时）
  useEffect(() => {
    if (previewData?.html) {
      dispatch({ type: 'SET_PREVIEW_HTML', payload: previewData.html })
    }
  }, [previewData, dispatch])
  
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
    
    // 直接更新实际内容
    dispatch({ type: 'UPDATE_EDITOR_CONTENT', payload: newDisplayContent })
    
    // 重新聚焦并设置光标位置
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + newText.length, start + newText.length)
    }, 10)
  }, [displayContent, dispatch])

  // 同步全局状态到显示内容（确保状态一致）
  useEffect(() => {
    if (state.editor.content !== displayContent) {
      console.log('🔄 同步编辑器内容:', { 
        global: state.editor.content.substring(0, 50) + '...', 
        display: displayContent.substring(0, 50) + '...' 
      })
      setDisplayContent(state.editor.content)
    }
  }, [state.editor.content])

  // 图片压缩函数
  const compressImage = useCallback((file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // 计算新尺寸
        let { width, height } = img
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        canvas.width = width
        canvas.height = height
        
        // 绘制并压缩
        ctx?.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob((blob) => {
          if (blob) {
            // 创建新的File对象
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            resolve(compressedFile)
          } else {
            resolve(file) // 压缩失败时返回原文件
          }
        }, 'image/jpeg', quality)
      }
      
      img.onerror = () => resolve(file) // 加载失败时返回原文件
      img.src = URL.createObjectURL(file)
    })
  }, [])
  
  // 将文件转换为Base64
  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => {
        console.error('FileReader error:', error)
        reject(new Error('文件读取失败'))
      }
      reader.readAsDataURL(file)
    })
  }, [])

  // 处理图片文件上传
  const handleImageUpload = useCallback(async (file: File) => {
    try {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        notification.warning('请选择图片文件', {
          details: '支持的格式: PNG, JPG, JPEG, GIF, WebP'
        })
        return
      }
      
      // 验证用户是否已登录
      if (!authState.isAuthenticated) {
        notification.error('请先登录后再上传图片')
        return
      }
      
      setIsUploading(true)
      
      // 上传图片到服务器
      console.log(`📤 开始上传图片: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`)
      const imageInfo = await uploadImage(file)
      
      // 生成完整的访问URL
      const fullImageUrl = getImageUrl(imageInfo.url)
      
      // 插入图片Markdown语法
      const textarea = textareaRef.current
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const fileName = imageInfo.originalName.replace(/\.[^/.]+$/, "") // 去掉扩展名作为alt文本
        const sizeInfo = ` (${(imageInfo.size / 1024).toFixed(1)}KB)`
        
        // 直接使用服务器返回的URL，无需占位符机制
        const imageMarkdown = `![${fileName}${sizeInfo}](${fullImageUrl})`
        
        // 更新显示内容和实际内容
        const newContent = 
          displayContent.substring(0, start) +
          imageMarkdown +
          displayContent.substring(end)
        setDisplayContent(newContent)
        dispatch({ type: 'UPDATE_EDITOR_CONTENT', payload: newContent })
        
        // 重新聚焦
        setTimeout(() => {
          textarea.focus()
          textarea.setSelectionRange(start + imageMarkdown.length, start + imageMarkdown.length)
        }, 10)
        
        // 显示成功提示
        console.log(`✅ 图片上传成功: ${file.name} -> ${imageInfo.filename}`)
        notification.success('图片上传成功', {
          details: `已保存为: ${imageInfo.filename}`
        })
      }
    } catch (error) {
      console.error('图片上传失败:', error)
      
      // 提供更详细的错误信息
      let errorTitle = '图片上传失败'
      let errorDetails = '请重试或选择其他图片'
      
      if (error instanceof Error) {
        if (error.message.includes('认证失败')) {
          errorTitle = '认证失败'
          errorDetails = '请重新登录后再试'
        } else if (error.message.includes('网络')) {
          errorTitle = '网络错误'
          errorDetails = '请检查网络连接后重试'
        } else if (error.message.includes('文件类型')) {
          errorTitle = '文件类型不支持'
          errorDetails = '请选择 JPG、PNG、GIF 或 WebP 格式的图片'
        } else {
          errorTitle = '上传失败'
          errorDetails = error.message
        }
      }
      
      notification.error(errorTitle, {
        details: errorDetails,
        duration: 8000
      })
    } finally {
      setIsUploading(false)
    }
  }, [displayContent, authState.isAuthenticated, dispatch])

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
  
  // 清理损坏的base64内容
  const cleanupBrokenContent = useCallback(() => {
    // 使用更简单的字符串操作来清理base64内容
    let cleanContent = state.editor.content
    
    // 查找并替换长base64图片
    const base64ImageRegex = new RegExp('!\\[([^\\]]*)\\]\\(data:image\\/[^;]+;base64,[A-Za-z0-9+/=]{100,}\\)', 'g')
    cleanContent = cleanContent.replace(base64ImageRegex, '![图片已清理](🖼️ 请重新上传)')
    
    dispatch({ type: 'UPDATE_EDITOR_CONTENT', payload: cleanContent })
    notification.info('已清理损坏的图片内容', {
      details: '请重新上传您的图片'
    })
  }, [state.editor.content, dispatch])
  
  // 重新设计的工具栏组件 - 按使用频率分组
  const ToolbarComponent = useMemo(() => (
    <div className="editor-toolbar">
        {/* 高频格式工具 */}
        <div className="toolbar-group primary">
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
        </div>
        
        <div className="toolbar-divider"></div>
        
        {/* 结构工具 */}
        <div className="toolbar-group secondary">
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
        
        <div className="toolbar-divider"></div>
        
        {/* 操作工具 */}
        <div className="toolbar-group actions">
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
            className={`toolbar-btn image-upload ${isUploading ? 'uploading' : ''}`}
            disabled={isUploading}
          >
            {isUploading ? '⏳' : '🖼️'}
          </button>
          
          {/* 手动保存按钮 */}
          {authState.isAuthenticated && (
            <button 
              type="button"
              onClick={handleManualSave}
              title="手动保存 (Cmd+S / Ctrl+S)"
              className={`toolbar-btn save-btn ${isManualSaving ? 'saving' : ''}`}
              disabled={isManualSaving}
            >
              {isManualSaving ? '⏳' : '💾'}
            </button>
          )}
        </div>
        
        {/* 调试工具 - 样式弱化显示 */}
        <div className="toolbar-divider"></div>
        <div className="toolbar-group debug">
          <button 
            type="button"
            onClick={cleanupBrokenContent}
            title="清理损坏的图片内容 (调试工具)"
            className="toolbar-btn debug-btn"
          >
            🧹
          </button>
        </div>
    </div>
  ), [cleanupBrokenContent, authState.isAuthenticated, handleManualSave, isManualSaving])
  
  // 优化的编辑器状态栏组件 - 保存状态主显示区
  const StatusComponent = useMemo(() => (
    <div className="editor-status">
      <div className="status-left">
        <span className="status-item word-count">
          📝 {state.editor.content.length} 字
        </span>
      </div>
      
      <div className="status-center">
        {/* 统一的保存状态显示 */}
        {authState.isAuthenticated ? (
          <span className={`save-status-main ${isManualSaving || autoSave.isSaving ? 'saving' : ''} ${autoSave.hasUnsavedChanges ? 'unsaved' : 'saved'}`}>
            {isManualSaving ? (
              <>
                <span className="status-icon saving">⏳</span>
                <span className="status-text">手动保存中...</span>
              </>
            ) : autoSave.isSaving ? (
              <>
                <span className="status-icon saving">💾</span>
                <span className="status-text">自动保存中...</span>
              </>
            ) : autoSave.hasUnsavedChanges ? (
              <>
                <span className="status-icon unsaved">⚠️</span>
                <span className="status-text">有未保存更改</span>
                <span className="status-hint">Cmd+S 保存</span>
              </>
            ) : autoSave.lastSaved ? (
              <>
                <span className="status-icon saved">✅</span>
                <span className="status-text">已保存</span>
                <span className="status-time">{new Date(autoSave.lastSaved).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
              </>
            ) : (
              <>
                <span className="status-icon ready">📝</span>
                <span className="status-text">就绪编辑</span>
                <span className="status-hint">Cmd+S 保存</span>
              </>
            )}
          </span>
        ) : (
          <span className="save-status-main guest">
            <span className="status-icon">🔐</span>
            <span className="status-text">游客模式 - 无法保存</span>
          </span>
        )}
      </div>
      
      <div className="status-right">
        {/* 当前文档信息 */}
        {authState.isAuthenticated && autoSave.currentDocumentId && (
          <span className="status-item document-info" title="当前文档">
            📄 {autoSave.currentDocumentId.slice(0, 8)}...
          </span>
        )}
      </div>
    </div>
  ), [
    state.editor.content.length, 
    state.editor.isChanged,
    authState.isAuthenticated,
    isManualSaving,
    autoSave.isSaving,
    autoSave.hasUnsavedChanges,
    autoSave.lastSaved,
    autoSave.currentDocumentId
  ])
  
  return (
    <div className="editor-container">
      {ToolbarComponent}
      
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
              <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.8 }}>
                正在压缩和优化，请稍候
              </div>
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
        {StatusComponent}
      </div>
    </div>
  )
})