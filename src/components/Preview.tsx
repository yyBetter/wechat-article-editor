// 预览组件  
import React, { useMemo, useRef } from 'react'
import { useApp } from '../utils/app-context'
import { TemplateEngine } from '../utils/template-engine'
import { templates } from '../templates'

const templateEngine = new TemplateEngine(templates)

export function Preview() {
  const { state, dispatch } = useApp()
  const previewRef = useRef<HTMLDivElement>(null)
  
  // 生成预览HTML
  const previewHTML = useMemo(() => {
    if (!state.templates.current || !state.editor.content) {
      return ''
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
      
      const { html, css } = templateEngine.renderTemplate(
        state.templates.current.id,
        state.editor.content,
        combinedVariables
      )
      
      // 应用品牌色彩
      const brandColors = combinedVariables.brandColors || ['#1e6fff', '#333333', '#666666']
      const primaryColor = brandColors[0]
      const secondaryColor = brandColors[1]
      const accentColor = brandColors[2]

      // 生成微信公众号标准样式的HTML
      return `
        <style>
          /* 微信公众号标准样式 */
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
            min-height: 100vh;
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
            color: ${primaryColor || '#333333'};
            font-weight: bold;
          }

          .wechat-article strong {
            font-weight: bold;
            color: #333333;
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

          /* 头部样式 */
          .wechat-header {
            text-align: center;
            padding: 20px 0 30px 0;
            border-bottom: 1px solid #e0e0e0;
            margin-bottom: 30px;
          }

          .wechat-header .title {
            font-size: 24px;
            font-weight: bold;
            color: #000000;
            line-height: 1.3;
            margin: 0 0 15px 0;
          }

          .wechat-header .meta {
            font-size: 14px;
            color: #8c8c8c;
          }

          /* 尾部样式 */
          .wechat-footer {
            text-align: center;
            padding: 40px 0 30px 0;
            border-top: 1px solid #e0e0e0;
            margin-top: 40px;
          }

          .wechat-footer .qrcode {
            width: 150px;
            height: 150px;
            margin: 0 auto 15px auto;
          }

          .wechat-footer .qr-text {
            font-size: 14px;
            color: #8c8c8c;
            margin-bottom: 20px;
          }

          .wechat-footer .copyright {
            font-size: 12px;
            color: #bbb;
          }

          ${css}
        </style>
        
        <div class="wechat-article">
          <div class="wechat-content">
            ${html}
          </div>
        </div>
      `
    } catch (error) {
      console.error('Preview generation error:', error)
      return '<div style="padding: 20px; color: red;">预览生成失败，请检查内容格式</div>'
    }
  }, [state.editor.content, state.templates.current, state.templates.variables])
  
  // 处理设备模式切换
  const handleDeviceModeChange = (mode: 'mobile' | 'desktop') => {
    dispatch({ type: 'SET_UI_STATE', payload: { ...state.ui, deviceMode: mode } })
  }
  
  // 复制富文本内容到剪贴板（适用于微信公众号）
  const copyRichContent = async () => {
    try {
      // 创建临时div来渲染富文本
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = previewHTML
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
        await navigator.clipboard.writeText(previewHTML)
        alert('已复制HTML代码到剪贴板')
      } catch {
        alert('复制失败，请手动选择内容复制')
      }
    }
  }

  // 复制纯文本内容
  const copyPlainText = async () => {
    try {
      // 从Markdown生成纯文本
      const plainText = state.editor.content
        .replace(/#{1,6}\s/g, '') // 移除标题标记
        .replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗体标记
        .replace(/\*(.*?)\*/g, '$1') // 移除斜体标记
        .replace(/`(.*?)`/g, '$1') // 移除代码标记
        .replace(/!\[.*?\]\(.*?\)/g, '[图片]') // 图片替换为文本
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 链接只保留文字
        .replace(/>\s?/g, '') // 移除引用标记
        .replace(/[-*+]\s/g, '• ') // 列表标记替换
        .replace(/\n\s*\n/g, '\n') // 合并多个换行
        .trim()

      await navigator.clipboard.writeText(plainText)
      alert('纯文本内容已复制到剪贴板')
    } catch (error) {
      console.error('Copy failed:', error)
      alert('复制失败')
    }
  }
  
  return (
    <div className="preview-container">
      {/* 预览工具栏 */}
      <div className="preview-toolbar">
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
        
        <div className="preview-actions">
          <button
            type="button"
            onClick={copyRichContent}
            className="action-btn primary"
            title="复制富文本，可直接粘贴到微信公众号"
          >
            复制到公众号
          </button>
          <button
            type="button"
            onClick={copyPlainText}
            className="action-btn secondary"
            title="复制纯文本内容"
          >
            复制文本
          </button>
        </div>
      </div>
      
      {/* 预览内容 */}
      <div className={`preview-frame ${state.ui.deviceMode}`}>
        <div 
          ref={previewRef}
          className="preview-content"
          dangerouslySetInnerHTML={{ __html: previewHTML }}
        />
      </div>
      
      {/* 预览信息 */}
      <div className="preview-info">
        <div className="info-item">
          <span className="info-label">当前模板:</span>
          <span className="info-value">{state.templates.current?.name}</span>
        </div>
        <div className="info-item">
          <span className="info-label">字符数:</span>
          <span className="info-value">{state.editor.content.length}</span>
        </div>
        <div className="info-item">
          <span className="info-label">预计阅读:</span>
          <span className="info-value">
            {Math.max(1, Math.ceil(state.editor.content.length / 400))} 分钟
          </span>
        </div>
      </div>
    </div>
  )
}