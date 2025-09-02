// 模板选择器组件
import React from 'react'
import { useApp } from '../utils/app-context'
import { Template } from '../types/template'
import { templatePresets } from '../templates'
import { DocumentSettings } from './DocumentSettings'
import { TemplateCustomizer } from './TemplateCustomizer'

export function TemplateSelector() {
  const { state, dispatch } = useApp()
  
  // 选择模板
  const selectTemplate = (templateId: string) => {
    dispatch({ type: 'SELECT_TEMPLATE', payload: templateId })
    // 标记用户已手动选择模板，防止自动推荐覆盖
    dispatch({ type: 'SET_UI_STATE', payload: { userHasSelectedTemplate: true } })
  }
  
  // 更新模板变量
  const updateVariable = (key: string, value: string) => {
    dispatch({ 
      type: 'UPDATE_TEMPLATE_VARIABLES', 
      payload: { [key]: value } 
    })
  }
  
  return (
    <div className="template-selector">
      <h3 className="section-title">🎨 选择模板</h3>
      
      {/* 模板列表 */}
      <div className="template-grid">
        {state.templates.available.map((template: Template) => {
          const preset = templatePresets[template.id as keyof typeof templatePresets]
          const isActive = state.templates.current?.id === template.id
          
          return (
            <div
              key={template.id}
              className={`template-card ${isActive ? 'active' : ''}`}
              onClick={() => selectTemplate(template.id)}
            >
              <div className="template-preview">
                <div className="template-icon">{preset.icon}</div>
                <div className="template-info">
                  <h4 className="template-name">{template.name}</h4>
                  <p className="template-desc">{template.description}</p>
                </div>
              </div>
              
              {/* 使用场景标签 */}
              <div className="template-tags">
                {preset.scenarios.map((scenario: string, index: number) => (
                  <span key={index} className="template-tag">
                    {scenario}
                  </span>
                ))}
              </div>
              
              {isActive && (
                <div className="template-active-indicator">
                  ✓ 已选择
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 文档信息设置 */}
      <div className="settings-section">
        <DocumentSettings />
      </div>
      
      {/* 模板定制 */}
      <div className="settings-section">
        <TemplateCustomizer />
      </div>

      {/* 模板使用说明 */}
      {state.templates.current?.usage && (
        <div className="template-usage-guide" style={{margin: '20px'}}>
          <h5>📖 使用说明：</h5>
          <div className="usage-content">
            {state.templates.current.usage.split('\n').map((line, index) => {
              if (line.startsWith('### ')) {
                return <h6 key={index}>{line.replace('### ', '')}</h6>
              } else if (line.startsWith('- ')) {
                return <div key={index}>{line}</div>
              } else if (line.trim()) {
                return <p key={index}>{line}</p>
              }
              return null
            })}
          </div>
        </div>
      )}
    </div>
  )
}