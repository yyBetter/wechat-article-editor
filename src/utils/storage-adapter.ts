// 存储适配器 - 纯本地存储
// 存储配置
export interface StorageConfig {
  mode: 'local'
  localDBName?: string
  enableDebugLogs?: boolean
}

const DEFAULT_CONFIG: StorageConfig = {
  mode: 'local',
  localDBName: 'WeChat_Editor_Pure',
  enableDebugLogs: true
}

// 全局存储配置
let storageConfig: StorageConfig = { ...DEFAULT_CONFIG }

// 获取存储配置
export function getStorageConfig(): StorageConfig {
  return { ...storageConfig }
}

// 设置存储配置
export function setStorageConfig(newConfig: Partial<StorageConfig>) {
  storageConfig = { ...storageConfig, ...newConfig }
  // 重置全局适配器，以便下次获取时使用新配置
  globalAdapter = null
}

// 切换存储模式 (纯本地模式下仅作为UI支持)
export async function switchStorageMode(mode: StorageConfig['mode']): Promise<void> {
  if (mode !== 'local') {
    throw new Error('当前版本仅支持本地存储模式')
  }
  setStorageConfig({ mode })
}

// 存储适配器基类
export abstract class StorageAdapter {
  protected config: StorageConfig

  constructor(config?: Partial<StorageConfig>) {
    this.config = { ...storageConfig, ...config }
  }

  protected log(message: string, data?: any) {
    if (this.config.enableDebugLogs) {
      console.log(`[LOCAL] ${message}`, data)
    }
  }

  abstract initialize(): Promise<void>
  abstract isAvailable(): boolean
}

// IndexedDB本地存储适配器
export class LocalStorageAdapter extends StorageAdapter {
  private db: IDBDatabase | null = null

  async initialize(): Promise<void> {
    this.db = await this.openDB()
    this.log('本地存储适配器已初始化')
  }

  isAvailable(): boolean {
    return 'indexedDB' in window && this.db !== null
  }

  private async openDB(): Promise<IDBDatabase> {
    const dbName = this.config.localDBName || 'WeChat_Editor_Pure'

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

  getDB(): IDBDatabase {
    if (!this.db) {
      throw new Error('数据库未初始化')
    }
    return this.db
  }

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

// 全局适配器实例
let globalAdapter: LocalStorageAdapter | null = null

// 获取全局适配器实例
export async function getStorageAdapter(): Promise<LocalStorageAdapter> {
  if (!globalAdapter) {
    globalAdapter = new LocalStorageAdapter()
    await globalAdapter.initialize()
  }

  return globalAdapter
}

// 重置适配器
export function resetStorageAdapter() {
  globalAdapter = null
}