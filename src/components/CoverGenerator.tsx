import React, { useState, useRef, useEffect } from 'react'
import './CoverGenerator.css'

interface CoverTemplate {
  id: string
  name: string
  background: string
  titleStyle: {
    fontSize: string
    color: string
    textAlign: string
    fontWeight: string
  }
  subtitleStyle: {
    fontSize: string
    color: string
    textAlign: string
  }
}

const coverTemplates: CoverTemplate[] = [
  {
    id: 'gradient-blue',
    name: '科技蓝渐变',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    titleStyle: {
      fontSize: '48px',
      color: '#ffffff',
      textAlign: 'center',
      fontWeight: 'bold'
    },
    subtitleStyle: {
      fontSize: '24px',
      color: 'rgba(255,255,255,0.9)',
      textAlign: 'center'
    }
  },
  {
    id: 'gradient-orange',
    name: '活力橙渐变',
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    titleStyle: {
      fontSize: '48px',
      color: '#ffffff',
      textAlign: 'center',
      fontWeight: 'bold'
    },
    subtitleStyle: {
      fontSize: '24px',
      color: 'rgba(255,255,255,0.9)',
      textAlign: 'center'
    }
  },
  {
    id: 'gradient-green',
    name: '清新绿渐变',
    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    titleStyle: {
      fontSize: '48px',
      color: '#ffffff',
      textAlign: 'center',
      fontWeight: 'bold'
    },
    subtitleStyle: {
      fontSize: '24px',
      color: 'rgba(255,255,255,0.9)',
      textAlign: 'center'
    }
  },
  {
    id: 'dark-minimal',
    name: '极简暗黑',
    background: '#1a1a2e',
    titleStyle: {
      fontSize: '52px',
      color: '#ffffff',
      textAlign: 'center',
      fontWeight: 'bold'
    },
    subtitleStyle: {
      fontSize: '22px',
      color: '#a0a0a0',
      textAlign: 'center'
    }
  },
  {
    id: 'paper-texture',
    name: '纸张质感',
    background: '#f5f5dc',
    titleStyle: {
      fontSize: '44px',
      color: '#2c3e50',
      textAlign: 'center',
      fontWeight: 'bold'
    },
    subtitleStyle: {
      fontSize: '20px',
      color: '#7f8c8d',
      textAlign: 'center'
    }
  },
  {
    id: 'neon-glow',
    name: '霓虹光效',
    background: '#0a0a0a',
    titleStyle: {
      fontSize: '50px',
      color: '#00ff88',
      textAlign: 'center',
      fontWeight: 'bold'
    },
    subtitleStyle: {
      fontSize: '22px',
      color: '#00ccff',
      textAlign: 'center'
    }
  }
]

