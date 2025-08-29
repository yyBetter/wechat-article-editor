import React from 'react'
import { useApp } from '../utils/app-context'
import { WeChatConfig } from './WeChatConfig'

export function Settings() {
  const { state, dispatch } = useApp()
  
  // 更新文章信息
  const updateArticleInfo = (key: string, value: string) => {
    dispatch({ 
      type: 'UPDATE_TEMPLATE_VARIABLES', 
      payload: { [key]: value } 
    })
  }
  
  // 更新固定资源
  const updateFixedAsset = (key: string, value: string) => {
    dispatch({
      type: 'UPDATE_FIXED_ASSETS',
      payload: { [key]: value }
    })
  }
  
  return (
    <div className="settings-container">
      <h3 className="section-title">⚙️ 全局设置</h3>
      
      {/* 文章基本信息 */}
      <div className="settings-section">
        <h4 className="settings-subtitle">📄 文章信息</h4>
        <div className="settings-desc">这些信息会自动应用到所有模板的头部</div>
        
        <div className="variable-group">
          <label className="variable-label">
            文章标题
            <input
              type="text"
              value={state.templates.variables.title || ''}
              onChange={(e) => updateArticleInfo('title', e.target.value)}
              placeholder="输入文章标题"
              className="variable-input"
            />
          </label>
          
          <label className="variable-label">
            作者署名
            <input
              type="text"
              value={state.templates.variables.author || ''}
              onChange={(e) => updateArticleInfo('author', e.target.value)}
              placeholder="输入作者名称（可选）"
              className="variable-input"
            />
          </label>
          
          <label className="variable-label">
            发布日期
            <input
              type="text"
              value={state.templates.variables.date || ''}
              onChange={(e) => updateArticleInfo('date', e.target.value)}
              placeholder="如：2025年8月30日"
              className="variable-input"
            />
          </label>
        </div>
      </div>
      
      {/* 品牌固定资源 */}
      <div className="settings-section">
        <h4 className="settings-subtitle">🖼️ 品牌资源</h4>
        <div className="settings-desc">配置一次，在所有文章中自动使用</div>
        
        <div className="variable-group">
          <label className="variable-label">
            品牌 LOGO
            <input
              type="url"
              value={state.assets.fixedAssets.logo || ''}
              onChange={(e) => updateFixedAsset('logo', e.target.value)}
              placeholder="https://example.com/logo.png"
              className="variable-input"
            />
            <div className="input-help">显示在文章头部，建议尺寸：200×60px</div>
          </label>
          
          <label className="variable-label">
            关注二维码
            <input
              type="url"
              value={state.assets.fixedAssets.qrcode || ''}
              onChange={(e) => updateFixedAsset('qrcode', e.target.value)}
              placeholder="https://example.com/qrcode.png"
              className="variable-input"
            />
            <div className="input-help">显示在文章底部，建议尺寸：150×150px</div>
          </label>
          
          <label className="variable-label">
            装饰分割线
            <input
              type="url"
              value={state.assets.fixedAssets.watermark || ''}
              onChange={(e) => updateFixedAsset('watermark', e.target.value)}
              placeholder="https://example.com/divider.png"
              className="variable-input"
            />
            <div className="input-help">用于分割内容，建议宽度：300-400px</div>
          </label>
        </div>
      </div>
      
      {/* 主题配色 */}
      <div className="settings-section">
        <h4 className="settings-subtitle">🎨 主题配色</h4>
        <div className="settings-desc">自定义品牌主色调</div>
        
        <div className="color-group">
          {state.assets.fixedAssets.brandColors.map((color, index) => (
            <div key={index} className="color-item">
              <label className="color-label">
                主色 {index + 1}
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => {
                      const newColors = [...state.assets.fixedAssets.brandColors]
                      newColors[index] = e.target.value
                      dispatch({
                        type: 'UPDATE_FIXED_ASSETS',
                        payload: { brandColors: newColors }
                      })
                    }}
                    className="color-input"
                  />
                  <span className="color-value">{color}</span>
                </div>
              </label>
            </div>
          ))}
        </div>
      </div>
      
      {/* 微信公众号配置 */}
      <div className="settings-section">
        <WeChatConfig />
      </div>

      {/* 高级设置 */}
      <div className="settings-section">
        <h4 className="settings-subtitle">🔧 高级设置</h4>
        
        <div className="advanced-options">
          <label className="checkbox-label">
            <input type="checkbox" defaultChecked />
            <span>自动保存编辑内容</span>
          </label>
          
          <label className="checkbox-label">
            <input type="checkbox" defaultChecked />
            <span>启用实时预览</span>
          </label>
          
          <label className="checkbox-label">
            <input type="checkbox" />
            <span>微信优化模式</span>
          </label>
        </div>
      </div>
    </div>
  )
}