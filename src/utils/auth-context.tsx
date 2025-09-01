// 用户认证状态管理
// 设计原则：与现有AppContext并存，不影响现有功能

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { User, storeToken, clearStoredToken, verifyToken, isAuthenticated } from './auth-api'

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
  login: (user: User, token: string) => void
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
            dispatch({ type: 'AUTH_SUCCESS', payload: result.user })
          } else {
            // Token无效，清除存储
            clearStoredToken()
            dispatch({ type: 'AUTH_FAILURE', payload: '登录已过期，请重新登录' })
          }
        } catch (error) {
          clearStoredToken()
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
  const login = (user: User, token: string) => {
    storeToken(token)
    dispatch({ type: 'AUTH_SUCCESS', payload: user })
  }
  
  // 登出方法
  const logout = () => {
    clearStoredToken()
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