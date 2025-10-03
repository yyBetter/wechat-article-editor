// MCP调用Nano Banana生成封面图片
interface MCPClient {
  callTool(toolName: string, params: any): Promise<any>
}

interface CoverGenerationOptions {
  title: string
  content?: string
  style: 'professional' | 'casual' | 'tech' | 'business' | 'artistic' | 'minimal'
  colorScheme: 'blue' | 'green' | 'red' | 'purple' | 'orange' | 'monochrome' | 'brand'
  layout: 'center' | 'left' | 'right' | 'top' | 'bottom'
  size: '900x383' | '1200x600' | '1080x1080' | 'custom'
  customSize?: { width: number; height: number }
  brandColors?: string[]
  includeSubtitle?: string
}

interface GeneratedCover {
  id: string
  imageUrl: string
  imageData?: string // base64 encoded image
  prompt: string
  style: string
  size: string
  generatedAt: Date
  metadata: {
    model: string
    processingTime: number
    cost?: number
  }
}

interface CoverGenerationResult {
  success: boolean
  cover?: GeneratedCover
  error?: string
  suggestions?: string[]
}

class NanoBananaCoverGenerator {
  private mcpClient: MCPClient
  private defaultOptions: Partial<CoverGenerationOptions>

  constructor(mcpClient: MCPClient, defaultOptions: Partial<CoverGenerationOptions> = {}) {
    this.mcpClient = mcpClient
    this.defaultOptions = {
      style: 'professional',
      colorScheme: 'blue',
      layout: 'center',
      size: '900x383',
      ...defaultOptions
    }
  }

  // 主要生成方法
  async generateCover(options: Partial<CoverGenerationOptions> = {}): Promise<CoverGenerationResult> {
    const finalOptions: CoverGenerationOptions = {
      ...this.defaultOptions,
      ...options
    } as CoverGenerationOptions

    try {
      // 1. 验证输入
      const validation = this.validateOptions(finalOptions)
      if (!validation.valid) {
        return {
          success: false,
          error: `输入验证失败: ${validation.errors.join(', ')}`
        }
      }

      // 2. 构建生成提示词
      const prompt = this.buildImagePrompt(finalOptions)
      
      console.log('🎨 生成封面图片提示词:', prompt)

      // 3. 调用MCP工具生成图片
      const mcpResult = await this.callNanoBananaViaMCP(prompt, finalOptions)
      
      // 4. 处理结果
      return this.processResult(mcpResult, finalOptions, prompt)

    } catch (error) {
      console.error('封面生成失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  // 根据文章内容智能生成封面
  async generateCoverFromContent(
    title: string, 
    content: string, 
    options: Partial<CoverGenerationOptions> = {}
  ): Promise<CoverGenerationResult> {
    try {
      // 1. 分析内容特征
      const contentAnalysis = this.analyzeContent(content)
      
      // 2. 推荐样式和配色
      const recommendedOptions = this.recommendOptionsFromAnalysis(contentAnalysis, options)
      
      // 3. 生成封面
      return await this.generateCover({
        title,
        content: content.substring(0, 500), // 限制长度
        ...recommendedOptions
      })

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '内容分析失败'
      }
    }
  }

  // 批量生成不同风格的封面
  async generateMultipleCovers(
    baseOptions: Partial<CoverGenerationOptions>,
    variations: Array<Partial<CoverGenerationOptions>> = []
  ): Promise<CoverGenerationResult[]> {
    // 如果没有指定变化，使用默认的几种风格
    if (variations.length === 0) {
      variations = [
        { style: 'professional', colorScheme: 'blue' },
        { style: 'tech', colorScheme: 'monochrome' },
        { style: 'casual', colorScheme: 'green' },
        { style: 'business', colorScheme: 'purple' }
      ]
    }

    const results: CoverGenerationResult[] = []

    for (const variation of variations) {
      try {
        const result = await this.generateCover({
          ...baseOptions,
          ...variation
        })
        results.push(result)
        
        // 避免API调用过于频繁
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : '生成失败'
        })
      }
    }

    return results
  }

