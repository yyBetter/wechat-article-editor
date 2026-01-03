// 自动保存Hook - 纯本地模式
import { useEffect, useCallback, useRef, useState } from 'react'
import { useApp } from '../utils/app-context'
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

  const { dispatch } = useApp()
  const documentId = null // 纯工具模式下，我们可以选择不持久化到特定ID，或者始终使用同一个

  const [autoSaveState, setAutoSaveState] = useState<AutoSaveState>({
    isSaving: false,
    lastSaved: localStorage.getItem('last_saved_time') ? new Date(localStorage.getItem('last_saved_time')!) : null,
    currentDocumentId: null,
    hasUnsavedChanges: false
  })

  const timeoutRef = useRef<number | null>(null)
  const lastContentRef = useRef<string>('')
  const lastTitleRef = useRef<string>('')
  const savingRef = useRef<boolean>(false)

  // 执行保存
  const performSave = useCallback(async () => {
    if (savingRef.current) return

    const contentChanged = content !== lastContentRef.current || title !== lastTitleRef.current
    if (!contentChanged && lastContentRef.current !== '') return

    try {
      savingRef.current = true
      setAutoSaveState(prev => ({ ...prev, isSaving: true }))

      // 纯本地保存到 localStorage 作为备份
      localStorage.setItem('editor_content_backup', content)
      localStorage.setItem('editor_title_backup', title)
      localStorage.setItem('last_saved_time', new Date().toISOString())

      // 如果需要 local-document-api 支持，也可以调用
      await saveCurrentContent({
        title: title || '未命名文档',
        content,
        templateId,
        templateVariables,
      })

      setAutoSaveState(prev => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
        hasUnsavedChanges: false
      }))

      lastContentRef.current = content
      lastTitleRef.current = title

      onSave?.({ id: 'local', title, content } as any)
    } catch (error) {
      console.error('自动保存失败:', error)
      setAutoSaveState(prev => ({ ...prev, isSaving: false }))
      onError?.(error as Error)
    } finally {
      savingRef.current = false
    }
  }, [title, content, templateId, templateVariables, onSave, onError])

  // 手动保存
  const save = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    await performSave()
  }, [performSave])

  // 自动保存逻辑
  useEffect(() => {
    if (!enabled) return

    const contentChanged = content !== lastContentRef.current || title !== lastTitleRef.current
    if (!contentChanged) return

    setAutoSaveState(prev => ({ ...prev, hasUnsavedChanges: true }))

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = window.setTimeout(() => {
      performSave()
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [enabled, content, title, delay, performSave])

  return {
    ...autoSaveState,
    save,
    reset: () => {
      localStorage.removeItem('editor_content_backup')
      localStorage.removeItem('editor_title_backup')
      lastContentRef.current = ''
      lastTitleRef.current = ''
      setAutoSaveState(prev => ({ ...prev, lastSaved: null, hasUnsavedChanges: false }))
    }
  }
}