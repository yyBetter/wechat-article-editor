# AI 功能集成规划 - DeepSeek

## 📋 功能清单

### Phase 1: 核心写作辅助（2周）
1. ✅ AI 标题优化器
2. ✅ 智能摘要生成
3. ✅ 大纲智能生成

### Phase 2: 内容质量提升（2周）
4. ✅ 可读性分析仪
5. ✅ 敏感词/合规检测
6. ✅ 开头/结尾生成器

### Phase 3: 素材管理（2周）
7. ✅ 灵感库/素材管理

### Phase 4: 发布优化（2周）
8. ✅ 最佳发布时间推荐
9. ✅ 封面图智能生成

### Phase 5: 数据分析（2周）
10. ✅ 阅读数据分析
11. ✅ 内容策略助手

---

## 🏗️ 技术架构

### 整体架构图
```
┌─────────────────────────────────────────────────────┐
│                    前端界面层                          │
│  - 编辑器组件                                          │
│  - AI助手面板                                          │
│  - 分析仪表盘                                          │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│                  业务逻辑层                            │
│  - AIService (统一AI调用)                             │
│  - AnalysisService (分析服务)                         │
│  - StorageService (素材管理)                          │
└────────────────┬────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
┌───────▼─────┐  ┌────────▼──────┐
│ DeepSeek API│  │  本地算法引擎  │
│ (AI功能)    │  │  (分析/检测)   │
└─────────────┘  └───────────────┘
```

### 目录结构
```
src/
├── services/
│   ├── ai/
│   │   ├── deepseek-client.ts      # DeepSeek API客户端
│   │   ├── prompt-templates.ts      # Prompt模板库
│   │   ├── ai-service.ts            # AI服务统一接口
│   │   └── ai-cache.ts              # AI结果缓存
│   ├── analysis/
│   │   ├── readability.ts           # 可读性分析
│   │   ├── sensitive-words.ts       # 敏感词检测
│   │   └── seo-analyzer.ts          # SEO分析
│   └── insights/
│       ├── publish-time.ts          # 发布时间推荐
│       └── content-strategy.ts      # 内容策略
├── components/
│   ├── ai/
│   │   ├── AIAssistant.tsx          # AI助手主面板
│   │   ├── TitleGenerator.tsx       # 标题生成器
│   │   ├── SummaryGenerator.tsx     # 摘要生成器
│   │   ├── OutlineGenerator.tsx     # 大纲生成器
│   │   └── TextPolisher.tsx         # 文本润色器
│   ├── analysis/
│   │   ├── ReadabilityPanel.tsx     # 可读性面板
│   │   └── ComplianceChecker.tsx    # 合规检查
│   └── inspiration/
│       ├── InspirationLibrary.tsx   # 灵感库
│       └── MaterialManager.tsx      # 素材管理
├── hooks/
│   ├── useAI.ts                     # AI功能Hook
│   ├── useAnalysis.ts               # 分析功能Hook
│   └── useInsights.ts               # 洞察功能Hook
└── types/
    └── ai.ts                        # AI相关类型定义
```

---

## 🔧 核心实现

### 1. DeepSeek 客户端封装

```typescript
// src/services/ai/deepseek-client.ts
import axios from 'axios'

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

export class DeepSeekClient {
  private config: DeepSeekConfig
  private baseURL: string
  private model: string

  constructor(config: DeepSeekConfig) {
    this.config = config
    this.baseURL = config.baseURL || 'https://api.deepseek.com/v1'
    this.model = config.model || 'deepseek-chat'
  }

  async chat(messages: ChatMessage[], options?: {
    temperature?: number
    maxTokens?: number
    stream?: boolean
  }): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.model,
          messages,
          temperature: options?.temperature ?? this.config.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? this.config.maxTokens ?? 2000,
          stream: options?.stream ?? false
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      )

      return response.data.choices[0].message.content
    } catch (error) {
      console.error('DeepSeek API 调用失败:', error)
      throw new Error('AI 服务暂时不可用，请稍后重试')
    }
  }

  async streamChat(
    messages: ChatMessage[],
    onChunk: (text: string) => void
  ): Promise<void> {
    // 流式响应实现
    // TODO: 使用 EventSource 或 fetch stream
  }
}
```