  // 构建图片生成提示词
  private buildImagePrompt(options: CoverGenerationOptions): string {
    const stylePrompts = {
      professional: '专业商务风格，简洁大方，现代设计',
      casual: '轻松友好风格，温暖色调，亲近感',
      tech: '科技感强，未来主义，几何图形，渐变效果',
      business: '商业专业，权威感，企业级设计',
      artistic: '艺术创意，独特视觉，创新表达',
      minimal: '极简主义，留白设计，简约美学'
    }

    const colorPrompts = {
      blue: '蓝色主调，专业可信',
      green: '绿色主调，自然活力',
      red: '红色主调，热情动感',
      purple: '紫色主调，优雅神秘',
      orange: '橙色主调，温暖创新',
      monochrome: '黑白灰单色调，简约现代',
      brand: options.brandColors ? `品牌色调 ${options.brandColors.join(', ')}` : '蓝色主调'
    }

    const layoutPrompts = {
      center: '居中对称布局',
      left: '左对齐布局，留白设计',
      right: '右对齐布局，动态平衡',
      top: '顶部标题，下方装饰',
      bottom: '底部标题，上方视觉'
    }

    let prompt = `Create a professional WeChat article cover image with the following requirements:

Title: "${options.title}"
${options.includeSubtitle ? `Subtitle: "${options.includeSubtitle}"` : ''}

Style: ${stylePrompts[options.style]}
Color scheme: ${colorPrompts[options.colorScheme]}
Layout: ${layoutPrompts[options.layout]}

Design specifications:
- Size: ${options.size === 'custom' && options.customSize ? `${options.customSize.width}x${options.customSize.height}` : options.size} pixels
- High quality, professional appearance
- Readable typography
- WeChat article cover format
- Modern, clean design
- Chinese text support if needed

Technical requirements:
- High resolution
- Optimized for mobile viewing
- Professional color balance
- Clear text hierarchy`

    // 如果有内容，添加内容相关的视觉元素建议
    if (options.content && options.content.length > 100) {
      const contentKeywords = this.extractKeywords(options.content)
      if (contentKeywords.length > 0) {
        prompt += `\n\nContent themes for visual elements: ${contentKeywords.join(', ')}`
      }
    }

    return prompt
  }

  // 调用MCP客户端生成图片
  private async callNanoBananaViaMCP(prompt: string, options: CoverGenerationOptions): Promise<any> {
    try {
      // 构建MCP调用参数
      const mcpParams = {
        prompt: prompt,
        width: this.getSizeFromString(options.size).width,
        height: this.getSizeFromString(options.size).height,
        model: 'nano-banana', // 或其他可用模型
        quality: 'high',
        style_preset: this.mapStyleToPreset(options.style),
        steps: 50, // 生成步数，影响质量
        cfg_scale: 7 // 提示词遵循度
      }

      console.log('📡 调用MCP Nano Banana工具:', mcpParams)

      // 实际调用MCP工具
      const result = await this.mcpClient.callTool('nano_banana_generate', mcpParams)
      
      return result
    } catch (error) {
      console.error('MCP调用失败:', error)
      throw new Error(`MCP调用失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 处理生成结果
  private processResult(
    mcpResult: any, 
    options: CoverGenerationOptions, 
    prompt: string
  ): CoverGenerationResult {
    try {
      // 检查MCP结果格式
      if (!mcpResult || !mcpResult.success) {
        return {
          success: false,
          error: mcpResult?.error || 'MCP调用返回失败'
        }
      }

      // 构建返回结果
      const cover: GeneratedCover = {
        id: `cover_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        imageUrl: mcpResult.image_url || '',
        imageData: mcpResult.image_data || '',
        prompt: prompt,
        style: options.style,
        size: options.size,
        generatedAt: new Date(),
        metadata: {
          model: 'nano-banana',
          processingTime: mcpResult.processing_time || 0,
          cost: mcpResult.cost
        }
      }

      // 生成使用建议
      const suggestions = this.generateUsageSuggestions(options)

      return {
        success: true,
        cover,
        suggestions
      }
    } catch (error) {
      return {
        success: false,
        error: `结果处理失败: ${error instanceof Error ? error.message : '未知错误'}`
      }
    }
  }

