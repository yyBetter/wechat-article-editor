// DeepSeek AI标题生成器
interface DeepSeekConfig {
  apiKey: string
  baseURL?: string
  model?: string
}

interface TitleGenerationOptions {
  style: 'professional' | 'casual' | 'marketing' | 'academic' | 'creative'
  targetAudience: 'general' | 'tech' | 'business' | 'lifestyle'
  maxLength: number
  count: number
  avoidClickbait: boolean
}

interface GeneratedTitle {
  title: string
  score: {
    attractiveness: number    // 吸引力 1-10
    accuracy: number         // 准确性 1-10
    readability: number      // 可读性 1-10
    seoValue: number        // SEO价值 1-10
  }
  keywords: string[]
  reasoning: string
  risks: string[]
}

interface TitleGenerationResult {
  success: boolean
  titles: GeneratedTitle[]
  error?: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

class DeepSeekTitleGenerator {
  private config: DeepSeekConfig
  private baseURL: string

  constructor(config: DeepSeekConfig) {
    this.config = config
    this.baseURL = config.baseURL || 'https://api.deepseek.com'
  }

  // 生成标题的核心方法
  async generateTitles(
    content: string, 
    options: Partial<TitleGenerationOptions> = {}
  ): Promise<TitleGenerationResult> {
    const opts: TitleGenerationOptions = {
      style: 'professional',
      targetAudience: 'general',
      maxLength: 25,
      count: 5,
      avoidClickbait: true,
      ...options
    }

    try {
      // 预处理内容
      const processedContent = this.preprocessContent(content)
      
      // 构建提示词
      const prompt = this.buildPrompt(processedContent, opts)
      
      // 调用DeepSeek API
      const response = await this.callDeepSeekAPI(prompt, opts)
      
      // 解析结果
      return this.parseResponse(response)
      
    } catch (error) {
      console.error('标题生成失败:', error)
      return {
        success: false,
        titles: [],
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  // 预处理文章内容
  private preprocessContent(content: string): string {
    // 移除markdown标记
    let processed = content.replace(/[#*`]/g, '')
    
    // 限制长度，避免token过多
    if (processed.length > 2000) {
      processed = processed.substring(0, 2000) + '...'
    }
    
    return processed.trim()
  }

  // 构建AI提示词
  private buildPrompt(content: string, options: TitleGenerationOptions): string {
    const styleGuide = this.getStyleGuide(options.style)
    const audienceGuide = this.getAudienceGuide(options.targetAudience)
    
    return `你是一个专业的公众号运营专家和文案策划师。请为以下文章内容生成${options.count}个高质量标题。

## 文章内容
${content}

## 要求
- 风格：${styleGuide}
- 目标读者：${audienceGuide}  
- 标题长度：${options.maxLength}字以内
- 避免标题党：${options.avoidClickbait ? '是' : '否'}

## 生成策略
请生成不同策略的标题：
1. 价值导向：明确告诉读者能获得什么
2. 好奇驱动：激发读者的好奇心和探索欲
3. 权威背书：体现专业性和可信度
4. 情感共鸣：触达读者的情感痛点或需求
5. 创新角度：提供独特的视角和见解

## 评估标准
为每个标题评估：
- 吸引力：能否吸引目标读者点击 (1-10分)
- 准确性：是否准确反映文章内容 (1-10分)  
- 可读性：是否通俗易懂 (1-10分)
- SEO价值：是否包含有效关键词 (1-10分)

## 输出格式
请严格按照以下JSON格式输出，不要添加任何其他文字：

{
  "titles": [
    {
      "title": "具体标题文字",
      "score": {
        "attractiveness": 8,
        "accuracy": 9,
        "readability": 8,
        "seoValue": 7
      },
      "keywords": ["关键词1", "关键词2"],
      "reasoning": "选择这个标题的理由和策略说明",
      "risks": ["可能的风险或需要注意的点"]
    }
  ]
}`
  }

  // 获取不同风格的指导
  private getStyleGuide(style: TitleGenerationOptions['style']): string {
    const guides = {
      professional: '正式专业，适合商务和技术类内容，用词准确严谨',
      casual: '轻松自然，贴近日常对话，有亲和力',
      marketing: '营销导向，突出价值和收益，但避免过度包装',
      academic: '学术严谨，注重准确性和逻辑性',
      creative: '创意新颖，语言生动，敢于突破常规'
    }
    return guides[style]
  }

  // 获取不同受众的指导
  private getAudienceGuide(audience: TitleGenerationOptions['targetAudience']): string {
    const guides = {
      general: '普通大众，用词通俗易懂，避免过多专业术语',
      tech: '技术人员和科技爱好者，可使用适当的技术术语',
      business: '商务人士和企业决策者，关注商业价值和实用性',
      lifestyle: '生活方式关注者，注重生活品质和个人成长'
    }
    return guides[audience]
  }

  // 调用DeepSeek API
  private async callDeepSeekAPI(prompt: string, options: TitleGenerationOptions): Promise<any> {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model || 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        stream: false
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`DeepSeek API错误: ${response.status} - ${errorText}`)
    }

    return await response.json()
  }

  // 解析API响应
  private parseResponse(response: any): TitleGenerationResult {
    try {
      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('API返回内容为空')
      }

      // 尝试解析JSON
      const result = JSON.parse(content)
      
      if (!result.titles || !Array.isArray(result.titles)) {
        throw new Error('返回格式不正确')
      }

      return {
        success: true,
        titles: result.titles,
        usage: response.usage
      }
    } catch (error) {
      console.error('解析响应失败:', error)
      return {
        success: false,
        titles: [],
        error: `响应解析失败: ${error instanceof Error ? error.message : '未知错误'}`
      }
    }
  }

  // 批量生成多种风格的标题
  async generateMultiStyleTitles(content: string, baseOptions: Partial<TitleGenerationOptions> = {}): Promise<Record<string, TitleGenerationResult>> {
    const styles: TitleGenerationOptions['style'][] = ['professional', 'casual', 'marketing', 'creative']
    const results: Record<string, TitleGenerationResult> = {}

    for (const style of styles) {
      try {
        const result = await this.generateTitles(content, {
          ...baseOptions,
          style,
          count: 3 // 每种风格生成3个
        })
        results[style] = result
        
        // 避免API调用过于频繁
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        results[style] = {
          success: false,
          titles: [],
          error: error instanceof Error ? error.message : '生成失败'
        }
      }
    }

    return results
  }

  // 验证配置
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (!this.config.apiKey) {
      errors.push('缺少API Key')
    }
    
    if (this.config.apiKey && !this.config.apiKey.startsWith('sk-')) {
      errors.push('API Key格式可能不正确')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

// 导出工厂函数
export function createTitleGenerator(config: DeepSeekConfig): DeepSeekTitleGenerator {
  return new DeepSeekTitleGenerator(config)
}

// 导出类型
export type { 
  DeepSeekConfig, 
  TitleGenerationOptions, 
  GeneratedTitle, 
  TitleGenerationResult 
}

export { DeepSeekTitleGenerator }