// 自动保存Hook - 飞书模式（延迟创建+智能保存）
import { useEffect, useCallback, useRef, useState } from 'react'
import { useAuth } from '../utils/auth-context'
import { useApp } from '../utils/app-context'
import { saveCurrentContent, Document } from '../utils/document-api'
import { getStorageConfig } from '../utils/storage-adapter'
import type { DocumentStatus } from '../types/app'

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

// 飞书模式：判断是否应该创建文档
function shouldCreateDocument(
  content: string,
  title: string,
  documentStatus: DocumentStatus,
  editStartTime: Date | null
): boolean {
  // 如果已经是DRAFT或NORMAL状态，说明已经创建过了
  if (documentStatus !== 'TEMP') {
    return false
  }

  const contentLength = content.trim().length
  const hasTitle = title.trim().length > 0

  // 条件1: 内容 ≥ 30字 + 标题非空
  if (contentLength >= 30 && hasTitle) {
    return true
  }

  // 条件2: 内容 ≥ 50字（即使标题为空）
  if (contentLength >= 50) {
    return true
  }

  // 条件3: 编辑时长 > 3分钟且有内容
  if (editStartTime && contentLength > 10) {
    const editDuration = Date.now() - editStartTime.getTime()
    if (editDuration > 3 * 60 * 1000) { // 3分钟
      return true
    }
  }

  return false
}

