// 无痕模式检测工具

/**
 * 检测是否在无痕/隐私模式下运行
 * @returns Promise<boolean> true表示是无痕模式
 */
export async function detectIncognitoMode(): Promise<boolean> {
  // 方法1：检测是否能使用持久化存储
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const { quota } = await navigator.storage.estimate()
      // 无痕模式下的quota通常很小（<120MB）
      if (quota && quota < 120000000) {
        return true
      }
    } catch (e) {
      // 如果API不可用，继续其他检测
    }
  }

  // 方法2：尝试使用IndexedDB
  return new Promise((resolve) => {
    if (!window.indexedDB) {
      resolve(false)
      return
    }

    try {
      const testDB = window.indexedDB.open('test')
      testDB.onerror = () => resolve(true) // 无痕模式可能阻止访问
      testDB.onsuccess = () => {
        // 在无痕模式下，某些浏览器的quota非常小
        resolve(false)
      }
    } catch (e) {
      resolve(true)
    }
  })
}

/**
 * 检测浏览器类型
 */
export function getBrowserInfo(): {
  name: string
  isIncognitoSupported: boolean
} {
  const ua = navigator.userAgent
  
  if (ua.includes('Firefox')) {
    return { name: 'Firefox', isIncognitoSupported: true }
  } else if (ua.includes('Edg')) {
    return { name: 'Edge', isIncognitoSupported: true }
  } else if (ua.includes('Chrome')) {
    return { name: 'Chrome', isIncognitoSupported: true }
  } else if (ua.includes('Safari')) {
    return { name: 'Safari', isIncognitoSupported: true }
  } else {
    return { name: 'Unknown', isIncognitoSupported: false }
  }
}

/**
 * 获取无痕模式的友好名称
 */
export function getIncognitoModeName(): string {
  const browser = getBrowserInfo()
  
  switch (browser.name) {
    case 'Chrome':
    case 'Edge':
      return '无痕模式'
    case 'Firefox':
      return '隐私浏览模式'
    case 'Safari':
      return '私人浏览模式'
    default:
      return '隐私模式'
  }
}

