// 智能粘贴处理器 - 支持飞书、Notion、Word等格式
import TurndownService from 'turndown'
import { gfm } from 'turndown-plugin-gfm'

export interface PasteResult {
  markdown: string
  source: string
  hasImages: boolean
  imageCount: number
}

export class SmartPasteHandler {
  private turndown: TurndownService

  constructor() {
    this.turndown = new TurndownService({
      headingStyle: 'atx',
      hr: '---',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced',
      emDelimiter: '*',
      strongDelimiter: '**',
      linkStyle: 'inlined',
    })

    // 使用GitHub风格的Markdown（支持表格、删除线等）
    this.turndown.use(gfm)

    // 添加自定义规则
    this.addCustomRules()
  }

  /**
   * 检测粘贴内容的来源
   */
  detectSource(html: string): string {
    if (!html) return '纯文本'

    // 飞书文档特征
    if (html.includes('lark') || html.includes('feishu') || html.includes('data-lark')) {
      return '飞书文档'
    }

    // Notion特征
    if (html.includes('notion') || html.includes('data-block-id')) {
      return 'Notion'
    }

    // Word特征
    if (html.includes('mso-') || html.includes('Microsoft')) {
      return 'Word文档'
    }

    // Google Docs特征
    if (html.includes('docs-internal') || html.includes('docs.google.com')) {
      return 'Google Docs'
    }

    // 石墨文档
    if (html.includes('shimo')) {
      return '石墨文档'
    }

    // 语雀
    if (html.includes('yuque')) {
      return '语雀'
    }

    // 富文本HTML
    if (html.includes('<p>') || html.includes('<div>')) {
      return '富文本'
    }

    return '未知来源'
  }

  /**
   * 将HTML转换为Markdown
   */
  async convert(html: string, plainText: string = ''): Promise<PasteResult> {
    // 如果没有HTML，使用纯文本
    if (!html && plainText) {
      return {
        markdown: plainText,
        source: '纯文本',
        hasImages: false,
        imageCount: 0
      }
    }

    // 检测来源
    const source = this.detectSource(html)
    console.log('[粘贴处理器] 检测到来源:', source)

    // 预处理：清理HTML
    let cleanedHtml = this.cleanHTML(html, source)

    // 转换为Markdown
    let markdown = this.turndown.turndown(cleanedHtml)

    // 后处理：优化Markdown格式
    markdown = this.postProcess(markdown)

    // 检测图片
    const imageMatches = markdown.match(/!\[.*?\]\(.*?\)/g) || []
    const hasImages = imageMatches.length > 0

    console.log('[粘贴处理器] 转换完成:', {
      source,
      length: markdown.length,
      imageCount: imageMatches.length
    })

    return {
      markdown,
      source,
      hasImages,
      imageCount: imageMatches.length
    }
  }

  /**
   * 清理HTML，移除不必要的标签和属性
   */
  private cleanHTML(html: string, source: string): string {
    // 移除脚本和样式
    html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')

    // 移除注释
    html = html.replace(/<!--[\s\S]*?-->/g, '')

    // 清理飞书特殊标记
    if (source === '飞书文档') {
      html = html.replace(/data-lark-[^=]*="[^"]*"/g, '')
      html = html.replace(/class="[^"]*lark[^"]*"/g, '')
    }

    // 清理Notion特殊标记
    if (source === 'Notion') {
      html = html.replace(/data-block-id="[^"]*"/g, '')
      html = html.replace(/class="[^"]*notion[^"]*"/g, '')
    }

    // 清理Word的mso样式
    if (source === 'Word文档') {
      html = html.replace(/class="[^"]*Mso[^"]*"/gi, '')
      html = html.replace(/style="[^"]*mso[^"]*"/gi, '')
    }

    // 清理所有内联样式（保留基本格式）
    html = html.replace(/style="[^"]*"/g, '')

    // 清理空的span和div
    html = html.replace(/<span>\s*<\/span>/g, '')
    html = html.replace(/<div>\s*<\/div>/g, '')

    return html
  }

  /**
   * 后处理Markdown，优化格式
   */
  private postProcess(markdown: string): string {
    // 1. 清理多余的空行（最多保留2个换行）
    markdown = markdown.replace(/\n{3,}/g, '\n\n')

    // 2. 修复标题后的空行
    markdown = markdown.replace(/^(#{1,6}.*)\n{1}(?=[^\n#])/gm, '$1\n\n')

    // 3. 修复列表格式
    markdown = markdown.replace(/^([-*+] .+)$/gm, (match) => {
      return match.trim()
    })

    // 4. 清理行首和行尾的空格
    markdown = markdown.split('\n').map(line => line.trim()).join('\n')

    // 5. 确保代码块前后有空行
    markdown = markdown.replace(/\n```/g, '\n\n```')
    markdown = markdown.replace(/```\n/g, '```\n\n')

    // 6. 最终清理：移除开头和结尾的空行
    markdown = markdown.trim()

    return markdown
  }

  /**
   * 添加自定义转换规则
   */
  private addCustomRules() {
    // 保持图片的原始URL
    this.turndown.addRule('images', {
      filter: 'img',
      replacement: (content: string, node: any) => {
        const alt = node.getAttribute('alt') || ''
        const src = node.getAttribute('src') || ''
        const title = node.getAttribute('title') || ''

        if (!src) return ''

        const titlePart = title ? ` "${title}"` : ''
        return `![${alt}](${src}${titlePart})`
      }
    })

    // 处理表格
    this.turndown.addRule('table', {
      filter: 'table',
      replacement: (content: string) => {
        return '\n\n' + content + '\n\n'
      }
    })

    // 处理换行符
    this.turndown.addRule('linebreak', {
      filter: 'br',
      replacement: () => '  \n'
    })

    // 处理高亮文本（飞书/Notion常用）
    this.turndown.addRule('highlight', {
      filter: (node: any) => {
        return (
          node.nodeName === 'MARK' ||
          node.nodeName === 'SPAN' && (
            node.style.backgroundColor === 'yellow' ||
            node.style.backgroundColor === 'rgb(255, 255, 0)'
          )
        )
      },
      replacement: (content: string) => {
        return `==${content}==`  // 使用==标记高亮
      }
    })
  }

  /**
   * 快速检测是否应该使用智能粘贴
   */
  static shouldUseSmartPaste(html: string): boolean {
    if (!html) return false
    
    // 检测是否包含HTML标签
    return /<[a-z][\s\S]*>/i.test(html)
  }
}

// 导出单例
export const smartPasteHandler = new SmartPasteHandler()

