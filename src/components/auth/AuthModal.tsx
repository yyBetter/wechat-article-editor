// 认证弹窗组件 - 登录注册统一入口
// 设计原则：不影响现有功能，可选择性使用

import React, { useState } from 'react'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: 'login' | 'register'
  onAuthSuccess?: (user: any, token: string) => void
}

export function AuthModal({ isOpen, onClose, defaultMode = 'login', onAuthSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode)

  if (!isOpen) return null

  const handleAuthSuccess = (user: any, token: string) => {
    onAuthSuccess?.(user, token)
    onClose()
  }

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* 模态框头部 */}
        <div className="auth-modal-header">
          <h2 className="auth-modal-title">
            {mode === 'login' ? '登录账号' : '创建账号'}
          </h2>
          <button 
            className="auth-modal-close" 
            onClick={onClose}
            type="button"
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        {/* 模态框内容 */}
        <div className="auth-modal-body">
          {mode === 'login' ? (
            <LoginForm onSuccess={handleAuthSuccess} />
          ) : (
            <RegisterForm onSuccess={handleAuthSuccess} />
          )}
        </div>

        {/* 切换模式 */}
        <div className="auth-modal-footer">
          {mode === 'login' ? (
            <p className="auth-switch-text">
              还没有账号？
              <button 
                className="auth-switch-btn" 
                onClick={() => setMode('register')}
                type="button"
              >
                立即注册
              </button>
            </p>
          ) : (
            <p className="auth-switch-text">
              已有账号？
              <button 
                className="auth-switch-btn" 
                onClick={() => setMode('login')}
                type="button"
              >
                立即登录
              </button>
            </p>
          )}
        </div>
      </div>

      <style>{`
        .auth-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.2s ease-out;
        }

        .auth-modal-content {
          background: white;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          width: 90%;
          max-width: 400px;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideIn 0.2s ease-out;
        }

        .auth-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px 0;
        }

        .auth-modal-title {
          font-size: 20px;
          font-weight: 600;
          color: #333;
          margin: 0;
        }

        .auth-modal-close {
          background: none;
          border: none;
          font-size: 20px;
          color: #666;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .auth-modal-close:hover {
          background: #f5f5f5;
          color: #333;
        }

        .auth-modal-body {
          padding: 20px 24px;
        }

        .auth-modal-footer {
          padding: 0 24px 24px;
          text-align: center;
          border-top: 1px solid #f0f0f0;
          margin-top: 20px;
          padding-top: 20px;
        }

        .auth-switch-text {
          color: #666;
          font-size: 14px;
          margin: 0;
        }

        .auth-switch-btn {
          background: none;
          border: none;
          color: #1e6fff;
          cursor: pointer;
          font-size: 14px;
          margin-left: 4px;
          text-decoration: underline;
          transition: color 0.2s;
        }

        .auth-switch-btn:hover {
          color: #0056d2;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from { 
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  )
}