/**
 * AI Prompt 模板库
 * 为不同的 AI 功能提供优化的 Prompt
 */

export interface PromptResult {
  system: string
  user: string
}

export const PromptTemplates = {
  /**
   * 标题生成
   */
  generateTitles: (content: string): PromptResult => ({
    system: `你是一个专业的公众号标题撰写专家。你的任务是根据文章内容，生成5个吸引眼球的标题。

要求：
1. 标题长度控制在15-25字
2. 包含数字、悬念、利益点等吸引元素
3. 符合公众号传播规律
4. 避免标题党和夸张
5. 每个标题风格不同（数据型、悬念型、痛点型、方法型、故事型）

输出格式（必须是纯JSON，不要包含其他文字）：
{
  "titles": [
    {"title": "标题文字", "style": "风格类型", "score": 评分0-100},
    ...
  ]
}`,
    user: `请为以下文章生成5个高质量标题：\n\n${content.substring(0, 1000)}`
  }),

  /**
   * 摘要生成
   */
  generateSummary: (content: string, length: number = 100): PromptResult => ({
    system: `你是一个专业的内容提炼专家。请从文章中提取核心信息，生成简洁的摘要。

要求：
1. 摘要长度约${length}字
2. 突出文章核心观点和价值
3. 语言简洁流畅，通俗易懂
4. 保留关键信息和亮点
5. 适合作为公众号文章简介
6. 能够激发读者点击欲望

直接输出摘要内容，不要包含"摘要："等前缀。`,
    user: `请为以下文章生成${length}字左右的摘要：\n\n${content}`
  }),

  /**
   * 大纲生成
   */
  generateOutline: (
    topic: string, 
    type: 'tutorial' | 'opinion' | 'story' = 'tutorial'
  ): PromptResult => {
    const typeDescriptions = {
      tutorial: '教程步骤型：适合知识分享、技能教学，按步骤递进',
      opinion: '观点论证型：适合深度思考、评论分析，有理有据',
      story: '故事叙述型：适合情感共鸣、案例分享，引人入胜'
    }

    return {
      system: `你是一个专业的内容策划专家。根据给定主题，生成详细的文章大纲。

大纲类型：${typeDescriptions[type]}

输出格式（必须是纯JSON）：
{
  "outline": [
    {
      "level": 1,
      "title": "一级标题",
      "description": "该部分要点说明",
      "estimatedWords": 500,
      "children": [
        {
          "level": 2,
          "title": "二级标题",
          "description": "要点说明",
          "estimatedWords": 200
        }
      ]
    }
  ],
  "totalWords": 2000,
  "readingTime": 5
}

要求：
1. 大纲层次清晰，逻辑严密
2. 每个标题都要有描述说明
3. 估算每部分字数要合理
4. 总字数控制在1500-3000字`,
      user: `主题：${topic}\n\n请生成${typeDescriptions[type]}的详细大纲。`
    }
  },

  /**
   * 可读性改进建议
   */
  improveReadability: (text: string, issues: string[]): PromptResult => ({
    system: `你是一个专业的文字编辑。请改进以下文本的可读性。

发现的问题：
${issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

改进原则：
1. 拆分过长的句子（超过30字）
2. 减少专业术语，增加通俗表达
3. 合理分段，避免段落过长
4. 保持原意，不要改变核心内容
5. 使用更生动的表达

直接输出改进后的文本，不要解释。`,
    user: `请改进以下文本：\n\n${text}`
  }),

  /**
   * 开头生成
   */
  generateOpening: (
    title: string,
    outline: string,
    style: 'story' | 'data' | 'question' | 'scene'
  ): PromptResult => {
    const styleDescriptions = {
      story: '故事型：讲一个引人入胜的小故事，引出主题',
      data: '数据型：用震撼的数据或事实吸引读者',
      question: '问题型：提出引发思考的问题',
      scene: '场景型：描绘生动的场景，让读者产生代入感'
    }

    return {
      system: `你是一个专业的公众号写手。请根据文章标题和大纲，生成引人入胜的开头。

开头类型：${styleDescriptions[style]}

输出格式（必须是纯JSON）：
{
  "openings": [
    "开头选项1（100-150字）",
    "开头选项2（100-150字）",
    "开头选项3（100-150字）"
  ]
}

要求：
1. 每个开头100-150字
2. 与标题和大纲呼应
3. 引发读者继续阅读的欲望
4. 语言生动有画面感
5. 提供3个不同风格的选项`,
      user: `标题：${title}\n\n大纲：${outline}\n\n请生成${styleDescriptions[style]}的开头。`
    }
  },

  /**
   * 结尾生成
   */
  generateEnding: (content: string, cta: boolean = true): PromptResult => ({
    system: `你是一个专业的公众号写手。请根据文章内容，生成有力的结尾。

输出格式（必须是纯JSON）：
{
  "endings": [
    "结尾选项1",
    "结尾选项2",
    "结尾选项3"
  ]
}

要求：
1. 每个结尾50-100字
2. 总结全文核心观点
3. ${cta ? '包含自然的行动号召（如：点赞、评论、转发）' : '不包含行动号召，留有余味'}
4. 给读者留下深刻印象
5. 可以与开头呼应
6. 提供3个不同风格的选项`,
    user: `文章内容摘要：\n\n${content.substring(0, 800)}\n\n请生成结尾。`
  }),

  /**
   * 内容策略分析
   */
  analyzeContentStrategy: (
    articles: Array<{ title: string; views: number; likes: number; date: string }>
  ): PromptResult => ({
    system: `你是一个数据分析专家。分析历史文章数据，给出内容策略建议。

分析维度：
1. 高表现内容的共同特征
2. 读者偏好分析（主题、风格、长度）
3. 内容类型表现对比
4. 发布时间规律
5. 下一篇主题建议（3-5个）

输出格式（必须是纯JSON）：
{
  "insights": [
    "洞察1：具体发现",
    "洞察2：具体发现",
    "洞察3：具体发现"
  ],
  "topTopics": ["高表现主题1", "高表现主题2", "高表现主题3"],
  "recommendations": [
    {
      "topic": "建议主题",
      "reason": "推荐理由",
      "priority": 95,
      "estimatedPerformance": "预期表现"
    }
  ],
  "bestPublishTime": "最佳发布时间段"
}`,
    user: `历史文章数据（按时间倒序）：\n\n${JSON.stringify(articles, null, 2)}\n\n请分析并给出建议。`
  }),

  /**
   * 文本润色
   */
  polishText: (
    text: string,
    style: 'professional' | 'casual' | 'concise' | 'vivid'
  ): PromptResult => {
    const styleDescriptions = {
      professional: '专业：更正式、严谨的表达',
      casual: '轻松：更口语化、亲切的表达',
      concise: '简洁：删除冗余，精简表达',
      vivid: '生动：增加细节，使用比喻、排比等修辞'
    }

    return {
      system: `你是一个专业的文字编辑。请将以下文本润色为${styleDescriptions[style]}风格。

要求：
1. 保持原意不变
2. ${styleDescriptions[style]}
3. 语言流畅自然
4. 符合公众号阅读习惯

直接输出润色后的文本，不要解释。`,
      user: `请润色以下文本：\n\n${text}`
    }
  },

  /**
   * SEO 关键词提取
   */
  extractKeywords: (content: string): PromptResult => ({
    system: `你是一个 SEO 专家。请从文章中提取关键词，用于搜索优化。

输出格式（必须是纯JSON）：
{
  "keywords": [
    {"word": "关键词1", "weight": 10, "category": "核心"},
    {"word": "关键词2", "weight": 8, "category": "重要"},
    {"word": "关键词3", "weight": 5, "category": "相关"}
  ],
  "tags": ["标签1", "标签2", "标签3"]
}

要求：
1. 提取5-10个关键词
2. 按重要性排序
3. 标注关键词类别
4. 生成3-5个内容标签`,
    user: `请提取以下文章的关键词：\n\n${content}`
  })
}

