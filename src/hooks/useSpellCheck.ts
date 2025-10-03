/**
 * 错别字检查 Hook
 * 使用防抖避免影响编辑性能
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { checkSpelling, SpellError, hasSpellingErrors } from '../utils/spell-checker'

interface UseSpellCheckOptions {
  enabled?: boolean           // 是否启用检查
  debounceMs?: number        // 防抖延迟（毫秒）
  checkConfusables?: boolean // 是否检查易混淆词
  maxResults?: number        // 最多返回多少个错误
}

interface UseSpellCheckResult {
  errors: SpellError[]       // 错误列表
  hasErrors: boolean         // 是否有错误
  isChecking: boolean        // 是否正在检查
  checkText: (text: string) => void  // 手动触发检查
  clearErrors: () => void    // 清除错误
}

/**
 * 错别字检查 Hook
 */
export function useSpellCheck(
  text: string,
  options: UseSpellCheckOptions = {}
): UseSpellCheckResult {
  const {
    enabled = true,
    debounceMs = 1000,      // 默认1秒延迟，不影响编辑
    checkConfusables = false,
    maxResults = 50
  } = options

  const [errors, setErrors] = useState<SpellError[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const debounceTimerRef = useRef<number | null>(null)

  // 实际执行检查的函数
  const performCheck = useCallback((textToCheck: string) => {
    if (!enabled || !textToCheck.trim()) {
      setErrors([])
      setIsChecking(false)
      return
    }

    setIsChecking(true)

    // 使用 setTimeout 将检查放到下一个事件循环，避免阻塞 UI
    setTimeout(() => {
      try {
        const foundErrors = checkSpelling(textToCheck, {
          checkConfusables,
          maxResults
        })
        setErrors(foundErrors)
      } catch (error) {
        console.error('拼写检查出错:', error)
        setErrors([])
      } finally {
        setIsChecking(false)
      }
    }, 0)
  }, [enabled, checkConfusables, maxResults])

  // 防抖检查
  const debouncedCheck = useCallback((textToCheck: string) => {
    // 清除之前的定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // 设置新的定时器
    debounceTimerRef.current = setTimeout(() => {
      performCheck(textToCheck)
    }, debounceMs)
  }, [debounceMs, performCheck])

  // 手动触发检查（立即执行）
  const checkText = useCallback((textToCheck: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    performCheck(textToCheck)
  }, [performCheck])

  // 清除错误
  const clearErrors = useCallback(() => {
    setErrors([])
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
  }, [])

  // 监听文本变化，自动触发检查
  useEffect(() => {
    if (enabled && text) {
      debouncedCheck(text)
    } else {
      setErrors([])
    }

    // 清理函数
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [text, enabled, debouncedCheck])

  return {
    errors,
    hasErrors: errors.length > 0,
    isChecking,
    checkText,
    clearErrors
  }
}

/**
 * 轻量级检查 Hook（只检查是否有错误，不返回详细信息）
 * 性能更高，适合实时提示
 */
export function useHasSpellingErrors(
  text: string,
  options: { enabled?: boolean; debounceMs?: number } = {}
): { hasErrors: boolean; isChecking: boolean } {
  const { enabled = true, debounceMs = 500 } = options

  const [hasErrors, setHasErrors] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const debounceTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled || !text.trim()) {
      setHasErrors(false)
      return
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    setIsChecking(true)

    debounceTimerRef.current = setTimeout(() => {
      try {
        const result = hasSpellingErrors(text)
        setHasErrors(result)
      } catch (error) {
        console.error('拼写检查出错:', error)
        setHasErrors(false)
      } finally {
        setIsChecking(false)
      }
    }, debounceMs)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [text, enabled, debounceMs])

  return { hasErrors, isChecking }
}

