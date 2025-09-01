// Markdown编辑器组件 - 高性能优化版本
import React, { useCallback, useEffect, useRef, useState, useMemo, memo } from 'react'
import { useApp } from '../utils/app-context'
import { useAuth } from '../utils/auth-context'
import { useAutoSave } from '../hooks/useAutoSave'
import { TemplateEngine } from '../utils/template-engine'
import { templates } from '../templates'
import { notification } from '../utils/notification'

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

// 高性能图片管理器
class ImageManager {
  private cache = new Map<string, string>()
  private displayCache = new Map<string, string>()
  private idCounter = 0
  
  // 缓存base64图片并返回占位符
  cacheImage(base64Data: string, alt: string = ''): string {
    // 检查是否已缓存
    const existing = Array.from(this.cache.entries()).find(([, value]) => value === base64Data)
    if (existing) {
      return `![${alt}](🖼️ ${existing[0]})`
    }
    
    const key = `img_${this.idCounter++}`
    this.cache.set(key, base64Data)
    const placeholder = `![${alt}](🖼️ ${key})`
    this.displayCache.set(placeholder, base64Data)
    return placeholder
  }
  
  // 还原占位符为实际图片数据
  restoreImage(placeholder: string): string {
    const cached = this.displayCache.get(placeholder)
    return cached || placeholder
  }
  
