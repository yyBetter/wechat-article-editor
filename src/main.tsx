// React应用入口文件
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

// 创建根元素并渲染应用
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)