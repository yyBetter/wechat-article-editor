// 通知系统 - 替代alert的用户友好型提示
export type NotificationType = 'success' | 'error' | 'info' | 'warning'

interface NotificationOptions {
  type?: NotificationType
  duration?: number
  title?: string
  details?: string
}

export class NotificationManager {
  private static instance: NotificationManager
  private container: HTMLElement | null = null
  private notifications: Map<string, HTMLElement> = new Map()

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager()
    }
    return NotificationManager.instance
  }

  private createContainer(): HTMLElement {
    if (this.container) return this.container

    this.container = document.createElement('div')
    this.container.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 10000;
      pointer-events: none;
    `
    document.body.appendChild(this.container)
    return this.container
  }

  show(message: string, options: NotificationOptions = {}): string {
    const {
      type = 'info',
      duration = 2000,
      title,
      details
    } = options

    const container = this.createContainer()
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const notification = document.createElement('div')
    notification.className = `notification ${type}`
    notification.style.cssText = `
      position: relative;
      margin-bottom: 12px;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      transform: translateX(100%);
      animation: slideIn 0.3s ease-out forwards;
      max-width: 400px;
      word-wrap: break-word;
      pointer-events: auto;
      cursor: pointer;
    `

    // 设置背景色
    const colors = {
      success: '#4CAF50',
      error: '#f44336',
      info: '#2196F3',
      warning: '#ff9800'
    }
    notification.style.background = colors[type]
    notification.style.color = 'white'

    // 构建通知内容
    let content = ''
    
    if (title) {
      content += `<div style="font-weight: 600; margin-bottom: 4px;">${title}</div>`
    }
    
    content += `<div>${message}</div>`
    
    if (details) {
      content += `<div style="font-size: 12px; margin-top: 8px; opacity: 0.9; line-height: 1.4;">${details}</div>`
    }

    notification.innerHTML = content

    // 点击关闭
    notification.addEventListener('click', () => {
      this.hide(id)
    })

    // 自动关闭
    if (duration > 0) {
      setTimeout(() => {
        this.hide(id)
      }, duration)
    }

    container.appendChild(notification)
    this.notifications.set(id, notification)

    return id
  }

  hide(id: string): void {
    const notification = this.notifications.get(id)
    if (!notification) return

    // 添加退出动画
    notification.style.animation = 'slideOut 0.3s ease-in forwards'
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
      this.notifications.delete(id)
      
      // 如果没有通知了，清理容器
      if (this.notifications.size === 0 && this.container) {
        this.container.remove()
        this.container = null
      }
    }, 300)
  }

  // 便捷方法
  success(message: string, options?: Omit<NotificationOptions, 'type'>): string {
    return this.show(message, { ...options, type: 'success' })
  }

  error(message: string, options?: Omit<NotificationOptions, 'type'>): string {
    return this.show(message, { ...options, type: 'error' })
  }

  info(message: string, options?: Omit<NotificationOptions, 'type'>): string {
    return this.show(message, { ...options, type: 'info' })
  }

  warning(message: string, options?: Omit<NotificationOptions, 'type'>): string {
    return this.show(message, { ...options, type: 'warning' })
  }

  // 清除所有通知
  clear(): void {
    this.notifications.forEach((_, id) => {
      this.hide(id)
    })
  }
}

// 导出单例实例
export const notification = NotificationManager.getInstance()

// 添加样式到页面
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `
  document.head.appendChild(style)
}