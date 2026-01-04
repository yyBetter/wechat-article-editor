// 模板注册和管理
import { Template } from '../types/template'
import { simpleDocTemplate } from './simple-doc'
import { imageTextTemplate } from './image-text'
import { techModernTemplate } from './tech-modern'
import { businessFormalTemplate } from './business-formal'
import { literaryElegantTemplate } from './literary-elegant'
import { kuaidaoTemplate } from './kuaidao'

// 所有可用模板
export const templates: Template[] = [
  simpleDocTemplate,
  imageTextTemplate,
  techModernTemplate,
  businessFormalTemplate,
  literaryElegantTemplate,
  kuaidaoTemplate
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
  },
  'tech-modern': {
    name: '科技现代',
    icon: '🚀',
    description: '适合科技产品和创新项目',
    scenarios: ['产品发布', '技术分享', 'AI主题']
  },
  'business-formal': {
    name: '商务正式',
    icon: '💼',
    description: '适合企业和商业场景',
    scenarios: ['企业公告', '商业报告', '正式通知']
  },
  'literary-elegant': {
    name: '文艺优雅',
    icon: '🎨',
    description: '适合文学和生活分享',
    scenarios: ['文学创作', '生活随笔', '情感文章']
  },
  'kuaidao': {
    name: '快刀墨韵',
    icon: '🗡️',
    description: '仿快刀青衣风格，极致阅读体验',
    scenarios: ['深度长文', '产品发布', '行业观察']
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