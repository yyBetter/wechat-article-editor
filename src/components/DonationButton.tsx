// 打赏按钮组件 - 右下角浮动按钮
import React, { useState } from 'react'
import { DonationModal } from './DonationModal'

export function DonationButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button
        className="donation-button"
        onClick={() => setIsModalOpen(true)}
        title="请作者喝杯咖啡"
        type="button"
      >
        <span className="coffee-icon">☕</span>
        <span className="button-text">请我喝咖啡</span>
      </button>

      <DonationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      <style>{`
        .donation-button {
          position: fixed;
          bottom: 20px;
          right: 20px;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
          color: white;
          border: none;
          border-radius: 24px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
          z-index: 999;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .donation-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(255, 107, 107, 0.5);
        }

        .donation-button:active {
          transform: translateY(0px);
          box-shadow: 0 2px 8px rgba(255, 107, 107, 0.4);
        }

        .coffee-icon {
          font-size: 18px;
        }

        .button-text {
          font-size: 13px;
        }

        /* 响应式 */
        @media (max-width: 768px) {
          .donation-button {
            bottom: 16px;
            right: 16px;
            padding: 8px 12px;
          }

          .button-text {
            display: none;
          }

          .coffee-icon {
            font-size: 20px;
          }
        }
      `}</style>
    </>
  )
}

