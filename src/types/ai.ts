/**
 * AI 功能相关的类型定义
 */

// AI 任务状态
export type AITaskStatus = 'idle' | 'loading' | 'success' | 'error'

// AI 任务类型
export type AITaskType = 
  | 'generate-title'
  | 'generate-summary'
  | 'generate-outline'
  | 'improve-readability'
  | 'generate-opening'
  | 'generate-ending'
  | 'polish-text'
  | 'extract-keywords'
  | 'analyze-strategy'

// AI 任务
export interface AITask {
  id: string
  type: AITaskType
  status: AITaskStatus
  input: any
  output?: any
  error?: string
  createdAt: number
  completedAt?: number
}

// AI 使用额度
export interface AIQuota {
  total: number      // 总额度
  used: number       // 已使用
  remaining: number  // 剩余
  resetDate: string  // 重置日期
}

// AI 配置
export interface AIConfig {
  apiKey: string
  model: string
  enabled: boolean
  quotaLimit: number
}

// AI 结果缓存
export interface AICache {
  key: string
  value: any
  expiresAt: number
}

// 标题建议
export interface TitleSuggestion {
  title: string
  style: string
  score: number
}

// 大纲节点
export interface OutlineNode {
  level: number
  title: string
  description: string
  estimatedWords: number
  children?: OutlineNode[]
}

// 大纲结果
export interface OutlineResult {
  outline: OutlineNode[]
  totalWords: number
  readingTime: number
}

// 关键词
export interface Keyword {
  word: string
  weight: number
  category: string
}

// 内容策略建议
export interface StrategyRecommendation {
  topic: string
  reason: string
  priority: number
  estimatedPerformance: string
}

// 内容策略分析
export interface ContentStrategy {
  insights: string[]
  topTopics: string[]
  recommendations: StrategyRecommendation[]
  bestPublishTime: string
}

// AI 使用记录
export interface AIUsageRecord {
  id: string
  taskType: AITaskType
  inputTokens: number
  outputTokens: number
  cost: number
  timestamp: number
  success: boolean
}

// AI 统计
export interface AIStats {
  totalRequests: number
  successRequests: number
  failedRequests: number
  totalTokens: number
  totalCost: number
  averageResponseTime: number
}

