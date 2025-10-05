// 字数统计工具 - 与服务端保持一致
export function countWords(content: string): number {
  if (!content || content.trim() === '') return 0
  
  // 移除 markdown 语法字符，但保留文字内容
  let cleanContent = content
    // 移除代码块
    .replace(/```[\s\S]*?```/g, ' ')
    // 移除内联代码
    .replace(/`[^`]+`/g, ' ')
    // 移除图片和链接语法
    .replace(/!?\[[^\]]*\]\([^)]*\)/g, ' ')
    // 移除标题符号
    .replace(/^#{1,6}\s+/gm, '')
    // 移除列表符号
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    // 移除引用符号
    .replace(/^>\s*/gm, '')
    // 移除加粗、斜体符号
    .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1')
    // 移除多余空格和换行
    .replace(/\s+/g, ' ')
    .trim()
  
  if (!cleanContent) return 0
  
  // 统计中文字符
  const chineseChars = (cleanContent.match(/[\u4e00-\u9fa5]/g) || []).length
  
  // 统计英文单词（不包括单独的数字和符号）
  const englishWords = cleanContent
    .replace(/[\u4e00-\u9fa5]/g, ' ') // 移除中文
    .replace(/[^a-zA-Z\s]/g, ' ') // 只保留英文字母
    .split(/\s+/)
    .filter(word => word.length > 1) // 只统计长度>1的单词
    .length
  
  return chineseChars + englishWords
}