### 2. Prompt 模板库

```typescript
// src/services/ai/prompt-templates.ts

export const PromptTemplates = {
  // 标题生成
  generateTitles: (content: string) => ({
    system: `你是一个专业的公众号标题撰写专家。你的任务是根据文章内容，生成5个吸引眼球的标题。

要求：
1. 标题长度控制在15-25字
2. 包含数字、悬念、利益点等吸引元素
3. 符合公众号传播规律
4. 避免标题党和夸张
5. 每个标题风格不同

输出格式（JSON）：
{
  "titles": [
    {"title": "标题1", "style": "数据型", "score": 85},
    {"title": "标题2", "style": "悬念型", "score": 90},
    ...
  ]
}`,
    user: `请为以下文章生成5个标题：\n\n${content.substring(0, 1000)}`
  }),

  // 摘要生成
  generateSummary: (content: string, length: number = 100) => ({
    system: `你是一个专业的内容提炼专家。请从文章中提取核心信息，生成简洁的摘要。

要求：
1. 摘要长度约${length}字
2. 突出文章核心观点
3. 语言简洁流畅
4. 保留关键信息
5. 适合作为公众号文章简介`,
    user: `请为以下文章生成摘要：\n\n${content}`
  }),

  // 大纲生成
  generateOutline: (topic: string, type: 'tutorial' | 'opinion' | 'story' = 'tutorial') => ({
    system: `你是一个专业的内容策划专家。根据给定主题，生成详细的文章大纲。

大纲类型：${type}
- tutorial: 教程步骤型（适合知识分享）
- opinion: 观点论证型（适合深度思考）
- story: 故事叙述型（适合情感共鸣）

输出格式（JSON）：
{
  "outline": [
    {
      "level": 1,
      "title": "一级标题",
      "points": ["要点1", "要点2"],
      "children": [...]
    }
  ],
  "estimatedLength": 2000
}`,
    user: `主题：${topic}`
  }),

  // 可读性改进
  improveReadability: (text: string, issues: string[]) => ({
    system: `你是一个专业的文字编辑。请改进以下文本的可读性。

存在的问题：
${issues.map(issue => `- ${issue}`).join('\n')}

改进原则：
1. 拆分过长的句子
2. 减少专业术语
3. 增加段落层次
4. 保持语义不变`,
    user: `请改进以下文本：\n\n${text}`
  }),

  // 开头生成
  generateOpening: (title: string, outline: string, style: 'story' | 'data' | 'question' | 'scene') => ({
    system: `你是一个专业的公众号写手。请根据文章标题和大纲，生成引人入胜的开头。

开头类型：${style}
- story: 故事开头（讲一个引人入胜的小故事）
- data: 数据开头（用震撼的数据吸引读者）
- question: 问题开头（提出引发思考的问题）
- scene: 场景开头（描绘生动的场景）

要求：
1. 长度100-200字
2. 与标题和大纲呼应
3. 引发读者继续阅读的欲望
4. 语言生动有画面感`,
    user: `标题：${title}\n\n大纲：${outline}`
  }),

  // 结尾生成
  generateEnding: (content: string, cta: boolean = true) => ({
    system: `你是一个专业的公众号写手。请根据文章内容，生成有力的结尾。

要求：
1. 长度50-100字
2. 总结全文核心观点
3. ${cta ? '包含行动号召（点赞、转发、评论）' : '不包含行动号召'}
4. 给读者留下深刻印象
5. 与开头呼应`,
    user: `文章内容摘要：${content.substring(0, 500)}`
  }),

  // 内容策略
  analyzeContentStrategy: (articles: Array<{title: string, views: number, likes: number}>) => ({
    system: `你是一个数据分析专家。分析历史文章数据，给出内容策略建议。

