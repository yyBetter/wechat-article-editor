// 模板画廊 - 可展开/收起的模板选择器
import React, { useState } from 'react'
import { useApp } from '../utils/app-context'
import { Template } from '../types/template'
import { templatePresets } from '../templates'

export function TemplateGallery() {
  const { state, dispatch } = useApp()
  const [expanded, setExpanded] = useState(false)
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null)
  
  const currentTemplate = state.templates.current
  const currentPreset = currentTemplate 
    ? templatePresets[currentTemplate.id as keyof typeof templatePresets] 
    : null
  
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
    
    // 选择后自动收起
    setExpanded(false)
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
  
  // 检查当前配色是否为默认配色
  const isDefaultColors = currentTemplate?.brandColors 
    ? JSON.stringify(state.assets.fixedAssets.brandColors) === JSON.stringify(currentTemplate.brandColors)
    : true
  
  return (
    <div className="template-gallery">
      {/* 紧凑状态：当前模板 + 配色 */}
      <div className="gallery-compact">
        <button
          className="current-template-btn"
          onClick={() => setExpanded(!expanded)}
          title="点击切换模板"
        >
          <span className="template-info">
            <span className="template-icon">{currentPreset?.icon || '📝'}</span>
            <span className="template-name">{currentTemplate?.name || '简约文档'}</span>
          </span>
          <span className="expand-icon">{expanded ? '▲' : '▼'}</span>
        </button>
        
        {/* 配色编辑器 */}
        <div className="color-editor-inline">
          {state.assets.fixedAssets.brandColors.map((color, index) => (
            <div key={index} className="color-picker-compact">
              <input
                type="color"
                value={color}
                onChange={(e) => updateBrandColor(index, e.target.value)}
                className="color-input-compact"
                title={`主色${index + 1}`}
              />
              <div 
                className="color-preview"
                style={{ backgroundColor: color }}
              />
            </div>
          ))}
          
          {!isDefaultColors && (
            <button 
              className="reset-colors-btn"
              onClick={resetToDefaultColors}
              title="重置为默认配色"
            >
              🔄
            </button>
          )}
        </div>
      </div>
      
      {/* 展开状态：模板画廊 */}
      {expanded && (
        <div className="gallery-expanded">
          <div className="gallery-header">
            <h3>选择模板风格</h3>
            <button 
              className="close-gallery-btn"
              onClick={() => setExpanded(false)}
            >
              ✕
            </button>
          </div>
          
          <div className="templates-grid">
            {state.templates.available.map((template: Template) => {
              const preset = templatePresets[template.id as keyof typeof templatePresets]
              const isActive = template.id === currentTemplate?.id
              const isHovered = hoveredTemplate === template.id
              
              return (
                <div
                  key={template.id}
                  className={`template-card ${isActive ? 'active' : ''}`}
                  onClick={() => selectTemplate(template.id)}
                  onMouseEnter={() => setHoveredTemplate(template.id)}
                  onMouseLeave={() => setHoveredTemplate(null)}
                >
                  {/* 模板图标和名称 */}
                  <div className="card-header">
                    <span className="card-icon">{preset.icon}</span>
                    <span className="card-name">{template.name}</span>
                    {isActive && <span className="active-badge">使用中</span>}
                  </div>
                  
                  {/* 模板描述 */}
                  <div className="card-description">
                    {preset.description}
                  </div>
                  
                  {/* 适用场景（hover显示） */}
                  {isHovered && (
                    <div className="card-scenarios">
                      <div className="scenarios-label">适合场景：</div>
                      <div className="scenarios-tags">
                        {preset.scenarios.map((scenario, idx) => (
                          <span key={idx} className="scenario-tag">
                            {scenario}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 配色预览 */}
                  {template.brandColors && (
                    <div className="card-colors">
                      {template.brandColors.map((color, idx) => (
                        <div
                          key={idx}
                          className="color-dot"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          
          {/* 提示文字 */}
          <div className="gallery-footer">
            <p className="gallery-hint">
              💡 提示：选择模板后，可以在上方自定义品牌配色
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
