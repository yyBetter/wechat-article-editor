// 核心模板引擎
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { Template, TemplateVariables } from '../types/template'
import { ContentStructure, ContentMetadata } from '../types/content'

export class TemplateEngine {
  private templates: Map<string, Template> = new Map()

  // 性能优化：增加缓存机制
  private cssCache = new Map<string, string>()
  private markdownCache = new Map<string, string>()
  private analysisCache = new Map<string, ContentMetadata>()
  private templateStringCache = new Map<string, string>()

  constructor(templates: Template[]) {
    templates.forEach(template => {
      this.templates.set(template.id, template)
    })
    this.setupMarkedRenderer()
  }

  // 配置Markdown渲染器
  private setupMarkedRenderer() {
    // 配置marked选项
    marked.setOptions({
      breaks: true,
      gfm: true
    })
  }

  // 解析Markdown内容（增加缓存）
  parseMarkdown(content: string): string {
    // 检查缓存
    if (this.markdownCache.has(content)) {
      return this.markdownCache.get(content)!
    }

    try {
      const html = marked.parse(content) as string
      const sanitized = DOMPurify.sanitize(html)

      // 缓存结果（限制缓存大小避免内存泄露）
      if (this.markdownCache.size > 100) {
        this.markdownCache.clear()
      }
      this.markdownCache.set(content, sanitized)

      return sanitized
    } catch (error) {
      console.error('Markdown parsing error:', error)
      return content
    }
  }

