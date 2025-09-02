// 模板定制器 - 管理模板的视觉配置
import React from 'react'
import { useApp } from '../utils/app-context'

export function TemplateCustomizer() {
  const { state, dispatch } = useApp()
  
  // 更新品牌色彩
  const updateBrandColor = (index: number, color: string) => {
    const newColors = [...state.assets.fixedAssets.brandColors]
    newColors[index] = color
    
    dispatch({
      type: 'UPDATE_FIXED_ASSETS',
      payload: { brandColors: newColors }
    })
  }
  
  return (
    <div className="template-customizer">
      <h4 className="settings-subtitle">🎨 主题配色</h4>
      <div className="settings-desc">自定义当前模板的品牌主色调</div>
      
      <div className="color-group">
        <div className="color-item">
          <label className="color-label">主色 1</label>
          <div className="color-input-group">
            <div 
              className="color-preview" 
              style={{ backgroundColor: state.assets.fixedAssets.brandColors[0] }}
            />
            <input
              type="color"
              value={state.assets.fixedAssets.brandColors[0]}
              onChange={(e) => updateBrandColor(0, e.target.value)}
              className="color-input"
            />
            <input
              type="text"
              value={state.assets.fixedAssets.brandColors[0]}
              onChange={(e) => updateBrandColor(0, e.target.value)}
              placeholder="#1e6fff"
              className="color-text"
            />
          </div>
        </div>
        
        <div className="color-item">
          <label className="color-label">主色 2</label>
          <div className="color-input-group">
            <div 
              className="color-preview" 
              style={{ backgroundColor: state.assets.fixedAssets.brandColors[1] }}
            />
            <input
              type="color"
              value={state.assets.fixedAssets.brandColors[1]}
              onChange={(e) => updateBrandColor(1, e.target.value)}
              className="color-input"
            />
            <input
              type="text"
              value={state.assets.fixedAssets.brandColors[1]}
              onChange={(e) => updateBrandColor(1, e.target.value)}
              placeholder="#333333"
              className="color-text"
            />
          </div>
        </div>
        
        <div className="color-item">
          <label className="color-label">主色 3</label>
          <div className="color-input-group">
            <div 
              className="color-preview" 
              style={{ backgroundColor: state.assets.fixedAssets.brandColors[2] }}
            />
            <input
              type="color"
              value={state.assets.fixedAssets.brandColors[2]}
              onChange={(e) => updateBrandColor(2, e.target.value)}
              className="color-input"
            />
            <input
              type="text"
              value={state.assets.fixedAssets.brandColors[2]}
              onChange={(e) => updateBrandColor(2, e.target.value)}
              placeholder="#666666"
              className="color-text"
            />
          </div>
        </div>
      </div>
    </div>
  )
}