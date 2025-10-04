// 存储统计信息组件 - 用于在下拉菜单中显示
import React, { useState, useEffect } from 'react'
import { checkStorageQuota } from '../utils/local-storage-utils'
import { getStorageAdapter } from '../utils/storage-adapter'
import { useAuth } from '../utils/auth-context'

interface StorageInfo {
  documentsCount: number
  imagesCount: number
  quotaUsage: number
  quotaAvailable: number
}

export function StorageStats() {
  const { state: authState } = useAuth()
  const [info, setInfo] = useState<StorageInfo>({
    documentsCount: 0,
    imagesCount: 0,
    quotaUsage: 0,
    quotaAvailable: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authState.isAuthenticated) {
      return
    }

    const fetchStorageInfo = async () => {
      try {
        // 延迟500ms，确保 storage adapter 已初始化
        await new Promise(resolve => setTimeout(resolve, 500))

        const adapter = await getStorageAdapter()
        if (!adapter.isAvailable()) {
          setLoading(false)
          return
        }

        const quota = await checkStorageQuota()
        
        // 获取数据库实例
        let db: IDBDatabase | null = null
        if (adapter.constructor.name === 'LocalStorageAdapter') {
          db = (adapter as any).getDB()
        } else if (adapter.constructor.name === 'HybridStorageAdapter') {
          const localAdapter = (adapter as any).getCurrentAdapter()
          if (localAdapter && localAdapter.isAvailable()) {
            db = localAdapter.getDB()
          }
        }

        if (!db) {
          setLoading(false)
          return
        }

        // 统计文档和图片数量
        const docCount = await new Promise<number>((resolve) => {
          try {
            const transaction = db!.transaction(['documents'], 'readonly')
            const request = transaction.objectStore('documents').count()
            request.onsuccess = () => resolve(request.result)
            request.onerror = () => resolve(0)
          } catch {
            resolve(0)
          }
        })

        const imgCount = await new Promise<number>((resolve) => {
          try {
            const transaction = db!.transaction(['images'], 'readonly')
            const request = transaction.objectStore('images').count()
            request.onsuccess = () => resolve(request.result)
            request.onerror = () => resolve(0)
          } catch {
            resolve(0)
          }
        })

        setInfo({
          documentsCount: docCount,
          imagesCount: imgCount,
          quotaUsage: quota.percentage,
          quotaAvailable: quota.available / 1024 / 1024
        })
        setLoading(false)
      } catch (error) {
        console.error('获取存储信息失败:', error)
        setLoading(false)
      }
    }

    fetchStorageInfo()
  }, [authState.isAuthenticated])

  if (!authState.isAuthenticated) {
    return null
  }

  if (loading) {
    return (
      <div className="storage-stats loading">
        <div className="stats-icon">💾</div>
        <div className="stats-info">
          <div className="stats-label">加载中...</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="storage-stats">
        <div className="stats-header">
          <div className="stats-icon">💾</div>
          <span className="stats-title">本地存储</span>
          <span className="stats-badge">✓</span>
        </div>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">文档</span>
            <span className="stat-value">{info.documentsCount}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">图片</span>
            <span className="stat-value">{info.imagesCount}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">已用</span>
            <span className="stat-value">{info.quotaUsage.toFixed(1)}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">可用</span>
            <span className="stat-value">{Math.floor(info.quotaAvailable)}MB</span>
          </div>
        </div>
      </div>

      <style>{`
        .storage-stats {
          padding: 12px 16px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .storage-stats.loading {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
        }

        .storage-stats.loading .stats-icon {
          font-size: 20px;
        }

        .storage-stats.loading .stats-label {
          font-size: 13px;
          color: #999;
        }

        .stats-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .stats-icon {
          font-size: 18px;
        }

        .stats-title {
          font-size: 13px;
          font-weight: 600;
          color: #333;
          flex: 1;
        }

        .stats-badge {
          font-size: 14px;
          color: #4caf50;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 6px 8px;
          background: white;
          border-radius: 6px;
        }

        .stat-label {
          font-size: 11px;
          color: #999;
        }

        .stat-value {
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }
      `}</style>
    </>
  )
}

