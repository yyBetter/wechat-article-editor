// 用户认证状态管理
// 设计原则：与现有AppContext并存，不影响现有功能

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { User, storeToken, clearStoredToken, verifyToken, isAuthenticated } from './auth-api'
import { getStorageAdapter, resetStorageAdapter } from './storage-adapter'

// 认证状态类型
export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

// 认证操作类型
export type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; payload: User }

// 初始状态
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // 初始时检查token状态
  error: null
}

// Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null
      }
      
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null
      }
      
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      }
      
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      }
      
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      }
      
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload
      }
      
    default:
      return state
  }
}

// Context
interface AuthContextType {
  state: AuthState
  dispatch: React.Dispatch<AuthAction>
  login: (user: User, token: string) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

// Provider组件
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)
  
  // 初始化时验证token
  useEffect(() => {
    const checkAuthStatus = async () => {
      if (isAuthenticated()) {
        dispatch({ type: 'AUTH_START' })
        try {
          const result = await verifyToken()
          if (result.valid && result.user) {
            // 存储用户信息到localStorage (LocalStorageAdapter需要)
            localStorage.setItem('current_user', JSON.stringify(result.user))
            
            dispatch({ type: 'AUTH_SUCCESS', payload: result.user })
            
            // 初始化存储适配器
            try {
              console.log('Token验证成功，正在初始化存储适配器...')
              await getStorageAdapter()
              console.log('存储适配器初始化成功')
            } catch (storageError) {
              console.error('存储适配器初始化失败:', storageError)
            }
          } else {
            // Token无效，清除存储
            clearStoredToken()
            localStorage.removeItem('current_user')
            dispatch({ type: 'AUTH_FAILURE', payload: '登录已过期，请重新登录' })
          }
        } catch (error) {
          clearStoredToken()
          localStorage.removeItem('current_user')
          dispatch({ type: 'AUTH_FAILURE', payload: '验证登录状态失败' })
        }
      } else {
        // 没有token，直接设置为未认证状态
        dispatch({ type: 'AUTH_FAILURE', payload: '' })
      }
    }
    
    checkAuthStatus()
  }, [])
  
  // 登录方法
  const login = async (user: User, token: string) => {
    storeToken(token)
    
    // 存储用户信息到localStorage (LocalStorageAdapter需要)
    localStorage.setItem('current_user', JSON.stringify(user))
    
    dispatch({ type: 'AUTH_SUCCESS', payload: user })
    
    // 用户登录后初始化本地存储适配器
    try {
      console.log('用户登录成功，正在初始化存储适配器...')
      resetStorageAdapter() // 重置适配器以使用新的用户ID
      await getStorageAdapter()
      console.log('存储适配器初始化成功')
    } catch (error) {
      console.error('存储适配器初始化失败:', error)
    }
  }
  
  // 登出方法
  const logout = () => {
    clearStoredToken()
    localStorage.removeItem('current_user')
    dispatch({ type: 'LOGOUT' })
  }
  
  // 更新用户信息
  const updateUser = (user: User) => {
    dispatch({ type: 'UPDATE_USER', payload: user })
  }
  
  // 清除错误
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }
  
  return (
    <AuthContext.Provider value={{
      state,
      dispatch,
      login,
      logout,
      updateUser,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}