// 应用状态管理
import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { AppState, AppAction } from '../types/app'
import { templates, defaultTemplateVariables } from '../templates'

// 初始状态
const initialState: AppState = {
  editor: {
    content: '',
    selectedText: '',
    cursorPosition: 0,
    isChanged: false,
    lastSaved: null,
    scrollPercentage: 0,
    cursorLinePercentage: 0,
    totalLines: 1
  },

  preview: {
    html: '',
    css: '',
    isLoading: false,
    deviceMode: 'desktop',
    scale: 1,
    scrollPosition: 0,
    syncScrollEnabled: true,
    lastSyncSource: null
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
    // Removed uploadQueue and cdnConfig as they are server-dependent
    uploadQueue: [],
    cdnConfig: null
  },

  export: {
    isExporting: false,
    lastExported: null
  },

  ui: {
    sidebarOpen: true,
    activePanel: 'editor',
    showPreview: true,
    theme: 'light',
    fontSize: 'medium',
    deviceMode: 'desktop',
    userHasSelectedTemplate: false
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
          lastExported: new Date()
        }
      }

    case 'UPDATE_EDITOR_SCROLL':
      return {
        ...state,
        editor: {
          ...state.editor,
          scrollPercentage: action.payload.scrollPercentage,
          cursorLinePercentage: action.payload.cursorLinePercentage,
          totalLines: action.payload.totalLines
        },
        preview: {
          ...state.preview,
          lastSyncSource: 'editor'
        }
      }

    case 'UPDATE_PREVIEW_SCROLL':
      return {
        ...state,
        preview: {
          ...state.preview,
          scrollPosition: action.payload.scrollPosition,
          lastSyncSource: action.payload.source
        }
      }

    case 'TOGGLE_SYNC_SCROLL':
      return {
        ...state,
        preview: {
          ...state.preview,
          syncScrollEnabled: action.payload
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