// 打赏弹窗组件
import React, { useState } from 'react'
import { markAsDonated, getDonationStats } from '../utils/donation-tracker'
import { notification } from '../utils/notification'

interface DonationModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DonationModal({ isOpen, onClose }: DonationModalProps) {
  const stats = getDonationStats()

  if (!isOpen) return null

  const handleDonated = () => {
    markAsDonated()
    notification.success('感谢您的支持！🙏')
    setTimeout(onClose, 1500)
  }

  return (
    <>
      <div className="donation-modal-overlay" onClick={onClose}>
        <div className="donation-modal-content" onClick={(e) => e.stopPropagation()}>
          {/* 头部 */}
          <div className="donation-header">
            <div className="header-content">
              <h3 className="donation-title">💝 请作者喝杯咖啡</h3>
              <p className="donation-subtitle">如果这个工具帮到了您，欢迎打赏支持</p>
            </div>
            <button className="donation-close" onClick={onClose} type="button">
              ✕
            </button>
          </div>

          {/* 内容 */}
          <div className="donation-body">
            {/* 二维码并排展示 */}
            <div className="qr-codes-row">
              <div className="qr-item">
                <div className="qr-label">
                  <span className="qr-icon">💚</span>
                  <span className="qr-name">微信支付</span>
                </div>
                <img 
                  src="/wechat-qr.png" 
                  alt="微信支付二维码" 
                  className="qr-image"
                />
              </div>
              <div className="qr-item">
                <div className="qr-label">
                  <span className="qr-icon">💙</span>
                  <span className="qr-name">支付宝</span>
                </div>
                <img 
                  src="/alipay-qr.png" 
                  alt="支付宝二维码" 
                  className="qr-image"
                />
              </div>
            </div>

            {/* 建议金额 - 纯展示 */}
            <div className="amount-hint">
              <span className="hint-icon">💡</span>
              <span className="hint-text">任意金额，心意最重要</span>
              <span className="hint-examples">（如：¥5 / ¥10 / ¥20）</span>
            </div>

            {/* 用途说明 - 紧凑版 */}
            <div className="donation-purpose">
              <span className="purpose-icon">💖</span>
              <div className="purpose-content">
                <span className="purpose-text">您的支持将用于：</span>
                <span className="purpose-items">咖啡因供应 · 新功能开发 · Bug修复 · 服务器维护</span>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="donation-actions">
              <button 
                className="action-btn secondary" 
                onClick={onClose}
                type="button"
              >
                稍后支持
              </button>
              <button 
                className="action-btn primary" 
                onClick={handleDonated}
                type="button"
              >
                ✅ 我已打赏
              </button>
            </div>

            {/* 免责声明 */}
            <p className="donation-disclaimer">
              * 打赏完全自愿，不影响任何功能使用
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .donation-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: fadeIn 0.2s ease-out;
          backdrop-filter: blur(4px);
        }

        .donation-modal-content {
          background: white;
          border-radius: 16px;
          width: 90%;
          max-width: 580px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .donation-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 20px 24px 16px;
          border-bottom: 1px solid #f0f0f0;
        }

        .header-content {
          flex: 1;
        }

        .donation-title {
          margin: 0 0 4px 0;
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }

        .donation-subtitle {
          margin: 0;
          font-size: 13px;
          color: #999;
        }

        .donation-close {
          width: 28px;
          height: 28px;
          border: none;
          background: #f5f5f5;
          border-radius: 6px;
          font-size: 16px;
          color: #999;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .donation-close:hover {
          background: #e5e5e5;
          color: #666;
        }

        .donation-body {
          padding: 20px 24px;
        }

        /* 二维码并排展示 */
        .qr-codes-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        .qr-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .qr-label {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 10px;
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }

        .qr-icon {
          font-size: 18px;
        }

        .qr-name {
          font-size: 13px;
        }

        .qr-image {
          width: 100%;
          max-width: 200px;
          height: auto;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        /* 建议金额 - 纯展示 */
        .amount-hint {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 16px;
          background: #f8f9fa;
          border-radius: 8px;
          margin-bottom: 14px;
          font-size: 13px;
        }

        .hint-icon {
          font-size: 16px;
        }

        .hint-text {
          color: #666;
          font-weight: 500;
        }

        .hint-examples {
          color: #999;
        }

        /* 用途说明 - 单行紧凑版 */
        .donation-purpose {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: #fff7ed;
          border: 1px solid #fed7aa;
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .purpose-icon {
          font-size: 18px;
          flex-shrink: 0;
        }

        .purpose-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        .purpose-text {
          font-size: 12px;
          font-weight: 600;
          color: #9a3412;
        }

        .purpose-items {
          font-size: 11px;
          color: #c2410c;
          line-height: 1.4;
        }

        .donation-actions {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }

        .action-btn {
          flex: 1;
          padding: 11px 20px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn.secondary {
          background: #f5f5f5;
          color: #666;
        }

        .action-btn.secondary:hover {
          background: #e5e5e5;
        }

        .action-btn.primary {
          background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
          color: white;
        }

        .action-btn.primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
        }

        .donation-disclaimer {
          text-align: center;
          font-size: 11px;
          color: #bbb;
          margin: 0;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* 响应式 */
        @media (max-width: 768px) {
          .donation-modal-content {
            width: 95%;
            max-width: 400px;
          }

          .qr-codes-row {
            gap: 12px;
          }

          .qr-image {
            max-width: 160px;
          }

          .donation-header {
            padding: 16px 20px 14px;
          }

          .donation-body {
            padding: 16px 20px;
          }

          .purpose-content {
            gap: 3px;
          }

          .purpose-text {
            font-size: 11px;
          }

          .purpose-items {
            font-size: 10px;
          }
        }

        @media (max-width: 480px) {
          .qr-codes-row {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .qr-image {
            max-width: 200px;
          }
        }
      `}</style>
    </>
  )
}

