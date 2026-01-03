// 存储状态监控组件 - 纯本地模式
import React, { useState, useEffect } from 'react'
import { checkStorageQuota } from '../utils/local-storage-utils'
import { getStorageAdapter } from '../utils/storage-adapter'
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

        // 查询本地文档和图片数量
        const docCount = await countDocuments()
        const imgCount = await countImages()

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

    return () => {
      clearInterval(interval)
    }
  }, [])

  // 获取数据库实例
  const getDB = async (): Promise<IDBDatabase | null> => {
    try {
      const adapter = await getStorageAdapter()
      if (!adapter.isAvailable()) return null
      return (adapter as any).getDB()
    } catch (error) {
      // 初始化错误是正常的，静默处理
      return null
    }
  }

  // 统计文档数量
  const countDocuments = async (): Promise<number> => {
    try {
      const db = await getDB()
      if (!db) return 0

      return new Promise((resolve, reject) => {
        try {
          const transaction = db.transaction(['documents'], 'readonly')
          const store = transaction.objectStore('documents')
          const request = store.count()
          request.onsuccess = () => resolve(request.result)
          request.onerror = () => reject(request.error)
        } catch (error) {
          resolve(0)
        }
      })
    } catch (error) {
      console.error('统计文档失败:', error)
      return 0
    }
  }

  // 统计图片数量
  const countImages = async (): Promise<number> => {
    try {
      const db = await getDB()
      if (!db) return 0

      return new Promise((resolve, reject) => {
        try {
          const transaction = db.transaction(['images'], 'readonly')
          const store = transaction.objectStore('images')
          const request = store.count()
          request.onsuccess = () => resolve(request.result)
          request.onerror = () => reject(request.error)
        } catch (error) {
          resolve(0)
        }
      })
    } catch (error) {
      console.error('统计图片失败:', error)
      return 0
    }
  }

  // 清理缓存
  const clearCache = async () => {
    if (!confirm('确定要清理所有本地缓存吗？\n\n⚠️ 注意：这将删除所有本地文档和图片！\n\n建议先导出重要数据。')) {
      return
    }

    try {
      const db = await getDB()
      if (!db) {
        notification.error('无法访问本地数据库')
        return
      }

      // 清理 IndexedDB
      const transaction = db.transaction(['documents', 'images', 'versions'], 'readwrite')

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
        }),
        new Promise((resolve, reject) => {
          const request = transaction.objectStore('versions').clear()
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
    if (status.quotaUsage > 90) return '#f44336'  // 红色警告
    if (status.quotaUsage > 70) return '#ff9800'  // 橙色提示
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
      width: '320px',
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
        padding: '12px 16px',
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
          <h3 style={{ margin: 0, fontSize: '14px' }}>存储状态</h3>
        </div>
        <button
          onClick={() => setShowDetails(false)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            color: '#999',
            padding: '0'
          }}
        >
          ✕
        </button>
      </div>

      {/* 内容 */}
      <div style={{ padding: '16px' }}>
        {/* 存储统计 */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            fontSize: '12px',
            color: '#666',
            marginBottom: '8px',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span>存储使用:</span>
            <span style={{ fontWeight: 600 }}>{status.quotaUsage.toFixed(1)}%</span>
          </div>
          <div style={{
            height: '6px',
            background: '#eee',
            borderRadius: '3px',
            overflow: 'hidden',
            marginBottom: '12px'
          }}>
            <div style={{
              width: `${status.quotaUsage}%`,
              height: '100%',
              background: getStatusColor(),
              transition: 'width 0.3s'
            }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ padding: '8px', background: '#f8f9fa', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', color: '#999' }}>文档数量</div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{status.documentsCount}</div>
            </div>
            <div style={{ padding: '8px', background: '#f8f9fa', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', color: '#999' }}>图片数量</div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{status.imagesCount}</div>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <button
          onClick={clearCache}
          style={{
            width: '100%',
            padding: '8px',
            background: '#fff',
            border: '1px solid #ffc107',
            color: '#856404',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500
          }}
        >
          🗑️ 清理本地缓存
        </button>

        {/* 提示信息 */}
        {status.quotaUsage > 80 && (
          <div style={{
            marginTop: '12px',
            padding: '8px',
            background: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '6px',
            fontSize: '11px',
            color: '#856404'
          }}>
            ⚠️ 存储空间不足，建议清理旧文档或图片
          </div>
        )}

        {status.lastError && (
          <div style={{
            marginTop: '12px',
            padding: '8px',
            background: '#ffebee',
            border: '1px solid #f44336',
            borderRadius: '6px',
            fontSize: '11px',
            color: '#c62828'
          }}>
            ❌ {status.lastError}
          </div>
        )}
      </div>
    </div>
  )
}
