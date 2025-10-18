// 登录/注册模态框 - 调用后端API
import React, { useState } from 'react'
import { LocalUser } from '../../utils/local-auth'
import { notification } from '../../utils/notification'
import { registerUser, loginUser } from '../../utils/auth-api'

interface LocalAuthModalProps {
  isOpen: boolean
  onClose: () => void
  onAuthSuccess: (user: LocalUser) => void
}

export function LocalAuthModal({ isOpen, onClose, onAuthSuccess }: LocalAuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  // 本地开发环境预填账号（仅在开发模式下）
  const isDev = import.meta.env.DEV
  const [email, setEmail] = useState(isDev ? 'shawn@local.com' : '')
  const [username, setUsername] = useState(isDev ? 'Shawn' : '')
  const [password, setPassword] = useState(isDev ? 'shawn@local.com' : '')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      notification.error('请输入邮箱')
      return
    }
    
    if (!password.trim()) {
      notification.error('请输入密码')
      return
    }
    
    if (mode === 'register' && !username.trim()) {
      notification.error('请输入用户名')
      return
    }

    setLoading(true)
    
    try {
      let result: { user: any; token: string }
      
      if (mode === 'login') {
        // 调用后端登录API
        result = await loginUser({ email, password })
        notification.success(`欢迎回来，${result.user.username}！`)
      } else {
        // 调用后端注册API
        result = await registerUser({ email, password, username })
        notification.success(`注册成功！欢迎，${result.user.username}！`)
      }
      
      // 传递用户信息和真实的JWT token
      const userWithToken = {
        ...result.user,
        token: result.token
      }
      
      onAuthSuccess(userWithToken as LocalUser)
      onClose()
      
      // 清空表单
      if (!isDev) {
        setEmail('')
        setUsername('')
        setPassword('')
      }
    } catch (error: any) {
      const errorMessage = error.message || '操作失败'
      const errorCode = error.code
      
      // 根据错误类型提供明确的提示
      if (errorCode === 'USER_NOT_FOUND') {
        notification.error('该邮箱尚未注册', '请点击下方"注册账号"按钮进行注册')
        // 自动切换到注册模式
        setTimeout(() => setMode('register'), 1500)
      } else if (errorCode === 'INVALID_PASSWORD') {
        notification.error('密码错误', '请检查密码是否正确，或联系管理员重置密码')
      } else if (errorCode === 'EMAIL_EXISTS') {
        notification.error('该邮箱已被注册', '请直接登录，或使用其他邮箱注册')
        // 自动切换到登录模式
        setTimeout(() => setMode('login'), 1500)
      } else if (errorCode === 'USERNAME_EXISTS') {
        notification.error('该用户名已被使用', '请尝试其他用户名')
      } else {
        notification.error(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '32px',
          width: '400px',
          maxWidth: '90%'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题 */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>
            {mode === 'login' ? '登录账号' : '注册账号'}
          </h2>
          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
            📦 完全本地存储，数据保存在浏览器中
          </p>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
              邮箱地址
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              disabled={loading}
              autoFocus
            />
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: isDev ? '#10b981' : '#999' }}>
              {isDev ? '🚀 开发模式：已预填测试账号' : '💡 邮箱仅用于本地账号识别'}
            </p>
          </div>

          {mode === 'register' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="输入用户名"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                disabled={loading}
              />
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'register' ? '设置密码（至少6位）' : '输入密码'}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              disabled={loading}
            />
            {mode === 'register' && (
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#999' }}>
                💡 密码长度至少6位，建议使用字母+数字组合
              </p>
            )}
          </div>

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? '#ccc' : '#1e6fff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '16px'
            }}
          >
            {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
          </button>

          {/* 切换模式 */}
          <div style={{ textAlign: 'center', fontSize: '14px' }}>
            {mode === 'login' ? (
              <span>
                还没有账号？
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#1e6fff',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    marginLeft: '4px'
                  }}
                  disabled={loading}
                >
                  立即注册
                </button>
              </span>
            ) : (
              <span>
                已有账号？
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#1e6fff',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    marginLeft: '4px'
                  }}
                  disabled={loading}
                >
                  去登录
                </button>
              </span>
            )}
          </div>
        </form>

        {/* 特性说明 */}
        <div style={{
          marginTop: '24px',
          padding: '12px',
          background: '#f5f5f5',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#666'
        }}>
          <div style={{ marginBottom: '4px' }}>✅ 完全本地存储，无需联网</div>
          <div style={{ marginBottom: '4px' }}>✅ 数据隐私安全，仅保存在浏览器</div>
          <div style={{ marginBottom: '4px' }}>✅ 多账号隔离，每个账号独立数据库</div>
          <div>✅ 支持离线使用，随时随地编辑</div>
        </div>
      </div>
    </div>
  )
}