分析维度：
1. 高表现内容的共同特征
2. 读者偏好分析
3. 内容类型表现对比
4. 下一篇主题建议（3-5个）

输出格式（JSON）：
{
  "insights": ["洞察1", "洞察2"],
  "topTopics": ["主题1", "主题2"],
  "recommendations": [
    {"topic": "主题", "reason": "理由", "priority": 95}
  ]
}`,
    user: `历史文章数据：\n${JSON.stringify(articles, null, 2)}`
  })
}
```

### 3. AI 服务统一接口

```typescript
// src/services/ai/ai-service.ts
import { DeepSeekClient } from './deepseek-client'
import { PromptTemplates } from './prompt-templates'
import { AICache } from './ai-cache'

export interface TitleSuggestion {
  title: string
  style: string
  score: number
}

export class AIService {
  private client: DeepSeekClient
  private cache: AICache

  constructor(apiKey: string) {
    this.client = new DeepSeekClient({ apiKey })
    this.cache = new AICache()
  }

  // 1. 标题生成
  async generateTitles(content: string): Promise<TitleSuggestion[]> {
    const cacheKey = `titles:${this.hashContent(content)}`
    const cached = await this.cache.get(cacheKey)
    if (cached) return cached

    const prompt = PromptTemplates.generateTitles(content)
    const response = await this.client.chat([
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user }
    ])

    const result = JSON.parse(response)
    await this.cache.set(cacheKey, result.titles, 3600) // 缓存1小时
    return result.titles
  }

  // 2. 摘要生成
  async generateSummary(content: string, length: number = 100): Promise<string> {
    const cacheKey = `summary:${length}:${this.hashContent(content)}`
    const cached = await this.cache.get(cacheKey)
    if (cached) return cached

    const prompt = PromptTemplates.generateSummary(content, length)
    const response = await this.client.chat([
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user }
    ])

    await this.cache.set(cacheKey, response, 3600)
    return response
  }

  // 3. 大纲生成
  async generateOutline(topic: string, type: 'tutorial' | 'opinion' | 'story' = 'tutorial') {
    const prompt = PromptTemplates.generateOutline(topic, type)
    const response = await this.client.chat([
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user }
    ])

    return JSON.parse(response)
  }

  // 4. 可读性改进
  async improveReadability(text: string, issues: string[]): Promise<string> {
    const prompt = PromptTemplates.improveReadability(text, issues)
    const response = await this.client.chat([
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user }
    ])

    return response
  }

  // 5. 开头生成
  async generateOpening(
    title: string,
    outline: string,
    style: 'story' | 'data' | 'question' | 'scene'
  ): Promise<string[]> {
    const prompt = PromptTemplates.generateOpening(title, outline, style)
    const response = await this.client.chat([
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user }
    ])

    // 假设返回JSON数组
    return JSON.parse(response)
  }

  // 6. 结尾生成
  async generateEnding(content: string, cta: boolean = true): Promise<string[]> {
    const prompt = PromptTemplates.generateEnding(content, cta)
    const response = await this.client.chat([
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user }
    ])

    return JSON.parse(response)
  }

  // 7. 内容策略分析
  async analyzeContentStrategy(articles: Array<{title: string, views: number, likes: number}>) {
    const prompt = PromptTemplates.analyzeContentStrategy(articles)
    const response = await this.client.chat([
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user }
    ])

    return JSON.parse(response)
  }

  private hashContent(content: string): string {
    // 简单哈希实现
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString(36)
  }
}
```

---

## 🎨 UI 组件设计

