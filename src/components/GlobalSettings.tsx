import React from 'react'
import { useApp } from '../utils/app-context'

export function GlobalSettings() {
  const { state, dispatch } = useApp()

  return (
    <div className="settings-container">
      <h3 className="section-title">⚙️ 全局设置</h3>

      {/* 应用偏好设置 */}
      <div className="settings-section">
        <h4 className="settings-subtitle">🎛️ 应用偏好</h4>
        <div className="settings-desc">影响整个应用的使用体验</div>

        <div className="preference-group">
          <label className="preference-item">
            <input
              type="checkbox"
              defaultChecked
              className="preference-checkbox"
            />
            <div className="preference-content">
              <span className="preference-label">启用自动保存</span>
              <span className="preference-desc">编辑时自动保存文档到本地数据库</span>
            </div>
          </label>

          <label className="preference-item">
            <input
              type="checkbox"
              defaultChecked
              className="preference-checkbox"
            />
            <div className="preference-content">
              <span className="preference-label">实时预览</span>
              <span className="preference-desc">编辑时实时更新预览效果</span>
            </div>
          </label>

          <label className="preference-item">
            <input
              type="checkbox"
              className="preference-checkbox"
            />
            <div className="preference-content">
              <span className="preference-label">微信编辑器优化</span>
              <span className="preference-desc">针对微信编辑器粘贴进行兼容性优化</span>
            </div>
          </label>
        </div>
      </div>

      {/* 关于 */}
      <div className="settings-section">
        <h4 className="settings-subtitle">ℹ️ 关于工具</h4>
        <div className="settings-desc">纯净、高效的公众号排版工具</div>
        <div className="about-content">
          <p>这是一个纯本地运行的 Markdown 排版工具，所有数据仅存储在您的浏览器中。</p>
          <div className="version-info">版本: 1.0.0 (Pure Client)</div>
        </div>
      </div>
    </div>
  )
}