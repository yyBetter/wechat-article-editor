// 浏览器录音组件
import React, { useState, useRef, useCallback, useEffect } from 'react'
import { notification } from '../../utils/notification'
import '../../styles/audio-recorder.css'

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void
}

type RecordingState = 'idle' | 'recording' | 'paused' | 'completed'

export function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [duration, setDuration] = useState(0)
  const [audioURL, setAudioURL] = useState<string>('')
  const [isSupported, setIsSupported] = useState(true)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const pausedTimeRef = useRef<number>(0)

  // 检查浏览器支持
  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsSupported(false)
      notification.error('您的浏览器不支持录音功能')
    }
  }, [])

  // 开始录音
  const startRecording = useCallback(async () => {
    try {
      // 请求麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      })

      // 创建MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : 'audio/mp4'
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      // 监听数据
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      // 录音结束
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        const url = URL.createObjectURL(audioBlob)
        setAudioURL(url)
        setRecordingState('completed')
        
        // 通知父组件
        onRecordingComplete(audioBlob, duration)
        
        // 停止所有音轨
        stream.getTracks().forEach(track => track.stop())
        
        notification.success(`✅ 录音完成！时长：${formatDuration(duration)}`)
      }

      // 开始录音
      mediaRecorder.start(100) // 每100ms收集一次数据
      setRecordingState('recording')
      startTimeRef.current = Date.now()
      
      // 启动计时器
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current - pausedTimeRef.current) / 1000)
        setDuration(elapsed)
      }, 100)

      notification.success('🎤 录音开始')

    } catch (error: any) {
      console.error('录音失败:', error)
      
      if (error.name === 'NotAllowedError') {
        notification.error('❌ 请允许访问麦克风权限')
      } else if (error.name === 'NotFoundError') {
        notification.error('❌ 未检测到麦克风设备')
      } else {
        notification.error('❌ 录音失败：' + error.message)
      }
    }
  }, [duration, onRecordingComplete])

  // 暂停录音
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause()
      setRecordingState('paused')
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      
      pausedTimeRef.current += Date.now() - startTimeRef.current
      notification.info('⏸️ 录音已暂停')
    }
  }, [recordingState])

  // 继续录音
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume()
      setRecordingState('recording')
      
      startTimeRef.current = Date.now()
      
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current - pausedTimeRef.current) / 1000)
        setDuration(elapsed)
      }, 100)
      
      notification.info('▶️ 继续录音')
    }
  }, [recordingState])

  // 停止录音
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && (recordingState === 'recording' || recordingState === 'paused')) {
      mediaRecorderRef.current.stop()
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [recordingState])

  // 重新录音
  const resetRecording = useCallback(() => {
    setRecordingState('idle')
    setDuration(0)
    setAudioURL('')
    audioChunksRef.current = []
    pausedTimeRef.current = 0
    
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }, [])

  // 格式化时长
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // 清理
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (audioURL) {
        URL.revokeObjectURL(audioURL)
      }
    }
  }, [audioURL])

  if (!isSupported) {
    return (
      <div className="audio-recorder-error">
        <div className="error-icon">❌</div>
        <div className="error-message">您的浏览器不支持录音功能</div>
        <div className="error-hint">请使用Chrome、Firefox、Edge等现代浏览器</div>
      </div>
    )
  }

  return (
    <div className="audio-recorder">
      {/* 未开始录音 */}
      {recordingState === 'idle' && (
        <div className="recorder-idle">
          <div className="recorder-icon">🎤</div>
          <h3>开始录音</h3>
          <p className="recorder-hint">点击下方按钮开始录制您的想法</p>
          
          <button className="btn-start-recording" onClick={startRecording}>
            <span className="btn-icon">⏺️</span>
            <span>开始录音</span>
          </button>

          <div className="recorder-tips">
            <div className="tip-item">
              <span className="tip-icon">💡</span>
              <span>建议在安静的环境中录音</span>
            </div>
            <div className="tip-item">
              <span className="tip-icon">🎧</span>
              <span>使用耳机麦克风效果更佳</span>
            </div>
          </div>
        </div>
      )}

      {/* 正在录音 */}
      {(recordingState === 'recording' || recordingState === 'paused') && (
        <div className="recorder-active">
          <div className="recording-indicator">
            {recordingState === 'recording' && (
              <div className="recording-pulse"></div>
            )}
            <div className={`recording-icon ${recordingState}`}>
              {recordingState === 'recording' ? '🔴' : '⏸️'}
            </div>
          </div>

          <div className="recording-timer">
            <div className="timer-display">{formatDuration(duration)}</div>
            <div className="timer-label">
              {recordingState === 'recording' ? '正在录音...' : '已暂停'}
            </div>
          </div>

          <div className="recording-waveform">
            <div className="wave-bar" style={{ animationDelay: '0s' }}></div>
            <div className="wave-bar" style={{ animationDelay: '0.1s' }}></div>
            <div className="wave-bar" style={{ animationDelay: '0.2s' }}></div>
            <div className="wave-bar" style={{ animationDelay: '0.3s' }}></div>
            <div className="wave-bar" style={{ animationDelay: '0.4s' }}></div>
            <div className="wave-bar" style={{ animationDelay: '0.2s' }}></div>
            <div className="wave-bar" style={{ animationDelay: '0.1s' }}></div>
          </div>

          <div className="recording-controls">
            {recordingState === 'recording' ? (
              <button className="btn-pause" onClick={pauseRecording}>
                <span className="btn-icon">⏸️</span>
                <span>暂停</span>
              </button>
            ) : (
              <button className="btn-resume" onClick={resumeRecording}>
                <span className="btn-icon">▶️</span>
                <span>继续</span>
              </button>
            )}
            
            <button className="btn-stop" onClick={stopRecording}>
              <span className="btn-icon">⏹️</span>
              <span>停止</span>
            </button>
          </div>

          <div className="recording-hint">
            说话时请保持正常语速，清晰表达
          </div>
        </div>
      )}

      {/* 录音完成 */}
      {recordingState === 'completed' && audioURL && (
        <div className="recorder-completed">
          <div className="completed-icon">✅</div>
          <h3>录音完成</h3>
          
          <div className="completed-info">
            <div className="info-item">
              <span className="info-label">时长：</span>
              <span className="info-value">{formatDuration(duration)}</span>
            </div>
          </div>

          <div className="audio-preview">
            <audio controls src={audioURL} style={{ width: '100%' }} />
          </div>

          <div className="completed-actions">
            <button className="btn-secondary" onClick={resetRecording}>
              🔄 重新录音
            </button>
            <button className="btn-primary" onClick={() => {
              // 父组件已通过onRecordingComplete回调接收到录音
              notification.success('✅ 录音已准备好，可以开始转换')
            }}>
              ✨ 使用此录音
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