// 飞书模式：判断是否应该升级文档状态 (DRAFT -> NORMAL)
function shouldUpgradeToNormal(
  content: string,
  title: string,
  documentStatus: DocumentStatus,
  editStartTime: Date | null
): boolean {
  // 只有DRAFT状态才需要升级
  if (documentStatus !== 'DRAFT') {
    return false
  }

  const contentLength = content.trim().length
  const hasTitle = title.trim().length > 0

  // 条件1: 内容 ≥ 30字
  if (contentLength >= 30) {
    return true
  }

  // 条件2: 标题非空 + 内容 ≥ 10字
  if (hasTitle && contentLength >= 10) {
    return true
  }

  // 条件3: 编辑时长 > 3分钟
  if (editStartTime) {
    const editDuration = Date.now() - editStartTime.getTime()
    if (editDuration > 3 * 60 * 1000) { // 3分钟
      return true
    }
  }

  return false
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
  const { state, dispatch } = useApp()
  const { documentStatus, documentId, editStartTime } = state.editor

  const [autoSaveState, setAutoSaveState] = useState<AutoSaveState>({
    isSaving: false,
    lastSaved: null,
    currentDocumentId: documentId,
    hasUnsavedChanges: false
  })

  const timeoutRef = useRef<number | null>(null)
  const lastContentRef = useRef<string>('')
  const lastTitleRef = useRef<string>('')
  const savingRef = useRef<boolean>(false)
  const onSaveRef = useRef(onSave)
  const onErrorRef = useRef(onError)

  // 更新回调函数ref
  onSaveRef.current = onSave
  onErrorRef.current = onError

  // 检测内容是否有变化
  const hasContentChanged = useCallback(() => {
    return content !== lastContentRef.current || title !== lastTitleRef.current
  }, [content, title])

  // 执行保存（飞书模式）
  const performSave = useCallback(async () => {
    if (!authState.isAuthenticated || savingRef.current) {
      return
    }

    // 飞书模式：TEMP状态特殊处理
    if (documentStatus === 'TEMP') {
      // 检查是否应该创建文档（使用完整内容判断，不是增量）
      const shouldCreate = shouldCreateDocument(content, title, documentStatus, editStartTime)
      
      if (!shouldCreate) {
        console.log('📝 内容太少，暂不创建文档（飞书模式）', {
          contentLength: content.trim().length,
          hasTitle: title.trim().length > 0,
          editDuration: editStartTime ? Math.floor((Date.now() - editStartTime.getTime()) / 1000) + 's' : '0s'
        })
        // 重要：更新 lastRef，避免重复触发
        lastContentRef.current = content
        lastTitleRef.current = title
        return
      }
      
      console.log('✅ 满足创建条件，开始创建文档', {
        contentLength: content.trim().length,
        hasTitle: title.trim().length > 0
      })
    } else {
      // DRAFT 或 NORMAL 状态：检查是否有变化
      const contentChanged = content !== lastContentRef.current || title !== lastTitleRef.current
      if (!contentChanged) {
        return
      }
    }

    try {
      savingRef.current = true
      setAutoSaveState(prev => ({ ...prev, isSaving: true }))

      console.log('正在保存文档数据:', {
        title: title || '未命名文档',
        content: content.substring(0, 100) + '...',
        templateId,
        documentStatus,
        documentId
      })

      const document = await saveCurrentContent({
        title: title || '未命名文档',
        content,
        templateId,
        templateVariables,
        documentId: documentId || undefined
      })

      // 更新文档ID和状态
      if (!documentId) {
        dispatch({ type: 'SET_DOCUMENT_ID', payload: document.id })
      }

      // 飞书模式：状态升级逻辑
      if (documentStatus === 'TEMP') {
        // TEMP -> DRAFT (首次创建)
        dispatch({ type: 'SET_DOCUMENT_STATUS', payload: 'DRAFT' })
        console.log('📄 文档已创建为草稿 (TEMP -> DRAFT)')
      } else if (documentStatus === 'DRAFT') {
        // 检查是否应该升级到 NORMAL
        if (shouldUpgradeToNormal(content, title, documentStatus, editStartTime)) {
          dispatch({ type: 'SET_DOCUMENT_STATUS', payload: 'NORMAL' })
          console.log('✅ 文档已升级为正式文档 (DRAFT -> NORMAL)')
        }
      }
      
      // 如果是本地或混合模式，创建自动版本记录
      const config = getStorageConfig()
      if (config.mode === 'local' || config.mode === 'hybrid') {
        try {
          const { createAutoSaveVersion } = await import('../utils/local-version-api')
          await createAutoSaveVersion(document.id, {
            title: document.title,
            content: document.content,
            templateId: document.templateId,
            templateVariables: document.templateVariables
          })
        } catch (versionError) {
          console.warn('创建自动版本记录失败:', versionError)
        }
      }

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
    templateVariables,
    documentStatus,
    documentId,
    editStartTime,
    dispatch
  ])

  // 手动保存（不受限制）
  const save = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    // 手动保存时，直接升级到NORMAL状态
    if (documentStatus === 'TEMP' || documentStatus === 'DRAFT') {
      dispatch({ type: 'SET_DOCUMENT_STATUS', payload: 'NORMAL' })
    }

    await performSave()
  }, [performSave, documentStatus, dispatch])

  // 使用指定内容手动保存
  const saveWithContent = useCallback(async (immediateContent: string) => {
    if (!authState.isAuthenticated || savingRef.current) {
      return
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    // 手动保存时，直接升级到NORMAL状态
    if (documentStatus === 'TEMP' || documentStatus === 'DRAFT') {
      dispatch({ type: 'SET_DOCUMENT_STATUS', payload: 'NORMAL' })
    }

    try {
      savingRef.current = true
      setAutoSaveState(prev => ({ ...prev, isSaving: true }))

      const document = await saveCurrentContent({
        title: title || '未命名文档',
        content: immediateContent,
        templateId,
        templateVariables,
        documentId: documentId || undefined
      })

      if (!documentId) {
        dispatch({ type: 'SET_DOCUMENT_ID', payload: document.id })
      }

      const config = getStorageConfig()
      if (config.mode === 'local' || config.mode === 'hybrid') {
        try {
          const { createAutoSaveVersion } = await import('../utils/local-version-api')
          await createAutoSaveVersion(document.id, {
            title: document.title,
            content: document.content,
            templateId: document.templateId,
            templateVariables: document.templateVariables
          })
        } catch (versionError) {
          console.warn('创建版本记录失败:', versionError)
        }
      }

      setAutoSaveState(prev => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
        currentDocumentId: document.id,
        hasUnsavedChanges: false
      }))

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
    templateVariables,
    documentId,
    documentStatus,
    dispatch
  ])

  // 设置当前文档ID（用于加载已有文档时）
  const setCurrentDocumentId = useCallback((docId: string | null, status: DocumentStatus = 'NORMAL') => {
    dispatch({ type: 'SET_DOCUMENT_ID', payload: docId })
    dispatch({ type: 'SET_DOCUMENT_STATUS', payload: status })
    setAutoSaveState(prev => ({
      ...prev,
      currentDocumentId: docId,
      hasUnsavedChanges: false
    }))
    
    if (docId) {
      lastContentRef.current = content
      lastTitleRef.current = title
    }
  }, [content, title, dispatch])

  // 重置自动保存状态（用于新建文档）
  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    
    dispatch({ type: 'RESET_DOCUMENT' })
    setAutoSaveState({
      isSaving: false,
      lastSaved: null,
      currentDocumentId: null,
      hasUnsavedChanges: false
    })
    
    lastContentRef.current = ''
    lastTitleRef.current = ''
  }, [dispatch])

  // 自动保存逻辑
  useEffect(() => {
    if (!enabled || !authState.isAuthenticated) {
      return
    }

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

    // 飞书模式：根据文档状态设置不同的延迟
    let saveDelay = delay
    if (documentStatus === 'TEMP') {
      // TEMP状态：延迟10秒（给用户更多思考时间）
      saveDelay = 10000
    } else if (documentStatus === 'DRAFT') {
      // DRAFT状态：延迟5秒
      saveDelay = 5000
    } else {
      // NORMAL状态：延迟3秒（快速保存）
      saveDelay = delay
    }

    // 设置新的定时器
    timeoutRef.current = setTimeout(() => {
      performSave()
    }, saveDelay) as unknown as number

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [enabled, authState.isAuthenticated, content, title, documentStatus, delay, performSave])

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
    documentStatus,
    save,
    saveWithContent,
    setCurrentDocumentId,
    reset
  }
}