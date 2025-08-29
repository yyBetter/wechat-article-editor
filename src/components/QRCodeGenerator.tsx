import React, { useEffect, useRef } from 'react'

interface QRCodeGeneratorProps {
  url: string
  size?: number
}

export function QRCodeGenerator({ url, size = 150 }: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!url || !canvasRef.current) return

    // 简单的二维码生成（实际项目中应该使用qrcode库）
    generateQRCode(url, canvasRef.current, size)
  }, [url, size])

  // 简化的二维码生成函数（演示用）
  const generateQRCode = (text: string, canvas: HTMLCanvasElement, size: number) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = size
    canvas.height = size

    // 清空画布
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)

    // 绘制简单的二维码样式（演示用）
    ctx.fillStyle = '#000000'
    const cellSize = size / 25

    // 绘制定位图案（三个角）
    drawFinderPattern(ctx, 0, 0, cellSize)
    drawFinderPattern(ctx, 18 * cellSize, 0, cellSize)
    drawFinderPattern(ctx, 0, 18 * cellSize, cellSize)

    // 绘制数据模块（简化版本）
    for (let i = 0; i < 25; i++) {
      for (let j = 0; j < 25; j++) {
        // 跳过定位图案区域
        if ((i < 9 && j < 9) || (i < 9 && j > 15) || (i > 15 && j < 9)) {
          continue
        }
        
        // 基于URL生成伪随机模块
        const hash = simpleHash(text + i + j)
        if (hash % 3 === 0) {
          ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize)
        }
      }
    }

    // 绘制中心logo区域
    ctx.fillStyle = '#ffffff'
    const centerStart = 9 * cellSize
    const centerSize = 7 * cellSize
    ctx.fillRect(centerStart, centerStart, centerSize, centerSize)
    
    ctx.fillStyle = '#000000'
    ctx.strokeRect(centerStart, centerStart, centerSize, centerSize)
    
    // 绘制微信图标（简化）
    ctx.font = `${cellSize * 3}px Arial`
    ctx.textAlign = 'center'
    ctx.fillText('微', size / 2, size / 2 + cellSize)
  }

  const drawFinderPattern = (ctx: CanvasRenderingContext2D, x: number, y: number, cellSize: number) => {
    // 外框
    ctx.fillRect(x, y, 7 * cellSize, 7 * cellSize)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(x + cellSize, y + cellSize, 5 * cellSize, 5 * cellSize)
    ctx.fillStyle = '#000000'
    ctx.fillRect(x + 2 * cellSize, y + 2 * cellSize, 3 * cellSize, 3 * cellSize)
  }

  const simpleHash = (str: string): number => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash)
  }

  return (
    <div className="qr-generator">
      <canvas 
        ref={canvasRef}
        className="qr-canvas"
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: '8px'
        }}
      />
    </div>
  )
}