// 登录表单组件
import React, { useState } from 'react'

interface LoginFormProps {
  onSuccess: (user: any, token: string) => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('http://localhost:3002/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        // 登录成功
        onSuccess(result.data.user, result.data.token)
      } else {
        setError(result.error || '登录失败')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    // 清除错误信息
    if (error) setError('')
  }

  return (
    <form onSubmit={handleSubmit} className="login-form">
      {error && (
        <div className="auth-error">
          {error}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="email" className="form-label">邮箱地址</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className="form-input"
          placeholder="输入你的邮箱"
          required
          autoComplete="email"
        />
      </div>

      <div className="form-group">
        <label htmlFor="password" className="form-label">密码</label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          className="form-input"
          placeholder="输入密码"
          required
          autoComplete="current-password"
        />
      </div>

      <button 
        type="submit" 
        className={`auth-submit-btn ${loading ? 'loading' : ''}`}
        disabled={loading}
      >
        {loading ? '登录中...' : '登录'}
      </button>

      <style>{`
        .login-form {
          width: 100%;
        }

        .auth-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px;
          border-radius: 6px;
          font-size: 14px;
          margin-bottom: 16px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 6px;
        }

        .form-input {
          width: 100%;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: all 0.2s;
          box-sizing: border-box;
        }

        .form-input:focus {
          outline: none;
          border-color: #1e6fff;
          box-shadow: 0 0 0 3px rgba(30, 111, 255, 0.1);
        }

        .auth-submit-btn {
          width: 100%;
          background: #1e6fff;
          color: white;
          border: none;
          padding: 12px;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 8px;
        }

        .auth-submit-btn:hover:not(:disabled) {
          background: #0056d2;
        }

        .auth-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auth-submit-btn.loading {
          position: relative;
          color: transparent;
        }

        .auth-submit-btn.loading::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
    </form>
  )
}