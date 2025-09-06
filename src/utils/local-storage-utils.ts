// 本地存储工具函数 - IndexedDB操作封装
import { LocalStorageAdapter } from './storage-adapter'

// 通用数据类型
export interface BaseEntity {
  id: string
  createdAt?: string
  updatedAt?: string
}

// IndexedDB操作工具类
export class LocalStorageUtils {
  private adapter: LocalStorageAdapter
  
  constructor(adapter: LocalStorageAdapter) {
    this.adapter = adapter
  }
  
  // 添加或更新记录
  async put<T extends BaseEntity>(storeName: string, data: T): Promise<T> {
    const now = new Date().toISOString()
    const record = {
      ...data,
      updatedAt: now,
      createdAt: data.createdAt || now
    }
    
    return this.adapter.executeTransaction(storeName, 'readwrite', async (transaction) => {
      const store = transaction.objectStore(storeName)
      
      return new Promise<T>((resolve, reject) => {
        const request = store.put(record)
        request.onsuccess = () => resolve(record)
        request.onerror = () => reject(request.error)
      })
    })
  }
  
  // 根据ID获取记录
  async get<T extends BaseEntity>(storeName: string, id: string): Promise<T | null> {
    return this.adapter.executeTransaction(storeName, 'readonly', async (transaction) => {
      const store = transaction.objectStore(storeName)
      
      return new Promise<T | null>((resolve, reject) => {
        const request = store.get(id)
        request.onsuccess = () => resolve(request.result || null)
        request.onerror = () => reject(request.error)
      })
    })
  }
  
  // 获取所有记录
  async getAll<T extends BaseEntity>(storeName: string): Promise<T[]> {
    return this.adapter.executeTransaction(storeName, 'readonly', async (transaction) => {
      const store = transaction.objectStore(storeName)
      
      return new Promise<T[]>((resolve, reject) => {
        const request = store.getAll()
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
    })
  }
  
  // 分页获取记录
  async getPage<T extends BaseEntity>(
    storeName: string,
    options: {
      page?: number
      limit?: number
      indexName?: string
      indexValue?: any
      direction?: 'prev' | 'next'
    } = {}
  ): Promise<{ data: T[], total: number, hasMore: boolean }> {
    const { page = 1, limit = 20, indexName, indexValue, direction = 'prev' } = options
    const offset = (page - 1) * limit
    
    return this.adapter.executeTransaction(storeName, 'readonly', async (transaction) => {
      const store = transaction.objectStore(storeName)
      const source = indexName ? store.index(indexName) : store
      
      // 获取总数
      const countRequest = indexValue !== undefined 
        ? source.count(indexValue)
        : source.count()
      
      const total = await new Promise<number>((resolve, reject) => {
        countRequest.onsuccess = () => resolve(countRequest.result)
        countRequest.onerror = () => reject(countRequest.error)
      })
      
      // 获取分页数据
      const data = await new Promise<T[]>((resolve, reject) => {
        const results: T[] = []
        let skipped = 0
        let collected = 0
        
        const keyRange = indexValue !== undefined ? IDBKeyRange.only(indexValue) : undefined
        const request = source.openCursor(keyRange, direction)
        
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result
          if (!cursor || collected >= limit) {
            resolve(results)
            return
          }
          
          if (skipped < offset) {
            skipped++
            cursor.continue()
            return
          }
          
          results.push(cursor.value)
          collected++
          cursor.continue()
        }
        
        request.onerror = () => reject(request.error)
      })
      
      return {
        data,
        total,
        hasMore: offset + limit < total
      }
    })
  }
  
  // 删除记录
  async delete(storeName: string, id: string): Promise<boolean> {
    return this.adapter.executeTransaction(storeName, 'readwrite', async (transaction) => {
      const store = transaction.objectStore(storeName)
      
      return new Promise<boolean>((resolve, reject) => {
        const request = store.delete(id)
        request.onsuccess = () => resolve(true)
        request.onerror = () => reject(request.error)
      })
    })
  }
  
  // 按条件查询
  async findByIndex<T extends BaseEntity>(
    storeName: string,
    indexName: string,
    value: any,
    limit?: number
  ): Promise<T[]> {
    return this.adapter.executeTransaction(storeName, 'readonly', async (transaction) => {
      const store = transaction.objectStore(storeName)
      const index = store.index(indexName)
      
      return new Promise<T[]>((resolve, reject) => {
        const results: T[] = []
        const request = index.openCursor(IDBKeyRange.only(value))
        
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result
          if (!cursor || (limit && results.length >= limit)) {
            resolve(results)
            return
          }
          
          results.push(cursor.value)
          cursor.continue()
        }
        
        request.onerror = () => reject(request.error)
      })
    })
  }
  
