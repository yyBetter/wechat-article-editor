/**
 * DeepSeek API 客户端
 * 封装 DeepSeek AI 服务的调用逻辑
 */

export interface DeepSeekConfig {
  apiKey: string
  baseURL?: string
  model?: string
  temperature?: number
  maxTokens?: number
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionResponse {
  id: string
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class DeepSeekClient {
  private config: DeepSeekConfig
  private baseURL: string
  private model: string

  constructor(config: DeepSeekConfig) {
    this.config = config
    this.baseURL = config.baseURL || 'https://api.deepseek.com/v1'
    this.model = config.model || 'deepseek-chat'
  }

  /**
   * 发送聊天请求
   */
  async chat(messages: ChatMessage[], options?: {
    temperature?: number
    maxTokens?: number
    stream?: boolean
  }): Promise<string> {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: options?.temperature ?? this.config.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? this.config.maxTokens ?? 2000,
          stream: options?.stream ?? false
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'API 请求失败')
      }

      const data: ChatCompletionResponse = await response.json()
      return data.choices[0].message.content
    } catch (error) {
      console.error('DeepSeek API 调用失败:', error)
      throw new Error('AI 服务暂时不可用，请稍后重试')
    }
  }

  /**
   * 流式响应（用于实时显示生成内容）
   */
  async streamChat(
    messages: ChatMessage[],
    onChunk: (text: string) => void,
    options?: {
      temperature?: number
      maxTokens?: number
    }
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 2000,
          stream: true
        })
      })

      if (!response.ok) {
        throw new Error('流式请求失败')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法读取响应流')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices[0]?.delta?.content
              if (content) {
                onChunk(content)
              }
            } catch (e) {
              console.warn('解析流数据失败:', e)
            }
          }
        }
      }
    } catch (error) {
      console.error('流式响应失败:', error)
      throw new Error('AI 流式服务暂时不可用')
    }
  }

  /**
   * 估算 token 数量（粗略估计）
   */
  estimateTokens(text: string): number {
    // 中文：1个字 ≈ 1.5 tokens
    // 英文：1个单词 ≈ 1.3 tokens
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
    return Math.ceil(chineseChars * 1.5 + englishWords * 1.3)
  }

  /**
   * 估算请求成本（元）
   */
  estimateCost(inputTokens: number, outputTokens: number): number {
    // DeepSeek 定价：¥1/百万tokens
    const costPer1MTokens = 1
    return ((inputTokens + outputTokens) / 1000000) * costPer1MTokens
  }
}

