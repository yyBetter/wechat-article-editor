// 注册表单组件
import React, { useState } from 'react'

interface RegisterFormProps {
  onSuccess: (user: any, token: string) => void
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const errors: Record<string, string> = {}

    // 用户名验证
    if (formData.username.length < 2) {
      errors.username = '用户名至少2个字符'
    } else if (formData.username.length > 20) {
      errors.username = '用户名不超过20个字符'
    } else if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(formData.username)) {
      errors.username = '用户名只能包含字母、数字、下划线和中文'
    }

    // 邮箱验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      errors.email = '请输入有效的邮箱地址'
    }

    // 密码验证
    if (formData.password.length < 6) {
      errors.password = '密码至少6个字符'
    } else if (formData.password.length > 50) {
      errors.password = '密码不超过50个字符'
    }

    // 确认密码验证
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = '两次输入的密码不一致'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002'}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        })
      })

      const result = await response.json()

      if (result.success) {
        // 注册成功
        onSuccess(result.data.user, result.data.token)
      } else {
        setError(result.error || '注册失败')
      }
    } catch (err) {
      console.error('Register error:', err)
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // 清除相关错误信息
    if (error) setError('')
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
    // 如果是确认密码，也清除确认密码的错误
    if (name === 'password' && validationErrors.confirmPassword) {
      setValidationErrors(prev => ({
        ...prev,
        confirmPassword: ''
      }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="register-form">
      {error && (
        <div className="auth-error">
          {error}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="username" className="form-label">用户名</label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleInputChange}
          className={`form-input ${validationErrors.username ? 'error' : ''}`}
          placeholder="输入用户名"
          required
          autoComplete="username"
        />
        {validationErrors.username && (
          <div className="field-error">{validationErrors.username}</div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="email" className="form-label">邮箱地址</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className={`form-input ${validationErrors.email ? 'error' : ''}`}
          placeholder="输入邮箱地址"
          required
          autoComplete="email"
        />
        {validationErrors.email && (
          <div className="field-error">{validationErrors.email}</div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="password" className="form-label">密码</label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          className={`form-input ${validationErrors.password ? 'error' : ''}`}
          placeholder="输入密码 (至少6位)"
          required
          autoComplete="new-password"
        />
        {validationErrors.password && (
          <div className="field-error">{validationErrors.password}</div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword" className="form-label">确认密码</label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          className={`form-input ${validationErrors.confirmPassword ? 'error' : ''}`}
          placeholder="再次输入密码"
          required
          autoComplete="new-password"
        />
        {validationErrors.confirmPassword && (
          <div className="field-error">{validationErrors.confirmPassword}</div>
        )}
      </div>

      <button 
        type="submit" 
        className={`auth-submit-btn ${loading ? 'loading' : ''}`}
        disabled={loading}
      >
        {loading ? '注册中...' : '创建账号'}
      </button>

      <style>{`
        .register-form {
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

        .form-input.error {
          border-color: #dc2626;
        }

        .field-error {
          color: #dc2626;
          font-size: 12px;
          margin-top: 4px;
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