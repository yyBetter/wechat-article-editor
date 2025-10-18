// AI语音转文字组件
import React, { useState, useCallback } from 'react'
import { notification } from '../../utils/notification'
import { AudioRecorder } from './AudioRecorder'
import '../../styles/voice-to-article.css'

interface VoiceToArticleProps {
  onArticleGenerated: (content: string) => void
  onClose?: () => void
}

interface TranscriptionProgress {
  stage: 'uploading' | 'transcribing' | 'processing' | 'complete' | 'error'
  progress: number
  message: string
}

type InputMode = 'upload' | 'record'

export function VoiceToArticle({ onArticleGenerated, onClose }: VoiceToArticleProps) {
  const [inputMode, setInputMode] = useState<InputMode>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<TranscriptionProgress>({
    stage: 'uploading',
    progress: 0,
    message: ''
  })
  const [transcript, setTranscript] = useState<string>('')
  const [processedArticle, setProcessedArticle] = useState<string>('')
  const [audioPreview, setAudioPreview] = useState<string>('')

  // 处理文件选择
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // 验证文件类型
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/webm']
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(mp3|wav|m4a|webm)$/i)) {
      notification.error('❌ 请上传音频文件（mp3、wav、m4a、webm）')
      return
    }

    // 验证文件大小（最大25MB）
    const maxSize = 25 * 1024 * 1024
    if (selectedFile.size > maxSize) {
      notification.error('❌ 文件大小不能超过25MB')
      return
    }

    setFile(selectedFile)
    
    // 创建音频预览
    const url = URL.createObjectURL(selectedFile)
    setAudioPreview(url)
    
    notification.success(`✅ 已选择：${selectedFile.name}`)
  }, [])

  // 处理拖拽上传
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const droppedFile = e.dataTransfer.files[0]
    if (!droppedFile) return

    // 模拟input change事件
    const input = document.createElement('input')
    input.type = 'file'
    const dataTransfer = new DataTransfer()
    dataTransfer.items.add(droppedFile)
    input.files = dataTransfer.files

    handleFileSelect({ target: input } as any)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  // 开始转换
  const handleStartConversion = useCallback(async () => {
    if (!file) {
      notification.error('请先选择音频文件')
      return
    }

    setIsProcessing(true)
    setTranscript('')
    setProcessedArticle('')

    try {
      // 阶段1：上传文件
      setProgress({
        stage: 'uploading',
        progress: 10,
        message: '正在上传音频文件...'
      })

      const formData = new FormData()
      formData.append('audio', file)

      // 阶段2：语音转文字
      setProgress({
        stage: 'transcribing',
        progress: 30,
        message: '🎤 AI正在识别语音内容...'
      })

      const transcribeResponse = await fetch('/api/ai/transcribe', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (!transcribeResponse.ok) {
        throw new Error('语音识别失败')
      }

      const transcribeData = await transcribeResponse.json()
      const rawTranscript = transcribeData.text
      setTranscript(rawTranscript)

      setProgress({
        stage: 'transcribing',
        progress: 60,
        message: '✅ 语音识别完成！正在智能整理...'
      })

      // 阶段3：AI智能整理
      setProgress({
        stage: 'processing',
        progress: 70,
        message: '🤖 AI正在整理文本（去口语化、分段、优化）...'
      })

      const processResponse = await fetch('/api/ai/process-transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ transcript: rawTranscript })
      })

      if (!processResponse.ok) {
        throw new Error('文本处理失败')
      }

      const processData = await processResponse.json()
      const article = processData.article
      setProcessedArticle(article)

      // 完成
      setProgress({
        stage: 'complete',
        progress: 100,
        message: '🎉 转换完成！'
      })

      notification.success('✅ AI语音转文字完成！')

    } catch (error: any) {
      console.error('转换失败:', error)
      setProgress({
        stage: 'error',
        progress: 0,
        message: error.message || '转换失败，请重试'
      })
      notification.error(`❌ ${error.message || '转换失败'}`)
    } finally {
      setIsProcessing(false)
    }
  }, [file])

  // 应用到编辑器
  const handleApply = useCallback(() => {
    if (processedArticle) {
      onArticleGenerated(processedArticle)
      notification.success('✅ 已插入编辑器')
      if (onClose) onClose()
    }
  }, [processedArticle, onArticleGenerated, onClose])

  // 重新开始
  const handleReset = useCallback(() => {
    setFile(null)
    setTranscript('')
    setProcessedArticle('')
    setProgress({ stage: 'uploading', progress: 0, message: '' })
    if (audioPreview) {
      URL.revokeObjectURL(audioPreview)
      setAudioPreview('')
    }
  }, [audioPreview])

  // 处理录音完成
  const handleRecordingComplete = useCallback((audioBlob: Blob, duration: number) => {
    // 将Blob转换为File对象
    const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, {
      type: audioBlob.type
    })
    
    setFile(audioFile)
    
    // 创建音频预览
    const url = URL.createObjectURL(audioBlob)
    setAudioPreview(url)
    
    notification.success(`✅ 录音完成（${Math.floor(duration / 60)}分${duration % 60}秒），可以开始转换`)
  }, [])

  return (
    <div className="voice-to-article-modal">
      <div className="modal-overlay" onClick={onClose}></div>
      
      <div className="modal-content">
        <div className="modal-header">
          <div className="header-title">
            <span className="title-icon">🎤</span>
            <h2>AI语音转文字</h2>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* 标签页切换 */}
        <div className="mode-tabs">
          <button 
            className={`mode-tab ${inputMode === 'upload' ? 'active' : ''}`}
            onClick={() => setInputMode('upload')}
          >
            <span className="tab-icon">📁</span>
            <span className="tab-label">上传文件</span>
          </button>
          <button 
            className={`mode-tab ${inputMode === 'record' ? 'active' : ''}`}
            onClick={() => setInputMode('record')}
          >
            <span className="tab-icon">🎤</span>
            <span className="tab-label">直接录音</span>
          </button>
        </div>

        <div className="modal-body">
          {/* 上传模式 */}
          {inputMode === 'upload' && (
            <>
              {/* 上传区域 */}
              {!file && (
            <div 
              className="upload-area"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="upload-icon">🎤</div>
              <h3>上传音频文件</h3>
              <p className="upload-hint">支持 mp3、wav、m4a、webm 格式，最大25MB</p>
              
              <label className="upload-button">
                <input 
                  type="file" 
                  accept="audio/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <span>📁 选择文件</span>
              </label>

              <p className="upload-hint-secondary">或拖拽文件到这里</p>
            </div>
          )}

          {/* 文件已选择 */}
          {file && !isProcessing && progress.stage !== 'complete' && (
            <div className="file-selected">
              <div className="file-info">
                <span className="file-icon">🎵</span>
                <div className="file-details">
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              </div>

              {audioPreview && (
                <div className="audio-preview">
                  <audio controls src={audioPreview} style={{ width: '100%' }} />
                </div>
              )}

              <div className="action-buttons">
                <button className="btn-secondary" onClick={handleReset}>
                  🔄 重新选择
                </button>
                <button className="btn-primary" onClick={handleStartConversion}>
                  ✨ 开始转换
                </button>
              </div>
            </div>
          )}

          {/* 处理进度 */}
          {isProcessing && (
            <div className="processing-status">
              <div className="progress-indicator">
                <div className="progress-circle">
                  <svg viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" className="progress-bg" />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="45" 
                      className="progress-bar"
                      style={{
                        strokeDasharray: `${progress.progress * 2.827}, 282.7`
                      }}
                    />
                  </svg>
                  <div className="progress-text">{progress.progress}%</div>
                </div>
              </div>

              <div className="progress-message">{progress.message}</div>

              <div className="progress-steps">
                <div className={`step ${progress.progress >= 30 ? 'completed' : 'active'}`}>
                  <span className="step-icon">📤</span>
                  <span className="step-label">上传文件</span>
                </div>
                <div className={`step ${progress.progress >= 60 ? 'completed' : progress.progress >= 30 ? 'active' : ''}`}>
                  <span className="step-icon">🎤</span>
                  <span className="step-label">语音识别</span>
                </div>
                <div className={`step ${progress.progress >= 100 ? 'completed' : progress.progress >= 60 ? 'active' : ''}`}>
                  <span className="step-icon">🤖</span>
                  <span className="step-label">智能整理</span>
                </div>
              </div>
            </div>
          )}

          {/* 转换完成 */}
          {progress.stage === 'complete' && (
            <div className="conversion-result">
              <div className="result-header">
                <span className="result-icon">🎉</span>
                <h3>转换完成！</h3>
              </div>

              {/* 原始语音文本 */}
              <div className="result-section">
                <div className="section-title">
                  <span className="title-icon">📝</span>
                  <span>原始识别文本</span>
                </div>
                <div className="result-content raw-transcript">
                  {transcript}
                </div>
              </div>

              {/* AI整理后的文章 */}
              <div className="result-section">
                <div className="section-title">
                  <span className="title-icon">✨</span>
                  <span>AI整理后的文章</span>
                  <span className="badge">推荐使用</span>
                </div>
                <div className="result-content processed-article">
                  {processedArticle}
                </div>
              </div>

              <div className="result-actions">
                <button className="btn-secondary" onClick={handleReset}>
                  🔄 转换新文件
                </button>
                <button className="btn-primary" onClick={handleApply}>
                  ✅ 插入编辑器
                </button>
              </div>
            </div>
          )}

              {/* 错误状态 */}
              {progress.stage === 'error' && (
                <div className="error-state">
                  <div className="error-icon">❌</div>
                  <div className="error-message">{progress.message}</div>
                  <button className="btn-primary" onClick={handleReset}>
                    🔄 重新开始
                  </button>
                </div>
              )}
            </>
          )}

          {/* 录音模式 */}
          {inputMode === 'record' && (
            <>
              {!file && !isProcessing && progress.stage !== 'complete' && (
                <AudioRecorder onRecordingComplete={handleRecordingComplete} />
              )}

              {/* 录音完成，显示文件信息 */}
              {file && !isProcessing && progress.stage !== 'complete' && (
                <div className="file-selected">
                  <div className="file-info">
                    <span className="file-icon">🎵</span>
                    <div className="file-details">
                      <div className="file-name">{file.name}</div>
                      <div className="file-size">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  </div>

                  {audioPreview && (
                    <div className="audio-preview">
                      <audio controls src={audioPreview} style={{ width: '100%' }} />
                    </div>
                  )}

                  <div className="action-buttons">
                    <button className="btn-secondary" onClick={handleReset}>
                      🔄 重新录音
                    </button>
                    <button className="btn-primary" onClick={handleStartConversion}>
                      ✨ 开始转换
                    </button>
                  </div>
                </div>
              )}

              {/* 处理进度 */}
              {isProcessing && (
                <div className="processing-status">
                  <div className="progress-indicator">
                    <div className="progress-circle">
                      <svg viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" className="progress-bg" />
                        <circle 
                          cx="50" 
                          cy="50" 
                          r="45" 
                          className="progress-bar"
                          style={{
                            strokeDasharray: `${progress.progress * 2.827}, 282.7`
                          }}
                        />
                      </svg>
                      <div className="progress-text">{progress.progress}%</div>
                    </div>
                  </div>

                  <div className="progress-message">{progress.message}</div>

                  <div className="progress-steps">
                    <div className={`step ${progress.progress >= 30 ? 'completed' : 'active'}`}>
                      <span className="step-icon">📤</span>
                      <span className="step-label">上传文件</span>
                    </div>
                    <div className={`step ${progress.progress >= 60 ? 'completed' : progress.progress >= 30 ? 'active' : ''}`}>
                      <span className="step-icon">🎤</span>
                      <span className="step-label">语音识别</span>
                    </div>
                    <div className={`step ${progress.progress >= 100 ? 'completed' : progress.progress >= 60 ? 'active' : ''}`}>
                      <span className="step-icon">🤖</span>
                      <span className="step-label">智能整理</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 转换完成 */}
              {progress.stage === 'complete' && (
                <div className="conversion-result">
                  <div className="result-header">
                    <span className="result-icon">🎉</span>
                    <h3>转换完成！</h3>
                  </div>

                  {/* 原始语音文本 */}
                  <div className="result-section">
                    <div className="section-title">
                      <span className="title-icon">📝</span>
                      <span>原始识别文本</span>
                    </div>
                    <div className="result-content raw-transcript">
                      {transcript}
                    </div>
                  </div>

                  {/* AI整理后的文章 */}
                  <div className="result-section">
                    <div className="section-title">
                      <span className="title-icon">✨</span>
                      <span>AI整理后的文章</span>
                      <span className="badge">推荐使用</span>
                    </div>
                    <div className="result-content processed-article">
                      {processedArticle}
                    </div>
                  </div>

                  <div className="result-actions">
                    <button className="btn-secondary" onClick={handleReset}>
                      🔄 转换新文件
                    </button>
                    <button className="btn-primary" onClick={handleApply}>
                      ✅ 插入编辑器
                    </button>
                  </div>
                </div>
              )}

              {/* 错误状态 */}
              {progress.stage === 'error' && (
                <div className="error-state">
                  <div className="error-icon">❌</div>
                  <div className="error-message">{progress.message}</div>
                  <button className="btn-primary" onClick={handleReset}>
                    🔄 重新开始
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <div className="footer-tips">
            <span className="tip-icon">💡</span>
            <span className="tip-text">
              提示：录音时请保持环境安静，说话清晰，以获得最佳识别效果
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

