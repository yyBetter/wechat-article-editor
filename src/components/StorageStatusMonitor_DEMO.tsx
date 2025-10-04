// 存储状态监控组件 - DEMO 版本（简化为只支持本地存储）
import React, { useState, useEffect } from 'react'
import { checkStorageQuota } from '../utils/local-storage-utils'
import { notification } from '../utils/notification'

interface StorageStatus {
  quotaUsage: number  // 存储使用百分比
  quotaAvailable: number  // 剩余空间 (MB)
  documentsCount: number  // 本地文档数量
  imagesCount: number  // 本地图片数量
  lastError: string | null
}

export function StorageStatusMonitor() {
  const [status, setStatus] = useState<StorageStatus>({
    quotaUsage: 0,
    quotaAvailable: 0,
    documentsCount: 0,
    imagesCount: 0,
    lastError: null
  })
  const [showDetails, setShowDetails] = useState(false)

  // 检查本地存储状态
  useEffect(() => {
    const checkStatus = async () => {
      try {
        // 查询存储配额
        const quota = await checkStorageQuota()
        
        // 查询本地文档数量
        const db = await openDB()
        const docCount = await countDocuments(db)
        const imgCount = await countImages(db)
        
        setStatus({
          quotaUsage: quota.percentage,
          quotaAvailable: quota.available / 1024 / 1024, // 转为 MB
          documentsCount: docCount,
          imagesCount: imgCount,
          lastError: null
        })
      } catch (error) {
        console.error('检查存储状态失败:', error)
        setStatus(prev => ({
          ...prev,
          lastError: (error as Error).message
        }))
      }
    }

    checkStatus()
    
    // 每30秒刷新一次
    const interval = setInterval(checkStatus, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // 打开 IndexedDB
  const openDB = async (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('wechat-editor-local', 1)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // 统计文档数量
  const countDocuments = async (db: IDBDatabase): Promise<number> => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['documents'], 'readonly')
      const store = transaction.objectStore('documents')
      const request = store.count()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // 统计图片数量
  const countImages = async (db: IDBDatabase): Promise<number> => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['images'], 'readonly')
      const store = transaction.objectStore('images')
      const request = store.count()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // 清理缓存
  const clearCache = async () => {
    if (!confirm('确定要清理所有本地缓存吗？\n\n注意：这将删除所有本地文档和图片！')) {
      return
    }

    try {
      // 清理 IndexedDB
      const db = await openDB()
      const transaction = db.transaction(['documents', 'images'], 'readwrite')
      
      await Promise.all([
        new Promise((resolve, reject) => {
          const request = transaction.objectStore('documents').clear()
          request.onsuccess = () => resolve(true)
          request.onerror = () => reject(request.error)
        }),
        new Promise((resolve, reject) => {
          const request = transaction.objectStore('images').clear()
          request.onsuccess = () => resolve(true)
          request.onerror = () => reject(request.error)
        })
      ])

      notification.success('本地缓存已清理')
      
      // 刷新状态
      const quota = await checkStorageQuota()
      setStatus({
        quotaUsage: quota.percentage,
        quotaAvailable: quota.available / 1024 / 1024,
        documentsCount: 0,
        imagesCount: 0,
        lastError: null
      })
    } catch (error) {
      console.error('清理缓存失败:', error)
      notification.error('清理失败: ' + (error as Error).message)
    }
  }

  // 获取状态颜色
  const getStatusColor = () => {
    if (status.quotaUsage > 90) return '#ff9800'  // 橙色警告
    if (status.quotaUsage > 70) return '#ffeb3b'  // 黄色提示
    return '#4caf50'  // 绿色正常
  }

  if (!showDetails) {
    // 简化状态指示器
    return (
      <div 
        onClick={() => setShowDetails(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '8px 12px',
          background: 'white',
          border: `2px solid ${getStatusColor()}`,
          borderRadius: '20px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 500,
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          zIndex: 1000,
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: getStatusColor()
        }} />
        <span>本地存储 ✓</span>
      </div>
    )
  }

  // 详细状态面板
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '400px',
      maxHeight: '600px',
      background: 'white',
      border: '1px solid #e0e0e0',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      zIndex: 1000,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 头部 */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#fafafa'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: getStatusColor()
          }} />
          <h3 style={{ margin: 0, fontSize: '16px' }}>存储状态</h3>
        </div>
        <button 
          onClick={() => setShowDetails(false)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#999',
            padding: '0',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ✕
        </button>
      </div>

      {/* 内容 */}
      <div style={{ padding: '20px', overflowY: 'auto' }}>
        {/* 本地存储模式 */}
        <div style={{
          padding: '16px',
          background: '#e8f5e9',
          border: '2px solid #4caf50',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '20px' }}>💾</span>
            <strong>本地存储模式</strong>
            <span style={{ 
              marginLeft: 'auto', 
              fontSize: '20px',
              color: '#4caf50' 
            }}>✓</span>
          </div>
          <div style={{ fontSize: '13px', color: '#666', marginLeft: '28px' }}>
            数据安全存储在浏览器本地，速度快、隐私好
          </div>
        </div>

        {/* 存储统计 */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ 
            fontSize: '14px', 
            color: '#666', 
            marginBottom: '12px',
            fontWeight: 500 
          }}>
            📊 存储使用情况
          </div>
          
          <div style={{ 
            fontSize: '13px', 
            marginBottom: '8px',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span style={{ color: '#666' }}>存储使用:</span>
            <span style={{ fontWeight: 500 }}>{status.quotaUsage.toFixed(2)}%</span>
          </div>
          
          <div style={{ 
            fontSize: '13px', 
            marginBottom: '8px',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span style={{ color: '#666' }}>剩余空间:</span>
            <span style={{ fontWeight: 500 }}>{Math.floor(status.quotaAvailable)} MB</span>
          </div>
          
          <div style={{ 
            fontSize: '13px', 
            marginBottom: '8px',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span style={{ color: '#666' }}>本地文档:</span>
            <span style={{ fontWeight: 500 }}>{status.documentsCount} 篇</span>
          </div>
          
          <div style={{ 
            fontSize: '13px',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span style={{ color: '#666' }}>本地图片:</span>
            <span style={{ fontWeight: 500 }}>{status.imagesCount} 张</span>
          </div>
        </div>

        {/* 服务器同步 - 标记为后续开发 */}
        <div style={{
          padding: '16px',
          background: '#fff9e6',
          border: '1px dashed #ffc107',
          borderRadius: '8px',
          marginBottom: '16px',
          opacity: 0.7
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '20px' }}>☁️</span>
            <strong style={{ color: '#666' }}>服务器同步</strong>
            <span style={{ 
              marginLeft: 'auto',
              padding: '2px 8px',
              background: '#ffc107',
              color: 'white',
              fontSize: '11px',
              borderRadius: '4px',
              fontWeight: 500
            }}>
              后续开发
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#999', marginLeft: '28px' }}>
            多设备同步、云端备份功能正在开发中...
          </div>
        </div>

        {/* 操作按钮 */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={clearCache}
            style={{
              flex: 1,
              padding: '10px',
              background: '#f5f5f5',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e0e0e0'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f5f5f5'
            }}
          >
            🗑️ 清理缓存
          </button>
        </div>

        {/* 提示信息 */}
        {status.quotaUsage > 80 && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#856404'
          }}>
            ⚠️ 存储空间不足，建议清理旧文档或图片
          </div>
        )}

        {status.lastError && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: '#ffebee',
            border: '1px solid #f44336',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#c62828'
          }}>
            ❌ {status.lastError}
          </div>
        )}
      </div>
    </div>
  )
}

