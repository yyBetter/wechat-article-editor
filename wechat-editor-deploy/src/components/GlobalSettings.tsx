import React from 'react'
import { useApp } from '../utils/app-context'
import { useAuth } from '../utils/auth-context'
import { WeChatConfig } from './WeChatConfig'

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
            <span className="preference-label">启用自动保存</span>
            <span className="preference-desc">编辑时自动保存文档，避免数据丢失</span>
          </label>
          
          <label className="preference-item">
            <input 
              type="checkbox" 
              defaultChecked 
              className="preference-checkbox"
            />
            <span className="preference-label">实时预览</span>
            <span className="preference-desc">编辑时实时更新预览效果</span>
          </label>
          
          <label className="preference-item">
            <input 
              type="checkbox" 
              className="preference-checkbox"
            />
            <span className="preference-label">微信编辑器优化</span>
            <span className="preference-desc">针对微信编辑器粘贴进行优化</span>
          </label>
        </div>
      </div>
      
      {/* 微信公众号授权 - 真正的全局设置 */}
      <div className="settings-section">
        <WeChatConfig />
      </div>
    </div>
  )
}