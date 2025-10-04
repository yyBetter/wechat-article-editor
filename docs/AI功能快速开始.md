# AI 功能快速开始指南

## 🚀 5分钟快速集成

### Step 1: 获取 DeepSeek API Key

1. 访问 [DeepSeek 开放平台](https://platform.deepseek.com/)
2. 注册/登录账号
3. 进入控制台 → API Keys
4. 创建新的 API Key
5. 复制保存（只显示一次）

### Step 2: 配置环境变量

在项目根目录创建 `.env` 文件：

```bash
# .env
VITE_DEEPSEEK_API_KEY=your_api_key_here
```

### Step 3: 测试 AI 功能

创建测试文件 `tests/ai-test.ts`：

```typescript
import { createAIService } from '../src/services/ai/ai-service'

async function test() {
  const ai = createAIService()

  // 测试标题生成
  const titles = await ai.generateTitles(`
    这是一篇关于提升工作效率的文章。
    本文将介绍10个实用技巧，帮助你更好地管理时间...
  `)

  console.log('生成的标题：', titles)
}

test()
```

运行测试：
```bash
npx tsx tests/ai-test.ts
```

---

## 📦 核心功能使用示例

### 1. 标题生成

```typescript
const ai = createAIService()

const titles = await ai.generateTitles(articleContent)
// 返回：
// [
//   { title: "10个技巧让你效率翻倍", style: "数据型", score: 90 },
//   { title: "为什么90%的人都不会管理时间？", style: "悬念型", score: 85 },
//   ...
// ]
```

### 2. 摘要生成

```typescript
const summary = await ai.generateSummary(articleContent, 100)
// 返回：字符串，约100字的摘要
```

### 3. 大纲生成

```typescript
const outline = await ai.generateOutline(
  "如何提升工作效率",
  "tutorial"  // tutorial | opinion | story
)
// 返回：完整的文章大纲结构
```

### 4. 文本润色

```typescript
const polished = await ai.polishText(
  "这个功能很好用",
  "professional"  // professional | casual | concise | vivid
)
// 返回：润色后的文本
```

### 5. 流式生成（实时显示）

```typescript
let fullText = ''

await ai.streamGenerate(
  [
    { role: 'system', content: '你是写作助手' },
    { role: 'user', content: '写一段开头' }
  ],
  (chunk) => {
    fullText += chunk
    console.log(chunk) // 实时输出每个字
  }
)
```

---

## 🎨 在组件中使用

### 创建 Hook

```typescript
// src/hooks/useAI.ts
import { useState } from 'react'
import { createAIService } from '../services/ai/ai-service'
import { notification } from '../utils/notification'

export function useAI() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateTitles = async (content: string) => {
    setLoading(true)
    setError(null)

    try {
      const ai = createAIService()
      const titles = await ai.generateTitles(content)
      notification.success('标题生成成功！')
      return titles
    } catch (err) {
      const message = err instanceof Error ? err.message : '生成失败'
      setError(message)
      notification.error(message)
      return []
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    generateTitles
  }
}
```

### 在组件中使用

```typescript
// src/components/ai/TitleGenerator.tsx
import React from 'react'
import { useApp } from '../../utils/app-context'
import { useAI } from '../../hooks/useAI'

export function TitleGenerator() {
  const { state } = useApp()
  const { loading, generateTitles } = useAI()
  const [titles, setTitles] = useState([])

  const handleGenerate = async () => {
    const results = await generateTitles(state.editor.content)
    setTitles(results)
  }

  return (
    <div className="title-generator">
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? '生成中...' : '✨ 生成标题'}
      </button>

      {titles.length > 0 && (
        <div className="results">
          {titles.map((item, index) => (
            <div key={index} className="title-item">
              <span className="score">评分: {item.score}</span>
              <span className="style">{item.style}</span>
              <h4>{item.title}</h4>
              <button>使用</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## 💰 成本控制

### 估算成本

```typescript
const ai = createAIService()

// 估算单次调用成本
const content = "你的文章内容..."
const cost = ai.estimateCost(content, 500)
console.log(`预估成本: ¥${cost.toFixed(4)}`)
```

### 实际成本

```
功能          | 平均Tokens | 成本/次
-------------|-----------|--------
标题生成      | 1000      | ¥0.001
摘要生成      | 800       | ¥0.0008
大纲生成      | 1500      | ¥0.0015
文本润色      | 2000      | ¥0.002
```

**月度成本估算**：
- 1000个用户
- 每人平均50次调用
- 总成本：¥50-100/月

---

## 🔒 安全配置

### 方案1：服务器代理（推荐）

```typescript
// server/routes/ai.ts
import express from 'express'
import { createAIService } from '../services/ai'

const router = express.Router()
const ai = createAIService(process.env.DEEPSEEK_API_KEY)

router.post('/generate-title', async (req, res) => {
  try {
    const { content } = req.body
    const titles = await ai.generateTitles(content)
    res.json({ success: true, data: titles })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
```

前端调用：
```typescript
async function generateTitles(content: string) {
  const response = await fetch('/api/ai/generate-title', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  })
  return response.json()
}
```

### 方案2：用户自备 Key

```typescript
// 允许用户输入自己的 API Key
const ai = createAIService(userProvidedApiKey)
```

---

## 📊 监控与优化

### 添加使用统计

```typescript
interface AIUsage {
  taskType: string
  tokens: number
  cost: number
  timestamp: number
}

const usageLog: AIUsage[] = []

function logUsage(type: string, tokens: number, cost: number) {
  usageLog.push({
    taskType: type,
    tokens,
    cost,
    timestamp: Date.now()
  })

  // 定期上报统计
  if (usageLog.length >= 100) {
    // 上报到分析服务
    reportAnalytics(usageLog)
    usageLog.length = 0
  }
}
```

### 缓存优化

```typescript
// 相同内容24小时内不重复调用
const cache = new Map()

async function generateWithCache(key: string, generator: () => Promise<any>) {
  if (cache.has(key)) {
    return cache.get(key)
  }

  const result = await generator()
  cache.set(key, result)
  
  // 24小时后过期
  setTimeout(() => cache.delete(key), 24 * 60 * 60 * 1000)
  
  return result
}
```

---

## 🐛 故障排查

### 常见问题

**Q: API Key 无效**
```
Error: 401 Unauthorized

解决：
1. 检查 .env 文件是否正确配置
2. 确认 API Key 没有过期
3. 检查账户余额
```

**Q: 响应超时**
```
Error: Request timeout

解决：
1. 检查网络连接
2. 增加 timeout 时间
3. 使用更快的模型
```

**Q: JSON 解析失败**
```
Error: JSON parse error

解决：
1. 检查 prompt 模板
2. 添加重试机制
3. 增加错误处理
```

### 调试模式

```typescript
// 开启详细日志
const ai = createAIService(apiKey)
ai.client.debug = true  // 输出详细请求日志
```

---

## 🎯 下一步

1. **完成UI组件**
   - [ ] AI 助手面板
   - [ ] 标题生成器
   - [ ] 摘要生成器

2. **添加高级功能**
   - [ ] 缓存系统
   - [ ] 用户额度管理
   - [ ] 使用统计

3. **优化体验**
   - [ ] 加载动画
   - [ ] 结果预览
   - [ ] 一键应用

4. **测试部署**
   - [ ] 单元测试
   - [ ] 性能测试
   - [ ] 上线验证

---

## 📚 相关文档

- [AI功能集成规划](./AI功能集成规划.md)
- [DeepSeek API 文档](https://platform.deepseek.com/docs)
- [Prompt 工程最佳实践](https://platform.openai.com/docs/guides/prompt-engineering)

