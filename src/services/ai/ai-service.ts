/**
 * AI 服务统一接口
 * 整合所有 AI 功能的调用
 */

import { DeepSeekClient, ChatMessage } from './deepseek-client'
import { PromptTemplates } from './prompt-templates'

export interface TitleSuggestion {
  title: string
  style: string
  score: number
}

export interface OutlineNode {
  level: number
  title: string
  description: string
  estimatedWords: number
  children?: OutlineNode[]
}

export interface OutlineResult {
  outline: OutlineNode[]
  totalWords: number
  readingTime: number
}

export interface KeywordResult {
  keywords: Array<{
    word: string
    weight: number
    category: string
  }>
  tags: string[]
}

export interface StrategyRecommendation {
  topic: string
  reason: string
  priority: number
  estimatedPerformance: string
}

export interface ContentStrategy {
  insights: string[]
  topTopics: string[]
  recommendations: StrategyRecommendation[]
  bestPublishTime: string
}

/**
 * AI 服务类
 */
export class AIService {
  private client: DeepSeekClient
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.client = new DeepSeekClient({ apiKey })
  }

  /**
   * 生成标题建议
   */
  async generateTitles(content: string): Promise<TitleSuggestion[]> {
    const prompt = PromptTemplates.generateTitles(content)
    const response = await this.client.chat([
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user }
    ], {
      temperature: 0.8, // 标题需要更多创意
      maxTokens: 1000
    })

    try {
      const result = JSON.parse(response)
      return result.titles
    } catch (error) {
      console.error('解析标题结果失败:', error)
      throw new Error('标题生成失败，请重试')
    }
  }

  /**
   * 生成摘要
   */
  async generateSummary(content: string, length: number = 100): Promise<string> {
    const prompt = PromptTemplates.generateSummary(content, length)
    const response = await this.client.chat([
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user }
    ], {
      temperature: 0.5, // 摘要需要更准确
      maxTokens: Math.ceil(length * 2) // 预留token
    })

    return response.trim()
  }

  /**
   * 生成大纲
   */
  async generateOutline(
    topic: string,
    type: 'tutorial' | 'opinion' | 'story' = 'tutorial'
  ): Promise<OutlineResult> {
    const prompt = PromptTemplates.generateOutline(topic, type)
    const response = await this.client.chat([
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user }
    ], {
      temperature: 0.7,
      maxTokens: 2000
    })

    try {
      return JSON.parse(response)
    } catch (error) {
      console.error('解析大纲失败:', error)
      throw new Error('大纲生成失败，请重试')
    }
  }

  /**
   * 改进可读性
   */
  async improveReadability(text: string, issues: string[]): Promise<string> {
    const prompt = PromptTemplates.improveReadability(text, issues)
    const response = await this.client.chat([
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user }
    ], {
      temperature: 0.3, // 改进需要保守
      maxTokens: Math.ceil(text.length * 2)
    })

    return response.trim()
  }

  /**
   * 生成开头
   */
  async generateOpening(
    title: string,
    outline: string,
    style: 'story' | 'data' | 'question' | 'scene'
  ): Promise<string[]> {
    const prompt = PromptTemplates.generateOpening(title, outline, style)
    const response = await this.client.chat([
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user }
    ], {
      temperature: 0.8,
      maxTokens: 1000
    })

    try {
      const result = JSON.parse(response)
      return result.openings
    } catch (error) {
      console.error('解析开头失败:', error)
      throw new Error('开头生成失败，请重试')
    }
  }

  /**
   * 生成结尾
   */
  async generateEnding(content: string, cta: boolean = true): Promise<string[]> {
    const prompt = PromptTemplates.generateEnding(content, cta)
    const response = await this.client.chat([
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user }
    ], {
      temperature: 0.7,
      maxTokens: 800
    })

    try {
      const result = JSON.parse(response)
      return result.endings
    } catch (error) {
      console.error('解析结尾失败:', error)
      throw new Error('结尾生成失败，请重试')
    }
  }

  /**
   * 润色文本
   */
  async polishText(
    text: string,
    style: 'professional' | 'casual' | 'concise' | 'vivid'
  ): Promise<string> {
    const prompt = PromptTemplates.polishText(text, style)
    const response = await this.client.chat([
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user }
    ], {
      temperature: 0.6,
      maxTokens: Math.ceil(text.length * 1.5)
    })

    return response.trim()
  }

  /**
   * 提取关键词
   */
  async extractKeywords(content: string): Promise<KeywordResult> {
    const prompt = PromptTemplates.extractKeywords(content)
    const response = await this.client.chat([
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user }
    ], {
      temperature: 0.3,
      maxTokens: 500
    })

    try {
      return JSON.parse(response)
    } catch (error) {
      console.error('解析关键词失败:', error)
      throw new Error('关键词提取失败，请重试')
    }
  }

  /**
   * 分析内容策略
   */
  async analyzeContentStrategy(
    articles: Array<{ title: string; views: number; likes: number; date: string }>
  ): Promise<ContentStrategy> {
    const prompt = PromptTemplates.analyzeContentStrategy(articles)
    const response = await this.client.chat([
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user }
    ], {
      temperature: 0.5,
      maxTokens: 1500
    })

    try {
      return JSON.parse(response)
    } catch (error) {
      console.error('解析策略分析失败:', error)
      throw new Error('策略分析失败，请重试')
    }
  }

  /**
   * 流式生成（用于实时显示）
   */
  async streamGenerate(
    messages: ChatMessage[],
    onChunk: (text: string) => void
  ): Promise<void> {
    await this.client.streamChat(messages, onChunk)
  }

  /**
   * 估算成本
   */
  estimateCost(inputText: string, outputLength: number): number {
    const inputTokens = this.client.estimateTokens(inputText)
    const outputTokens = outputLength * 1.5 // 粗略估算
    return this.client.estimateCost(inputTokens, outputTokens)
  }
}

/**
 * 创建 AI 服务实例
 */
export function createAIService(apiKey?: string): AIService {
  // 优先使用传入的 API Key，否则从环境变量读取
  const key = apiKey || import.meta.env.VITE_DEEPSEEK_API_KEY || ''
  
  if (!key) {
    throw new Error('DeepSeek API Key 未配置')
  }

  return new AIService(key)
}

