// 自动保存Hook
import { useEffect, useCallback, useRef, useState } from 'react'
import { useAuth } from '../utils/auth-context'
import { saveCurrentContent, Document } from '../utils/document-api'

interface AutoSaveOptions {
  delay?: number // 延迟时间(毫秒)，默认3000ms
  enabled?: boolean // 是否启用自动保存
  onSave?: (document: Document) => void // 保存成功回调
  onError?: (error: Error) => void // 保存失败回调
}

interface AutoSaveState {
  isSaving: boolean
  lastSaved: Date | null
  currentDocumentId: string | null
  hasUnsavedChanges: boolean
}

export function useAutoSave(
  title: string,
  content: string,
  templateId: string,
  templateVariables: Record<string, any>,
  options: AutoSaveOptions = {}
) {
  const {
    delay = 3000,
    enabled = true,
    onSave,
    onError
  } = options

  const { state: authState } = useAuth()
  const [autoSaveState, setAutoSaveState] = useState<AutoSaveState>({
    isSaving: false,
    lastSaved: null,
    currentDocumentId: null,
    hasUnsavedChanges: false
  })

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastContentRef = useRef<string>('')
  const lastTitleRef = useRef<string>('')
  const savingRef = useRef<boolean>(false)

  // 检测内容是否有变化
  const hasContentChanged = useCallback(() => {
    return content !== lastContentRef.current || title !== lastTitleRef.current
  }, [content, title])

  // 执行保存
  const performSave = useCallback(async () => {
    if (!authState.isAuthenticated || savingRef.current || !hasContentChanged()) {
      return
    }

    try {
      savingRef.current = true
      setAutoSaveState(prev => ({ ...prev, isSaving: true }))

      const document = await saveCurrentContent({
        title: title || '未命名文档',
        content,
        templateId,
        templateVariables,
        documentId: autoSaveState.currentDocumentId || undefined
      })

      // 更新状态
      setAutoSaveState(prev => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
        currentDocumentId: document.id,
        hasUnsavedChanges: false
      }))

      // 更新引用值
      lastContentRef.current = content
      lastTitleRef.current = title

      onSave?.(document)
      
      console.log('文档已自动保存:', document.title)
    } catch (error) {
      console.error('自动保存失败:', error)
      setAutoSaveState(prev => ({ ...prev, isSaving: false }))
      onError?.(error as Error)
    } finally {
      savingRef.current = false
    }
  }, [
    authState.isAuthenticated,
    title,
    content,
    templateId,
    templateVariables,
    autoSaveState.currentDocumentId,
    hasContentChanged,
    onSave,
    onError
  ])

  // 手动保存
  const save = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    await performSave()
  }, [performSave])

  // 设置当前文档ID（用于加载已有文档时）
  const setCurrentDocumentId = useCallback((documentId: string | null) => {
    setAutoSaveState(prev => ({
      ...prev,
      currentDocumentId: documentId,
      hasUnsavedChanges: false
    }))
    
    if (documentId) {
      // 如果设置了文档ID，更新引用值为当前内容
      lastContentRef.current = content
      lastTitleRef.current = title
    }
  }, [content, title])

  // 重置自动保存状态（用于新建文档）
  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    
    setAutoSaveState({
      isSaving: false,
      lastSaved: null,
      currentDocumentId: null,
      hasUnsavedChanges: false
    })
    
    lastContentRef.current = ''
    lastTitleRef.current = ''
  }, [])

  // 自动保存逻辑
  useEffect(() => {
    if (!enabled || !authState.isAuthenticated || !hasContentChanged()) {
      return
    }

    // 标记有未保存的更改
    setAutoSaveState(prev => ({ ...prev, hasUnsavedChanges: true }))

    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // 设置新的定时器
    timeoutRef.current = setTimeout(performSave, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [enabled, authState.isAuthenticated, content, title, templateId, templateVariables, delay, hasContentChanged, performSave])

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    ...autoSaveState,
    save,
    setCurrentDocumentId,
    reset
  }
}