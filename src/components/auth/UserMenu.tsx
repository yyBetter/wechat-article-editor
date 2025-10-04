// 用户菜单组件 - 显示在应用头部
import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../utils/auth-context'
import { GlobalSettingsModal } from '../GlobalSettingsModal'
import { StorageStats } from '../StorageStats'

interface UserMenuProps {
  onOpenAuthModal: () => void
}

export function UserMenu({ onOpenAuthModal }: UserMenuProps) {
  const { state, logout } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [showGlobalSettings, setShowGlobalSettings] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 如果还在加载中，显示加载状态
  if (state.isLoading) {
    return (
      <div className="user-menu-loading">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  // 未登录状态 - 显示登录按钮
  if (!state.isAuthenticated) {
    return (
      <div className="user-menu-guest">
        <button 
          className="login-btn"
          onClick={onOpenAuthModal}
          type="button"
        >
          登录
        </button>
      </div>
    )
  }

  // 已登录状态 - 显示用户头像和菜单
  const user = state.user!
  const avatarUrl = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=1e6fff&color=fff&size=32`

  const handleLogout = () => {
    logout()
    setIsOpen(false)
  }

  return (
    <div className="user-menu" ref={menuRef}>
      <button 
        className="user-avatar-btn"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        title={user.username}
      >
        <img 
          src={avatarUrl}
          alt={user.username}
          className="user-avatar"
        />
      </button>

      {isOpen && (
        <div className="user-menu-dropdown">
          <div className="user-info">
            <img 
              src={avatarUrl}
              alt={user.username}
              className="user-info-avatar"
            />
            <div className="user-details">
              <div className="user-name">{user.username}</div>
              <div className="user-email">{user.email}</div>
            </div>
          </div>
          
          <div className="menu-divider"></div>
          
          <div className="menu-items">
            <button 
              className="menu-item"
              onClick={() => {
                setIsOpen(false)
                navigate('/settings')
              }}
              type="button"
            >
              <span className="menu-icon">👤</span>
              个人设置
            </button>
            
            <button 
              className="menu-item"
              onClick={() => {
                setIsOpen(false)
                setShowGlobalSettings(true)
              }}
              type="button"
            >
              <span className="menu-icon">⚙️</span>
              全局设置
            </button>
            
            <div className="menu-divider"></div>
            
            {/* 存储统计信息 */}
            <div className="menu-section">
              <StorageStats />
            </div>
            
            <div className="menu-divider"></div>
            
            <button 
              className="menu-item logout"
              onClick={handleLogout}
              type="button"
            >
              <span className="menu-icon">🚪</span>
              退出登录
            </button>
          </div>
        </div>
      )}

      {/* 全局设置模态框 */}
      <GlobalSettingsModal 
        isOpen={showGlobalSettings}
        onClose={() => setShowGlobalSettings(false)}
      />

      <style>{`
        .user-menu {
          position: relative;
        }

        .user-menu-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #e5e5e5;
          border-top: 2px solid #1e6fff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .user-menu-guest {
          display: flex;
          align-items: center;
        }

        .login-btn {
          background: #1e6fff;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .login-btn:hover {
          background: #0056d2;
        }

        .user-avatar-btn {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          border-radius: 50%;
          transition: opacity 0.2s;
        }

        .user-avatar-btn:hover {
          opacity: 0.8;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
        }

        .user-menu-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          min-width: 200px;
          z-index: 1000;
          animation: fadeIn 0.15s ease-out;
        }

        .user-info {
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-info-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
        }

        .user-details {
          flex: 1;
          min-width: 0;
        }

        .user-name {
          font-weight: 600;
          font-size: 14px;
          color: #333;
          truncate: true;
        }

        .user-email {
          font-size: 12px;
          color: #666;
          truncate: true;
        }

        .menu-divider {
          height: 1px;
          background: #f0f0f0;
        }

        .menu-items {
          padding: 8px 0;
        }

        .menu-section {
          padding: 8px 12px;
        }

        .menu-item {
          width: 100%;
          background: none;
          border: none;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #333;
          cursor: pointer;
          transition: background 0.2s;
          text-align: left;
        }

        .menu-item:hover {
          background: #f5f5f5;
        }

        .menu-item.logout {
          color: #dc2626;
        }

        .menu-item.logout:hover {
          background: #fef2f2;
        }

        .menu-icon {
          font-size: 16px;
          width: 20px;
          text-align: center;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
          from { 
            opacity: 0;
            transform: translateY(-4px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}