export function CoverGenerator() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(coverTemplates[0])
  const [title, setTitle] = useState('文章标题')
  const [subtitle, setSubtitle] = useState('副标题描述')
  const [customColor, setCustomColor] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  // 生成封面图片
  const generateCover = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 设置画布尺寸（公众号封面推荐尺寸 900x383）
    canvas.width = 900
    canvas.height = 383

    // 绘制背景
    if (customColor) {
      ctx.fillStyle = customColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    } else if (selectedTemplate.background.startsWith('linear-gradient')) {
      // 渐变背景简化处理
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, '#667eea')
      gradient.addColorStop(1, '#764ba2')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    } else {
      ctx.fillStyle = selectedTemplate.background
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // 绘制装饰元素
    ctx.save()
    ctx.globalAlpha = 0.1
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(750, 100, 150, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // 绘制标题
    ctx.font = `${selectedTemplate.titleStyle.fontWeight} ${selectedTemplate.titleStyle.fontSize} "PingFang SC", "Microsoft YaHei", sans-serif`
    ctx.fillStyle = selectedTemplate.titleStyle.color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // 自动换行处理
    const maxWidth = 800
    const lineHeight = 60
    const x = canvas.width / 2
    let y = canvas.height / 2 - 20

    // 简单的文字换行
    const words = title.split('')
    let line = ''
    const lines: string[] = []

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i]
      const metrics = ctx.measureText(testLine)
      if (metrics.width > maxWidth && i > 0) {
        lines.push(line)
        line = words[i]
      } else {
        line = testLine
      }
    }
    lines.push(line)

    // 调整起始位置（垂直居中）
    y = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2

    lines.forEach((lineText) => {
      ctx.fillText(lineText, x, y)
      y += lineHeight
    })

    // 绘制副标题
    if (subtitle) {
      ctx.font = `${selectedTemplate.subtitleStyle.fontSize} "PingFang SC", "Microsoft YaHei", sans-serif`
      ctx.fillStyle = selectedTemplate.subtitleStyle.color
      ctx.fillText(subtitle, canvas.width / 2, y + 30)
    }

    // 绘制品牌标识
    ctx.font = '16px "PingFang SC", sans-serif'
    ctx.fillStyle = selectedTemplate.titleStyle.color
    ctx.globalAlpha = 0.6
    ctx.fillText('公众号排版工具', canvas.width / 2, canvas.height - 30)
  }

  // 下载封面
  const downloadCover = () => {
    generateCover()
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement('a')
    link.download = `封面-${title.slice(0, 20)}-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  // 实时预览更新
  useEffect(() => {
    if (isOpen) {
      generateCover()
    }
  }, [title, subtitle, selectedTemplate, customColor, isOpen])

  if (!isOpen) {
    return (
      <button 
        className="cover-generator-trigger"
        onClick={() => setIsOpen(true)}
        title="生成封面图"
      >
        🎨 生成封面
      </button>
    )
  }

  return (
    <div className="cover-generator-overlay">
      <div className="cover-generator-modal">
        <div className="cover-generator-header">
          <h2>🎨 公众号封面生成器</h2>
          <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
        </div>

        <div className="cover-generator-body">
          {/* 左侧：编辑区 */}
          <div className="cover-editor">
            <div className="form-group">
              <label>文章标题</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="输入文章标题"
                maxLength={30}
              />
              <span className="char-count">{title.length}/30</span>
            </div>

            <div className="form-group">
              <label>副标题（可选）</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="输入副标题"
                maxLength={20}
              />
              <span className="char-count">{subtitle.length}/20</span>
            </div>

            <div className="form-group">
              <label>选择模板</label>
              <div className="template-grid">
                {coverTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`template-item ${selectedTemplate.id === template.id ? 'active' : ''}`}
                    onClick={() => setSelectedTemplate(template)}
                    style={{ background: template.background }}
                  >
                    <span className="template-name">{template.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>自定义颜色（可选）</label>
              <input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="color-picker"
              />
              <button 
                className="clear-color-btn"
                onClick={() => setCustomColor('')}
              >
                清除
              </button>
            </div>

            <button className="download-btn" onClick={downloadCover}>
              📥 下载封面图
            </button>
          </div>

          {/* 右侧：预览区 */}
          <div className="cover-preview">
            <h3>实时预览</h3>
            <div 
              className="preview-container"
              ref={previewRef}
              style={{
                width: '450px',
                height: '191px',
                background: customColor || selectedTemplate.background,
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '8px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
              }}
            >
              {/* 装饰圆圈 */}
              <div 
                style={{
                  position: 'absolute',
                  width: '150px',
                  height: '150px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  top: '-30px',
                  right: '-30px'
                }}
              />
              
              {/* 标题 */}
              <div 
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  width: '90%'
                }}
              >
                <h4 
                  style={{
                    fontSize: '24px',
                    color: selectedTemplate.titleStyle.color,
                    fontWeight: selectedTemplate.titleStyle.fontWeight,
                    margin: '0 0 10px 0',
                    lineHeight: '1.3',
                    wordWrap: 'break-word'
                  }}
                >
                  {title || '文章标题'}
                </h4>
                {subtitle && (
                  <p 
                    style={{
                      fontSize: '12px',
                      color: selectedTemplate.subtitleStyle.color,
                      margin: 0
                    }}
                  >
                    {subtitle}
                  </p>
                )}
              </div>

              {/* 品牌标识 */}
              <div 
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '8px',
                  color: selectedTemplate.titleStyle.color,
                  opacity: 0.6
                }}
              >
                公众号排版工具
              </div>
            </div>

            <p className="preview-hint">
              推荐尺寸：900×383 像素（2.35:1）
            </p>
          </div>
        </div>

        {/* 隐藏的Canvas用于生成图片 */}
        <canvas 
          ref={canvasRef}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  )
}
