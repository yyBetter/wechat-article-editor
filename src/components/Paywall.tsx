import React from 'react'
import { useUser, FREE_TEMPLATES, PAID_TEMPLATES } from '../utils/user-context'
import { templates } from '../templates'
import './Paywall.css'

interface PaywallProps {
  isOpen: boolean
  onClose: () => void
  selectedTemplateId?: string
}

export function Paywall({ isOpen, onClose, selectedTemplateId }: PaywallProps) {
  const { unlockPaid, user } = useUser()

  if (!isOpen) return null

  const selectedTemplate = selectedTemplateId 
    ? templates.find(t => t.id === selectedTemplateId)
    : null

  const handlePayment = () => {
    // 解锁付费版
    unlockPaid()
    onClose()
    alert('🎉 解锁成功！现在可以使用全部模板了！')
  }

  return (
    <div className="paywall-overlay" onClick={onClose}>
      <div className="paywall-modal" onClick={e => e.stopPropagation()}>
        <button className="paywall-close" onClick={onClose}>×</button>
        
        <div className="paywall-header">
          <h2>🔓 解锁全部模板</h2>
          <p className="paywall-subtitle">一次付费，终身使用</p>
        </div>

        {selectedTemplate && (
          <div className="paywall-selected">
            <p>你选择了：<strong>{selectedTemplate.name}</strong></p>
            <p className="paywall-desc">{selectedTemplate.description}</p>
          </div>
        )}

        <div className="paywall-features">
          <h3>✨ 付费版包含：</h3>
          <ul>
            <li>🎨 <strong>6个精品模板</strong>（价值99元）</li>
            <li>⚡ <strong>3秒极速排版</strong></li>
            <li>🖼️ <strong>智能图片压缩</strong></li>
            <li>💾 <strong>版本历史管理</strong></li>
            <li>🎯 <strong>黄金排版参数</strong></li>
            <li>🔥 <strong>持续更新模板</strong></li>
          </ul>
        </div>

        <div className="paywall-templates">
          <h3>📦 全部模板预览：</h3>
          <div className="paywall-template-grid">
            {templates.map(template => {
              const isFree = FREE_TEMPLATES.includes(template.id)
              return (
                <div 
                  key={template.id} 
                  className={`paywall-template-card ${isFree ? 'free' : 'paid'}`}
                >
                  <span className="paywall-template-name">{template.name}</span>
                  <span className={`paywall-template-badge ${isFree ? 'free-badge' : 'paid-badge'}`}>
                    {isFree ? '免费' : '付费'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="paywall-pricing">
          <div className="paywall-price-tag">
            <span className="paywall-original">原价 ¥99</span>
            <span className="paywall-current">¥6.9</span>
            <span className="paywall-unit">/终身</span>
          </div>
          <p className="paywall-save">🔥 限时特惠，比竞品便宜30%</p>
          <p className="paywall-compare">竞品同款工具售价 ¥9.9</p>
        </div>

        <div className="paywall-payment">
          <h3>💳 支付方式：</h3>
          
          <div className="paywall-qr-section">
            <p className="paywall-qr-title">微信支付</p>
            <div className="paywall-qr-placeholder">
              <div className="paywall-qr-code">
                <div className="paywall-qr-mock">
                  <span>微信扫码支付</span>
                  <span className="paywall-qr-amount">¥6.9</span>
                </div>
              </div>
              <p className="paywall-qr-tip">扫码支付后点击下方按钮</p>
            </div>
          </div>

          <div className="paywall-alternative">
            <p>或添加微信：<strong>yangyu-work</strong></p>
            <p>备注"排版工具"，人工开通</p>
          </div>
        </div>

        <button className="paywall-unlock-btn" onClick={handlePayment}>
          ✅ 我已支付 ¥6.9，立即解锁
        </button>

        <p className="paywall-guarantee">
          🛡️ 7天无理由退款 · 永久更新 · 终身使用
        </p>
      </div>
    </div>
  )
}