  // 批量转换显示内容（仅在需要时执行regex）
  convertToDisplay(content: string): string {
    if (!content.includes('data:image/')) {
      return content
    }
    
    return content.replace(
      /!\[([^\]]*)\]\(data:image\/[^;]+;base64,[A-Za-z0-9+/=]+\)/g,
      (match, alt) => this.cacheImage(match, alt)
    )
  }
  
  // 批量还原实际内容
  convertToActual(displayContent: string): string {
    if (!displayContent.includes('🖼️')) {
      return displayContent
    }
    
    return displayContent.replace(
      /!\[([^\]]*)\]\(🖼️ (img_\d+)\)/g,
      (match, alt, key) => {
        const cached = this.cache.get(key)
        return cached || match
      }
    )
  }
  
  // 清理未使用的缓存
  cleanup(currentContent: string): void {
    const usedKeys = new Set<string>()
    const matches = currentContent.matchAll(/🖼️ (img_\d+)/g)
    for (const match of matches) {
      usedKeys.add(match[1])
    }
    
    for (const key of this.cache.keys()) {
      if (!usedKeys.has(key)) {
        this.cache.delete(key)
        // 从显示缓存中移除相关条目
        for (const [placeholder, data] of this.displayCache.entries()) {
          if (data === this.cache.get(key)) {
            this.displayCache.delete(placeholder)
          }
        }
      }
    }
  }
}

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
  
  // 简化的图片映射管理
  const imageMap = useRef(new Map<string, string>())
  const imageIdCounter = useRef(0)
  
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
  
  // 将占位符还原为实际图片数据（供预览使用）
  const restoreImagesForPreview = useCallback((content: string) => {
    if (!content || !content.includes('🖼️')) {
      return content
    }
    
    console.log('🔍 预览还原调试:', {
      content,
      mapSize: imageMap.current.size,
      mapKeys: Array.from(imageMap.current.keys())
    })
    
    // 还原所有图片占位符
    const restored = content.replace(
      /!\[([^\]]*)\]\(🖼️ (img_\d+)\)/g,
      (match, alt, imageId) => {
        const actualImage = imageMap.current.get(imageId)
        console.log(`🔧 还原图片: ${imageId} -> ${actualImage ? '找到' : '未找到'}`)
        return actualImage || `![${alt}](图片丢失: ${imageId})`
      }
    )
    
    console.log('✅ 还原结果:', restored.substring(0, 200) + '...')
    return restored
  }, [])
  
  // 初始化时转换显示内容
  const convertToDisplayContent = useCallback((content: string) => {
    if (!content || !content.includes('data:image/')) {
      return content
    }
    
    // 将长base64图片转换为占位符
    return content.replace(
      /!\[([^\]]*)\]\(data:image\/[^;]+;base64,[A-Za-z0-9+/=]{200,}\)/g,
      (match, alt) => {
        // 为已存在的图片创建映射
        const imageId = `img_${imageIdCounter.current++}`
        imageMap.current.set(imageId, match)
        return `![${alt}](🖼️ ${imageId})`
      }
    )
  }, [])
  
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
      
      // 先将占位符还原为实际图片数据
      const contentWithImages = restoreImagesForPreview(debouncedPreviewContent)
      
      return templateEngine.renderTemplate(
        state.templates.current.id,
        contentWithImages,
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
    state.assets.fixedAssets,
    restoreImagesForPreview
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

  // 初始化时转换显示内容（仅在加载时执行一次）
  useEffect(() => {
    if (!displayContent && state.editor.content) {
      const initialDisplayContent = convertToDisplayContent(state.editor.content)
      setDisplayContent(initialDisplayContent)
    }
  }, [state.editor.content, displayContent, convertToDisplayContent])

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
      
      // 验证文件大小并进行智能压缩
      const maxSize = 2 * 1024 * 1024 // 2MB
      let processedFile = file
      
      setIsUploading(true)
      
      if (file.size > maxSize) {
        // 尝试压缩图片
        console.log(`图片过大 (${(file.size / 1024 / 1024).toFixed(2)}MB)，正在压缩...`)
        processedFile = await compressImage(file)
        
        // 如果压缩后仍然过大，使用更高压缩率
        if (processedFile.size > maxSize) {
          processedFile = await compressImage(file, 800, 0.6)
        }
        
        // 最终检查
        if (processedFile.size > maxSize) {
          notification.error('图片文件仍然过大', {
            title: `压缩后仍有 ${(processedFile.size / 1024 / 1024).toFixed(2)}MB`,
            details: '建议:选择更小的图片或使用图片压缩工具先进行压缩',
            duration: 6000
          })
          return
        }
        
        console.log(`压缩完成: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(processedFile.size / 1024 / 1024).toFixed(2)}MB`)
        notification.success('图片压缩完成', {
          details: `${(file.size / 1024 / 1024).toFixed(2)}MB → ${(processedFile.size / 1024 / 1024).toFixed(2)}MB`
        })
      }

      // 转换为Base64格式
      const base64Url = await fileToBase64(processedFile)
      
      // 插入图片Markdown语法
      const textarea = textareaRef.current
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const fileName = processedFile.name.replace(/\.[^/.]+$/, "") // 去掉扩展名作为alt文本
        const sizeInfo = processedFile !== file ? ` (已压缩: ${(processedFile.size / 1024).toFixed(0)}KB)` : ''
        
        // 生成图片ID用于占位
        const imageId = `img_${imageIdCounter.current++}`
        
        // 存储实际的base64数据到本地映射和全局状态
        const actualImageMarkdown = `![${fileName}${sizeInfo}](${base64Url})`
        imageMap.current.set(imageId, actualImageMarkdown)
        
        // 同时更新全局状态中的图片映射
        dispatch({ 
          type: 'UPDATE_IMAGE_MAP', 
          payload: { id: imageId, data: actualImageMarkdown }
        })
        
        // 在编辑器中显示简洁的占位符
        const placeholderMarkdown = `![${fileName}${sizeInfo}](🖼️ ${imageId})`
        
        // 更新显示内容使用占位符，实际内容存储完整数据
        const newDisplayContent = 
          displayContent.substring(0, start) +
          placeholderMarkdown +
          displayContent.substring(end)
        setDisplayContent(newDisplayContent)
        
        // 实际内容也暂时使用占位符，预览时会还原
        dispatch({ type: 'UPDATE_EDITOR_CONTENT', payload: newDisplayContent })
        
        // 重新聚焦
        setTimeout(() => {
          textarea.focus()
          textarea.setSelectionRange(start + placeholderMarkdown.length, start + placeholderMarkdown.length)
        }, 10)
        
        // 显示成功提示
        notification.success('图片上传成功', {
          details: processedFile !== file ? '已自动压缩优化' : '已插入到编辑器'
        })
      }
    } catch (error) {
      console.error('图片上传失败:', error)
      
      // 提供更详细的错误信息
      let errorTitle = '图片上传失败'
      let errorDetails = '请重试或选择其他图片'
      
      if (error instanceof Error) {
        if (error.message.includes('文件读取失败')) {
          errorTitle = '文件读取失败'
          errorDetails = '请检查文件是否损坏或尝试其他图片文件'
        } else if (error.message.includes('网络')) {
          errorTitle = '网络错误'
          errorDetails = '请检查网络连接后重试'
        } else {
          errorTitle = '处理失败'
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
  }, [displayContent, fileToBase64, compressImage])

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