### AI 助手面板
```
┌─────────────────────────────────────┐
│ 🤖 AI 写作助手              [ - ]  │
├─────────────────────────────────────┤
│                                     │
│ ┌─ 快速操作 ─────────────────┐     │
│ │  ✨ 生成标题                 │     │
│ │  📝 生成摘要                 │     │
│ │  📋 生成大纲                 │     │
│ │  🎨 润色文字                 │     │
│ └─────────────────────────────┘     │
│                                     │
│ ┌─ 当前任务 ─────────────────┐     │
│ │  正在生成标题...            │     │
│ │  ▓▓▓▓▓▓░░░░ 60%            │     │
│ └─────────────────────────────┘     │
│                                     │
│ ┌─ 结果展示 ─────────────────┐     │
│ │  建议标题（5个）：          │     │
│ │  1. ⭐⭐⭐⭐⭐ [使用]       │     │
│ │     "10个技巧让你..."       │     │
│ │  2. ⭐⭐⭐⭐ [使用]         │     │
│ │     "为什么90%的人..."      │     │
│ │  ...                        │     │
│ └─────────────────────────────┘     │
│                                     │
│ [ 使用额度: 45/100 ]  [升级会员]   │
└─────────────────────────────────────┘
```

---

## 💰 成本控制策略

### 1. 请求优化
```typescript
// 合并请求
async batchGenerate(tasks: AITask[]) {
  // 将多个小任务合并为一个请求
}

// 增量生成
async incrementalGenerate(partial: string) {
  // 只对新增部分调用AI
}
```

### 2. 缓存策略
```typescript
// 本地缓存
- 相同内容24小时内不重复请求
- LRU缓存最多1000条

// 用户级缓存
- 用户历史结果保存
- 快速复用
```

### 3. 额度限制
```typescript
免费用户：每月50次
付费会员：无限制
企业版：API直连
```

---

## 📅 开发计划（10周）

### Week 1-2: 基础设施
- [x] DeepSeek 客户端封装
- [x] Prompt 模板库
- [x] AI 服务接口
- [x] 缓存系统
- [x] 额度管理

### Week 3-4: 核心功能
- [ ] 标题生成器
- [ ] 摘要生成器
- [ ] 大纲生成器
- [ ] AI 助手面板

### Week 5-6: 内容优化
- [ ] 可读性分析
- [ ] 敏感词检测
- [ ] 开头/结尾生成
- [ ] 文本润色

### Week 7-8: 素材管理
- [ ] 灵感库
- [ ] 素材收藏
- [ ] 自动分类
- [ ] 快速插入

### Week 9-10: 数据分析
- [ ] 发布时间推荐
- [ ] 内容策略分析
- [ ] 数据仪表盘
- [ ] 趋势预测

---

## 🔐 安全与隐私

### API Key 管理
```typescript
// 服务器端代理
/api/ai/generate -> 后端 -> DeepSeek
用户无需配置 API Key

// 或用户自备 Key
支持用户输入自己的 DeepSeek API Key
```

### 数据隐私
```typescript
- 不存储用户文章内容
- AI 请求日志脱敏
- 缓存数据加密
- 定期清理历史记录
```

---

## 📊 监控与优化

### 性能监控
```typescript
interface AIMetrics {
  requestCount: number      // 请求次数
  averageLatency: number    // 平均延迟
  successRate: number       // 成功率
  costPerRequest: number    // 单次成本
  cacheHitRate: number      // 缓存命中率
}
```

### 质量监控
```typescript
interface QualityMetrics {
  userSatisfaction: number  // 用户满意度
  adoptionRate: number      // 采纳率（生成后实际使用比例）
  regenerateRate: number    // 重新生成率
}
```

---

## 🚀 商业化策略

### 定价方案
```
免费版：
- 每月 50 次 AI 调用
- 基础功能

专业版（¥29/月）：
- 无限 AI 调用
- 优先响应
- 高级分析

企业版（¥299/月）：
- API 直连
- 自定义模型
- 专属支持
```

### 增值服务
```
- 定制 Prompt 模板
- 行业专属模型
- 数据导出
- 批量处理
```

