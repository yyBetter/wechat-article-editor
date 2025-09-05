import React, { useState } from 'react'
import { useApp } from '../utils/app-context'

export function WeChatConfig() {
  const { state } = useApp()
  const [config, setConfig] = useState({
    appId: '',
    appSecret: '',
    isConnected: false,
    accountInfo: null as any
  })

  const [isConnecting, setIsConnecting] = useState(false)

  // 模拟连接微信公众号
  const connectWeChat = async () => {
    if (!config.appId || !config.appSecret) {
      alert('请填写完整的AppID和AppSecret')
      return
    }

    setIsConnecting(true)
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 模拟成功连接
    const mockAccountInfo = {
      name: '我的公众号',
      originalId: 'gh_1234567890ab',
      accountType: '订阅号',
      verified: true,
      followers: 15420
    }
    
    setConfig(prev => ({
      ...prev,
      isConnected: true,
      accountInfo: mockAccountInfo
    }))
    
    setIsConnecting(false)
  }

  const disconnectWeChat = () => {
    setConfig(prev => ({
      ...prev,
      isConnected: false,
      accountInfo: null
    }))
  }

  return (
    <div className="wechat-config">
      <h4 className="config-title">🔗 微信公众号授权</h4>
      
      {!config.isConnected ? (
        <div className="config-form">
          <div className="config-desc">
            <p>连接您的微信公众号，实现一键发布功能</p>
            <div className="config-steps">
              <div className="config-step">
                <span className="step-num">1</span>
                <span>登录微信公众平台</span>
              </div>
              <div className="config-step">
                <span className="step-num">2</span>
                <span>获取开发者ID(AppID)和密钥(AppSecret)</span>
              </div>
              <div className="config-step">
                <span className="step-num">3</span>
                <span>填写下方表单完成授权</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              AppID (应用ID)
              <input
                type="text"
                value={config.appId}
                onChange={(e) => setConfig(prev => ({ ...prev, appId: e.target.value }))}
                placeholder="wx1234567890abcdef"
                className="form-input"
              />
            </label>
            
            <label className="form-label">
              AppSecret (应用密钥)
              <input
                type="password"
                value={config.appSecret}
                onChange={(e) => setConfig(prev => ({ ...prev, appSecret: e.target.value }))}
                placeholder="输入AppSecret"
                className="form-input"
              />
            </label>
          </div>

          <button
            className="connect-btn"
            onClick={connectWeChat}
            disabled={isConnecting || !config.appId || !config.appSecret}
          >
            {isConnecting ? (
              <>
                <div className="btn-spinner" />
                连接中...
              </>
            ) : (
              '连接微信公众号'
            )}
          </button>
        </div>
      ) : (
        <div className="connected-info">
          <div className="account-card">
            <div className="account-header">
              <div className="account-avatar">
                <div className="avatar-placeholder">微</div>
              </div>
              <div className="account-details">
                <h5 className="account-name">{config.accountInfo.name}</h5>
                <div className="account-meta">
                  <span className="account-type">{config.accountInfo.accountType}</span>
                  {config.accountInfo.verified && (
                    <span className="verified-badge">已认证</span>
                  )}
                </div>
                <div className="account-id">原始ID: {config.accountInfo.originalId}</div>
              </div>
            </div>
            
            <div className="account-stats">
              <div className="stat-item">
                <div className="stat-value">{config.accountInfo.followers.toLocaleString()}</div>
                <div className="stat-label">关注用户</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">已连接</div>
                <div className="stat-label">授权状态</div>
              </div>
            </div>
          </div>

          <div className="connection-actions">
            <button className="action-btn primary">测试连接</button>
            <button className="action-btn secondary" onClick={disconnectWeChat}>
              断开连接
            </button>
          </div>

          <div className="permission-info">
            <h6>已授权权限：</h6>
            <ul className="permission-list">
              <li className="permission-item granted">
                <span className="permission-icon">✅</span>
                <span>发布图文消息</span>
              </li>
              <li className="permission-item granted">
                <span className="permission-icon">✅</span>
                <span>上传多媒体文件</span>
              </li>
              <li className="permission-item granted">
                <span className="permission-icon">✅</span>
                <span>管理素材库</span>
              </li>
              <li className="permission-item limited">
                <span className="permission-icon">⚠️</span>
                <span>自定义菜单（需认证）</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}