// Markdown编辑器组件 - 高性能优化版本
import React, { useCallback, useEffect, useRef, useState, useMemo, memo } from 'react'
import { useApp } from '../utils/app-context'
import { useAuth } from '../utils/auth-context'
import { useAutoSave } from '../hooks/useAutoSave'
import { useSpellCheck } from '../hooks/useSpellCheck'
import { TemplateEngine } from '../utils/template-engine'
import { templates } from '../templates'
import { notification } from '../utils/notification'
import { uploadImage, getImageUrl } from '../utils/image-api'
import { SpellChecker } from './SpellChecker'
import { OutlinePanel } from './OutlinePanel'
import { OutlineNode } from '../utils/outline-parser'
import { countWords } from '../utils/word-counter'
import { smartPasteHandler, SmartPasteHandler } from '../utils/paste-handler'

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
interface EditorProps {
  currentDocumentId?: string | null
}

export const Editor = memo(function Editor({ currentDocumentId }: EditorProps) {
  const { state, dispatch } = useApp()
  const { state: authState } = useAuth()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [spellCheckEnabled, setSpellCheckEnabled] = useState(() => {
    // 从 localStorage 读取用户偏好
    const saved = localStorage.getItem('spell_check_enabled')
    return saved !== null ? saved === 'true' : false  // 默认关闭
  })
  
  // 大纲面板状态
  const [outlineCollapsed, setOutlineCollapsed] = useState(() => {
    const saved = localStorage.getItem('outline_collapsed')
    return saved !== null ? saved === 'true' : false  // 默认展开
  })
  const [spellListExpanded, setSpellListExpanded] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)

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
        // 如果是新建文档，第一次保存后需要通知父组件更新URL
        if (!currentDocumentId && document.id) {
          console.log('🆕 新建文档首次保存，文档ID:', document.id)
          // 这里可以通过回调通知父组件更新URL，但目前先保持简单
        }
        // 可以显示保存成功通知
        notification.success('文档已自动保存')
      },
      onError: (error) => {
        console.error('自动保存失败:', error)
        notification.error('自动保存失败: ' + error.message)
      }
    }
  )
  
  // 当文档ID变化时，更新自动保存的当前文档ID
  useEffect(() => {
    if (currentDocumentId) {
      console.log('🔗 设置当前文档ID:', currentDocumentId)
      autoSave.setCurrentDocumentId(currentDocumentId)
    } else {
      console.log('🆕 重置自动保存状态 (新建文档)')
      autoSave.reset()
      // 重置用户模板选择状态，允许新文档自动推荐模板
      dispatch({ type: 'SET_UI_STATE', payload: { userHasSelectedTemplate: false } })
    }
  }, [currentDocumentId, dispatch]) // 移除autoSave依赖，避免循环
  const [displayContent, setDisplayContent] = useState('')
  const [isManualSaving, setIsManualSaving] = useState(false)
  
  // 移除图片映射管理，现在使用直接URL
  
  // 优化防抖延迟，减少用户输入延迟感知
  const debouncedDisplayContent = useDebounce(displayContent, 100)
  
  // 错别字检查（独立防抖，2秒延迟，不影响编辑）
  const spellCheck = useSpellCheck(displayContent, {
    enabled: spellCheckEnabled,
    debounceMs: 2000,  // 2秒延迟，用户停止输入后才检查
    maxResults: 50
  })
  
  // 保存错别字检查偏好
  useEffect(() => {
    localStorage.setItem('spell_check_enabled', String(spellCheckEnabled))
  }, [spellCheckEnabled])
  
  // 保存大纲面板偏好
  useEffect(() => {
    localStorage.setItem('outline_collapsed', String(outlineCollapsed))
  }, [outlineCollapsed])
  
  // 监听光标位置变化
  const handleSelectionChange = useCallback(() => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart)
    }
  }, [])
  
  // 处理错别字点击（跳转到错误位置）
  const handleSpellErrorClick = useCallback((error: any) => {
    if (textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(error.position, error.position + error.length)
      textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [])
  
  // 处理大纲节点点击（跳转到对应标题）
  const handleOutlineNodeClick = useCallback((node: OutlineNode) => {
    if (textareaRef.current) {
      textareaRef.current.focus()
      // 跳转到标题位置
      textareaRef.current.setSelectionRange(node.position, node.position)
      // 滚动到可视区域
      textareaRef.current.scrollTop = node.line * 20 // 粗略估算
      setCursorPosition(node.position)
    }
  }, [])

  // 手动保存功能
  const handleManualSave = useCallback(async () => {
    if (!authState.isAuthenticated || isManualSaving) {
      return
    }

    try {
      setIsManualSaving(true)
      
      // 使用最新的displayContent直接保存，不依赖全局状态同步
      console.log('手动保存最新内容:', { 
        content: displayContent.substring(0, 50) + '...',
        title: state.templates.variables.title || '未命名文档'
      })
      
      // 使用新的saveWithContent方法保存即时内容
      await autoSave.saveWithContent(displayContent)
      
      // 保存成功后同步全局状态
      if (displayContent !== state.editor.content) {
        dispatch({ type: 'UPDATE_EDITOR_CONTENT', payload: displayContent })
      }
      
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
  }, [authState.isAuthenticated, isManualSaving, autoSave, displayContent, state.templates.variables.title, state.editor.content, dispatch])

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
  
  // 监听编辑器滚动和光标位置，同步到预览区
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    let syncTimeoutId: number | null = null
    
    // 计算滚动百分比和光标位置
    const updateScrollPosition = () => {
      const { scrollTop, scrollHeight, clientHeight, selectionStart, value } = textarea
      
      // 滚动百分比
      const maxScroll = scrollHeight - clientHeight
      const scrollPercentage = maxScroll > 0 ? scrollTop / maxScroll : 0
      
      // 光标所在行号
      const beforeCursor = value.substring(0, selectionStart)
      const currentLine = beforeCursor.split('\n').length
      const totalLines = Math.max(value.split('\n').length, 1)
      const cursorLinePercentage = (currentLine - 1) / Math.max(totalLines - 1, 1)
      
      // 使用节流更新，避免频繁dispatch
      if (syncTimeoutId) return
      
      syncTimeoutId = setTimeout(() => {
        dispatch({
          type: 'UPDATE_EDITOR_SCROLL',
          payload: {
            scrollPercentage,
            cursorLinePercentage,
            totalLines
          }
        })
        syncTimeoutId = null
      }, 50) // 50ms 节流
    }
    
    // 监听滚动事件
    textarea.addEventListener('scroll', updateScrollPosition)
    // 监听选择变化（光标移动）
    textarea.addEventListener('select', updateScrollPosition)
    textarea.addEventListener('click', updateScrollPosition)
    textarea.addEventListener('keyup', updateScrollPosition)
    
    // 初始化
    updateScrollPosition()
    
    return () => {
      textarea.removeEventListener('scroll', updateScrollPosition)
      textarea.removeEventListener('select', updateScrollPosition)
      textarea.removeEventListener('click', updateScrollPosition)
      textarea.removeEventListener('keyup', updateScrollPosition)
      if (syncTimeoutId) clearTimeout(syncTimeoutId)
    }
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
  
  // 自动模板推荐（仅在初次加载且用户未主动选择时）
  useEffect(() => {
    // 只有在以下条件都满足时才自动推荐：
    // 1. 有分析结果
    // 2. 有当前模板
    // 3. 用户没有主动选择过模板
    // 4. 内容较少（初始状态）
    if (templateAnalysis && 
        state.templates.current && 
        !state.ui.userHasSelectedTemplate && 
        debouncedPreviewContent.length < 200) {
      
      const { suggestedTemplate } = templateAnalysis
      if (state.templates.current.id !== suggestedTemplate) {
        const recommendedTemplate = templates.find(t => t.id === suggestedTemplate)
        if (recommendedTemplate) {
          console.log('🤖 自动推荐模板:', suggestedTemplate)
          dispatch({ type: 'SELECT_TEMPLATE', payload: suggestedTemplate })
        }
      }
    }
  }, [templateAnalysis, state.templates.current, state.ui.userHasSelectedTemplate, debouncedPreviewContent.length, dispatch])
  
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

  // 智能粘贴处理 - 支持飞书、Notion、Word等
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items)
    const imageItem = items.find(item => item.type.startsWith('image/'))
    
    // 优先处理图片
    if (imageItem) {
      e.preventDefault()
      const file = imageItem.getAsFile()
      if (file) {
        handleImageUpload(file)
      }
      return
    }
    
    // 处理HTML内容（飞书、Notion、Word等）
    const html = e.clipboardData.getData('text/html')
    const plainText = e.clipboardData.getData('text/plain')
    
    // 检测是否应该使用智能粘贴
    if (SmartPasteHandler.shouldUseSmartPaste(html)) {
      e.preventDefault()
      
      try {
        // 显示处理中提示
        notification.info('🔄 正在智能识别格式...')
        
        // 使用智能粘贴处理器转换
        const result = await smartPasteHandler.convert(html, plainText)
        
        // 在光标位置插入转换后的Markdown
        const textarea = textareaRef.current
        if (textarea) {
          const start = textarea.selectionStart
          const end = textarea.selectionEnd
          const currentContent = state.editor.content
          
          // 插入新内容
          const newContent = 
            currentContent.substring(0, start) +
            result.markdown +
            currentContent.substring(end)
          
          // 更新编辑器内容
          dispatch({
            type: 'UPDATE_EDITOR_CONTENT',
            payload: newContent
          })
          
          // 显示成功通知
          const sourceText = result.source !== '未知来源' ? `从${result.source}` : ''
          notification.success(
            `✅ ${sourceText}导入成功！${result.imageCount > 0 ? `包含 ${result.imageCount} 张图片` : ''}`
          )
          
          console.log('[智能粘贴]', result)
          
          // 恢复光标位置
          setTimeout(() => {
            const newPosition = start + result.markdown.length
            textarea.setSelectionRange(newPosition, newPosition)
            textarea.focus()
          }, 0)
        }
      } catch (error) {
        console.error('[智能粘贴] 转换失败:', error)
        notification.error('格式转换失败，已插入纯文本')
        
        // 失败时插入纯文本
        const textarea = textareaRef.current
        if (textarea) {
          const start = textarea.selectionStart
          const end = textarea.selectionEnd
          const currentContent = state.editor.content
          const newContent = 
            currentContent.substring(0, start) +
            plainText +
            currentContent.substring(end)
          
          dispatch({
            type: 'UPDATE_EDITOR_CONTENT',
            payload: newContent
          })
        }
      }
    }
    // 纯文本直接使用浏览器默认行为
  }, [handleImageUpload, state.editor.content, dispatch, textareaRef])

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
    </div>
  ), [authState.isAuthenticated, handleManualSave, isManualSaving])
  
  // 优化的编辑器状态栏组件 - 保存状态主显示区
  const StatusComponent = useMemo(() => (
    <div className="editor-status">
      <div className="status-left">
        {/* 飞书模式：文档状态指示器 */}
        <span 
          className={`status-item document-status ${state.editor.documentStatus.toLowerCase()}`}
          title={
            state.editor.documentStatus === 'TEMP' ? '临时状态：内容达到30字后自动保存' :
            state.editor.documentStatus === 'DRAFT' ? '草稿状态：内容达到30字后自动转为正式文档' :
            '正式文档：已自动保存'
          }
        >
          {state.editor.documentStatus === 'TEMP' && '✏️ 编辑中'}
          {state.editor.documentStatus === 'DRAFT' && '📝 草稿'}
          {state.editor.documentStatus === 'NORMAL' && '✓ 已保存'}
        </span>

        <span className="status-item word-count">
          📝 {countWords(state.editor.content)} 字
        </span>
        
        {/* 错别字检查状态 */}
        <span 
          className={`status-item spell-check-status ${spellCheckEnabled ? 'enabled' : 'disabled'}`}
          onClick={() => setSpellCheckEnabled(!spellCheckEnabled)}
          title={spellCheckEnabled ? '点击关闭错别字检查' : '点击开启错别字检查'}
        >
          {spellCheckEnabled ? (
            spellCheck.isChecking ? (
              <>⏳ 检查中...</>
            ) : spellCheck.errors.length > 0 ? (
              <>⚠️ {spellCheck.errors.length} 处错别字</>
            ) : (
              <>✓ 无错别字</>
            )
          ) : (
            <>🔍 错别字检查</>
          )}
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
        
        {/* 错别字列表按钮 */}
        {spellCheckEnabled && spellCheck.errors.length > 0 && (
          <button
            className="status-btn spell-check-list-btn"
            onClick={() => setSpellListExpanded(!spellListExpanded)}
            title="查看错别字列表"
          >
            {spellListExpanded ? '收起列表' : '查看列表'}
          </button>
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
    autoSave.currentDocumentId,
    spellCheckEnabled,
    spellCheck.isChecking,
    spellCheck.errors.length,
    spellListExpanded
  ])
  
  // 更新文档信息
  const updateDocumentInfo = useCallback((key: string, value: string) => {
    dispatch({ 
      type: 'UPDATE_TEMPLATE_VARIABLES', 
      payload: { [key]: value } 
    })
  }, [dispatch])
  
  // 获取默认日期
  const getDefaultDate = () => {
    return new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    })
  }
  
  return (
    <div className="editor-container">
      {ToolbarComponent}
      
      <div className="editor-main-content">
        {/* 大纲面板 */}
        <OutlinePanel
          content={displayContent}
          cursorPosition={cursorPosition}
          onNodeClick={handleOutlineNodeClick}
          isCollapsed={outlineCollapsed}
          onToggleCollapse={() => setOutlineCollapsed(!outlineCollapsed)}
        />
        
        {/* 编辑器 */}
        <div 
          className={`editor-wrapper ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
        {/* 文档信息栏 */}
        <div className="document-info-bar">
          <div className="doc-info-row">
            <label className="doc-info-label">标题</label>
            <input
              type="text"
              className="doc-info-input title-input"
              value={state.templates.variables.title || ''}
              onChange={(e) => updateDocumentInfo('title', e.target.value)}
              placeholder="未命名文档"
            />
          </div>
          <div className="doc-info-row compact">
            <div className="doc-info-field">
              <label className="doc-info-label">作者</label>
              <input
                type="text"
                className="doc-info-input"
                value={state.templates.variables.author || ''}
                onChange={(e) => updateDocumentInfo('author', e.target.value)}
                placeholder="输入作者名（可选）"
              />
            </div>
            <div className="doc-info-field">
              <label className="doc-info-label">日期</label>
              <input
                type="text"
                className="doc-info-input"
                value={state.templates.variables.date || getDefaultDate()}
                onChange={(e) => updateDocumentInfo('date', e.target.value)}
                placeholder="2025年8月30日"
              />
            </div>
          </div>
          
          {/* 精简模板指示器（预览关闭时显示） */}
          {!state.ui.showPreview && (
            <div className="template-indicator-compact">
              <span className="indicator-label">当前模板：</span>
              <span className="indicator-value">{state.templates.current?.name || '简约文档'}</span>
              <button 
                className="indicator-action"
                onClick={() => dispatch({ type: 'SET_UI_STATE', payload: { showPreview: true } })}
                type="button"
                title="打开预览区切换模板"
              >
                切换
              </button>
            </div>
          )}
        </div>
        
        <textarea
          ref={textareaRef}
          value={displayContent}
          onChange={handleContentChange}
          onPaste={handlePaste}
          onSelect={handleSelectionChange}
          onKeyUp={handleSelectionChange}
          onClick={handleSelectionChange}
          placeholder="# 在这里开始写作...

✨ 智能粘贴：支持从飞书、Notion、Word直接复制
📸 图片上传：支持拖拽或粘贴截图
💾 自动保存：内容达到30字后自动保存"
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
        
        {/* 错别字列表（展开时显示） */}
        {spellCheckEnabled && spellListExpanded && spellCheck.errors.length > 0 && (
          <div className="spell-errors-list-bottom">
            <div className="spell-errors-list-header">
              <span>错别字列表 ({spellCheck.errors.length} 处)</span>
              <button
                className="close-btn"
                onClick={() => setSpellListExpanded(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="spell-errors-items">
              {spellCheck.errors.map((error, index) => (
                <div
                  key={`${error.position}-${index}`}
                  className="spell-error-item"
                  onClick={() => handleSpellErrorClick(error)}
                  title="点击定位"
                >
                  <div className="spell-error-item-word">
                    <span className="wrong">{error.word}</span>
                    <span className="arrow">→</span>
                    <span className="correct">{error.correct}</span>
                  </div>
                  {error.context && (
                    <div className="spell-error-item-context">
                      {error.context}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
})