// 存储设置组件 - 用于开发和测试阶段切换存储模式
import React, { useState, useEffect } from 'react'
import { 
  getStorageConfig, 
  setStorageConfig, 
  switchStorageMode, 
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
  const [loading, setLoading] = useState(false)
  const [quota, setQuota] = useState<StorageQuota | null>(null)
  const [error, setError] = useState<string | null>(null)
  
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
  
  // 切换存储模式
  const handleModeChange = async (mode: StorageConfig['mode']) => {
    if (mode === config.mode) return
    
    setLoading(true)
    setError(null)
    
    try {
      await switchStorageMode(mode)
      setConfig(getStorageConfig())
      
      // 如果切换到本地模式，重新获取配额信息
      if (mode === 'local' || mode === 'hybrid') {
        await loadStorageQuota()
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '切换失败')
      console.error('存储模式切换失败:', error)
    } finally {
      setLoading(false)
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
        <h3>🗄️ 存储设置</h3>
        <p>选择数据存储方式（开发测试用）</p>
      </div>
      
      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}
      
      {/* 存储模式选择 */}
      <div className="setting-group">
        <label className="setting-label">存储模式</label>
        <div className="storage-mode-options">
          <div 
            className={`mode-option ${config.mode === 'server' ? 'active' : ''}`}
            onClick={() => !loading && handleModeChange('server')}
          >
            <div className="mode-icon">🌐</div>
            <div className="mode-info">
              <div className="mode-title">服务器存储</div>
              <div className="mode-desc">数据存储在服务器上，支持多设备同步</div>
            </div>
            {config.mode === 'server' && <div className="mode-indicator">✓</div>}
          </div>
          
          <div 
            className={`mode-option ${config.mode === 'local' ? 'active' : ''}`}
            onClick={() => !loading && handleModeChange('local')}
          >
            <div className="mode-icon">💻</div>
            <div className="mode-info">
              <div className="mode-title">本地存储</div>
              <div className="mode-desc">数据存储在浏览器本地，速度快、隐私好</div>
            </div>
            {config.mode === 'local' && <div className="mode-indicator">✓</div>}
          </div>
          
          <div 
            className={`mode-option ${config.mode === 'hybrid' ? 'active' : ''}`}
            onClick={() => !loading && handleModeChange('hybrid')}
          >
            <div className="mode-icon">🔄</div>
            <div className="mode-info">
              <div className="mode-title">混合模式</div>
              <div className="mode-desc">认证使用服务器，数据使用本地存储</div>
            </div>
            {config.mode === 'hybrid' && <div className="mode-indicator">✓</div>}
          </div>
        </div>
      </div>
      
      {loading && (
        <div className="loading-indicator">
          <span className="spinner">⏳</span>
          <span>正在切换存储模式...</span>
        </div>
      )}
      
      {/* 本地存储配额信息 */}
      {(config.mode === 'local' || config.mode === 'hybrid') && quota && (
        <div className="setting-group">
          <label className="setting-label">本地存储状态</label>
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
                ⚠️ 存储空间使用率较高，建议清理数据或导出备份
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 调试选项 */}
      <div className="setting-group">
        <label className="setting-label">调试选项</label>
        <div className="debug-options">
          <label className="debug-option">
            <input
              type="checkbox"
              checked={config.enableDebugLogs}
              onChange={handleDebugToggle}
            />
            <span>启用调试日志</span>
          </label>
        </div>
      </div>
      
      {/* 当前配置信息 */}
      <div className="setting-group">
        <label className="setting-label">当前配置</label>
        <div className="config-display">
          <div className="config-item">
            <span className="config-key">存储模式:</span>
            <span className="config-value">{config.mode}</span>
          </div>
          {config.serverBaseUrl && (
            <div className="config-item">
              <span className="config-key">服务器地址:</span>
              <span className="config-value">{config.serverBaseUrl}</span>
            </div>
          )}
          <div className="config-item">
            <span className="config-key">本地数据库:</span>
            <span className="config-value">{config.localDBName}</span>
          </div>
        </div>
      </div>
      
      {/* 操作提示 */}
      <div className="setting-tips">
        <div className="tip-item">
          💡 <strong>服务器模式:</strong> 适合多设备使用，数据自动同步
        </div>
        <div className="tip-item">
          💡 <strong>本地模式:</strong> 速度最快，完全离线工作，数据隐私性最好
        </div>
        <div className="tip-item">
          💡 <strong>混合模式:</strong> 兼具认证便利和本地性能，推荐使用
        </div>
        <div className="tip-item">
          ⚠️ 切换存储模式不会自动迁移现有数据，请注意备份
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

.error-message {
  background: #fee;
  border: 1px solid #fcc;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
  color: #c33;
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

.storage-mode-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mode-option {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-option:hover {
  border-color: #007bff;
  background: #f8f9ff;
}

.mode-option.active {
  border-color: #007bff;
  background: #f0f4ff;
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
  color: #007bff;
  font-weight: bold;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f0f0f0;
  border-radius: 6px;
  font-size: 14px;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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
  background: linear-gradient(to right, #28a745, #ffc107, #dc3545);
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
  background: #e3f2fd;
  padding: 16px;
  border-radius: 6px;
  border-left: 4px solid #2196f3;
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