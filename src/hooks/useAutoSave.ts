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

  const timeoutRef = useRef<number | null>(null)
  const lastContentRef = useRef<string>('')
  const lastTitleRef = useRef<string>('')
  const savingRef = useRef<boolean>(false)
  const currentDocumentIdRef = useRef<string | null>(null)
  const onSaveRef = useRef(onSave)
  const onErrorRef = useRef(onError)

  // 更新回调函数ref
  onSaveRef.current = onSave
  onErrorRef.current = onError

  // 检测内容是否有变化
  const hasContentChanged = useCallback(() => {
    return content !== lastContentRef.current || title !== lastTitleRef.current
  }, [content, title])

  // 执行保存
  const performSave = useCallback(async () => {
    if (!authState.isAuthenticated || savingRef.current) {
      return
    }

    // 内联检查变化，避免依赖hasContentChanged函数
    const contentChanged = content !== lastContentRef.current || title !== lastTitleRef.current
    if (!contentChanged) {
      return
    }

    try {
      savingRef.current = true
      setAutoSaveState(prev => ({ ...prev, isSaving: true }))

      console.log('正在保存文档数据:', {
        title: title || '未命名文档',
        content: content.substring(0, 100) + '...',
        templateId,
        templateVariables,
        documentId: currentDocumentIdRef.current || undefined
      })

      const document = await saveCurrentContent({
        title: title || '未命名文档',
        content,
        templateId,
        templateVariables,
        documentId: currentDocumentIdRef.current || undefined
      })

      // 更新状态和引用
      currentDocumentIdRef.current = document.id
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

      onSaveRef.current?.(document)
      
      console.log('文档已自动保存:', document.title)
    } catch (error) {
      console.error('自动保存失败:', error)
      setAutoSaveState(prev => ({ ...prev, isSaving: false }))
      onErrorRef.current?.(error as Error)
    } finally {
      savingRef.current = false
    }
  }, [
    authState.isAuthenticated,
    title,
    content,
    templateId,
    templateVariables
  ])

  // 手动保存
  const save = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    await performSave()
  }, [performSave])

  // 使用指定内容手动保存
  const saveWithContent = useCallback(async (immediateContent: string) => {
    if (!authState.isAuthenticated || savingRef.current) {
      return
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    try {
      savingRef.current = true
      setAutoSaveState(prev => ({ ...prev, isSaving: true }))

      console.log('正在保存指定内容:', {
        title: title || '未命名文档',
        content: immediateContent.substring(0, 100) + '...',
        templateId,
        templateVariables,
        documentId: currentDocumentIdRef.current || undefined
      })

      const document = await saveCurrentContent({
        title: title || '未命名文档',
        content: immediateContent,
        templateId,
        templateVariables,
        documentId: currentDocumentIdRef.current || undefined
      })

      // 更新状态和引用
      currentDocumentIdRef.current = document.id
      setAutoSaveState(prev => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
        currentDocumentId: document.id,
        hasUnsavedChanges: false
      }))

      // 更新引用值 - 使用传入的内容
      lastContentRef.current = immediateContent
      lastTitleRef.current = title

      onSaveRef.current?.(document)
      
      console.log('文档已手动保存:', document.title)
    } catch (error) {
      console.error('手动保存失败:', error)
      setAutoSaveState(prev => ({ ...prev, isSaving: false }))
      onErrorRef.current?.(error as Error)
    } finally {
      savingRef.current = false
    }
  }, [
    authState.isAuthenticated,
    title,
    templateId,
    templateVariables
  ])

  // 设置当前文档ID（用于加载已有文档时）
  const setCurrentDocumentId = useCallback((documentId: string | null) => {
    currentDocumentIdRef.current = documentId
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
    
    currentDocumentIdRef.current = null
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
    if (!enabled || !authState.isAuthenticated) {
      return
    }

    // 检查内容是否有变化（内联检查避免函数依赖）
    const contentChanged = content !== lastContentRef.current || title !== lastTitleRef.current
    
    if (!contentChanged) {
      return
    }

    // 标记有未保存的更改
    setAutoSaveState(prev => ({ ...prev, hasUnsavedChanges: true }))

    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // 设置新的定时器
    timeoutRef.current = setTimeout(() => {
      performSave()
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [enabled, authState.isAuthenticated, content, title, templateId, templateVariables, delay])

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
    saveWithContent,
    setCurrentDocumentId,
    reset
  }
}