  // 搜索功能（模糊匹配）
  async search<T extends BaseEntity>(
    storeName: string,
    searchTerm: string,
    searchFields: string[] = ['title']
  ): Promise<T[]> {
    const allRecords = await this.getAll<T>(storeName)
    const searchTermLower = searchTerm.toLowerCase()
    
    return allRecords.filter(record => {
      return searchFields.some(field => {
        const fieldValue = (record as any)[field]
        return fieldValue && 
               typeof fieldValue === 'string' && 
               fieldValue.toLowerCase().includes(searchTermLower)
      })
    })
  }
  
  // 批量操作
  async bulkPut<T extends BaseEntity>(storeName: string, records: T[]): Promise<T[]> {
    return this.adapter.executeTransaction(storeName, 'readwrite', async (transaction) => {
      const store = transaction.objectStore(storeName)
      const now = new Date().toISOString()
      
      const promises = records.map(record => {
        const updatedRecord = {
          ...record,
          updatedAt: now,
          createdAt: record.createdAt || now
        }
        
        return new Promise<T>((resolve, reject) => {
          const request = store.put(updatedRecord)
          request.onsuccess = () => resolve(updatedRecord)
          request.onerror = () => reject(request.error)
        })
      })
      
      return Promise.all(promises)
    })
  }
  
  // 清空存储
  async clear(storeName: string): Promise<void> {
    return this.adapter.executeTransaction(storeName, 'readwrite', async (transaction) => {
      const store = transaction.objectStore(storeName)
      
      return new Promise<void>((resolve, reject) => {
        const request = store.clear()
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    })
  }
  
  // 统计信息
  async getStats(): Promise<{
    documents: number
    versions: number
    images: number
    totalSize: number
  }> {
    const [docCount, verCount, imgCount] = await Promise.all([
      this.count('documents'),
      this.count('versions'),
      this.count('images')
    ])
    
    // 估算存储大小（简单实现）
    const allDocs = await this.getAll('documents')
    const allVersions = await this.getAll('versions')
    const allImages = await this.getAll('images')
    
    const totalSize = JSON.stringify([...allDocs, ...allVersions, ...allImages]).length
    
    return {
      documents: docCount,
      versions: verCount,
      images: imgCount,
      totalSize
    }
  }
  
  private async count(storeName: string): Promise<number> {
    return this.adapter.executeTransaction(storeName, 'readonly', async (transaction) => {
      const store = transaction.objectStore(storeName)
      
      return new Promise<number>((resolve, reject) => {
        const request = store.count()
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
    })
  }
}

// 生成UUID
export function generateId(): string {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

// 格式化存储大小
export function formatStorageSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
}

// 存储配额检查
export async function checkStorageQuota(): Promise<{
  quota: number
  usage: number
  available: number
  percentage: number
}> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate()
    const quota = estimate.quota || 0
    const usage = estimate.usage || 0
    const available = quota - usage
    const percentage = quota > 0 ? (usage / quota) * 100 : 0
    
    return { quota, usage, available, percentage }
  }
  
  // 降级处理
  return { quota: 0, usage: 0, available: 0, percentage: 0 }
}