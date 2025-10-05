/**
 * 中文错别字检查工具
 * 轻量级、纯客户端、不影响编辑性能
 */

import { commonMisspellings, phraseErrors, confusablePairs, ConfusablePair } from './chinese-spell-dict-clean'

export interface SpellError {
  word: string           // 错误的词
  correct: string        // 正确的词
  position: number       // 在文本中的位置
  length: number         // 错误词的长度
  type: 'misspelling' | 'confusable'  // 错误类型
  context?: string       // 上下文说明
  hint?: string          // 提示信息
}

/**
 * 检查文本中的错别字
 * @param text 要检查的文本
 * @param options 检查选项
 * @returns 错误列表
 */
export function checkSpelling(
  text: string,
  options: {
    checkConfusables?: boolean  // 是否检查易混淆词
    maxResults?: number         // 最多返回多少个错误
  } = {}
): SpellError[] {
  const {
    checkConfusables = false,  // 默认不检查易混淆词（需要更复杂的上下文分析）
    maxResults = 100
  } = options

  const errors: SpellError[] = []

  // 1. 检查词组级别的错误（优先级高）
  for (const phrase of phraseErrors) {
    let index = 0
    while ((index = text.indexOf(phrase.wrong, index)) !== -1) {
      errors.push({
        word: phrase.wrong,
        correct: phrase.correct,
        position: index,
        length: phrase.wrong.length,
        type: 'misspelling',
        context: phrase.context
      })
      index += phrase.wrong.length
      
      if (errors.length >= maxResults) {
        return errors
      }
    }
  }

  // 2. 检查单字错误（优化：更严格的过滤）
  for (const [wrong, correct] of Object.entries(commonMisspellings)) {
    // 跳过正确的词（字典中标记为"正确"的）
    if (wrong === correct) continue
    
    // 跳过包含"正确"注释的词
    if (wrong.length === 0 || correct.length === 0) continue
    
    let index = 0
    while ((index = text.indexOf(wrong, index)) !== -1) {
      // 避免重复报告（如果这个位置已经在词组错误中）
      const alreadyReported = errors.some(
        e => e.position <= index && e.position + e.length > index
      )
      
      // 上下文检查：避免误报
      // 如果前后都是中文字符，需要更谨慎（可能是组词的一部分）
      const before = text[index - 1]
      const after = text[index + wrong.length]
      const isChinese = (char: string) => char && /[\u4e00-\u9fa5]/.test(char)
      
      // 如果两侧都是中文，且错误词只有单字，跳过（太容易误报）
      if (wrong.length === 1 && isChinese(before) && isChinese(after)) {
        index += wrong.length
        continue
      }
      
      if (!alreadyReported) {
        errors.push({
          word: wrong,
          correct: correct,
          position: index,
          length: wrong.length,
          type: 'misspelling'
        })
      }
      
      index += wrong.length
      
      if (errors.length >= maxResults) {
        return errors
      }
    }
  }

  // 3. 检查易混淆词（可选，性能较低）
  if (checkConfusables) {
    // TODO: 实现基于上下文的易混淆词检查
    // 这需要更复杂的自然语言处理，暂时不实现
  }

  // 按位置排序
  return errors.sort((a, b) => a.position - b.position)
}

/**
 * 快速检查文本中是否有错别字（只返回布尔值，性能更高）
 * @param text 要检查的文本
 * @returns 是否有错别字
 */
export function hasSpellingErrors(text: string): boolean {
  // 只检查词组错误（更常见、更重要）
  for (const phrase of phraseErrors) {
    if (text.includes(phrase.wrong)) {
      return true
    }
  }
  
  // 检查最常见的单字错误（前20个）
  const commonErrors = [
    '在见', '在说', '在次', '己经', '自已',
    '做品', '做业', '做用', '做者', '做家',
    '坐者', '坐用', '工做', '编缉', '布署',
    '应响', '既使', '建意', '起动'
  ]
  
  for (const wrong of commonErrors) {
    if (text.includes(wrong)) {
      return true
    }
  }
  
  return false
}

/**
 * 获取易混淆词的提示信息
 * @param word 词语
 * @returns 提示信息
 */
export function getConfusableHint(word: string): ConfusablePair | null {
  return confusablePairs.find(
    pair => pair.word1 === word || pair.word2 === word
  ) || null
}

/**
 * 应用错别字修正
 * @param text 原文本
 * @param errors 错误列表
 * @returns 修正后的文本
 */
export function applyCorrections(text: string, errors: SpellError[]): string {
  // 从后往前修正，避免位置偏移
  const sortedErrors = [...errors].sort((a, b) => b.position - a.position)
  
  let result = text
  for (const error of sortedErrors) {
    result = 
      result.slice(0, error.position) +
      error.correct +
      result.slice(error.position + error.length)
  }
  
  return result
}

/**
 * 高亮显示错别字（用于预览）
 * @param text 原文本
 * @param errors 错误列表
 * @returns HTML字符串（带高亮标记）
 */
export function highlightErrors(text: string, errors: SpellError[]): string {
  if (errors.length === 0) return text
  
  // 从后往前插入标记，避免位置偏移
  const sortedErrors = [...errors].sort((a, b) => b.position - a.position)
  
  let result = text
  for (const error of sortedErrors) {
    const errorWord = result.slice(error.position, error.position + error.length)
    const tooltip = error.context 
      ? `${error.correct}（${error.context}）`
      : error.correct
    
    const highlighted = `<span class="spell-error" data-correct="${error.correct}" data-tooltip="${tooltip}">${errorWord}</span>`
    
    result = 
      result.slice(0, error.position) +
      highlighted +
      result.slice(error.position + error.length)
  }
  
  return result
}

/**
 * 统计错别字信息
 * @param text 要检查的文本
 * @returns 统计信息
 */
export function getSpellingStats(text: string): {
  totalErrors: number
  errorTypes: Record<string, number>
  topErrors: Array<{ word: string; count: number }>
} {
  const errors = checkSpelling(text)
  
  const errorTypes: Record<string, number> = {
    misspelling: 0,
    confusable: 0
  }
  
  const errorCounts: Record<string, number> = {}
  
  for (const error of errors) {
    errorTypes[error.type]++
    errorCounts[error.word] = (errorCounts[error.word] || 0) + 1
  }
  
  const topErrors = Object.entries(errorCounts)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
  
  return {
    totalErrors: errors.length,
    errorTypes,
    topErrors
  }
}

