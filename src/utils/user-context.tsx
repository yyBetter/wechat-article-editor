// 用户权限和付费状态管理
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type UserTier = 'free' | 'paid'

export interface UserState {
  tier: UserTier
  isAuthenticated: boolean
  userId: string | null
  purchaseDate: string | null
  templatesUnlocked: string[]
}

interface UserContextType {
  user: UserState
  unlockPaid: () => void
  isTemplateAvailable: (templateId: string) => boolean
  getAvailableTemplates: () => string[]
}

const FREE_TEMPLATES = ['viral-standard', 'simple-doc']
const PAID_TEMPLATES = ['kuaidao', 'report-grid', 'electric-neo', 'liquid-glass']

const defaultUser: UserState = {
  tier: 'free',
  isAuthenticated: false,
  userId: null,
  purchaseDate: null,
  templatesUnlocked: [...FREE_TEMPLATES]
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserState>(() => {
    // 从localStorage恢复用户状态
    const saved = localStorage.getItem('wechat-editor-user')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return { ...defaultUser, ...parsed }
      } catch {
        return defaultUser
      }
    }
    return defaultUser
  })

  // 保存到localStorage
  useEffect(() => {
    localStorage.setItem('wechat-editor-user', JSON.stringify(user))
  }, [user])

  // 解锁付费版
  const unlockPaid = () => {
    const userId = 'user_' + Date.now()
    setUser({
      tier: 'paid',
      isAuthenticated: true,
      userId,
      purchaseDate: new Date().toISOString(),
      templatesUnlocked: [...FREE_TEMPLATES, ...PAID_TEMPLATES]
    })
  }

  // 检查模板是否可用
  const isTemplateAvailable = (templateId: string): boolean => {
    return user.templatesUnlocked.includes(templateId)
  }

  // 获取可用模板列表
  const getAvailableTemplates = (): string[] => {
    return user.templatesUnlocked
  }

  return (
    <UserContext.Provider value={{ user, unlockPaid, isTemplateAvailable, getAvailableTemplates }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

export { FREE_TEMPLATES, PAID_TEMPLATES }
