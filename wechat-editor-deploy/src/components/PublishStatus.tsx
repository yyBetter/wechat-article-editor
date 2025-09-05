import React from 'react'

interface PublishStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
}

interface PublishStatusProps {
  steps: PublishStep[]
}

export function PublishStatus({ steps }: PublishStatusProps) {
  const getStepIcon = (status: PublishStep['status']) => {
    switch (status) {
      case 'pending':
        return '⏳'
      case 'processing':
        return '🔄'
      case 'completed':
        return '✅'
      case 'error':
        return '❌'
      default:
        return '⏳'
    }
  }

  const getStepClass = (status: PublishStep['status']) => {
    return `publish-step ${status}`
  }

  return (
    <div className="publish-status">
      <div className="status-header">
        <h5>发布进度</h5>
        <div className="status-summary">
          {steps.filter(s => s.status === 'completed').length} / {steps.length} 完成
        </div>
      </div>
      
      <div className="status-steps">
        {steps.map((step, index) => (
          <div key={step.id} className={getStepClass(step.status)}>
            <div className="step-indicator">
              <span className="step-icon">{getStepIcon(step.status)}</span>
              {index < steps.length - 1 && (
                <div className={`step-line ${step.status === 'completed' ? 'completed' : ''}`} />
              )}
            </div>
            
            <div className="step-content">
              <div className="step-header">
                <h6 className="step-title">{step.title}</h6>
                {step.status === 'processing' && (
                  <div className="step-spinner">
                    <div className="spinner" />
                  </div>
                )}
              </div>
              <p className="step-description">{step.description}</p>
              
              {step.error && (
                <div className="step-error">
                  <span className="error-icon">⚠️</span>
                  <span className="error-message">{step.error}</span>
                  <button className="retry-btn">重试</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {steps.every(step => step.status === 'completed') && (
        <div className="publish-success">
          <div className="success-icon">🎉</div>
          <h4>发布成功！</h4>
          <p>您的文章已成功发布到微信公众号</p>
          <div className="success-actions">
            <button className="action-btn primary">查看文章</button>
            <button className="action-btn secondary">分享链接</button>
          </div>
        </div>
      )}
    </div>
  )
}