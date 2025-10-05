/**
 * AI 功能快速测试
 * 测试 DeepSeek API 连接和各项功能
 */

import { AIService } from '../src/services/ai/ai-service'

const API_KEY = 'sk-f52066db4c8748c793e70bcaf7c72397'

async function testAIFunctions() {
  console.log('🚀 开始测试 DeepSeek AI 功能...\n')

  const ai = new AIService(API_KEY)

  try {
    // 测试1: 标题生成
    console.log('📝 测试1: 标题生成')
    console.log('输入: 一篇关于提升工作效率的文章...')
    const titles = await ai.generateTitles(`
      在当今快节奏的工作环境中，提升工作效率已成为每个职场人的必修课。
      本文将分享10个经过验证的实用技巧，帮助你更好地管理时间、提高专注力。
      通过这些方法，你可以在同样的时间内完成更多工作，同时保持工作质量。
    `)
    console.log('✅ 生成的标题：')
    titles.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.title} (${t.style}, 评分:${t.score})`)
    })
    console.log('')

    // 测试2: 摘要生成
    console.log('📝 测试2: 摘要生成')
    const summary = await ai.generateSummary(`
      人工智能正在改变我们的生活方式。从智能手机到自动驾驶汽车，
      AI技术已经渗透到各个领域。然而，随着技术的发展，我们也面临着
      隐私保护、就业影响等挑战。本文将探讨AI技术的发展现状、
      应用场景以及未来趋势。
    `, 80)
    console.log('✅ 生成的摘要：')
    console.log(`   ${summary}`)
    console.log('')

    // 测试3: 大纲生成
    console.log('📝 测试3: 大纲生成')
    const outline = await ai.generateOutline('如何成为一名优秀的程序员', 'tutorial')
    console.log('✅ 生成的大纲：')
    console.log(`   总字数: ${outline.totalWords}`)
    console.log(`   阅读时长: ${outline.readingTime}分钟`)
    console.log('   结构:')
    outline.outline.forEach((node, i) => {
      console.log(`   ${i + 1}. ${node.title} (${node.estimatedWords}字)`)
      console.log(`      ${node.description}`)
    })
    console.log('')

    // 测试4: 文本润色
    console.log('📝 测试4: 文本润色')
    const originalText = '这个功能很好用，大家都应该试试。'
    console.log(`   原文: ${originalText}`)
    const polished = await ai.polishText(originalText, 'professional')
    console.log(`   润色后: ${polished}`)
    console.log('')

    // 测试5: 关键词提取
    console.log('📝 测试5: 关键词提取')
    const keywords = await ai.extractKeywords(`
      云计算是一种按需提供计算资源的服务模式。
      用户可以通过互联网访问存储、计算能力和应用程序，
      无需购买和维护物理服务器。主流的云服务提供商包括
      AWS、Azure和阿里云。
    `)
    console.log('✅ 提取的关键词：')
    keywords.keywords.forEach(kw => {
      console.log(`   - ${kw.word} (${kw.category}, 权重:${kw.weight})`)
    })
    console.log(`   标签: ${keywords.tags.join(', ')}`)
    console.log('')

    // 成本统计
    console.log('💰 成本预估：')
    const testContent = '这是一个测试内容，用于估算token数量和成本'
    const tokens = ai.client.estimateTokens(testContent)
    const cost = ai.estimateCost(testContent, 500)
    console.log(`   测试内容tokens: ${tokens}`)
    console.log(`   预估单次成本: ¥${cost.toFixed(6)}`)
    console.log('')

    console.log('🎉 所有测试通过！DeepSeek API 工作正常！')

  } catch (error) {
    console.error('❌ 测试失败:', error)
    if (error instanceof Error) {
      console.error('错误详情:', error.message)
    }
  }
}

// 运行测试
testAIFunctions()

