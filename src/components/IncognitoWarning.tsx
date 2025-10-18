// 无痕模式警告组件
import React, { useState, useEffect } from 'react'
import { detectIncognitoMode, getIncognitoModeName, getBrowserInfo } from '../utils/incognito-detector'
import '../styles/incognito-warning.css'

export function IncognitoWarning() {
  const [isIncognito, setIsIncognito] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [modeName, setModeName] = useState('隐私模式')

  useEffect(() => {
    const checkIncognito = async () => {
      const incognito = await detectIncognitoMode()
      setIsIncognito(incognito)
      if (incognito) {
        setModeName(getIncognitoModeName())
      }
    }

    checkIncognito()
  }, [])

  const handleDismiss = () => {
    setIsDismissed(true)
    // 使用sessionStorage记住用户已关闭警告（仅本次会话）
    sessionStorage.setItem('incognito-warning-dismissed', 'true')
  }

  // 如果不是无痕模式，或用户已关闭警告，则不显示
  if (!isIncognito || isDismissed || sessionStorage.getItem('incognito-warning-dismissed')) {
    return null
  }

  const browser = getBrowserInfo()

  return (
    <div className="incognito-warning-overlay">
      <div className="incognito-warning-modal">
        <div className="warning-icon">🚨</div>
        
        <h2 className="warning-title">检测到{modeName}</h2>
        
        <div className="warning-content">
          <p className="warning-message">
            您当前正在使用 <strong>{modeName}</strong>，这会导致以下问题：
          </p>
          
          <div className="warning-issues">
            <div className="issue-item">
              <span className="issue-icon">❌</span>
              <div className="issue-text">
                <strong>数据无法保存</strong>
                <p>浏览器关闭后，所有文章和设置将被清除</p>
              </div>
            </div>
            
            <div className="issue-item">
              <span className="issue-icon">❌</span>
              <div className="issue-text">
                <strong>无法跨窗口访问</strong>
                <p>在普通浏览模式下无法读取{modeName}的数据</p>
              </div>
            </div>
            
            <div className="issue-item">
              <span className="issue-icon">❌</span>
              <div className="issue-text">
                <strong>可能影响功能</strong>
                <p>某些浏览器会限制存储容量和API访问</p>
              </div>
            </div>
          </div>
          
          <div className="warning-recommendation">
            <div className="recommend-icon">💡</div>
            <div className="recommend-content">
              <strong>建议操作：</strong>
              <ol>
                <li>切换到普通浏览模式</li>
                <li>刷新页面重新访问</li>
                <li>如需保存数据，请使用服务器模式（需登录）</li>
              </ol>
            </div>
          </div>
          
          <div className="warning-note">
            <p>
              <strong>为什么检测{modeName}？</strong>
            </p>
            <p className="note-text">
              本应用使用浏览器本地存储（IndexedDB）保存您的文章和设置。
              在{modeName}下，这些数据会在关闭浏览器时被自动清除，导致数据丢失。
              为了保护您的工作成果，我们强烈建议使用普通模式或登录账号使用服务器存储。
            </p>
          </div>
        </div>
        
        <div className="warning-actions">
          <button className="btn-primary" onClick={() => window.location.reload()}>
            <span className="btn-icon">🔄</span>
            <span>刷新页面</span>
          </button>
          
          <button className="btn-secondary" onClick={handleDismiss}>
            我知道了，继续使用
          </button>
        </div>
        
        <div className="warning-footer">
          <span className="footer-icon">ℹ️</span>
          <span className="footer-text">
            如果您需要临时使用，可以继续，但请务必导出重要数据
          </span>
        </div>
      </div>
    </div>
  )
}