  // 分析内容特征
  private analyzeContent(content: string): any {
    const analysis = {
      wordCount: content.length,
      hasCode: /```|`[^`]+`/.test(content),
      hasList: /^\s*[-*+]\s+/m.test(content),
      hasNumbers: /\d+%|\d+\.\d+|\$\d+/.test(content),
      tone: content.includes('!') ? 'excited' : 'neutral',
      topics: this.extractKeywords(content),
      complexity: content.length > 1000 ? 'high' : content.length > 500 ? 'medium' : 'low'
    }

    return analysis
  }

  // 基于内容分析推荐选项
  private recommendOptionsFromAnalysis(
    analysis: any, 
    userOptions: Partial<CoverGenerationOptions>
  ): Partial<CoverGenerationOptions> {
    const recommended: Partial<CoverGenerationOptions> = {}

    // 根据内容推荐风格
    if (analysis.hasCode) {
      recommended.style = 'tech'
      recommended.colorScheme = 'monochrome'
    } else if (analysis.hasNumbers) {
      recommended.style = 'business'
      recommended.colorScheme = 'blue'
    } else if (analysis.tone === 'excited') {
      recommended.style = 'casual'
      recommended.colorScheme = 'orange'
    } else {
      recommended.style = 'professional'
      recommended.colorScheme = 'blue'
    }

    // 用户选项优先级更高
    return { ...recommended, ...userOptions }
  }

  // 提取关键词
  private extractKeywords(content: string): string[] {
    // 简单的关键词提取逻辑
    const words = content.match(/[\u4e00-\u9fa5a-zA-Z]{2,}/g) || []
    const frequency: Record<string, number> = {}
    
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1
    })

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word)
  }

  // 验证选项
  private validateOptions(options: CoverGenerationOptions): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!options.title || options.title.trim().length === 0) {
      errors.push('标题不能为空')
    }

    if (options.title && options.title.length > 50) {
      errors.push('标题过长（建议50字以内）')
    }

    if (options.size === 'custom' && !options.customSize) {
      errors.push('自定义尺寸时必须提供customSize参数')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // 从尺寸字符串解析尺寸
  private getSizeFromString(sizeStr: string): { width: number; height: number } {
    const sizeMap = {
      '900x383': { width: 900, height: 383 }, // 微信公众号标准
      '1200x600': { width: 1200, height: 600 },
      '1080x1080': { width: 1080, height: 1080 }
    }

    return sizeMap[sizeStr as keyof typeof sizeMap] || { width: 900, height: 383 }
  }

  // 映射风格到预设
  private mapStyleToPreset(style: string): string {
    const styleMap = {
      professional: 'corporate',
      casual: 'friendly',
      tech: 'futuristic',
      business: 'corporate',
      artistic: 'creative',
      minimal: 'clean'
    }

    return styleMap[style as keyof typeof styleMap] || 'corporate'
  }

  // 生成使用建议
  private generateUsageSuggestions(options: CoverGenerationOptions): string[] {
    const suggestions = [
      '建议在发布前预览图片在移动端的显示效果',
      '可以尝试A/B测试不同风格的封面，观察阅读量差异'
    ]

    if (options.style === 'casual') {
      suggestions.push('轻松风格适合生活类、情感类文章')
    }

    if (options.colorScheme === 'brand' && options.brandColors) {
      suggestions.push('品牌色彩有助于建立视觉识别度')
    }

    return suggestions
  }
}

// 模拟MCP客户端（用于测试）
export class MockMCPClient implements MCPClient {
  async callTool(toolName: string, params: any): Promise<any> {
    console.log(`🔧 模拟MCP调用: ${toolName}`, params)
    
    // 模拟生成结果
    await new Promise(resolve => setTimeout(resolve, 2000)) // 模拟API延迟

    return {
      success: true,
      image_url: `https://example.com/generated_image_${Date.now()}.jpg`,
      image_data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...(base64_encoded_image)',
      processing_time: 3.5,
      cost: 0.02
    }
  }
}

// 导出
export { NanoBananaCoverGenerator }
export type { 
  MCPClient, 
  CoverGenerationOptions, 
  GeneratedCover, 
  CoverGenerationResult 
}