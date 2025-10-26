// AI写作工作室 API路由
import express from 'express'
import { authenticateToken } from '../middleware/auth'
import { createSuccessResponse, createErrorResponse } from '../utils/validation'
import { checkAIUsage, incrementAIUsage } from '../utils/ai-usage'
import OpenAI from 'openai'

const router = express.Router()

// 初始化OpenAI客户端
const getOpenAIClient = () => {
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY
  const baseURL = process.env.DEEPSEEK_API_KEY 
    ? 'https://api.deepseek.com/v1' 
    : 'https://api.openai.com/v1'
  
  if (!apiKey) {
    throw new Error('未配置AI API密钥，请在环境变量中设置 DEEPSEEK_API_KEY 或 OPENAI_API_KEY')
  }

  return new OpenAI({
    apiKey,
    baseURL
  })
}

/**
 * 风格化改写
 * POST /api/ai-studio/rewrite
 */
router.post('/rewrite', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id
    const { content, styleId, customPrompt } = req.body

    // 验证输入
    if (!content || !content.trim()) {
      return res.status(400).json(createErrorResponse('内容不能为空'))
    }

    if (!styleId) {
      return res.status(400).json(createErrorResponse('请选择风格'))
    }

    // 检查AI使用次数
    const canUse = await checkAIUsage(userId)
    if (!canUse) {
      return res.status(403).json(createErrorResponse(
        'AI使用次数已达上限',
        'AI_USAGE_LIMIT_EXCEEDED'
      ))
    }

    // 构建提示词
    let prompt = ''
    
    // 根据styleId构建不同的提示词
    const stylePrompts: Record<string, string> = {
      liurun: `你是一位擅长商业分析的专业作者，写作风格类似刘润。你的文章特点是：
1. 结构清晰：问题→分析→模型→建议→升华
2. 语言精准：多用商业术语，少用形容词
3. 逻辑严密：每个观点都有案例和数据支撑
4. 金句频出：善于提炼可传播的观点
5. 实战导向：注重方法论的可落地性

请用这种风格改写以下内容，保持原文的核心观点和信息。`,
      
      fandeng: `你是一位知识分享者，写作风格类似樊登。你的文章特点是：
1. 故事化：用真实案例引入话题
2. 通俗化：把复杂概念讲得简单易懂
3. 对话感：像在和读者聊天
4. 温暖感：鼓励和正能量
5. 实用性：给出可操作的建议

请用这种风格改写以下内容，保持原文的核心观点和信息。`,
      
      lixiaolai: `你是一位理性思考者，写作风格类似李笑来。你的文章特点是：
1. 颠覆性：挑战常见认知
2. 逻辑性：层层递进分析
3. 犀利感：直白不留情面
4. 深度感：引发深度思考
5. 行动力：号召认知升级

请用这种风格改写以下内容，保持原文的核心观点和信息。`,
      
      luoyonghao: `你是一位幽默犀利的表达者，写作风格类似罗永浩。你的文章特点是：
1. 幽默感：善用段子和自嘲
2. 批判性：敢于吐槽和质疑
3. 情怀感：理想主义色彩
4. 真实感：不装、接地气
5. 节奏感：转折和反转多

请用这种风格改写以下内容，保持原文的核心观点和信息。`,
      
      simple: `你是一位专业的内容创作者，写作风格简约清晰。你的文章特点是：
1. 结构清晰：开门见山，条理分明
2. 语言简洁：不拖泥带水
3. 信息密集：高信息含量
4. 客观准确：避免主观臆断
5. 易于理解：专业但不晦涩

请用这种风格改写以下内容，保持原文的核心观点和信息。`,
      
      storytelling: `你是一位故事叙述者，擅长用故事传递观点。你的文章特点是：
1. 故事性：用完整的故事展开内容
2. 画面感：细节描写丰富
3. 情感性：打动人心
4. 代入感：让读者身临其境
5. 启发性：故事中蕴含道理

请用这种风格改写以下内容，保持原文的核心观点和信息。`
    }

    prompt = stylePrompts[styleId] || stylePrompts['simple']
    
    // 如果有自定义提示词，追加
    if (customPrompt) {
      prompt += `\n\n额外要求：${customPrompt}`
    }

    // 调用AI API
    const openai = getOpenAIClient()
    
    console.log(`[AI Studio] 开始改写，用户：${userId}，风格：${styleId}，内容长度：${content.length}`)
    
    const completion = await openai.chat.completions.create({
      model: process.env.DEEPSEEK_API_KEY ? 'deepseek-chat' : 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: prompt
        },
        {
          role: 'user',
          content: `【原文】\n${content}\n\n【要求】\n直接输出改写后的完整文章，不需要额外说明。`
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    })

    const rewrittenContent = completion.choices[0]?.message?.content || ''

    if (!rewrittenContent) {
      throw new Error('AI返回内容为空')
    }

    // 增加使用次数
    await incrementAIUsage(userId, 'ai_studio_rewrite')

    console.log(`[AI Studio] 改写完成，输出长度：${rewrittenContent.length}`)

    res.json(createSuccessResponse({
      originalContent: content,
      rewrittenContent,
      styleId,
      stats: {
        originalLength: content.length,
        rewrittenLength: rewrittenContent.length,
        tokensUsed: completion.usage?.total_tokens || 0
      }
    }))

  } catch (error) {
    console.error('[AI Studio] 改写失败:', error)
    res.status(500).json(createErrorResponse(
      error instanceof Error ? error.message : 'AI改写失败，请稍后重试'
    ))
  }
})

