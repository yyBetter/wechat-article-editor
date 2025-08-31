// 应用状态管理
import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { AppState, AppAction } from '../types/app'
import { templates, defaultTemplateVariables } from '../templates'

// 初始状态
const initialState: AppState = {
  editor: {
    content: `# 欢迎使用公众号排版工具

这是一个专业的微信公众号文章排版工具，支持 **Markdown** 语法编写，一键生成美观的排版效果。

## 主要特性

- 📝 简约文档模板
- 🖼️ 图文并茂模板  
- 🎨 智能模板推荐
- 📱 实时预览效果
- 🚀 一键导出HTML

## 使用方法

1. 在左侧编辑器输入 Markdown 内容
2. 选择合适的排版模板
3. 查看右侧实时预览效果
4. 点击导出按钮获取HTML代码

> 开始你的创作之旅吧！`,
    selectedText: '',
    cursorPosition: 0,
    isChanged: false,
    lastSaved: null
  },
  
  preview: {
    html: '',
    css: '',
    isLoading: false,
    deviceMode: 'mobile',
    scale: 1,
    scrollPosition: 0
  },
  
  templates: {
    available: templates,
    current: templates[0],
    variables: { ...defaultTemplateVariables, content: '' },
    customStyles: {}
  },
  
  assets: {
    images: [],
    imageMap: {},
    fixedAssets: {
      logo: null,
      qrcode: null,
      dividers: [],
      watermark: null,
      brandColors: ['#1e6fff', '#333333', '#666666'],
      customCSS: ''
    },
    uploadQueue: [],
    cdnConfig: null
  },
  
  export: {
    isExporting: false,
    lastExported: null,
    exportHistory: []
  },
  
  ui: {
    sidebarOpen: true,
    activePanel: 'templates',
    showPreview: true,
    theme: 'light',
    fontSize: 'medium',
    deviceMode: 'mobile'
  }
}

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'UPDATE_EDITOR_CONTENT':
      return {
        ...state,
        editor: {
          ...state.editor,
          content: action.payload,
          isChanged: true
        }
      }
      
    case 'SELECT_TEMPLATE':
      const template = templates.find(t => t.id === action.payload)
      return {
        ...state,
        templates: {
          ...state.templates,
          current: template || state.templates.current
        }
      }
      
    case 'UPDATE_TEMPLATE_VARIABLES':
      return {
        ...state,
        templates: {
          ...state.templates,
          variables: {
            ...state.templates.variables,
            ...action.payload
          }
        }
      }
      
    case 'SET_PREVIEW_HTML':
      return {
        ...state,
        preview: {
          ...state.preview,
          html: action.payload,
          isLoading: false
        }
      }
      
    case 'ADD_ASSET':
      return {
        ...state,
        assets: {
          ...state.assets,
          images: [...state.assets.images, action.payload]
        }
      }
      
    case 'REMOVE_ASSET':
      return {
        ...state,
        assets: {
          ...state.assets,
          images: state.assets.images.filter(img => img.id !== action.payload)
        }
      }
      
    case 'UPDATE_IMAGE_MAP':
      return {
        ...state,
        assets: {
          ...state.assets,
          imageMap: {
            ...state.assets.imageMap,
            [action.payload.id]: action.payload.data
          }
        }
      }
      
    case 'UPDATE_FIXED_ASSETS':
      return {
        ...state,
        assets: {
          ...state.assets,
          fixedAssets: {
            ...state.assets.fixedAssets,
            ...action.payload
          }
        }
      }
      
    case 'SET_UI_STATE':
      return {
        ...state,
        ui: {
          ...state.ui,
          ...action.payload
        }
      }
      
    case 'EXPORT_START':
      return {
        ...state,
        export: {
          ...state.export,
          isExporting: true
        }
      }
      
    case 'EXPORT_COMPLETE':
      return {
        ...state,
        export: {
          ...state.export,
          isExporting: false,
          lastExported: new Date(),
          exportHistory: [action.payload, ...state.export.exportHistory.slice(0, 9)]
        }
      }
      
    default:
      return state
  }
}

// Context
const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | null>(null)

// Provider 组件
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

// Hook
export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}