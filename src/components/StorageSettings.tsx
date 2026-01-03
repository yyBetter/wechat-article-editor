// 存储设置组件 - 纯本地模式
import React, { useState, useEffect } from 'react'
import {
  getStorageConfig,
  setStorageConfig,
  StorageConfig
} from '../utils/storage-adapter'
import { checkStorageQuota, formatStorageSize } from '../utils/local-storage-utils'

interface StorageQuota {
  quota: number
  usage: number
  available: number
  percentage: number
}

export function StorageSettings() {
  const [config, setConfig] = useState<StorageConfig>(getStorageConfig())
  const [quota, setQuota] = useState<StorageQuota | null>(null)

  // 加载存储配额信息
  useEffect(() => {
    loadStorageQuota()
  }, [])

  const loadStorageQuota = async () => {
    try {
      const quotaInfo = await checkStorageQuota()
      setQuota(quotaInfo)
    } catch (error) {
      console.error('获取存储配额失败:', error)
    }
  }

  // 切换调试日志
  const handleDebugToggle = () => {
    const newConfig = { ...config, enableDebugLogs: !config.enableDebugLogs }
    setStorageConfig(newConfig)
    setConfig(newConfig)
  }

  return (
    <div className="storage-settings">
      <div className="settings-header">
        <h3>🗄️ 存储状态</h3>
        <p>管理本地数据存储</p>
      </div>

      {/* 存储模式显示 */}
      <div className="setting-group">
        <label className="setting-label">当前模式</label>
        <div className="storage-mode-display">
          <div className="mode-option active">
            <div className="mode-icon">💻</div>
            <div className="mode-info">
              <div className="mode-title">纯本地存储</div>
              <div className="mode-desc">数据仅存储在您的浏览器中，确保隐私和速度</div>
            </div>
            <div className="mode-indicator">✓</div>
          </div>
        </div>
      </div>

      {/* 本地存储配额信息 */}
      {quota && (
        <div className="setting-group">
          <label className="setting-label">存储概况</label>
          <div className="storage-quota">
            <div className="quota-info">
              <div className="quota-item">
                <span className="quota-label">已使用:</span>
                <span className="quota-value">{formatStorageSize(quota.usage)}</span>
              </div>
              <div className="quota-item">
                <span className="quota-label">配额:</span>
                <span className="quota-value">{formatStorageSize(quota.quota)}</span>
              </div>
              <div className="quota-item">
                <span className="quota-label">使用率:</span>
                <span className="quota-value">{quota.percentage.toFixed(1)}%</span>
              </div>
            </div>

            <div className="quota-bar">
              <div
                className="quota-progress"
                style={{ width: `${Math.min(quota.percentage, 100)}%` }}
              />
            </div>

            {quota.percentage > 80 && (
              <div className="quota-warning">
                ⚠️ 存储空间使用率较高，建议清理旧文档或图片
              </div>
            )}
          </div>
        </div>
      )}

      {/* 调试选项 */}
      <div className="setting-group">
        <label className="setting-label">高级选项</label>
        <div className="debug-options">
          <label className="debug-option">
            <input
              type="checkbox"
              checked={config.enableDebugLogs}
              onChange={handleDebugToggle}
            />
            <span>启用控制台调试日志</span>
          </label>
        </div>
      </div>

      {/* 当前配置信息 */}
      <div className="setting-group">
        <label className="setting-label">配置详情</label>
        <div className="config-display">
          <div className="config-item">
            <span className="config-key">数据库名称:</span>
            <span className="config-value">{config.localDBName}</span>
          </div>
        </div>
      </div>

      {/* 操作提示 */}
      <div className="setting-tips">
        <div className="tip-item">
          💡 <strong>隐私说明:</strong> 您的所有内容均保存在浏览器本地，不会上传到任何服务器。
        </div>
        <div className="tip-item">
          ⚠️ <strong>清除缓存:</strong> 清除浏览器缓存或 IndexedDB 数据将导致所有已保存的文档丢失。
        </div>
      </div>
    </div>
  )
}

// CSS样式（可以移到单独的CSS文件中）
const styles = `
.storage-settings {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
}

.settings-header h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
}

.settings-header p {
  margin: 0 0 24px 0;
  color: #666;
  font-size: 14px;
}

.setting-group {
  margin-bottom: 24px;
}

.setting-label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 14px;
}

.mode-option {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: #f8f9fa;
}

.mode-option.active {
  border-color: #4caf50;
  background: #f1f8f1;
}

.mode-icon {
  font-size: 24px;
  margin-right: 16px;
}

.mode-info {
  flex: 1;
}

.mode-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.mode-desc {
  color: #666;
  font-size: 13px;
}

.mode-indicator {
  color: #4caf50;
  font-weight: bold;
}

.storage-quota {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 6px;
}

.quota-info {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 12px;
}

.quota-item {
  text-align: center;
}

.quota-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.quota-value {
  font-weight: 600;
}

.quota-bar {
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.quota-progress {
  height: 100%;
  background: #4caf50;
  transition: width 0.3s;
}

.quota-warning {
  font-size: 13px;
  color: #856404;
  background: #fff3cd;
  padding: 8px;
  border-radius: 4px;
}

.debug-options {
  display: flex;
  gap: 16px;
}

.debug-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.config-display {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 13px;
}

.config-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.config-key {
  color: #666;
}

.config-value {
  font-weight: 600;
}

.setting-tips {
  background: #fff8e1;
  padding: 16px;
  border-radius: 6px;
  border-left: 4px solid #ffc107;
}

.tip-item {
  margin-bottom: 8px;
  font-size: 13px;
  line-height: 1.4;
}

.tip-item:last-child {
  margin-bottom: 0;
}
`

// 注入样式
if (typeof document !== 'undefined' && !document.getElementById('storage-settings-styles')) {
  const styleSheet = document.createElement('style')
  styleSheet.id = 'storage-settings-styles'
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}