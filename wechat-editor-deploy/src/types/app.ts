// 应用状态类型定义

import { Template, TemplateVariables } from './template'
import { ContentStructure, ContentAsset } from './content'

// 应用主状态
export interface AppState {
  editor: EditorState
  preview: PreviewState
  templates: TemplateState
  assets: AssetState
  export: ExportState
  ui: UIState
}

// 编辑器状态
export interface EditorState {
  content: string
  selectedText: string
  cursorPosition: number
  isChanged: boolean
  lastSaved: Date | null
}

// 预览状态
export interface PreviewState {
  html: string
  css: string
  isLoading: boolean
  deviceMode: 'mobile' | 'desktop'
  scale: number
  scrollPosition: number
}

// 模板状态
export interface TemplateState {
  available: Template[]
  current: Template | null
  variables: TemplateVariables
  customStyles: Record<string, string>
}

// 资源状态
export interface AssetState {
  images: ContentAsset[]
  imageMap: Record<string, string> // 图片占位符到真实base64的映射
  fixedAssets: FixedAssetConfig
  uploadQueue: UploadQueueItem[]
  cdnConfig: CDNConfig | null
}

// 导出状态
export interface ExportState {
  isExporting: boolean
  lastExported: Date | null
  exportHistory: ExportRecord[]
}

// UI状态
export interface UIState {
  sidebarOpen: boolean
  activePanel: 'editor' | 'templates' | 'documents' | 'assets' | 'export' | 'guide' | 'settings'
  showPreview: boolean
  theme: 'light' | 'dark'
  fontSize: 'small' | 'medium' | 'large'
  deviceMode: 'mobile' | 'desktop'
  userHasSelectedTemplate: boolean
}

// 固定资源配置
export interface FixedAssetConfig {
  logo: string | null
  qrcode: string | null
  dividers: string[]
  watermark: string | null
  brandColors: string[]
  customCSS: string
}

// 上传队列项
export interface UploadQueueItem {
  id: string
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'failed'
  url?: string
  error?: string
}

// CDN配置
export interface CDNConfig {
  provider: 'qiniu' | 'aliyun' | 'tencent' | 'custom'
  accessKey: string
  secretKey: string
  bucket: string
  domain: string
}

// 导出记录
export interface ExportRecord {
  id: string
  timestamp: Date
  templateId: string
  format: 'html' | 'markdown' | 'pdf'
  size: number
  downloadUrl?: string
}

// 用户配置
export interface UserConfig {
  defaultTemplate: string
  autoSave: boolean
  autoSaveInterval: number
  imageCompression: boolean
  imageQuality: number
  wechatOptimization: boolean
  fixedAssets: FixedAssetConfig
}

// 应用动作类型
export type AppAction = 
  | { type: 'UPDATE_EDITOR_CONTENT'; payload: string }
  | { type: 'SELECT_TEMPLATE'; payload: string }
  | { type: 'UPDATE_TEMPLATE_VARIABLES'; payload: Partial<TemplateVariables> }
  | { type: 'SET_PREVIEW_HTML'; payload: string }
  | { type: 'ADD_ASSET'; payload: ContentAsset }
  | { type: 'REMOVE_ASSET'; payload: string }
  | { type: 'UPDATE_IMAGE_MAP'; payload: { id: string; data: string } }
  | { type: 'UPDATE_FIXED_ASSETS'; payload: Partial<FixedAssetConfig> }
  | { type: 'SET_UI_STATE'; payload: Partial<UIState> }
  | { type: 'EXPORT_START' }
  | { type: 'EXPORT_COMPLETE'; payload: ExportRecord }