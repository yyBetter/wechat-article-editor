// AI语音转文字路由
import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import OpenAI from 'openai'
import { authMiddleware } from '../middleware/auth'

const router = express.Router()

// 配置OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.OPENAI_API_KEY 
    ? 'https://api.openai.com/v1' 
    : 'https://api.deepseek.com/v1'
})

// 配置multer存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/audio')
    // 确保目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'audio-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp3|wav|m4a|webm|mpeg/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    
    if (extname && mimetype) {
      cb(null, true)
    } else {
      cb(new Error('只支持音频文件 (mp3, wav, m4a, webm)'))
    }
  }
})

// 语音转文字接口
router.post('/transcribe', authMiddleware, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '未上传文件' })
    }

    console.log('🎤 开始语音识别:', req.file.filename)

    // 检查API密钥
    if (!process.env.OPENAI_API_KEY && !process.env.DEEPSEEK_API_KEY) {
      throw new Error('未配置AI API密钥')
    }

    const audioFilePath = req.file.path

    try {
      // 使用OpenAI Whisper API进行语音识别
      // 注意：DeepSeek目前可能不支持Whisper API，需要使用OpenAI
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(audioFilePath),
        model: 'whisper-1',
        language: 'zh', // 中文
        response_format: 'text'
      })

      console.log('✅ 语音识别成功')
      console.log('识别文本:', transcription)

      // 删除临时文件
      fs.unlinkSync(audioFilePath)

      res.json({
        success: true,
        text: transcription,
        filename: req.file.originalname
      })

    } catch (apiError: any) {
      console.error('❌ Whisper API错误:', apiError)
      
      // 删除临时文件
      if (fs.existsSync(audioFilePath)) {
        fs.unlinkSync(audioFilePath)
      }

      // 如果是使用DeepSeek，提示用户需要OpenAI API
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ 
          error: '语音识别需要OpenAI API密钥。DeepSeek暂不支持Whisper API。请在.env中配置OPENAI_API_KEY' 
        })
      }

      throw apiError
    }

  } catch (error: any) {
    console.error('❌ 语音识别失败:', error)
    
    // 清理文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }

    res.status(500).json({ 
      error: error.message || '语音识别失败，请重试' 
    })
  }
})

// AI文本整理接口
router.post('/process-transcript', authMiddleware, async (req, res) => {
  try {
    const { transcript } = req.body

    if (!transcript) {
      return res.status(400).json({ error: '缺少转录文本' })
    }

    console.log('🤖 开始AI文本整理...')

    // 使用GPT整理文本
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_API_KEY ? 'gpt-4' : 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `你是一个专业的文字编辑和内容整理专家。你的任务是将口语化的语音转录文本整理成规范的书面文章。

整理要求：
1. 去除口语化表达（如"那个"、"嗯"、"就是"等填充词）
2. 去除重复和冗余的内容
3. 调整语序，使句子更通顺
4. 适当分段，每段表达一个完整的意思
5. 使用标准的标点符号
6. 保持原意，不要删除关键信息
7. 使用书面语表达，但保持自然流畅
8. 适当添加标题和小标题（如果内容较长）
9. 对于数据、观点等重要信息，适当使用加粗或列表强调

输出格式：
- 使用Markdown格式
- 适当使用标题（# ## ###）
- 使用列表（- 或 1. 2. 3.）
- 使用加粗（**文字**）强调重点
- 合理分段

请直接输出整理后的文章，不要有任何额外说明。`
        },
        {
          role: 'user',
          content: `请将以下语音转录文本整理成一篇规范的文章：

${transcript}`
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    })

    const processedArticle = completion.choices[0].message.content

    console.log('✅ 文本整理完成')

    res.json({
      success: true,
      article: processedArticle,
      originalLength: transcript.length,
      processedLength: processedArticle?.length || 0
    })

  } catch (error: any) {
    console.error('❌ 文本整理失败:', error)
    res.status(500).json({ 
      error: error.message || '文本整理失败，请重试' 
    })
  }
})

// 批量删除过期音频文件（定期清理）
router.delete('/cleanup', authMiddleware, async (req, res) => {
  try {
    const uploadDir = path.join(__dirname, '../../uploads/audio')
    
    if (!fs.existsSync(uploadDir)) {
      return res.json({ message: '无需清理' })
    }

    const files = fs.readdirSync(uploadDir)
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24小时
    let deletedCount = 0

    files.forEach(file => {
      const filePath = path.join(uploadDir, file)
      const stat = fs.statSync(filePath)
      const age = now - stat.mtimeMs

      if (age > maxAge) {
        fs.unlinkSync(filePath)
        deletedCount++
      }
    })

    console.log(`🗑️ 清理了 ${deletedCount} 个过期音频文件`)

    res.json({ 
      success: true, 
      deletedCount,
      message: `清理了 ${deletedCount} 个过期文件` 
    })

  } catch (error: any) {
    console.error('❌ 清理失败:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router

