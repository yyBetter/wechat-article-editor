// 全局设置模态框组件
import React, { useEffect } from 'react'
import { GlobalSettings } from './GlobalSettings'

interface GlobalSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function GlobalSettingsModal({ isOpen, onClose }: GlobalSettingsModalProps) {
  // ESC键关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // 阻止页面滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="global-settings-modal-overlay" onClick={onClose}>
      <div className="global-settings-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* 模态框头部 */}
        <div className="modal-header">
          <h2 className="modal-title">⚙️ 全局设置</h2>
          <button 
            className="modal-close-btn"
            onClick={onClose}
            type="button"
            title="关闭 (ESC)"
          >
            ✕
          </button>
        </div>

        {/* 设置内容 */}
        <div className="modal-body">
          <GlobalSettings />
        </div>
      </div>

      <style>{`
        .global-settings-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
          animation: fadeIn 0.2s ease-out;
        }

        .global-settings-modal-content {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 700px;
          width: 100%;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          animation: slideIn 0.2s ease-out;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid #e5e5e5;
        }

        .modal-title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }

        .modal-close-btn {
          background: none;
          border: none;
          font-size: 24px;
          color: #999;
          cursor: pointer;
          padding: 4px;
          line-height: 1;
          transition: color 0.2s, transform 0.2s;
          border-radius: 4px;
        }

        .modal-close-btn:hover {
          color: #333;
          background: #f5f5f5;
          transform: scale(1.1);
        }

        .modal-body {
          overflow-y: auto;
          padding: 24px;
          flex: 1;
        }

        /* 优化内部 GlobalSettings 样式 */
        .modal-body .settings-container {
          max-width: 100%;
        }

        .modal-body .section-title {
          display: none; /* 隐藏重复标题 */
        }

        .modal-body .settings-section {
          margin-bottom: 24px;
        }

        .modal-body .settings-section:last-child {
          margin-bottom: 0;
        }

        /* 滚动条样式 */
        .modal-body::-webkit-scrollbar {
          width: 8px;
        }

        .modal-body::-webkit-scrollbar-track {
          background: #f5f5f5;
          border-radius: 4px;
        }

        .modal-body::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 4px;
        }

        .modal-body::-webkit-scrollbar-thumb:hover {
          background: #999;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* 响应式调整 */
        @media (max-width: 768px) {
          .global-settings-modal-content {
            max-width: 100%;
            max-height: 90vh;
            margin: 0 16px;
          }

          .modal-header {
            padding: 16px 20px;
          }

          .modal-body {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  )
}

