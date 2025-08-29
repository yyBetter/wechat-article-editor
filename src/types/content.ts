// 内容相关类型定义

// 内容结构
export interface ContentStructure {
  type: 'document' | 'image-text' | 'mixed'
  sections: ContentSection[]
  metadata: ContentMetadata
  assets: ContentAsset[]
}

// 内容区块
export interface ContentSection {
  id: string
  type: 'text' | 'image' | 'heading' | 'list' | 'quote' | 'code'
  content: string
  level?: number // for headings
  imageInfo?: ImageInfo
}

// 内容元数据
export interface ContentMetadata {
  wordCount: number
  imageCount: number
  estimatedReadTime: number
  hasCode: boolean
  hasLists: boolean
  hasQuotes: boolean
  suggestedTemplate: string
}

// 内容资源
export interface ContentAsset {
  id: string
  type: 'image' | 'file'
  url: string
  name: string
  size?: number
  dimensions?: { width: number; height: number }
}

// 图片信息
export interface ImageInfo {
  src: string
  alt: string
  title?: string
  caption?: string
  width?: number
  height?: number
}

// 解析选项
export interface ParseOptions {
  enableImageAnalysis: boolean
  enableContentSuggestion: boolean
  maxImageWidth: number
  imageQuality: number
}

// 渲染选项
export interface RenderOptions {
  templateId: string
  variables: Record<string, string>
  enableFixedElements: boolean
  optimizeForWeChat: boolean
}

// 导出选项
export interface ExportOptions {
  format: 'html' | 'markdown' | 'pdf'
  includeStyles: boolean
  compressImages: boolean
  addWatermark: boolean
  wechatCompatible: boolean
}