  // 分析内容特征（增加缓存）
  analyzeContent(content: string): ContentMetadata {
    // 检查缓存
    if (this.analysisCache.has(content)) {
      return this.analysisCache.get(content)!
    }

    const lines = content.split('\n')
    const words = content.replace(/[^\u4e00-\u9fa5\w]/g, ' ').split(/\s+/).filter(w => w.length > 0)

    // 图片统计
    const imageMatches = content.match(/!\[.*?\]\(.*?\)/g) || []
    const imageCount = imageMatches.length

    // 代码块统计
    const codeBlockMatches = content.match(/```[\s\S]*?```/g) || []
    const inlineCodeMatches = content.match(/`[^`]+`/g) || []
    const hasCode = codeBlockMatches.length > 0 || inlineCodeMatches.length > 0

    // 列表统计
    const listMatches = content.match(/^[\s]*[-*+]\s/gm) || []
    const orderedListMatches = content.match(/^[\s]*\d+\.\s/gm) || []
    const hasLists = listMatches.length > 0 || orderedListMatches.length > 0

    // 引用统计
    const quoteMatches = content.match(/^>/gm) || []
    const hasQuotes = quoteMatches.length > 0

    // 标题统计
    const headingMatches = content.match(/^#{1,6}\s/gm) || []

    const wordCount = words.length
    const estimatedReadTime = Math.ceil(wordCount / 200) // 假设每分钟200字

    const result = {
      wordCount,
      imageCount,
      estimatedReadTime,
      hasCode,
      hasLists,
      hasQuotes,
      suggestedTemplate: this.recommendTemplate({
        wordCount,
        imageCount,
        hasLists,
        hasCode
      })
    }

    // 缓存结果（限制缓存大小）
    if (this.analysisCache.size > 50) {
      this.analysisCache.clear()
    }
    this.analysisCache.set(content, result)

    return result
  }

  // 智能推荐模板
  private recommendTemplate(analysis: {
    wordCount: number
    imageCount: number
    hasLists: boolean
    hasCode: boolean
  }): string {
    const { wordCount, imageCount, hasLists, hasCode } = analysis

    // 图文比例高，推荐图文模板
    if (imageCount >= 3 && wordCount < 500) {
      return 'image-text'
    }

    // 有代码或长文档，推荐文档模板
    if (hasCode || wordCount > 800) {
      return 'simple-doc'
    }

    // 有图片但不多，根据图片数量决定
    if (imageCount >= 2) {
      return 'image-text'
    }

    // 默认简约文档
    return 'simple-doc'
  }

  // 渲染模板
  renderTemplate(
    templateId: string,
    content: string,
    variables: TemplateVariables = { content: '' }
  ): { html: string; css: string } {
    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error(`Template not found: ${templateId}`)
    }

    // 解析Markdown
    const parsedHTML = this.parseMarkdown(content)

    // 生成CSS，传递变量以应用品牌色
    const css = this.generateCSS(template, variables)

    // 处理图文模板的特殊渲染
    let processedHTML = parsedHTML
    if (template.id === 'image-text') {
      processedHTML = this.processImageTextContent(parsedHTML, template)
    }

    // 注入固定元素
    const finalHTML = this.injectFixedElements(processedHTML, template, variables)

    // 包装最终HTML
    const wrappedHTML = this.wrapWithContainer(finalHTML, template)

    return {
      html: wrappedHTML,
      css
    }
  }

  // 生成CSS样式（增加缓存）
  private generateCSS(template: Template, variables?: TemplateVariables): string {
    const { styles } = template

    // 获取品牌色彩
    const brandColors = variables?.brandColors || ['#1e6fff', '#333333', '#666666']
    const primaryColor = brandColors[0]
    const secondaryColor = brandColors[1] || '#333333'
    const accentColor = brandColors[2] || '#666666'

    // 创建缓存键（包括模板和品牌色）
    const cacheKey = `${template.id}-${primaryColor}-${secondaryColor}-${accentColor}`

    // 检查缓存
    if (this.cssCache.has(cacheKey)) {
      return this.cssCache.get(cacheKey)!
    }

    let css = ''

    // 容器样式
    css += `.article-container {\n`
    Object.entries(styles.container).forEach(([prop, value]) => {
      css += `  ${this.camelToKebab(prop)}: ${value};\n`
    })
    css += `}\n\n`

    // 排版样式
    Object.entries(styles.typography).forEach(([element, style]) => {
      css += `.article-container ${element} {\n`
      Object.entries(style).forEach(([prop, value]) => {
        // 应用品牌色彩
        let finalValue = value
        if (prop === 'color') {
          // 替换预定义颜色变量
          if (value === '#1e6fff' || (typeof value === 'string' && value.includes('primary'))) {
            finalValue = primaryColor
          } else if (value === '#333333' || (typeof value === 'string' && value.includes('secondary'))) {
            finalValue = secondaryColor
          } else if (value === '#666666' || (typeof value === 'string' && value.includes('accent'))) {
            finalValue = accentColor
          }
        }
        css += `  ${this.camelToKebab(prop)}: ${finalValue};\n`
      })
      css += `}\n\n`
    })

    // 其他元素样式
    if (styles.elements) {
      Object.entries(styles.elements).forEach(([element, style]) => {
        css += `.article-container ${element} {\n`
        Object.entries(style).forEach(([prop, value]) => {
          css += `  ${this.camelToKebab(prop)}: ${value};\n`
        })
        css += `}\n\n`
      })
    }

    // 图文块样式
    if (styles.imageBlock) {
      css += `.image-block {\n`
      Object.entries(styles.imageBlock.container).forEach(([prop, value]) => {
        css += `  ${this.camelToKebab(prop)}: ${value};\n`
      })
      css += `}\n\n`

      css += `.image-block img {\n`
      Object.entries(styles.imageBlock.image).forEach(([prop, value]) => {
        css += `  ${this.camelToKebab(prop)}: ${value};\n`
      })
      css += `}\n\n`

      css += `.image-block .image-title {\n`
      Object.entries(styles.imageBlock.title).forEach(([prop, value]) => {
        css += `  ${this.camelToKebab(prop)}: ${value};\n`
      })
      css += `}\n\n`

      css += `.image-block .image-desc {\n`
      Object.entries(styles.imageBlock.description).forEach(([prop, value]) => {
        css += `  ${this.camelToKebab(prop)}: ${value};\n`
      })
      css += `}\n\n`
    }

    // 缓存CSS结果（限制缓存大小）
    if (this.cssCache.size > 20) {
      this.cssCache.clear()
    }
    this.cssCache.set(cacheKey, css)

    return css
  }

  // 处理图文模板内容
  private processImageTextContent(html: string, template: Template): string {
    // 将图片转换为图文块结构
    const imgRegex = /<img([^>]+)>/g

    return html.replace(imgRegex, (match, attrs) => {
      // 解析img标签属性
      const srcMatch = attrs.match(/src=['"]([^'"]+)['"]/i)
      const altMatch = attrs.match(/alt=['"]([^'"]+)['"]/i)

      const src = srcMatch ? srcMatch[1] : ''
      const alt = altMatch ? altMatch[1] : ''

      return `
        <div class="image-block">
          <img src="${src}" alt="${alt}" />
          ${alt ? `<div class="image-title">${alt}</div>` : ''}
        </div>
      `
    })
  }

  // 注入固定元素
  private injectFixedElements(
    html: string,
    template: Template,
    variables: TemplateVariables
  ): string {
    let result = html

    // 只注入尾部元素（根据用户配置条件显示）
    if (template.fixedElements.footer) {
      const footerHTML = this.renderTemplateString(
        template.fixedElements.footer.template,
        variables
      )
      result = result + footerHTML
    }

    return result
  }

  // 简单模板变量替换（增加缓存）
  private renderTemplateString(template: string, variables: TemplateVariables): string {
    // 创建缓存键（包括模板和变量）
    const variablesKey = JSON.stringify(variables)
    const cacheKey = `${template}-${variablesKey}`

    // 检查缓存
    if (this.templateStringCache.has(cacheKey)) {
      return this.templateStringCache.get(cacheKey)!
    }

    let result = template

    // 多轮处理条件语句，直到没有条件语句为止
    for (let iteration = 0; iteration < 5; iteration++) {
      const beforeProcess = result

      // 处理条件语句 - 从最内层开始（无嵌套的先处理）
      result = result.replace(/\{\{#if\s+(\w+)\}\}((?:(?!\{\{#if|\{\{\/if\}\}).)*)\{\{\/if\}\}/g, (match, varName, content) => {
        const value = variables[varName]
        const hasValue = value && String(value).trim() !== ''
        return hasValue ? content.trim() : ''
      })

      // 如果这轮没有变化，跳出循环
      if (beforeProcess === result) {
        break
      }
    }

    // 处理简单变量替换
    result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = variables[key]
      return value ? String(value) : ''
    })

    // 清理任何残留的模板语法
    result = result.replace(/\{\{#if\s+\w+\}\}/g, '')
    result = result.replace(/\{\{\/if\}\}/g, '')
    result = result.replace(/\{\{[^}]*\}\}/g, '')

    // 清理多余的空白行
    result = result.replace(/\n\s*\n\s*\n/g, '\n\n')

    const finalResult = result.trim()

    // 缓存结果（限制缓存大小）
    if (this.templateStringCache.size > 30) {
      this.templateStringCache.clear()
    }
    this.templateStringCache.set(cacheKey, finalResult)

    return finalResult
  }

  // 用容器包装HTML
  private wrapWithContainer(html: string, template: Template): string {
    return `<div class="article-container">${html}</div>`
  }

  // 驼峰转短横线
  private camelToKebab(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
  }

  // 获取模板
  getTemplate(id: string): Template | undefined {
    return this.templates.get(id)
  }

  // 获取所有模板
  getAllTemplates(): Template[] {
    return Array.from(this.templates.values())
  }

  // 清理所有缓存（用于内存管理）
  clearCaches(): void {
    this.cssCache.clear()
    this.markdownCache.clear()
    this.analysisCache.clear()
    this.templateStringCache.clear()
  }

  // 获取缓存统计信息
  getCacheStats(): { css: number; markdown: number; analysis: number; templateString: number } {
    return {
      css: this.cssCache.size,
      markdown: this.markdownCache.size,
      analysis: this.analysisCache.size,
      templateString: this.templateStringCache.size
    }
  }
}