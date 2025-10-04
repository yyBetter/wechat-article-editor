// 模板选择器组件 - 精简版（带内联配色编辑）
import React, { useState } from 'react'
import { useApp } from '../utils/app-context'
import { Template } from '../types/template'
import { templatePresets } from '../templates'

export function TemplateSelector() {
  const { state, dispatch } = useApp()
  const [showTooltip, setShowTooltip] = useState(false)
  const [editingColorIndex, setEditingColorIndex] = useState<number | null>(null)
  
  // 选择模板
  const selectTemplate = (templateId: string) => {
    const selectedTemplate = state.templates.available.find(t => t.id === templateId)
    
    // 切换模板
    dispatch({ type: 'SELECT_TEMPLATE', payload: templateId })
    
    // 应用模板预设配色（如果存在）
    if (selectedTemplate?.brandColors) {
      dispatch({
        type: 'UPDATE_FIXED_ASSETS',
        payload: { brandColors: selectedTemplate.brandColors }
      })
    }
    
    // 标记用户已手动选择模板，防止自动推荐覆盖
    dispatch({ type: 'SET_UI_STATE', payload: { userHasSelectedTemplate: true } })
  }
  
  // 更新单个颜色
  const updateBrandColor = (index: number, color: string) => {
    const newColors = [...state.assets.fixedAssets.brandColors]
    newColors[index] = color
    
    dispatch({
      type: 'UPDATE_FIXED_ASSETS',
      payload: { brandColors: newColors }
    })
  }
  
  // 重置为模板默认配色
  const resetToDefaultColors = () => {
    if (currentTemplate?.brandColors) {
      dispatch({
        type: 'UPDATE_FIXED_ASSETS',
        payload: { brandColors: currentTemplate.brandColors }
      })
    }
  }
  
  const currentTemplate = state.templates.current
  const currentPreset = currentTemplate 
    ? templatePresets[currentTemplate.id as keyof typeof templatePresets] 
    : null
  
  // 检查当前配色是否为默认配色
  const isDefaultColors = currentTemplate?.brandColors 
    ? JSON.stringify(state.assets.fixedAssets.brandColors) === JSON.stringify(currentTemplate.brandColors)
    : true
  
  return (
    <div className="template-selector-compact">
      <h3 className="section-title">🎨 模板风格</h3>
      
      <div className="template-select-group">
        {/* 下拉选择器 */}
        <select 
          className="template-select"
          value={currentTemplate?.id || ''}
          onChange={(e) => selectTemplate(e.target.value)}
        >
          {state.templates.available.map((template: Template) => {
            const preset = templatePresets[template.id as keyof typeof templatePresets]
            return (
              <option key={template.id} value={template.id}>
                {preset.icon} {template.name} - {template.description}
              </option>
            )
          })}
        </select>
        
        {/* 使用说明提示 */}
        <button 
          className="template-help-btn"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          title="查看使用说明"
          type="button"
        >
          ❓
        </button>
        
        {/* Tooltip 弹窗 */}
        {showTooltip && currentTemplate?.usage && (
          <div className="template-tooltip">
            <div className="tooltip-content">
              <h4>📖 使用说明</h4>
              <div className="usage-text">
                {currentTemplate.usage.split('\n').map((line, index) => {
                  if (line.startsWith('### ')) {
                    return <div key={index} className="usage-subtitle">{line.replace('### ', '')}</div>
                  } else if (line.startsWith('- ')) {
                    return <div key={index} className="usage-item">{line}</div>
                  } else if (line.trim() && !line.startsWith('##')) {
                    return <div key={index} className="usage-text-line">{line}</div>
                  }
                  return null
                })}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 显示当前模板的使用场景 */}
      {currentPreset && (
        <div className="template-scenarios">
          <span className="scenarios-label">适用场景：</span>
          {currentPreset.scenarios.map((scenario: string, index: number) => (
            <span key={index} className="scenario-tag">
              {scenario}
            </span>
          ))}
        </div>
      )}
      
      {/* 配色编辑器（内联可编辑） */}
      <div className="color-editor-group">
        <div className="color-editor-header">
          <span className="color-label">主题配色</span>
          <span className="color-hint">点击色块编辑</span>
        </div>
        
        <div className="color-editor-swatches">
          {state.assets.fixedAssets.brandColors.map((color, index) => (
            <div key={index} className="color-editor-item">
              <label className="color-editor-label">
                主色 {index + 1}
                <div className="color-editor-input-wrapper">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => updateBrandColor(index, e.target.value)}
                    className="color-picker-input"
                    title={`点击编辑主色 ${index + 1}`}
                  />
                  <div 
                    className="color-display-swatch"
                    style={{ backgroundColor: color }}
                  >
                    <span className="color-hex-value">{color}</span>
                  </div>
                </div>
              </label>
            </div>
          ))}
        </div>
        
        {!isDefaultColors && (
          <button 
            className="reset-colors-btn"
            onClick={resetToDefaultColors}
            type="button"
            title="重置为模板默认配色"
          >
            🔄 重置为默认
          </button>
        )}
      </div>
    </div>
  )
}