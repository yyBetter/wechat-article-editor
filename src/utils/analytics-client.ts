// 前端统计追踪工具
export enum ClientAnalyticsEvent {
  // 用户行为
  USER_REGISTER = 'user_register',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  
  // 文档操作
  DOCUMENT_CREATE = 'document_create',
  DOCUMENT_SAVE = 'document_save',
  DOCUMENT_EXPORT = 'document_export',
  DOCUMENT_DELETE = 'document_delete',
  
  // 模板使用
  TEMPLATE_SELECT = 'template_select',
  TEMPLATE_CHANGE = 'template_change',
  
  // 功能使用
  IMAGE_UPLOAD = 'image_upload',
  COPY_HTML = 'copy_html',
  PREVIEW_VIEW = 'preview_view',
  
  // 页面访问
  PAGE_VIEW = 'page_view',
  SESSION_START = 'session_start',
  SESSION_END = 'session_end'
}

interface TrackEventData {
  event: ClientAnalyticsEvent
  properties?: Record<string, any>
}

class AnalyticsClient {
  private sessionId: string
  private baseUrl: string

  constructor() {
    this.sessionId = this.generateSessionId()
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002'
    
    // 页面加载时记录session开始
    this.trackEvent(ClientAnalyticsEvent.SESSION_START)
    
    // 页面卸载时记录session结束
    window.addEventListener('beforeunload', () => {
      this.trackEvent(ClientAnalyticsEvent.SESSION_END)
    })
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // 发送统计事件
  async trackEvent(event: ClientAnalyticsEvent, properties: Record<string, any> = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/api/analytics/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': this.sessionId,
        },
        credentials: 'include', // 包含认证cookie
        body: JSON.stringify({
          event,
          properties: {
            ...properties,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            referrer: document.referrer
          }
        })
      })

      if (!response.ok) {
        console.warn('Analytics tracking failed:', response.statusText)
      }
    } catch (error) {
      // 静默失败，不影响用户体验
      console.warn('Analytics tracking error:', error)
    }
  }

  // 追踪页面访问
  trackPageView(pageName?: string) {
    this.trackEvent(ClientAnalyticsEvent.PAGE_VIEW, {
      page: pageName || window.location.pathname,
      title: document.title
    })
  }

  // 追踪用户操作
  trackUserAction(action: ClientAnalyticsEvent, details: Record<string, any> = {}) {
    this.trackEvent(action, details)
  }

  // 追踪模板使用
  trackTemplateUsage(templateId: string, templateName: string) {
    this.trackEvent(ClientAnalyticsEvent.TEMPLATE_SELECT, {
      templateId,
      templateName
    })
  }

  // 追踪文档操作
  trackDocumentAction(action: ClientAnalyticsEvent, documentId?: string, metadata?: Record<string, any>) {
    this.trackEvent(action, {
      documentId,
      ...metadata
    })
  }

  // 追踪功能使用
  trackFeatureUsage(feature: string, details: Record<string, any> = {}) {
    this.trackEvent(ClientAnalyticsEvent.PREVIEW_VIEW, {
      feature,
      ...details
    })
  }
}

// 创建全局实例
const analytics = new AnalyticsClient()

// 导出追踪函数
export const trackEvent = (event: ClientAnalyticsEvent, properties?: Record<string, any>) => {
  analytics.trackEvent(event, properties)
}

export const trackPageView = (pageName?: string) => {
  analytics.trackPageView(pageName)
}

export const trackUserAction = (action: ClientAnalyticsEvent, details?: Record<string, any>) => {
  analytics.trackUserAction(action, details)
}

export const trackTemplateUsage = (templateId: string, templateName: string) => {
  analytics.trackTemplateUsage(templateId, templateName)
}

export const trackDocumentAction = (action: ClientAnalyticsEvent, documentId?: string, metadata?: Record<string, any>) => {
  analytics.trackDocumentAction(action, documentId, metadata)
}

export const trackFeatureUsage = (feature: string, details?: Record<string, any>) => {
  analytics.trackFeatureUsage(feature, details)
}

export default analytics