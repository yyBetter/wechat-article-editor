// 新的路由器组件 - 管理应用的页面路由
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './utils/auth-context'
import { AppProvider } from './utils/app-context'
import { Dashboard } from './pages/Dashboard'
import { Articles } from './pages/Articles'
import { UserSettings } from './pages/UserSettings'
import { LegacyEditorContent } from './components/LegacyEditorContent'

// 创建一个不包含Context提供器的LegacyEditor内容组件
function LegacyEditorRoute() {
  return <LegacyEditorContent />
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <Routes>
            {/* 新的Dashboard首页 - To C产品入口 */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* 编辑器页面 */}
            <Route path="/editor" element={<LegacyEditorRoute />} />
            <Route path="/editor/:documentId" element={<LegacyEditorRoute />} />
            
            {/* 文章管理页面 */}
            <Route path="/articles" element={<Articles />} />
            
            {/* 用户设置页面 */}
            <Route path="/settings" element={<UserSettings />} />
            
            {/* 兼容性路由 - 保持现有功能可访问 */}
            <Route path="/legacy" element={<LegacyEditorRoute />} />
            
            {/* 未匹配的路由重定向到首页 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}