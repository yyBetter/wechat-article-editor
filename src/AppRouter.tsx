// 新的路由器组件 - 管理应用的页面路由
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './utils/app-context'
import { EditorPage } from './pages/EditorPage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          {/* 首页即编辑器 */}
          <Route path="/" element={<EditorPage />} />
          
          {/* 未匹配的路由重定向到首页 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  )
}