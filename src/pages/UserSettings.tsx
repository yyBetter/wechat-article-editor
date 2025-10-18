// 用户设置页面
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../utils/auth-context'
import { StyleAnalyzer } from '../components/ai/StyleAnalyzer'

export function UserSettings() {
  const navigate = useNavigate()
  const { state } = useAuth()

  const handleBackToHome = () => {
    navigate('/')
  }

  return (
    <div className="user-settings-page">
      <header className="page-header">
        <div className="header-left">
          <button 
            type="button"
            className="back-btn"
            onClick={handleBackToHome}
            title="返回首页"
          >
            ← 返回首页
          </button>
          <h1 className="page-title">个人设置</h1>
        </div>
      </header>

      <main className="page-content">
        <div className="settings-container">
          <div className="user-profile-section">
            <h2>用户信息</h2>
            {state.user && (
              <div className="user-info-card">
                <div className="user-avatar-large">
                  <img 
                    src={state.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(state.user.username)}&background=1e6fff&color=fff&size=80`}
                    alt={state.user.username}
                    className="avatar-img"
                  />
                </div>
                <div className="user-details">
                  <h3>{state.user.username}</h3>
                  <p className="user-email">{state.user.email}</p>
                </div>
              </div>
            )}
          </div>

          {/* AI风格学习 */}
          <div className="ai-style-section">
            <StyleAnalyzer />
          </div>

          <div className="settings-sections">
            <div className="settings-section">
              <h3>账户设置</h3>
              <div className="setting-item">
                <label>用户名</label>
                <input 
                  type="text" 
                  value={state.user?.username || ''} 
                  disabled 
                  className="setting-input disabled"
                />
              </div>
              <div className="setting-item">
                <label>邮箱</label>
                <input 
                  type="email" 
                  value={state.user?.email || ''} 
                  disabled 
                  className="setting-input disabled"
                />
              </div>
            </div>

            <div className="settings-section">
              <h3>编辑器设置</h3>
              <div className="setting-item">
                <label>主题</label>
                <select className="setting-select" defaultValue="light">
                  <option value="light">浅色主题</option>
                  <option value="dark">深色主题</option>
                </select>
              </div>
              <div className="setting-item">
                <label>字体大小</label>
                <select className="setting-select" defaultValue="medium">
                  <option value="small">小号</option>
                  <option value="medium">中号</option>
                  <option value="large">大号</option>
                </select>
              </div>
            </div>

            <div className="settings-section">
              <h3>自动保存</h3>
              <div className="setting-item">
                <label>
                  <input type="checkbox" defaultChecked />
                  启用自动保存
                </label>
              </div>
              <div className="setting-item">
                <label>保存间隔</label>
                <select className="setting-select" defaultValue="3">
                  <option value="1">1秒</option>
                  <option value="3">3秒</option>
                  <option value="5">5秒</option>
                  <option value="10">10秒</option>
                </select>
              </div>
            </div>
          </div>

          <div className="settings-actions">
            <button className="btn-primary" disabled>
              保存设置
            </button>
            <p className="settings-note">
              💡 此页面为占位页面，设置功能暂未实现
            </p>
          </div>
        </div>
      </main>

      <style>{`
        .user-settings-page {
          min-height: 100vh;
          background: #f8f9fa;
        }

        .page-header {
          background: white;
          border-bottom: 1px solid #e5e5e5;
          padding: 0 24px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .back-btn {
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          font-size: 14px;
          padding: 8px 0;
          transition: color 0.2s;
        }

        .back-btn:hover {
          color: #1e6fff;
        }

        .page-title {
          font-size: 20px;
          font-weight: 600;
          color: #333;
          margin: 0;
        }

        .page-content {
          padding: 24px;
          max-width: 800px;
          margin: 0 auto;
        }

        .settings-container {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .user-profile-section {
          padding: 24px;
          border-bottom: 1px solid #f0f0f0;
        }

        .user-profile-section h2 {
          margin: 0 0 16px 0;
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }

        .user-info-card {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .user-avatar-large {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          overflow: hidden;
          background: #f0f0f0;
        }

        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .user-details h3 {
          margin: 0 0 4px 0;
          font-size: 20px;
          font-weight: 600;
          color: #333;
        }

        .user-email {
          margin: 0;
          color: #666;
          font-size: 14px;
        }

        .settings-sections {
          padding: 24px;
        }

        .settings-section {
          margin-bottom: 32px;
        }

        .settings-section:last-child {
          margin-bottom: 0;
        }

        .settings-section h3 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: #333;
          padding-bottom: 8px;
          border-bottom: 1px solid #f0f0f0;
        }

        .setting-item {
          margin-bottom: 16px;
        }

        .setting-item:last-child {
          margin-bottom: 0;
        }

        .setting-item label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #333;
          margin-bottom: 6px;
        }

        .setting-input,
        .setting-select {
          width: 100%;
          max-width: 300px;
          padding: 8px 12px;
          border: 1px solid #e5e5e5;
          border-radius: 4px;
          font-size: 14px;
          background: white;
        }

        .setting-input.disabled {
          background: #f8f9fa;
          color: #666;
          cursor: not-allowed;
        }

        .setting-input:focus,
        .setting-select:focus {
          outline: none;
          border-color: #1e6fff;
          box-shadow: 0 0 0 3px rgba(30, 111, 255, 0.1);
        }

        .settings-actions {
          padding: 24px;
          border-top: 1px solid #f0f0f0;
          background: #f8f9fa;
        }

        .btn-primary {
          background: #1e6fff;
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          cursor: not-allowed;
          opacity: 0.6;
          margin-bottom: 12px;
        }

        .settings-note {
          margin: 0;
          font-size: 14px;
          color: #666;
          font-style: italic;
        }

        input[type="checkbox"] {
          margin-right: 8px;
        }
      `}</style>
    </div>
  )
}