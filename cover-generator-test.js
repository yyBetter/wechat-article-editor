// Nano Banana封面生成器测试文件
// 运行方式: node cover-generator-test.js

// 模拟MCP客户端
class MockMCPClient {
  async callTool(toolName, params) {
    console.log(`🔧 模拟MCP调用工具: ${toolName}`)
    console.log('📝 参数:', JSON.stringify(params, null, 2))
    
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 模拟成功返回结果
    return {
      success: true,
      image_url: `https://example.com/generated_cover_${Date.now()}.jpg`,
      image_data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...(模拟的base64编码图片数据)',
      processing_time: Math.random() * 5 + 2, // 2-7秒
      cost: Math.random() * 0.05 + 0.01 // $0.01-0.06
    }
  }
}

// 简化的封面生成器
class NanoBananaCoverGeneratorTest {
  constructor(mcpClient, defaultOptions = {}) {
    this.mcpClient = mcpClient
    this.defaultOptions = {
      style: 'professional',
      colorScheme: 'blue',
      layout: 'center',
      size: '900x383',
      ...defaultOptions
    }
  }

  async generateCover(options = {}) {
    const finalOptions = {
      ...this.defaultOptions,
      ...options
    }

    console.log('🎨 开始生成封面图片...')
    console.log('📋 生成参数:', finalOptions)

    try {
      // 1. 验证输入
      const validation = this.validateOptions(finalOptions)
      if (!validation.valid) {
        return {
          success: false,
          error: `输入验证失败: ${validation.errors.join(', ')}`
        }
      }

      // 2. 构建提示词
      const prompt = this.buildImagePrompt(finalOptions)
      console.log('💬 生成的提示词:')
      console.log('-'.repeat(50))
      console.log(prompt)
      console.log('-'.repeat(50))

      // 3. 调用MCP
      const mcpResult = await this.callNanoBananaViaMCP(prompt, finalOptions)
      
      // 4. 处理结果
      return this.processResult(mcpResult, finalOptions, prompt)

    } catch (error) {
      console.error('❌ 封面生成失败:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async generateCoverFromContent(title, content, options = {}) {
    console.log('📝 根据内容智能生成封面...')
    
    // 分析内容特征
    const contentAnalysis = this.analyzeContent(content)
    console.log('🔍 内容分析结果:', contentAnalysis)
    
    // 推荐样式
    const recommendedOptions = this.recommendOptionsFromAnalysis(contentAnalysis, options)
    console.log('💡 推荐的样式配置:', recommendedOptions)
    
    // 生成封面
    return await this.generateCover({
      title,
      content: content.substring(0, 500),
      ...recommendedOptions
    })
  }

  buildImagePrompt(options) {
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
      monochrome: '黑白灰单色调，简约现代'
    }

    const layoutPrompts = {
      center: '居中对称布局',
      left: '左对齐布局，留白设计',
      right: '右对齐布局，动态平衡',
      top: '顶部标题，下方装饰',
      bottom: '底部标题，上方视觉'
    }

    let prompt = `Create a professional WeChat article cover image:

Title: "${options.title}"
${options.includeSubtitle ? `Subtitle: "${options.includeSubtitle}"` : ''}

Style: ${stylePrompts[options.style]}
Color scheme: ${colorPrompts[options.colorScheme]}
Layout: ${layoutPrompts[options.layout]}

Specifications:
- Size: ${options.size} pixels
- High quality, professional appearance
- Readable Chinese typography
- WeChat article cover format
- Modern, clean design`

    if (options.content && options.content.length > 100) {
      const keywords = this.extractKeywords(options.content)
      if (keywords.length > 0) {
        prompt += `\n\nContent themes: ${keywords.join(', ')}`
      }
    }

    return prompt
  }

  async callNanoBananaViaMCP(prompt, options) {
    const size = this.getSizeFromString(options.size)
    
    const mcpParams = {
      prompt: prompt,
      width: size.width,
      height: size.height,
      model: 'nano-banana',
      quality: 'high',
      style_preset: this.mapStyleToPreset(options.style),
      steps: 50,
      cfg_scale: 7
    }

    console.log('📡 MCP调用参数:', mcpParams)
    return await this.mcpClient.callTool('nano_banana_generate', mcpParams)
  }

  processResult(mcpResult, options, prompt) {
    if (!mcpResult || !mcpResult.success) {
      return {
        success: false,
        error: mcpResult?.error || 'MCP调用失败'
      }
    }

    const cover = {
      id: `cover_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      imageUrl: mcpResult.image_url,
      imageData: mcpResult.image_data,
      prompt: prompt,
      style: options.style,
      size: options.size,
      generatedAt: new Date(),
      metadata: {
        model: 'nano-banana',
        processingTime: mcpResult.processing_time,
        cost: mcpResult.cost
      }
    }

    const suggestions = this.generateUsageSuggestions(options)

    return {
      success: true,
      cover,
      suggestions
    }
  }

  analyzeContent(content) {
    return {
      wordCount: content.length,
      hasCode: /```|`[^`]+`/.test(content),
      hasList: /^\s*[-*+]\s+/m.test(content),
      hasNumbers: /\d+%|\d+\.\d+|\$\d+/.test(content),
      tone: content.includes('!') ? 'excited' : 'neutral',
      topics: this.extractKeywords(content),
      complexity: content.length > 1000 ? 'high' : content.length > 500 ? 'medium' : 'low'
    }
  }

  recommendOptionsFromAnalysis(analysis, userOptions) {
    const recommended = {}

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

    return { ...recommended, ...userOptions }
  }

  extractKeywords(content) {
    const words = content.match(/[\u4e00-\u9fa5a-zA-Z]{2,}/g) || []
    const frequency = {}
    
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1
    })

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word)
  }

  validateOptions(options) {
    const errors = []

    if (!options.title || options.title.trim().length === 0) {
      errors.push('标题不能为空')
    }

    if (options.title && options.title.length > 50) {
      errors.push('标题过长（建议50字以内）')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  getSizeFromString(sizeStr) {
    const sizeMap = {
      '900x383': { width: 900, height: 383 },
      '1200x600': { width: 1200, height: 600 },
      '1080x1080': { width: 1080, height: 1080 }
    }
    return sizeMap[sizeStr] || { width: 900, height: 383 }
  }

  mapStyleToPreset(style) {
    const styleMap = {
      professional: 'corporate',
      casual: 'friendly',
      tech: 'futuristic',
      business: 'corporate',
      artistic: 'creative',
      minimal: 'clean'
    }
    return styleMap[style] || 'corporate'
  }

  generateUsageSuggestions(options) {
    const suggestions = [
      '建议在发布前预览图片在移动端的显示效果',
      '可以尝试A/B测试不同风格的封面，观察阅读量差异'
    ]

    if (options.style === 'casual') {
      suggestions.push('轻松风格适合生活类、情感类文章')
    }

    return suggestions
  }
}

// 测试函数
async function testCoverGenerator() {
  console.log('🚀 开始测试Nano Banana封面生成器...\n')

  // 1. 创建模拟MCP客户端
  const mcpClient = new MockMCPClient()
  const generator = new NanoBananaCoverGeneratorTest(mcpClient)

  // 2. 测试文章数据
  const testTitle = "深度解析：AI如何改变内容创作的未来"
  const testContent = `
随着人工智能技术的快速发展，AI工具正在深刻改变内容创作行业。从ChatGPT到各种AI写作助手，创作者们发现自己的工作流程正在被重新定义。

在这篇文章中，我将分享我过去6个月使用AI工具进行内容创作的实际经验，包括如何选择合适的AI工具、如何设计有效的提示词，以及如何将AI生成的内容与人类创意相结合。

通过合理运用这些AI工具，我的写作效率提升了近300%，同时内容质量也得到了显著改善。更重要的是，AI让我能够探索以前从未尝试过的内容形式和写作风格。

但AI工具也带来了新的挑战：如何保持内容的原创性？如何避免过度依赖AI？如何在提高效率的同时保持人文关怀？

本文将深入探讨这些问题，并提供实用的解决方案。无论你是内容创作新手还是资深从业者，相信都能从中获得有价值的启发。
`

  // 3. 测试基础封面生成
  console.log('📝 测试1: 基础封面生成')
  console.log('='.repeat(50))
  
  const basicResult = await generator.generateCover({
    title: testTitle,
    style: 'professional',
    colorScheme: 'blue',
    layout: 'center'
  })

  if (basicResult.success) {
    console.log('✅ 基础生成成功!')
    console.log(`🆔 封面ID: ${basicResult.cover.id}`)
    console.log(`🔗 图片URL: ${basicResult.cover.imageUrl}`)
    console.log(`⏱️ 处理时间: ${basicResult.cover.metadata.processingTime.toFixed(2)}秒`)
    console.log(`💰 成本: $${basicResult.cover.metadata.cost.toFixed(4)}`)
    console.log(`💡 使用建议: ${basicResult.suggestions.join('; ')}`)
  } else {
    console.log('❌ 基础生成失败:', basicResult.error)
  }

  await new Promise(resolve => setTimeout(resolve, 1000))

  // 4. 测试智能内容分析生成
  console.log('\n📝 测试2: 基于内容智能生成封面')
  console.log('='.repeat(50))
  
  const smartResult = await generator.generateCoverFromContent(testTitle, testContent)

  if (smartResult.success) {
    console.log('✅ 智能生成成功!')
    console.log(`🎨 推荐风格: ${smartResult.cover.style}`)
    console.log(`🔗 图片URL: ${smartResult.cover.imageUrl}`)
    console.log(`📝 使用的提示词长度: ${smartResult.cover.prompt.length}字符`)
  } else {
    console.log('❌ 智能生成失败:', smartResult.error)
  }

  await new Promise(resolve => setTimeout(resolve, 1000))

  // 5. 测试多种风格生成
  console.log('\n📝 测试3: 多种风格批量生成')
  console.log('='.repeat(50))

  const styles = ['professional', 'tech', 'casual', 'minimal']
  for (const style of styles) {
    console.log(`\n🎨 生成风格: ${style}`)
    console.log('-'.repeat(30))
    
    const styleResult = await generator.generateCover({
      title: testTitle,
      style: style,
      colorScheme: style === 'tech' ? 'monochrome' : 'blue'
    })

    if (styleResult.success) {
      console.log(`✅ ${style}风格生成成功`)
      console.log(`⏱️ 处理时间: ${styleResult.cover.metadata.processingTime.toFixed(2)}秒`)
    } else {
      console.log(`❌ ${style}风格生成失败:`, styleResult.error)
    }

    // 避免调用过于频繁
    await new Promise(resolve => setTimeout(resolve, 1500))
  }

  console.log('\n✨ 测试完成!')
  console.log('\n💡 集成到项目的步骤:')
  console.log('1. 安装MCP客户端依赖')
  console.log('2. 配置Nano Banana的MCP连接')
  console.log('3. 在项目中集成CoverGenerator组件')
  console.log('4. 添加封面生成的UI界面')
}

// 运行测试
testCoverGenerator().catch(console.error)

// 导出供其他文件使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NanoBananaCoverGeneratorTest, MockMCPClient }
}