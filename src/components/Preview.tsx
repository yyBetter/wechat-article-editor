// 预览组件 - 高性能优化版本
import React, { useMemo, useRef, useEffect, memo, useCallback, useState } from 'react'
import { useApp } from '../utils/app-context'
import { TemplateEngine } from '../utils/template-engine'
import { templates } from '../templates'
import { getLocalImageData } from '../utils/local-image-api'
import { PreviewToolbar } from './PreviewToolbar'

const templateEngine = new TemplateEngine(templates)

// 使用 React.memo 优化组件渲染性能
export const Preview = memo(function Preview() {
  const { state, dispatch } = useApp()
  const previewRef = useRef<HTMLDivElement>(null)
  const previewFrameRef = useRef<HTMLDivElement>(null)
  const [processedContent, setProcessedContent] = useState('')
  const [localImageCache, setLocalImageCache] = useState<Map<string, string>>(new Map())
  const [cursorIndicatorStyle, setCursorIndicatorStyle] = useState<React.CSSProperties>({})
  
  // 处理本地图片的异步函数
  useEffect(() => {
    const processLocalImages = async () => {
      if (!state.editor.content) {
        setProcessedContent('')
        return
      }
      
      let content = state.editor.content
      
      // 先处理图片占位符
      if (content.includes('🖼️')) {
        const { imageMap } = state.assets
        content = content.replace(
          /!\[([^\]]*)\]\(🖼️ (img_\d+)\)/g,
          (match, alt, imageId) => {
            const actualImageData = imageMap[imageId]
            if (actualImageData) {
              return actualImageData
            } else {
              console.warn(`图片映射未找到: ${imageId}`)
              return `![${alt}](图片加载失败: ${imageId})`
            }
          }
        )
      }
      
      // 处理本地图片
      const localImageRegex = /!\[([^\]]*)\]\(\/local-image\/([^)]+)\)/g
      const matches = Array.from(content.matchAll(localImageRegex))
      
      if (matches.length > 0) {
        const cache = new Map(localImageCache)
        
        for (const match of matches) {
          const [fullMatch, alt, imageId] = match
          const imageUrl = `/local-image/${imageId}`
          
          if (!cache.has(imageUrl)) {
            try {
              const imageData = await getLocalImageData(imageUrl)
              if (imageData) {
                cache.set(imageUrl, imageData)
              }
            } catch (error) {
              console.error('加载本地图片失败:', imageUrl, error)
            }
          }
          
          const cachedData = cache.get(imageUrl)
          if (cachedData) {
            content = content.replace(fullMatch, `![${alt}](${cachedData})`)
          }
        }
        
        setLocalImageCache(cache)
      }
      
      setProcessedContent(content)
    }
    
    processLocalImages()
  }, [state.editor.content, state.assets.imageMap])

  // 生成预览HTML
  const previewData = useMemo(() => {
    if (!state.templates.current) {
      return { previewHTML: '', copyHTML: '' }
    }
    
    // 飞书模式：空内容时显示占位提示
    if (!processedContent || processedContent.trim() === '') {
      const placeholderHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 60vh;
          color: #999;
          text-align: center;
          padding: 40px;
        ">
          <div style="font-size: 48px; margin-bottom: 20px;">✍️</div>
          <div style="font-size: 18px; font-weight: 500; margin-bottom: 10px; color: #666;">
            开始你的创作
          </div>
          <div style="font-size: 14px; line-height: 1.6; color: #999;">
            在左侧编辑器输入内容<br/>
            支持 Markdown 语法<br/>
            支持拖拽上传图片
          </div>
        </div>
      `
      return { previewHTML: placeholderHTML, copyHTML: placeholderHTML }
    }
    
    try {
      // 使用已处理的内容（包含本地图片数据）
      const contentWithImages = processedContent
      
      // 合并模板变量和品牌资源
      const combinedVariables = {
        ...state.templates.variables,
        brandColors: state.assets.fixedAssets.brandColors,
        logo: state.assets.fixedAssets.logo,
        qrcode: state.assets.fixedAssets.qrcode,
        divider: state.assets.fixedAssets.watermark
      }
      
      const { html, css } = templateEngine.renderTemplate(
        state.templates.current.id,
        contentWithImages,
        combinedVariables
      )
      
      // 应用品牌色彩
      const brandColors = combinedVariables.brandColors || ['#1e6fff', '#333333', '#666666']
      const primaryColor = brandColors[0]
      const secondaryColor = brandColors[1]
      const accentColor = brandColors[2]
      
      // 调试信息
      console.log('🎨 预览组件品牌色彩调试:', {
        brandColors,
        primaryColor,
        secondaryColor,
        combinedVariables
      })

      // 将CSS样式转换为内联样式，确保复制时保持格式
      const inlineStyledHTML = `
        <div style="
          max-width: 677px;
          margin: 0 auto;
          padding: 20px 16px;
          background: #ffffff;
          font-family: -apple-system-font, 'Helvetica Neue', sans-serif;
          font-size: 17px;
          line-height: 1.6;
          color: #333333;
          word-wrap: break-word;
        ">
          ${html.replace(/<h1[^>]*>/g, `<h1 style="font-size: 24px; font-weight: bold; color: ${secondaryColor || '#000000'}; line-height: 1.3; margin: 20px 0; text-align: center;">`)
               .replace(/<h2[^>]*>/g, `<h2 style="font-size: 20px; font-weight: bold; color: ${primaryColor || '#1e6fff'}; line-height: 1.4; margin: 25px 0 15px 0; border-left: 4px solid ${primaryColor || '#1e6fff'}; padding-left: 12px;">`)
               .replace(/<h3[^>]*>/g, `<h3 style="font-size: 18px; font-weight: bold; color: ${secondaryColor || '#333333'}; line-height: 1.4; margin: 20px 0 10px 0;">`)
               .replace(/<p[^>]*>/g, '<p style="font-size: 17px; line-height: 1.75; color: #333333; margin: 15px 0; text-align: justify; word-wrap: break-word;">')
               .replace(/<strong[^>]*>/g, `<strong style="font-weight: bold; color: ${primaryColor || '#333333'};">`)
               .replace(/<a([^>]*)>/g, `<a$1 style="color: ${primaryColor || '#576b95'}; text-decoration: underline;">`)
               .replace(/<em[^>]*>/g, '<em style="font-style: italic; color: #333333;">')
               .replace(/<ul[^>]*>/g, '<ul style="margin: 15px 0; padding-left: 20px;">')
               .replace(/<ol[^>]*>/g, '<ol style="margin: 15px 0; padding-left: 20px;">')
               .replace(/<li[^>]*>/g, '<li style="margin: 8px 0; font-size: 17px; line-height: 1.75; color: #333333;">')
               .replace(/<blockquote[^>]*>/g, '<blockquote style="margin: 15px 0; padding: 15px; background-color: #f7f7f7; border-left: 4px solid #d0d0d0; font-style: italic; color: #666666;">')
               .replace(/<img([^>]*)>/g, '<img$1 style="max-width: 100%; height: auto; display: block; margin: 15px auto;">')
               .replace(/<code[^>]*>/g, '<code style="background-color: #f0f0f0; padding: 2px 4px; border-radius: 3px; font-family: Monaco, Menlo, monospace; font-size: 14px; color: #d73a49;">')
               .replace(/<pre[^>]*>/g, '<pre style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; overflow-x: auto; margin: 15px 0;">')
               .replace(/<hr[^>]*>/g, '<hr style="border: none; height: 1px; background-color: #e0e0e0; margin: 30px 0;">')
          }
        </div>
      `

      // 同时生成带外部样式的版本用于预览显示
      const previewHTML = `
        <style>
          .wechat-article {
            max-width: 677px;
            margin: 0 auto;
            padding: 0;
            background: #ffffff;
            font-family: -apple-system-font, "Helvetica Neue", sans-serif;
            font-size: 17px;
            line-height: 1.6;
            color: #333333;
            word-wrap: break-word;
          }
          .wechat-content {
            padding: 20px 16px;
          }
          .wechat-article h1 {
            font-size: 24px;
            font-weight: bold;
            color: ${secondaryColor || '#000000'};
            line-height: 1.3;
            margin: 20px 0;
            text-align: center;
          }
          .wechat-article h2 {
            font-size: 20px;
            font-weight: bold;
            color: ${primaryColor || '#1e6fff'};
            line-height: 1.4;
            margin: 25px 0 15px 0;
            border-left: 4px solid ${primaryColor || '#1e6fff'};
            padding-left: 12px;
          }
          .wechat-article h3 {
            font-size: 18px;
            font-weight: bold;
            color: ${secondaryColor || '#333333'};
            line-height: 1.4;
            margin: 20px 0 10px 0;
          }
          .wechat-article p {
            font-size: 17px;
            line-height: 1.75;
            color: #333333;
            margin: 15px 0;
            text-align: justify;
            word-wrap: break-word;
          }
          .wechat-article a {
            color: ${primaryColor || '#576b95'};
            text-decoration: underline;
          }
          .wechat-article strong {
            font-weight: bold;
            color: ${primaryColor || '#333333'};
          }
          .wechat-article em {
            font-style: italic;
            color: #333333;
          }
          .wechat-article ul, .wechat-article ol {
            margin: 15px 0;
            padding-left: 20px;
          }
          .wechat-article li {
            margin: 8px 0;
            font-size: 17px;
            line-height: 1.75;
            color: #333333;
          }
          .wechat-article blockquote {
            margin: 15px 0;
            padding: 15px;
            background-color: #f7f7f7;
            border-left: 4px solid #d0d0d0;
            font-style: italic;
            color: #666666;
          }
          .wechat-article img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 15px auto;
          }
          .wechat-article code {
            background-color: #f0f0f0;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 14px;
            color: #d73a49;
          }
          .wechat-article pre {
            background-color: #f8f8f8;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            margin: 15px 0;
          }
          .wechat-article hr {
            border: none;
            height: 1px;
            background-color: #e0e0e0;
            margin: 30px 0;
          }
          ${css}
        </style>
        
        <div class="wechat-article">
          <div class="wechat-content">
            ${html}
          </div>
        </div>
      `

      // 返回两个版本：一个用于预览显示，一个用于复制
      return { previewHTML, copyHTML: inlineStyledHTML }
    } catch (error) {
      console.error('Preview generation error:', error)
      return { 
        previewHTML: '<div style="padding: 20px; color: red;">预览生成失败，请检查内容格式</div>',
        copyHTML: '<div style="padding: 20px; color: red;">预览生成失败，请检查内容格式</div>'
      }
    }
  }, [processedContent, state.templates.current, state.templates.variables, state.assets.fixedAssets])
  
  // 优化事件处理器，使用 useCallback 保持引用稳定
  const handleDeviceModeChange = useCallback((mode: 'mobile' | 'desktop') => {
    dispatch({ type: 'SET_UI_STATE', payload: { ...state.ui, deviceMode: mode } })
  }, [dispatch, state.ui])
  
  // 优化复制功能，使用 useCallback 缓存
  const copyRichContent = useCallback(async () => {
    try {
      // 创建临时div来渲染富文本
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = previewData.previewHTML
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      document.body.appendChild(tempDiv)
      
      // 选择内容
      const range = document.createRange()
      range.selectNodeContents(tempDiv)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
      
      // 复制富文本
      const success = document.execCommand('copy')
      
      // 清理
      document.body.removeChild(tempDiv)
      selection?.removeAllRanges()
      
      if (success) {
        alert('富文本内容已复制！可直接粘贴到微信公众号编辑器')
      } else {
        throw new Error('复制失败')
      }
    } catch (error) {
      console.error('Copy failed:', error)
      
      // 降级方案：复制HTML代码
      try {
        await navigator.clipboard.writeText(previewData.previewHTML)
        alert('已复制HTML代码到剪贴板')
      } catch {
        alert('复制失败，请手动选择内容复制')
      }
    }
  }, [previewData.previewHTML])


  // 优化键盘事件处理，使用 useCallback
  const handlePreviewKeyDown = useCallback((e: React.KeyboardEvent) => {
    // 检测Ctrl+A (Windows) 或 Cmd+A (Mac)
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault() // 阻止默认的全页面选择
      
      // 创建包含内联样式的临时元素用于复制
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = previewData.copyHTML
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.opacity = '0'
      document.body.appendChild(tempDiv)
      
      try {
        const range = document.createRange()
        const selection = window.getSelection()
        
        // 选择临时元素的内容
        range.selectNodeContents(tempDiv)
        selection?.removeAllRanges()
        selection?.addRange(range)
        
        // 给用户一个视觉反馈
        const notification = document.createElement('div')
        notification.textContent = '✓ 已选择格式化内容，按 Ctrl+C 复制'
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: #4CAF50;
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 14px;
          z-index: 10000;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `
        document.body.appendChild(notification)
        
        // 3秒后移除通知
        setTimeout(() => {
          document.body.removeChild(notification)
          document.body.removeChild(tempDiv)
        }, 3000)
        
      } catch (error) {
        console.error('Selection failed:', error)
        document.body.removeChild(tempDiv)
      }
    }
  }, [previewData.copyHTML])

  // 优化点击处理，使用 useCallback
  const handlePreviewClick = useCallback(() => {
    if (previewRef.current) {
      previewRef.current.focus()
    }
  }, [])
  
  // 同步滚动：从编辑器到预览区
  useEffect(() => {
    if (!state.preview.syncScrollEnabled) return
    if (state.preview.lastSyncSource !== 'editor') return
    
    const previewFrame = previewFrameRef.current
    if (!previewFrame) return
    
    const { scrollPercentage } = state.editor
    const maxScroll = previewFrame.scrollHeight - previewFrame.clientHeight
    const targetScrollTop = maxScroll * scrollPercentage
    
    // 平滑滚动
    previewFrame.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth'
    })
  }, [state.editor.scrollPercentage, state.preview.syncScrollEnabled, state.preview.lastSyncSource])
  
  // 更新光标位置指示器
  useEffect(() => {
    const previewFrame = previewFrameRef.current
    if (!previewFrame) return
    
    const { cursorLinePercentage } = state.editor
    const previewHeight = previewFrame.clientHeight
    
    // 计算指示器位置（60px 高度的指示器，居中对齐光标位置）
    const indicatorHeight = 60
    const topPosition = Math.max(0, Math.min(
      cursorLinePercentage * previewHeight - indicatorHeight / 2,
      previewHeight - indicatorHeight
    ))
    
    setCursorIndicatorStyle({
      top: `${topPosition}px`,
      opacity: cursorLinePercentage >= 0 ? 1 : 0
    })
  }, [state.editor.cursorLinePercentage])
  
  return (
    <div className="preview-container">
      {/* 样式配置工具栏 - 模板和配色 */}
      <PreviewToolbar />
      
      {/* 预览工具栏 */}
      <div className="preview-toolbar">
        <div className="toolbar-left">
          <div className="device-switcher">
            <button
              type="button"
              className={`device-btn ${state.ui.deviceMode === 'mobile' ? 'active' : ''}`}
              onClick={() => handleDeviceModeChange('mobile')}
              title="手机预览"
            >
              📱
            </button>
            <button
              type="button"
              className={`device-btn ${state.ui.deviceMode === 'desktop' ? 'active' : ''}`}
              onClick={() => handleDeviceModeChange('desktop')}
              title="桌面预览"
            >
              💻
            </button>
          </div>
          
          <div className="preview-stats">
            <span className="stat-item">{state.templates.current?.name}</span>
            <span className="stat-divider">·</span>
            <span className="stat-item">{Math.max(1, Math.ceil(state.editor.content.length / 400))} 分钟阅读</span>
          </div>
        </div>
        
        <div className="copy-tip-inline">
          点击预览区域，按 <kbd>Ctrl+A</kbd> 全选，<kbd>Ctrl+C</kbd> 复制
        </div>
      </div>
      
      {/* 预览内容 - 关键：让这个区域可以直接全选复制 */}
      <div 
        ref={previewFrameRef}
        className={`preview-frame ${state.ui.deviceMode}`}
        style={{ position: 'relative' }}
      >
        {/* 光标位置指示器 */}
        <div 
          className="preview-cursor-indicator"
          style={cursorIndicatorStyle}
        />
        
        <div 
          ref={previewRef}
          className="preview-content selectable"
          style={{
            userSelect: 'text',
            WebkitUserSelect: 'text',
            MozUserSelect: 'text',
            msUserSelect: 'text',
            cursor: 'text',
            outline: 'none'
          }}
          tabIndex={0}
          onKeyDown={handlePreviewKeyDown}
          onClick={handlePreviewClick}
          dangerouslySetInnerHTML={{ __html: previewData.previewHTML }}
        />
      </div>
    </div>
  )
})