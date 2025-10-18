// AI多平台适配路由
import express from 'express'
import OpenAI from 'openai'
import { authMiddleware } from '../middleware/auth'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

// 配置OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.OPENAI_API_KEY 
    ? 'https://api.openai.com/v1' 
    : 'https://api.deepseek.com/v1'
})

// 平台适配规则
const PLATFORM_RULES = {
  wechat: {
    name: '公众号',
    titleRule: `
标题要求：
- 吸引眼球但不夸张
- 10-30字为宜
- 可以使用：数字、符号、emoji
- 避免标题党

内容调整：
- 段落清晰，每段3-5行
- 适当使用小标题（##）
- 重点内容加粗
- 适度使用emoji提升可读性
- 保持专业性和可读性
`,
    tips: [
      '建议添加首图和配图增强视觉效果',
      '可以在文末添加引导关注话术',
      '注意排版美观，段落分明',
      '适当使用表情符号增强情感表达'
    ]
  },
  
  zhihu: {
    name: '知乎',
    titleRule: `
标题要求：
- 问题式标题（如何、为什么、怎样）
- 15-40字
- 引发思考和好奇心
- 体现专业性

内容调整：
- 开头直接切入主题
- 逻辑清晰，论证严密
- 使用数据和案例支撑观点
- 专业但不生硬
- 适合深度阅读
- 减少emoji使用
`,
    tips: [
      '开头可以简述问题背景',
      '多用数据和案例增强说服力',
      '适当引用权威观点',
      '结尾可以总结要点或提出思考'
    ]
  },
  
  xiaohongshu: {
    name: '小红书',
    titleRule: `
标题要求：
- 口语化、年轻化
- 使用大量emoji 🔥✨💖
- 10-20字
- 可以用"｜"分隔关键词
- 制造悬念或共鸣

内容调整：
- 非常口语化，像朋友聊天
- 短句子，节奏快
- 大量emoji表情
- 多用"！"感叹号
- 分点列举，方便阅读
- 突出干货和实用性
- 鼓励互动（评论、收藏）
`,
    tips: [
      '标题要有吸引力和话题性',
      '内容分段明确，多用emoji',
      '结尾引导点赞收藏',
      '配图至少3-9张效果更好',
      '可以添加相关话题标签'
    ]
  },
  
  toutiao: {
    name: '头条',
    titleRule: `
标题要求：
- 新闻式标题
- 简洁有力，15-30字
- 突出信息点和新闻价值
- 可以使用数字增强吸引力

内容调整：
- 开头总结核心信息
- 倒金字塔结构
- 客观理性，少个人情感
- 突出时效性和新闻价值
- 段落简短，信息密集
- 减少emoji使用
`,
    tips: [
      '标题突出新闻点和时效性',
      '开头就给出关键信息',
      '配图要有新闻感',
      '保持客观中立的语气'
    ]
  },
  
  weibo: {
    name: '微博',
    titleRule: `
标题要求：
- 短标题或直接正文开头
- 5-15字
- 突出亮点

内容调整：
- 精简版本，300字以内
- 提炼核心观点和亮点
- 口语化但有态度
- 使用话题标签 #话题#
- 适量emoji
- 引导转发和评论
`,
    tips: [
      '内容要精简，突出核心',
      '配图1-9张效果更好',
      '添加相关话题标签增加曝光',
      '引导转发、评论、点赞'
    ]
  }
}

// AI平台适配接口
router.post('/adapt-platform', authMiddleware, async (req, res) => {
  try {
    const { platform, title, content } = req.body
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ error: '未授权' })
    }

    if (!platform || !title || !content) {
      return res.status(400).json({ error: '缺少必要参数' })
    }

    if (!PLATFORM_RULES[platform as keyof typeof PLATFORM_RULES]) {
      return res.status(400).json({ error: '不支持的平台' })
    }

    console.log(`🎯 开始适配${platform}平台...`)

    const platformRule = PLATFORM_RULES[platform as keyof typeof PLATFORM_RULES]

    // 获取用户风格配置（如果有）
    let styleContext = ''
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { styleProfile: true }
      })

      if (user?.styleProfile) {
        const styleProfile = JSON.parse(user.styleProfile as string)
        if (styleProfile.analyzed) {
          styleContext = `
          
【注意】用户有个人写作风格，适配时尽量保留：
- 语气：${styleProfile.profile.tone}
- 常用词汇倾向：${styleProfile.profile.vocabulary.slice(0, 5).join('、')}
${styleProfile.profile.emojiUsage.length > 0 ? `- Emoji习惯：${styleProfile.profile.emojiUsage.slice(0, 5).join(' ')}` : ''}
`
          console.log('✨ 已加载用户风格')
        }
      }
    } catch (error) {
      // 风格配置获取失败不影响主流程
    }

    // 使用GPT进行平台适配
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_API_KEY ? 'gpt-4' : 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `你是一个专业的内容适配专家，擅长将内容改编成适合不同平台的版本。

你现在需要将内容适配到【${platformRule.name}】平台。

${platformRule.titleRule}

${styleContext}

请以JSON格式返回结果：
{
  "title": "适配后的标题",
  "content": "适配后的正文内容（保持markdown格式）",
  "tips": ["建议1", "建议2", ...]
}

要求：
1. 完整保留原文核心信息和价值
2. 严格按照平台特点调整风格和形式
3. 标题和内容都要重新优化
4. 内容长度根据平台特点调整
5. 保持内容的实用性和可读性`
        },
        {
          role: 'user',
          content: `原始标题：${title}

原始内容：
${content}

请适配到${platformRule.name}平台。`
        }
      ],
      temperature: 0.7,
      max_tokens: 3000
    })

    const resultText = completion.choices[0].message.content

    if (!resultText) {
      throw new Error('AI返回空结果')
    }

    console.log('✅ AI适配完成')

    // 解析JSON结果
    let result
    try {
      const jsonMatch = resultText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0])
      } else {
        result = JSON.parse(resultText)
      }
    } catch (parseError) {
      console.error('解析JSON失败:', parseError)
      throw new Error('AI返回格式错误')
    }

    // 添加平台建议
    result.tips = [...(result.tips || []), ...platformRule.tips]

    res.json({
      success: true,
      platform: platformRule.name,
      ...result
    })

  } catch (error: any) {
    console.error('❌ 平台适配失败:', error)
    res.status(500).json({ 
      error: error.message || '平台适配失败，请重试' 
    })
  }
})

// 批量适配接口
router.post('/adapt-platforms-batch', authMiddleware, async (req, res) => {
  try {
    const { platforms, title, content } = req.body
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ error: '未授权' })
    }

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({ error: '请至少选择一个平台' })
    }

    if (!title || !content) {
      return res.status(400).json({ error: '缺少标题或内容' })
    }

    console.log(`🎯 开始批量适配${platforms.length}个平台...`)

    const results: Record<string, any> = {}

    // 逐个平台适配
    for (const platform of platforms) {
      try {
        // 这里可以调用单个适配的逻辑
        // 为了简化，这里省略实现
        results[platform] = {
          success: true,
          title: `${title} (${platform}版)`,
          content: content
        }
      } catch (error) {
        results[platform] = {
          success: false,
          error: '适配失败'
        }
      }
    }

    res.json({
      success: true,
      results
    })

  } catch (error: any) {
    console.error('❌ 批量适配失败:', error)
    res.status(500).json({ 
      error: error.message || '批量适配失败' 
    })
  }
})

export default router

