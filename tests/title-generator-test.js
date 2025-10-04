// DeepSeek标题生成器测试文件
// 运行方式: node title-generator-test.js

// Node.js 18+内置fetch支持

// 模拟DeepSeek标题生成器
class DeepSeekTitleGeneratorTest {
  constructor(apiKey) {
    this.apiKey = apiKey
    this.baseURL = 'https://api.deepseek.com'
  }

  async generateTitles(content, options = {}) {
    const opts = {
      style: 'professional',
      targetAudience: 'general',
      maxLength: 25,
      count: 5,
      avoidClickbait: true,
      ...options
    }

    try {
      const prompt = this.buildPrompt(content, opts)
      console.log('🤖 发送给DeepSeek的提示词:')
      console.log('=' * 50)
      console.log(prompt)
      console.log('=' * 50)
      
      const response = await this.callDeepSeekAPI(prompt, opts)
      return this.parseResponse(response)
      
    } catch (error) {
      console.error('❌ 标题生成失败:', error)
      return {
        success: false,
        titles: [],
        error: error.message
      }
    }
  }

  buildPrompt(content, options) {
    const styleGuide = {
      professional: '正式专业，适合商务和技术类内容',
      casual: '轻松自然，贴近日常对话',
      marketing: '营销导向，突出价值和收益',
      creative: '创意新颖，语言生动'
    }[options.style]

    return `你是一个专业的公众号运营专家。请为以下文章内容生成${options.count}个高质量标题。

## 文章内容
${content.substring(0, 1000)}...

## 要求
- 风格：${styleGuide}
- 标题长度：${options.maxLength}字以内
- 避免标题党：${options.avoidClickbait ? '是' : '否'}

## 输出格式
请严格按照以下JSON格式输出：

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
      "reasoning": "选择理由",
      "risks": ["潜在风险"]
    }
  ]
}`
  }

  async callDeepSeekAPI(prompt, options) {
    console.log('📡 调用DeepSeek API...')
    
    // 如果没有API Key，模拟返回结果用于测试
    if (!this.apiKey || this.apiKey === 'your-api-key-here') {
      console.log('⚠️ 使用模拟数据（未配置真实API Key）')
      return {
        choices: [{
          message: {
            content: JSON.stringify({
              titles: [
                {
                  title: "深度解析：AI如何改变内容创作的未来",
                  score: {
                    attractiveness: 8,
                    accuracy: 9,
                    readability: 8,
                    seoValue: 7
                  },
                  keywords: ["AI", "内容创作", "未来"],
                  reasoning: "结合了权威分析和未来趋势，吸引技术和内容从业者",
                  risks: ["可能过于宏观，需要具体案例支撑"]
                },
                {
                  title: "从0到1：我用AI工具提升写作效率300%",
                  score: {
                    attractiveness: 9,
                    accuracy: 8,
                    readability: 9,
                    seoValue: 8
                  },
                  keywords: ["AI工具", "写作效率", "实践"],
                  reasoning: "具体数据和个人经验，实用性强",
                  risks: ["数据需要真实可验证"]
                },
                {
                  title: "ChatGPT之后，下一个爆款AI应用在哪里？",
                  score: {
                    attractiveness: 8,
                    accuracy: 7,
                    readability: 9,
                    seoValue: 8
                  },
                  keywords: ["ChatGPT", "AI应用", "趋势"],
                  reasoning: "蹭热点同时提出思考，引发讨论",
                  risks: ["需要有实质性的分析，不能只是热点标题"]
                }
              ]
            })
          }
        }],
        usage: {
          prompt_tokens: 500,
          completion_tokens: 200,
          total_tokens: 700
        }
      }
    }

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1500,
        stream: false
      })
    })

    if (!response.ok) {
      throw new Error(`API错误: ${response.status} - ${await response.text()}`)
    }

    return await response.json()
  }

  parseResponse(response) {
    try {
      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('API返回内容为空')
      }

      const result = JSON.parse(content)
      
      return {
        success: true,
        titles: result.titles,
        usage: response.usage
      }
    } catch (error) {
      return {
        success: false,
        titles: [],
        error: `响应解析失败: ${error.message}`
      }
    }
  }
}

// 测试函数
async function testTitleGenerator() {
  console.log('🚀 开始测试DeepSeek标题生成器...\n')

  // 1. 配置API Key（请替换为你的真实API Key）
  const apiKey = process.env.DEEPSEEK_API_KEY || 'your-api-key-here'
  const generator = new DeepSeekTitleGeneratorTest(apiKey)

  // 2. 测试文章内容
  const testContent = `
随着人工智能技术的快速发展，AI工具正在深刻改变内容创作行业。从ChatGPT到各种AI写作助手，创作者们发现自己的工作流程正在被重新定义。

在这篇文章中，我将分享我过去6个月使用AI工具进行内容创作的实际经验，包括如何选择合适的AI工具、如何设计有效的提示词，以及如何将AI生成的内容与人类创意相结合。

通过合理运用这些AI工具，我的写作效率提升了近300%，同时内容质量也得到了显著改善。更重要的是，AI让我能够探索以前从未尝试过的内容形式和写作风格。

但AI工具也带来了新的挑战：如何保持内容的原创性？如何避免过度依赖AI？如何在提高效率的同时保持人文关怀？

本文将深入探讨这些问题，并提供实用的解决方案。无论你是内容创作新手还是资深从业者，相信都能从中获得有价值的启发。
`

  // 3. 测试不同风格的标题生成
  const styles = ['professional', 'casual', 'marketing', 'creative']
  
  for (const style of styles) {
    console.log(`\n📝 测试风格: ${style}`)
    console.log('-'.repeat(40))
    
    const result = await generator.generateTitles(testContent, {
      style: style,
      count: 3,
      maxLength: 25,
      targetAudience: 'tech'
    })

    if (result.success) {
      console.log('✅ 生成成功!')
      result.titles.forEach((title, index) => {
        console.log(`\n${index + 1}. ${title.title}`)
        console.log(`   📊 评分: 吸引力${title.score.attractiveness} | 准确性${title.score.accuracy} | 可读性${title.score.readability} | SEO${title.score.seoValue}`)
        console.log(`   🔍 关键词: ${title.keywords.join(', ')}`)
        console.log(`   💡 理由: ${title.reasoning}`)
        if (title.risks.length > 0) {
          console.log(`   ⚠️ 风险: ${title.risks.join('; ')}`)
        }
      })
      
      if (result.usage) {
        console.log(`\n📈 Token使用: ${result.usage.total_tokens} (提示${result.usage.prompt_tokens} + 完成${result.usage.completion_tokens})`)
      }
    } else {
      console.log('❌ 生成失败:', result.error)
    }

    // 避免API调用过于频繁
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log('\n✨ 测试完成!')
  console.log('\n💡 使用说明:')
  console.log('1. 设置环境变量: export DEEPSEEK_API_KEY="你的API密钥"')
  console.log('2. 或者直接修改代码中的apiKey变量')
  console.log('3. 运行: node title-generator-test.js')
}

// 运行测试
testTitleGenerator().catch(console.error)

// 导出供其他文件使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DeepSeekTitleGeneratorTest }
}