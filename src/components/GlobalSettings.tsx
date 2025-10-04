import React from 'react'
import { useApp } from '../utils/app-context'
import { useAuth } from '../utils/auth-context'
import { WeChatConfig } from './WeChatConfig'
import '../styles/donation.css'

export function GlobalSettings() {
  const { state, dispatch } = useApp()
  const { state: authState } = useAuth()
  
  return (
    <div className="settings-container">
      <h3 className="section-title">⚙️ 全局设置</h3>
      
      {/* 用户账号信息 */}
      <div className="settings-section">
        <h4 className="settings-subtitle">👤 账号信息</h4>
        <div className="settings-desc">当前登录账号的基本信息</div>
        
        {authState.user && (
          <div className="user-info">
            <div className="info-item">
              <span className="info-label">用户名：</span>
              <span className="info-value">{authState.user.username}</span>
            </div>
            <div className="info-item">
              <span className="info-label">邮箱：</span>
              <span className="info-value">{authState.user.email}</span>
            </div>
            <div className="info-item">
              <span className="info-label">注册时间：</span>
              <span className="info-value">
                {new Date(authState.user.createdAt).toLocaleDateString('zh-CN')}
              </span>
            </div>
          </div>
        )}
      </div>
      
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
              <span className="preference-desc">编辑时自动保存文档，避免数据丢失</span>
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
              <span className="preference-desc">针对微信编辑器粘贴进行优化</span>
            </div>
          </label>
        </div>
      </div>
      
      {/* 微信公众号授权 - 真正的全局设置 */}
      <div className="settings-section">
        <WeChatConfig />
      </div>

      {/* 支持作者 */}
      <div className="settings-section">
        <h4 className="settings-subtitle">💝 支持作者</h4>
        <div className="settings-desc">如果这个工具对您有帮助，可以请作者喝杯咖啡</div>
        
        <div className="support-content">
          <div className="support-stats">
            <div className="support-stat-item">
              <div className="stat-icon">⭐</div>
              <div className="stat-info">
                <div className="stat-title">完全免费</div>
                <div className="stat-desc">所有功能永久免费使用</div>
              </div>
            </div>
            <div className="support-stat-item">
              <div className="stat-icon">💪</div>
              <div className="stat-info">
                <div className="stat-title">持续更新</div>
                <div className="stat-desc">不断优化和新增功能</div>
              </div>
            </div>
            <div className="support-stat-item">
              <div className="stat-icon">🛠️</div>
              <div className="stat-info">
                <div className="stat-title">开源精神</div>
                <div className="stat-desc">代码开源，欢迎贡献</div>
              </div>
            </div>
          </div>

          <div className="support-action">
            <p className="support-message">
              如果觉得好用，可以请作者喝杯咖啡 ☕<br />
              您的支持是最大的动力！
            </p>
            <button 
              className="support-button"
              onClick={() => {
                // 触发打赏按钮的点击事件
                const donationBtn = document.querySelector('.donation-button') as HTMLButtonElement
                if (donationBtn) {
                  donationBtn.click()
                }
              }}
              type="button"
            >
              ☕ 请我喝咖啡
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}