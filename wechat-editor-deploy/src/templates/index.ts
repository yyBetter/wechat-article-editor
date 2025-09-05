// 模板注册和管理
import { Template } from '../types/template'
import { simpleDocTemplate } from './simple-doc'
import { imageTextTemplate } from './image-text'

// 所有可用模板
export const templates: Template[] = [
  simpleDocTemplate,
  imageTextTemplate
]

// 根据ID获取模板
export function getTemplateById(id: string): Template | null {
  return templates.find(template => template.id === id) || null
}

// 获取所有模板
export function getAllTemplates(): Template[] {
  return templates
}

// 根据分类获取模板
export function getTemplatesByCategory(category: Template['category']): Template[] {
  return templates.filter(template => template.category === category)
}

// 智能推荐模板
export function recommendTemplate(contentAnalysis: {
  wordCount: number
  imageCount: number
  hasLists: boolean
  hasCode: boolean
}): string {
  const { wordCount, imageCount, hasLists, hasCode } = contentAnalysis
  
  // 图片数量多且文字相对较少，推荐图文模板
  if (imageCount >= 3 && imageCount / (wordCount / 100) > 0.3) {
    return 'image-text'
  }
  
  // 有大量列表或代码，推荐文档模板
  if (hasLists || hasCode || wordCount > 1000) {
    return 'simple-doc'
  }
  
  // 图片较多但文字也不少，推荐图文模板
  if (imageCount >= 2) {
    return 'image-text'
  }
  
  // 默认推荐简约文档模板
  return 'simple-doc'
}

// 模板预设配置
export const templatePresets = {
  'simple-doc': {
    name: '简约文档',
    icon: '📝',
    description: '适合文字为主的内容',
    scenarios: ['技术文档', '新闻资讯', '教程指南']
  },
  'image-text': {
    name: '图文并茂', 
    icon: '🖼️',
    description: '适合图片展示的内容',
    scenarios: ['产品介绍', '美食分享', '旅游攻略']
  }
}

// 默认模板变量
export const defaultTemplateVariables = {
  title: '文章标题',
  author: '',
  date: '2025年8月30日',
  logo: '',
  qrcode: '',
  divider: ''
}