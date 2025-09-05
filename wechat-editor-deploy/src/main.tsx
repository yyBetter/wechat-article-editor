// React应用入口文件
import React from 'react'
import { createRoot } from 'react-dom/client'
import { AppRouter } from './AppRouter'

// 创建根元素并渲染应用（现在使用路由器）
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
)