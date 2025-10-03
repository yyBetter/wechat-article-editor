// 存储状态监控组件 - 显示存储状态和提供快速修复选项
import React, { useState, useEffect } from 'react'
import { getStorageConfig, setStorageConfig, resetStorageAdapter } from '../utils/storage-adapter'
import { checkStorageQuota } from '../utils/local-storage-utils'
import { notification } from '../utils/notification'

interface StorageStatus {
  mode: 'local' | 'server' | 'hybrid'
  isOnline: boolean
  quotaUsage: number
  quotaAvailable: number
  lastError: string | null
}

export function StorageStatusMonitor() {
  const [status, setStatus] = useState<StorageStatus>({
    mode: 'local',
    isOnline: navigator.onLine,
    quotaUsage: 0,
    quotaAvailable: 0,
    lastError: null
  })
  const [showDetails, setShowDetails] = useState(false)

  // 检查存储状态
  useEffect(() => {
    const checkStatus = async () => {
      const config = getStorageConfig()
      
      try {
        const quota = await checkStorageQuota()
        
        setStatus(prev => ({
          ...prev,
          mode: config.mode,
          isOnline: navigator.onLine,
          quotaUsage: quota.percentage,
          quotaAvailable: quota.available / 1024 / 1024 // MB
        }))
      } catch (error) {
        console.error('检查存储状态失败:', error)
      }
    }

    checkStatus()
    
    // 监听在线状态变化
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }))
      notification.success('网络连接已恢复')
    }
    
    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }))
      notification.warning('网络连接已断开，切换到本地模式')
      
      // 自动切换到本地模式
      const config = getStorageConfig()
      if (config.mode === 'server') {
        switchToLocalMode()
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // 切换到本地模式
  const switchToLocalMode = async () => {
    try {
      setStorageConfig({ mode: 'local' })
      resetStorageAdapter()
      notification.success('已切换到本地存储模式')
      
      setStatus(prev => ({ ...prev, mode: 'local' }))
    } catch (error) {
      console.error('切换存储模式失败:', error)
      notification.error('切换失败: ' + (error as Error).message)
    }
  }

  // 切换到服务器模式
  const switchToServerMode = async () => {
    if (!status.isOnline) {
      notification.warning('当前离线，无法切换到服务器模式')
      return
    }

    try {
      setStorageConfig({ mode: 'server' })
      resetStorageAdapter()
      notification.success('已切换到服务器存储模式')
      
      setStatus(prev => ({ ...prev, mode: 'server' }))
    } catch (error) {
      console.error('切换存储模式失败:', error)
      notification.error('切换失败: ' + (error as Error).message)
    }
  }

  // 切换到混合模式
  const switchToHybridMode = async () => {
    try {
      setStorageConfig({ mode: 'hybrid' })
      resetStorageAdapter()
      notification.success('已切换到混合存储模式（本地优先）')
      
      setStatus(prev => ({ ...prev, mode: 'hybrid' }))
    } catch (error) {
      console.error('切换存储模式失败:', error)
      notification.error('切换失败: ' + (error as Error).message)
    }
  }

  // 获取状态颜色
  const getStatusColor = () => {
    if (!status.isOnline && status.mode === 'server') return '#ff4444'
    if (status.quotaUsage > 90) return '#ff9800'
    return '#4caf50'
  }

  // 获取状态文本
  const getStatusText = () => {
    if (!status.isOnline && status.mode === 'server') {
      return '离线 (服务器模式不可用)'
    }
    
    const modeText = {
      local: '本地存储',
      server: '服务器存储',
      hybrid: '混合存储'
    }[status.mode]
    
    return `${modeText} ${status.isOnline ? '✓' : '(离线)'}`
  }

  if (!showDetails) {
    // 简化状态指示器
    return (
      <div 
        style={{
          position: 'fixed',
          bottom: '60px',  // 提高位置，在错别字检查上方
          right: '20px',
          background: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          zIndex: 1000
        }}
        onClick={() => setShowDetails(true)}
      >
        <div 
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: getStatusColor()
          }}
        />
        <span>{getStatusText()}</span>
      </div>
    )
  }

  // 详细状态面板
  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '60px',  // 提高位置，在错别字检查上方
        right: '20px',
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        minWidth: '320px',
        zIndex: 1000
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>存储状态</h3>
        <button 
          onClick={() => setShowDetails(false)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '20px',
            color: '#999'
          }}
        >
          ×
        </button>
      </div>

      {/* 当前状态 */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div 
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: getStatusColor()
            }}
          />
          <strong>{getStatusText()}</strong>
        </div>
        
        {/* 存储配额 */}
        <div style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
          <div>存储使用: {status.quotaUsage.toFixed(1)}%</div>
          <div>剩余空间: {status.quotaAvailable.toFixed(0)} MB</div>
        </div>
      </div>

      {/* 模式切换按钮 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={switchToLocalMode}
          disabled={status.mode === 'local'}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px solid #ddd',
            background: status.mode === 'local' ? '#e3f2fd' : 'white',
            cursor: status.mode === 'local' ? 'default' : 'pointer',
            fontSize: '13px'
          }}
        >
          💾 本地存储模式 {status.mode === 'local' && '(当前)'}
        </button>
        
        <button
          onClick={switchToHybridMode}
          disabled={status.mode === 'hybrid'}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px solid #ddd',
            background: status.mode === 'hybrid' ? '#e3f2fd' : 'white',
            cursor: status.mode === 'hybrid' ? 'default' : 'pointer',
            fontSize: '13px'
          }}
        >
          🔄 混合模式 {status.mode === 'hybrid' && '(当前)'}
        </button>
        
        <button
          onClick={switchToServerMode}
          disabled={status.mode === 'server' || !status.isOnline}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px solid #ddd',
            background: status.mode === 'server' ? '#e3f2fd' : 'white',
            cursor: (status.mode === 'server' || !status.isOnline) ? 'default' : 'pointer',
            fontSize: '13px',
            opacity: !status.isOnline ? 0.5 : 1
          }}
        >
          ☁️ 服务器模式 {status.mode === 'server' && '(当前)'}
        </button>
      </div>

      {/* 提示信息 */}
      {!status.isOnline && (
        <div style={{
          marginTop: '12px',
          padding: '8px',
          background: '#fff3cd',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#856404'
        }}>
          ⚠️ 当前离线，建议使用本地或混合模式
        </div>
      )}
      
      {status.quotaUsage > 80 && (
        <div style={{
          marginTop: '12px',
          padding: '8px',
          background: '#fff3cd',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#856404'
        }}>
          ⚠️ 存储空间不足，建议清理旧版本或切换到服务器模式
        </div>
      )}
    </div>
  )
}



