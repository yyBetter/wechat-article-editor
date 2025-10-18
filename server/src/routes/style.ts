// AI风格分析路由
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

// 获取用户风格配置
router.get('/style-profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ error: '未授权' })
    }

    // 从用户配置中获取风格描述
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { styleProfile: true }
    })

    if (user?.styleProfile) {
      res.json({ profile: JSON.parse(user.styleProfile as string) })
    } else {
      res.json({ profile: null })
    }

  } catch (error: any) {
    console.error('获取风格配置失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 分析用户写作风格
router.post('/analyze-style', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id
    const { articleIds } = req.body

    if (!userId) {
      return res.status(401).json({ error: '未授权' })
    }

    if (!articleIds || !Array.isArray(articleIds) || articleIds.length < 3) {
      return res.status(400).json({ error: '请至少选择3篇文章' })
    }

    if (articleIds.length > 20) {
      return res.status(400).json({ error: '最多选择20篇文章' })
    }

    console.log('🎨 开始分析用户写作风格...', { userId, articleCount: articleIds.length })

    // 获取文章内容
    const articles = await prisma.document.findMany({
      where: {
        id: { in: articleIds },
        userId: userId
      },
      select: {
        title: true,
        content: true
      }
    })

    if (articles.length === 0) {
      return res.status(404).json({ error: '未找到文章' })
    }

    // 合并所有文章内容
    const combinedContent = articles.map((article, index) => {
      return `【文章${index + 1}：${article.title || '无标题'}】\n${article.content}`
    }).join('\n\n---\n\n')

    // 限制内容长度（避免超过token限制）
    const maxLength = 20000 // 约5000字/篇
    const contentForAnalysis = combinedContent.length > maxLength
      ? combinedContent.substring(0, maxLength) + '\n...(内容过长已截断)'
      : combinedContent

    console.log('📝 准备分析内容长度:', contentForAnalysis.length)

    // 使用GPT分析写作风格
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_API_KEY ? 'gpt-4' : 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `你是一个专业的写作风格分析师。你需要深入分析用户的文章，提取以下关键风格特征：

1. **常用词汇**：找出用户经常使用的特色词汇（10-20个）
2. **句式特点**：总结典型的句式结构和表达模式（5-8个）
3. **Emoji使用**：统计常用的emoji表情（如果有）
4. **语气风格**：判断整体语气（如：专业严谨、轻松幽默、亲切温暖、理性客观等）
5. **写作习惯**：总结特有的写作习惯和偏好（8-12个）

请以JSON格式输出，格式如下：
{
  "vocabulary": ["词汇1", "词汇2", ...],
  "sentencePatterns": ["句式1", "句式2", ...],
  "emojiUsage": ["😊", "✅", ...],
  "tone": "语气描述",
  "writingHabits": ["习惯1", "习惯2", ...],
  "summary": "200字左右的风格总结"
}

注意：
- 提取的特征要具体、准确、有代表性
- 写作习惯要详细描述，例如"喜欢用数据支撑观点"、"经常使用比喻和类比"
- 风格总结要全面概括用户的写作特色`
        },
        {
          role: 'user',
          content: `请分析以下${articles.length}篇文章的写作风格：

${contentForAnalysis}`
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    })

    const analysisText = completion.choices[0].message.content
    
    if (!analysisText) {
      throw new Error('AI分析返回空结果')
    }

    console.log('✅ AI风格分析完成')

    // 解析JSON结果
    let styleProfile
    try {
      // 尝试提取JSON（可能包含在markdown代码块中）
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        styleProfile = JSON.parse(jsonMatch[0])
      } else {
        styleProfile = JSON.parse(analysisText)
      }
    } catch (parseError) {
      console.error('解析AI返回的JSON失败:', parseError)
      throw new Error('AI分析结果格式错误')
    }

    // 构建完整的风格配置
    const fullProfile = {
      analyzed: true,
      articleCount: articles.length,
      analyzedAt: new Date().toISOString(),
      profile: styleProfile,
      summary: styleProfile.summary || '风格分析完成'
    }

    // 保存到数据库
    await prisma.user.update({
      where: { id: userId },
      data: {
        styleProfile: JSON.stringify(fullProfile)
      }
    })

    console.log('💾 风格配置已保存到数据库')

    res.json({
      success: true,
      profile: fullProfile
    })

  } catch (error: any) {
    console.error('❌ 风格分析失败:', error)
    res.status(500).json({ 
      error: error.message || '风格分析失败，请重试' 
    })
  }
})

// 删除风格配置
router.delete('/style-profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ error: '未授权' })
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        styleProfile: null
      }
    })

    res.json({ success: true, message: '风格配置已删除' })

  } catch (error: any) {
    console.error('删除风格配置失败:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router

