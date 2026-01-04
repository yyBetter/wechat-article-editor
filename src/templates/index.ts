// 模板注册和管理
import { Template } from '../types/template'
import { simpleDocTemplate } from './simple-doc'
import { kuaidaoTemplate } from './kuaidao'
import { blueprintReportTemplate } from './report-grid'
import { electricNeoTemplate } from './electric-neo'

// 所有可用模板
export const templates: Template[] = [
  simpleDocTemplate,
  kuaidaoTemplate,
  blueprintReportTemplate,
  electricNeoTemplate
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

  // 默认推荐快刀墨韵模板（作为主打）
  if (wordCount > 100) {
    return 'kuaidao'
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
  'kuaidao': {
    name: '快刀墨韵',
    icon: '🗡️',
    description: '仿快刀青衣风格，极致阅读体验，行业分析必备',
    scenarios: ['深度长文', '产品发布', '行业观察']
  },
  'report-grid': {
    name: '青韵简报',
    icon: '📊',
    description: '深青色分析简报，带稿纸方格底纹',
    scenarios: ['行业报告', '数据分析', '调研总结']
  },
  'electric-neo': {
    name: '电讯风',
    icon: '⚡',
    description: '科技媒体风格，高对比撞色设计',
    scenarios: ['技术点评', '深度报道', '趋势预测']
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