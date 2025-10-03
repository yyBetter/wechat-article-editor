/**
 * 错别字检查组件
 * 显示错别字统计和详细列表
 */

import React, { useState } from 'react'
import { SpellError } from '../utils/spell-checker'
import '../styles/spell-checker.css'

interface SpellCheckerProps {
  errors: SpellError[]
  isChecking: boolean
  enabled: boolean
  onToggle: () => void
  onErrorClick?: (error: SpellError) => void
}

export function SpellChecker({
  errors,
  isChecking,
  enabled,
  onToggle,
  onErrorClick
}: SpellCheckerProps) {
  const [showList, setShowList] = useState(false)

  if (!enabled) {
    return (
      <div className="spell-check-toggle" onClick={onToggle}>
        <div className="toggle-icon" />
        <span>开启错别字检查</span>
      </div>
    )
  }

  const handleErrorClick = (error: SpellError) => {
    if (onErrorClick) {
      onErrorClick(error)
    }
    setShowList(false)
  }

  return (
    <>
      {/* 统计面板 */}
      <div className={`spell-check-panel ${errors.length > 0 ? 'has-errors' : ''}`}>
        <div className={`icon ${errors.length > 0 ? 'error' : 'success'}`}>
          {isChecking ? (
            <span>⏳</span>
          ) : errors.length > 0 ? (
            <span>⚠️</span>
          ) : (
            <span>✓</span>
          )}
        </div>
        
        <div className="text">
          {isChecking ? (
            '检查中...'
          ) : errors.length > 0 ? (
            <>
              发现 <span className="count">{errors.length}</span> 处错别字
            </>
          ) : (
            '未发现错别字'
          )}
        </div>

        {errors.length > 0 && (
          <button
            className="button"
            onClick={() => setShowList(!showList)}
          >
            {showList ? '收起' : '查看'}
          </button>
        )}

        <button
          className="button"
          onClick={onToggle}
          title="关闭错别字检查"
        >
          ✕
        </button>
      </div>

      {/* 错误列表 */}
      {showList && errors.length > 0 && (
        <div className="spell-errors-list">
          <div className="spell-errors-list-header">
            <span>错别字列表</span>
            <button
              className="close-btn"
              onClick={() => setShowList(false)}
            >
              ✕
            </button>
          </div>
          
          {errors.map((error, index) => (
            <div
              key={`${error.position}-${index}`}
              className="spell-error-item"
              onClick={() => handleErrorClick(error)}
              title="点击定位"
            >
              <div className="spell-error-item-word">
                <span className="wrong">{error.word}</span>
                <span className="arrow">→</span>
                <span className="correct">{error.correct}</span>
              </div>
              {error.context && (
                <div className="spell-error-item-context">
                  {error.context}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

/**
 * 轻量级的错别字提示组件（仅显示是否有错误）
 */
interface SpellCheckIndicatorProps {
  hasErrors: boolean
  isChecking: boolean
  enabled: boolean
  onToggle: () => void
}

export function SpellCheckIndicator({
  hasErrors,
  isChecking,
  enabled,
  onToggle
}: SpellCheckIndicatorProps) {
  if (!enabled) {
    return (
      <div className="spell-check-toggle" onClick={onToggle}>
        <div className="toggle-icon" />
        <span>错别字检查</span>
      </div>
    )
  }

  return (
    <div className={`spell-check-toggle enabled`} onClick={onToggle}>
      <div className="toggle-icon" />
      <span>
        {isChecking ? '检查中...' : hasErrors ? '发现错别字' : '无错别字'}
      </span>
    </div>
  )
}

