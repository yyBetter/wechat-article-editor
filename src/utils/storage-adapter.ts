// 存储适配器 - 支持服务器存储和本地存储切换
import { getStoredToken } from './auth-api'

// 存储配置
export interface StorageConfig {
  mode: 'server' | 'local' | 'hybrid'
  serverBaseUrl?: string
  localDBName?: string
  enableDebugLogs?: boolean
}

// 默认配置
const DEFAULT_CONFIG: StorageConfig = {
  mode: 'local', // 切换到本地存储模式
  serverBaseUrl: (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002') + '/api',
  localDBName: 'WeChat_Editor',
  enableDebugLogs: true
}

// 全局存储配置
let storageConfig: StorageConfig = { ...DEFAULT_CONFIG }

// 设置存储配置
export function setStorageConfig(config: Partial<StorageConfig>) {
  storageConfig = { ...storageConfig, ...config }
  console.log('存储模式已切换:', storageConfig.mode)
}

// 获取存储配置
export function getStorageConfig(): StorageConfig {
  return { ...storageConfig }
}

// 存储适配器基类
export abstract class StorageAdapter {
  protected config: StorageConfig
  
  constructor(config?: Partial<StorageConfig>) {
    this.config = { ...storageConfig, ...config }
  }
  
  protected log(message: string, data?: any) {
    if (this.config.enableDebugLogs) {
      console.log(`[${this.config.mode.toUpperCase()}] ${message}`, data)
    }
  }
  
  // 抽象方法 - 子类必须实现
  abstract initialize(): Promise<void>
  abstract isAvailable(): boolean
}

// 服务器存储适配器
export class ServerStorageAdapter extends StorageAdapter {
  async initialize(): Promise<void> {
    this.log('服务器存储适配器已初始化')
  }
  
  isAvailable(): boolean {
    return true // 服务器存储总是可用
  }
  
  protected createHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    
    const token = getStoredToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    
    return headers
  }
  
  protected async apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.serverBaseUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.createHeaders(),
        ...options.headers
      }
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('认证失败，请重新登录')
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.error || '请求失败')
    }

    return result.data
  }
}

// IndexedDB本地存储适配器
export class LocalStorageAdapter extends StorageAdapter {
  private db: IDBDatabase | null = null
  private userId: string | null = null
  
  async initialize(): Promise<void> {
    // 从localStorage获取当前用户
    const currentUser = localStorage.getItem('current_user')
    if (currentUser) {
      const user = JSON.parse(currentUser)
      this.userId = user.id
    }
    
    if (!this.userId) {
      throw new Error('未找到当前用户，无法初始化本地存储')
    }
    
    this.db = await this.openDB()
    this.log('本地存储适配器已初始化', { userId: this.userId })
  }
  
  isAvailable(): boolean {
    return 'indexedDB' in window && this.db !== null
  }
  
  private async openDB(): Promise<IDBDatabase> {
    const dbName = `${this.config.localDBName}_${this.userId}`
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // 创建对象存储
        if (!db.objectStoreNames.contains('documents')) {
          const docStore = db.createObjectStore('documents', { keyPath: 'id' })
          docStore.createIndex('title', 'title', { unique: false })
          docStore.createIndex('status', 'status', { unique: false })
          docStore.createIndex('createdAt', 'createdAt', { unique: false })
        }
        
        if (!db.objectStoreNames.contains('versions')) {
          const verStore = db.createObjectStore('versions', { keyPath: 'id' })
          verStore.createIndex('documentId', 'documentId', { unique: false })
          verStore.createIndex('createdAt', 'createdAt', { unique: false })
        }
        
        if (!db.objectStoreNames.contains('images')) {
          const imgStore = db.createObjectStore('images', { keyPath: 'id' })
          imgStore.createIndex('filename', 'filename', { unique: false })
        }
        
        console.log('IndexedDB数据库结构已创建')
      }
    })
  }
  
  // 获取数据库实例
  getDB(): IDBDatabase {
    if (!this.db) {
      throw new Error('数据库未初始化')
    }
    return this.db
  }
  
  // 通用事务执行方法
  async executeTransaction<T>(
    storeNames: string | string[],
    mode: IDBTransactionMode,
    operation: (transaction: IDBTransaction) => Promise<T>
  ): Promise<T> {
    const db = this.getDB()
    const transaction = db.transaction(storeNames, mode)
    
    return new Promise((resolve, reject) => {
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(new Error('Transaction aborted'))
      
      operation(transaction)
        .then(resolve)
        .catch(reject)
    })
  }
}

// 混合存储适配器 - 根据用户设置动态选择
export class HybridStorageAdapter extends StorageAdapter {
  private serverAdapter: ServerStorageAdapter
  private localAdapter: LocalStorageAdapter
  
  constructor(config?: Partial<StorageConfig>) {
    super(config)
    this.serverAdapter = new ServerStorageAdapter(config)
    this.localAdapter = new LocalStorageAdapter(config)
  }
  
  async initialize(): Promise<void> {
    await this.serverAdapter.initialize()
    
    try {
      await this.localAdapter.initialize()
      this.log('混合存储适配器已初始化 - 本地存储可用')
    } catch (error) {
      this.log('本地存储初始化失败，将使用服务器存储', error)
    }
  }
  
  isAvailable(): boolean {
    return this.serverAdapter.isAvailable() || this.localAdapter.isAvailable()
  }
  
  // 获取当前可用的适配器
  getCurrentAdapter(): ServerStorageAdapter | LocalStorageAdapter {
    if (this.config.mode === 'local' && this.localAdapter.isAvailable()) {
      return this.localAdapter
    }
    return this.serverAdapter
  }
}

// 全局适配器实例
let globalAdapter: StorageAdapter | null = null

// 获取全局适配器实例
export async function getStorageAdapter(): Promise<StorageAdapter> {
  if (!globalAdapter) {
    switch (storageConfig.mode) {
      case 'local':
        globalAdapter = new LocalStorageAdapter()
        break
      case 'hybrid':
        globalAdapter = new HybridStorageAdapter()
        break
      default:
        globalAdapter = new ServerStorageAdapter()
    }
    
    await globalAdapter.initialize()
  }
  
  return globalAdapter
}

// 重置适配器（用于切换存储模式）
export function resetStorageAdapter() {
  globalAdapter = null
}

// 存储模式切换助手
export async function switchStorageMode(mode: StorageConfig['mode']) {
  const oldMode = storageConfig.mode
  
  setStorageConfig({ mode })
  resetStorageAdapter()
  
  try {
    await getStorageAdapter()
    console.log(`存储模式已从 ${oldMode} 切换到 ${mode}`)
    return true
  } catch (error) {
    console.error(`存储模式切换失败:`, error)
    // 回滚到原来的模式
    setStorageConfig({ mode: oldMode })
    resetStorageAdapter()
    throw error
  }
}