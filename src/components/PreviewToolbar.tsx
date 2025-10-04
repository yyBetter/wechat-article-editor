// 预览区工具栏 - 模板选择和配色编辑
import React from 'react'
import { useApp } from '../utils/app-context'
import { Template } from '../types/template'
import { templatePresets } from '../templates'

export function PreviewToolbar() {
  const { state, dispatch } = useApp()
  
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
    <div className="preview-toolbar-mini">
      <div className="toolbar-row">
        {/* 模板选择 - 超紧凑 */}
        <div className="toolbar-item">
          <select 
            className="template-select-mini"
            value={currentTemplate?.id || ''}
            onChange={(e) => selectTemplate(e.target.value)}
            title="切换模板风格"
          >
            {state.templates.available.map((template: Template) => {
              const preset = templatePresets[template.id as keyof typeof templatePresets]
              return (
                <option key={template.id} value={template.id}>
                  {preset.icon} {template.name}
                </option>
              )
            })}
          </select>
        </div>
        
        {/* 配色编辑器 - 横向排列 */}
        <div className="toolbar-item colors">
          {state.assets.fixedAssets.brandColors.map((color, index) => (
            <div key={index} className="color-picker-mini">
              <input
                type="color"
                value={color}
                onChange={(e) => updateBrandColor(index, e.target.value)}
                className="color-input-mini"
                title={`主色${index + 1}: ${color}`}
              />
              <div 
                className="color-swatch-mini"
                style={{ backgroundColor: color }}
              />
            </div>
          ))}
          
          {!isDefaultColors && (
            <button 
              className="reset-btn-mini"
              onClick={resetToDefaultColors}
              type="button"
              title="重置配色"
            >
              🔄
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