/**
 * 内容优化（生成优化建议）
 * POST /api/ai-studio/optimize
 */
router.post('/optimize', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id
    const { content, focusAreas } = req.body

    if (!content || !content.trim()) {
      return res.status(400).json(createErrorResponse('内容不能为空'))
    }

    // 检查AI使用次数
    const canUse = await checkAIUsage(userId)
    if (!canUse) {
      return res.status(403).json(createErrorResponse(
        'AI使用次数已达上限',
        'AI_USAGE_LIMIT_EXCEEDED'
      ))
    }

    // 构建优化提示词
    let prompt = `你是一位资深的内容编辑，请为以下文章提供详细的优化建议。

【分析维度】
1. 标题：是否吸引人，能否激发阅读欲望
2. 结构：逻辑是否清晰，层次是否分明
3. 语言：表达是否准确，文字是否流畅
4. 内容：信息是否充实，论据是否充分
5. 吸引力：是否有金句，能否引发共鸣

【输出格式】
以JSON格式输出，包含以下字段：
{
  "overallScore": 85,
  "suggestions": [
    {
      "category": "标题",
      "issue": "当前问题描述",
      "suggestion": "具体改进建议",
      "priority": "high|medium|low"
    }
  ],
  "highlights": ["文章的亮点1", "文章的亮点2"],
  "summary": "总体评价和建议概述"
}`

    if (focusAreas && focusAreas.length > 0) {
      prompt += `\n\n【重点关注】\n${focusAreas.join('、')}`
    }

    const openai = getOpenAIClient()
    
    const completion = await openai.chat.completions.create({
      model: process.env.DEEPSEEK_API_KEY ? 'deepseek-chat' : 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: prompt
        },
        {
          role: 'user',
          content: `【待优化内容】\n${content}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    })

    const resultText = completion.choices[0]?.message?.content || '{}'
    const result = JSON.parse(resultText)

    // 增加使用次数
    await incrementAIUsage(userId, 'ai_studio_optimize')

    res.json(createSuccessResponse(result))

  } catch (error) {
    console.error('[AI Studio] 优化分析失败:', error)
    res.status(500).json(createErrorResponse(
      error instanceof Error ? error.message : '优化分析失败，请稍后重试'
    ))
  }
})

/**
 * AI对话（用于交互式优化）
 * POST /api/ai-studio/chat
 */
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id
    const { messages, context } = req.body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json(createErrorResponse('消息不能为空'))
    }

    // 检查AI使用次数
    const canUse = await checkAIUsage(userId)
    if (!canUse) {
      return res.status(403).json(createErrorResponse(
        'AI使用次数已达上限',
        'AI_USAGE_LIMIT_EXCEEDED'
      ))
    }

    const openai = getOpenAIClient()

    // 构建系统提示词
    let systemPrompt = `你是AI写作工作室的助手，帮助用户优化文章内容。你的任务是：
1. 理解用户的需求和问题
2. 提供专业的写作建议
3. 帮助用户改进文章质量
4. 保持友好、专业的交流方式`

    if (context?.content) {
      systemPrompt += `\n\n【当前编辑的文章】\n${context.content.substring(0, 1000)}...`
    }

    const completion = await openai.chat.completions.create({
      model: process.env.DEEPSEEK_API_KEY ? 'deepseek-chat' : 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        ...messages
      ],
      temperature: 0.8,
      max_tokens: 1500
    })

    const reply = completion.choices[0]?.message?.content || ''

    // 增加使用次数
    await incrementAIUsage(userId, 'ai_studio_chat')

    res.json(createSuccessResponse({
      reply,
      tokensUsed: completion.usage?.total_tokens || 0
    }))

  } catch (error) {
    console.error('[AI Studio] 对话失败:', error)
    res.status(500).json(createErrorResponse(
      error instanceof Error ? error.message : 'AI对话失败，请稍后重试'
    ))
  }
})

export default router

