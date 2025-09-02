// 文档设置组件 - 管理当前文档的基本信息
import React from 'react'
import { useApp } from '../utils/app-context'

export function DocumentSettings() {
  const { state, dispatch } = useApp()
  
  // 获取默认日期
  const getDefaultDate = () => {
    return new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    })
  }
  
  // 更新文档信息
  const updateDocumentInfo = (key: string, value: string) => {
    dispatch({ 
      type: 'UPDATE_TEMPLATE_VARIABLES', 
      payload: { [key]: value } 
    })
  }
  
  // 如果日期为空，设置默认日期
  React.useEffect(() => {
    if (!state.templates.variables.date) {
      updateDocumentInfo('date', getDefaultDate())
    }
  }, [state.templates.variables.date])
  
  return (
    <div className="document-settings">
      <h4 className="settings-subtitle">📄 文档信息</h4>
      <div className="settings-desc">当前文档的基本信息，会显示在文章头部</div>
      
      <div className="variable-group">
        <label className="variable-label">
          文章标题
          <input
            type="text"
            value={state.templates.variables.title || ''}
            onChange={(e) => updateDocumentInfo('title', e.target.value)}
            placeholder="输入文章标题"
            className="variable-input"
          />
        </label>
        
        <label className="variable-label">
          作者署名
          <input
            type="text"
            value={state.templates.variables.author || ''}
            onChange={(e) => updateDocumentInfo('author', e.target.value)}
            placeholder="输入作者名称（可选）"
            className="variable-input"
          />
        </label>
        
        <label className="variable-label">
          发布日期
          <input
            type="text"
            value={state.templates.variables.date || getDefaultDate()}
            onChange={(e) => updateDocumentInfo('date', e.target.value)}
            placeholder="2025年8月30日"
            className="variable-input"
          />
        </label>
      </div>
    </div>
  )
}