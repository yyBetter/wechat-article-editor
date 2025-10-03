/**
 * 大纲解析工具
 * 从 Markdown 内容中提取标题结构
 */

export interface OutlineNode {
  id: string              // 唯一标识
  level: number           // 标题层级 (1-6)
  text: string            // 标题文本
  line: number            // 在文档中的行号
  position: number        // 在文档中的字符位置
  children?: OutlineNode[] // 子节点
}

/**
 * 解析 Markdown 内容，提取标题结构
 * @param content Markdown 内容
 * @returns 扁平化的标题节点数组
 */
export function parseOutline(content: string): OutlineNode[] {
  if (!content || !content.trim()) {
    return []
  }

  const lines = content.split('\n')
  const nodes: OutlineNode[] = []
  let currentPosition = 0

  lines.forEach((line, index) => {
    // 匹配 Markdown 标题：# 标题
    const match = line.match(/^(#{1,6})\s+(.+)$/)
    
    if (match) {
      const level = match[1].length
      const text = match[2].trim()
      
      // 生成唯一 ID
      const id = `heading-${index}-${level}-${text.substring(0, 20).replace(/\s/g, '-')}`
      
      nodes.push({
        id,
        level,
        text,
        line: index,
        position: currentPosition,
      })
    }
    
    // 更新位置（包括换行符）
    currentPosition += line.length + 1
  })

  return nodes
}

/**
 * 将扁平化的节点数组转换为树形结构
 * @param nodes 扁平化的节点数组
 * @returns 树形结构的根节点数组
 */
export function buildOutlineTree(nodes: OutlineNode[]): OutlineNode[] {
  if (nodes.length === 0) {
    return []
  }

  const root: OutlineNode[] = []
  const stack: OutlineNode[] = []

  nodes.forEach(node => {
    // 创建新节点（避免修改原对象）
    const newNode: OutlineNode = { ...node, children: [] }

    // 找到合适的父节点
    while (stack.length > 0) {
      const parent = stack[stack.length - 1]
      
      if (parent.level < newNode.level) {
        // 当前节点是栈顶节点的子节点
        if (!parent.children) {
          parent.children = []
        }
        parent.children.push(newNode)
        stack.push(newNode)
        return
      } else {
        // 当前节点不是栈顶节点的子节点，出栈
        stack.pop()
      }
    }

    // 如果栈为空，说明是根节点
    root.push(newNode)
    stack.push(newNode)
  })

  return root
}

/**
 * 根据当前光标位置，查找对应的大纲节点
 * @param nodes 节点数组
 * @param cursorPosition 光标位置
 * @returns 当前激活的节点 ID
 */
export function getActiveNodeId(nodes: OutlineNode[], cursorPosition: number): string | null {
  if (nodes.length === 0) {
    return null
  }

  // 找到光标位置之前的最近的标题
  let activeNode: OutlineNode | null = null

  for (let i = nodes.length - 1; i >= 0; i--) {
    if (nodes[i].position <= cursorPosition) {
      activeNode = nodes[i]
      break
    }
  }

  return activeNode ? activeNode.id : null
}

/**
 * 获取标题的缩进级别（用于视觉展示）
 * @param level 标题层级
 * @returns 缩进像素值
 */
export function getIndentLevel(level: number): number {
  // 一级标题不缩进，每增加一级缩进 20px
  return (level - 1) * 20
}

/**
 * 统计每个层级的节点数量
 * @param nodes 节点数组
 * @returns 统计信息
 */
export function getOutlineStats(nodes: OutlineNode[]): {
  total: number
  byLevel: Record<number, number>
} {
  const stats = {
    total: nodes.length,
    byLevel: {} as Record<number, number>
  }

  nodes.forEach(node => {
    stats.byLevel[node.level] = (stats.byLevel[node.level] || 0) + 1
  })

  return stats
}

/**
 * 验证大纲结构是否合理
 * @param nodes 节点数组
 * @returns 验证结果
 */
export function validateOutline(nodes: OutlineNode[]): {
  isValid: boolean
  warnings: string[]
} {
  const warnings: string[] = []

  if (nodes.length === 0) {
    return { isValid: true, warnings: [] }
  }

  // 检查是否有一级标题
  const hasH1 = nodes.some(node => node.level === 1)
  if (!hasH1) {
    warnings.push('建议添加一个一级标题（#）作为文档标题')
  }

  // 检查是否有标题层级跳跃
  for (let i = 1; i < nodes.length; i++) {
    const prev = nodes[i - 1]
    const curr = nodes[i]
    
    if (curr.level - prev.level > 1) {
      warnings.push(`第 ${curr.line + 1} 行：标题层级跳跃过大（从 H${prev.level} 到 H${curr.level}）`)
    }
  }

  return {
    isValid: warnings.length === 0,
    warnings
  }
}

