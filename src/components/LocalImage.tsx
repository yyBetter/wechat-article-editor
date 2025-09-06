// 本地图片显示组件 - 自动处理本地和服务器图片
import React, { useState, useEffect, memo } from 'react'
import { getLocalImageData } from '../utils/local-image-api'

interface LocalImageProps {
  src: string
  alt?: string
  className?: string
  style?: React.CSSProperties
  loading?: 'lazy' | 'eager'
  onLoad?: () => void
  onError?: () => void
  fallbackSrc?: string
  placeholder?: React.ReactNode
  onClick?: () => void
}

// 图片加载状态
type LoadingState = 'loading' | 'loaded' | 'error'

export const LocalImage = memo(function LocalImage({
  src,
  alt = '',
  className,
  style,
  loading = 'lazy',
  onLoad,
  onError,
  fallbackSrc,
  placeholder,
  onClick
}: LocalImageProps) {
  const [imageData, setImageData] = useState<string | null>(null)
  const [loadingState, setLoadingState] = useState<LoadingState>('loading')
  
  useEffect(() => {
    let isMounted = true
    
    const loadImage = async () => {
      if (!src) {
        setLoadingState('error')
        return
      }
      
      setLoadingState('loading')
      
      try {
        // 检查是否是本地图片
        if (src.startsWith('/local-image/')) {
          const localData = await getLocalImageData(src)
          
          if (isMounted) {
            if (localData) {
              setImageData(localData)
              setLoadingState('loaded')
              onLoad?.()
            } else {
              setLoadingState('error')
              onError?.()
            }
          }
        } else {
          // 服务器图片或外部图片，直接设置
          if (isMounted) {
            setImageData(src)
            // 让浏览器处理加载状态
          }
        }
      } catch (error) {
        console.error('图片加载失败:', error)
        if (isMounted) {
          setLoadingState('error')
          onError?.()
        }
      }
    }
    
    loadImage()
    
    return () => {
      isMounted = false
    }
  }, [src, onLoad, onError])
  
  const handleImageLoad = () => {
    setLoadingState('loaded')
    onLoad?.()
  }
  
  const handleImageError = () => {
    setLoadingState('error')
    onError?.()
  }
  
  // 渲染占位符
  if (loadingState === 'loading' && placeholder) {
    return <>{placeholder}</>
  }
  
  // 渲染加载中状态
  if (loadingState === 'loading') {
    return (
      <div 
        className={`local-image-placeholder loading ${className || ''}`}
        style={style}
      >
        <div className="loading-spinner">
          <div className="spinner" />
        </div>
      </div>
    )
  }
  
  // 渲染错误状态
  if (loadingState === 'error') {
    if (fallbackSrc) {
      return (
        <img
          src={fallbackSrc}
          alt={alt}
          className={className}
          style={style}
          loading={loading}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )
    }
    
    return (
      <div 
        className={`local-image-placeholder error ${className || ''}`}
        style={style}
      >
        <div className="error-content">
          <span className="error-icon">🖼️</span>
          <span className="error-text">图片加载失败</span>
        </div>
      </div>
    )
  }
  
  // 渲染正常图片
  return (
    <img
      src={imageData || src}
      alt={alt}
      className={className}
      style={style}
      loading={loading}
      onLoad={handleImageLoad}
      onError={handleImageError}
      onClick={onClick}
    />
  )
})

// 图片预览组件（支持放大查看）
interface ImagePreviewProps extends LocalImageProps {
  enablePreview?: boolean
  previewClassName?: string
}

export const LocalImagePreview = memo(function LocalImagePreview({
  enablePreview = true,
  previewClassName,
  ...imageProps
}: ImagePreviewProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  
  const handleImageClick = () => {
    if (enablePreview) {
      setIsPreviewOpen(true)
    }
  }
  
  const closePreview = () => {
    setIsPreviewOpen(false)
  }
  
  return (
    <>
      <LocalImage
        {...imageProps}
        className={`${imageProps.className || ''} ${enablePreview ? 'clickable' : ''}`}
        onClick={enablePreview ? handleImageClick : undefined}
        style={{
          ...imageProps.style,
          cursor: enablePreview ? 'pointer' : undefined
        }}
      />
      
      {isPreviewOpen && (
        <div className="image-preview-modal" onClick={closePreview}>
          <div className="preview-content" onClick={(e) => e.stopPropagation()}>
            <button className="preview-close" onClick={closePreview}>
              ✕
            </button>
            <LocalImage
              src={imageProps.src}
              alt={imageProps.alt}
              className={previewClassName}
              style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }}
            />
          </div>
        </div>
      )}
    </>
  )
})

// 图片网格组件（用于图片列表显示）
interface ImageGridProps {
  images: Array<{
    id: string
    src: string
    alt?: string
    title?: string
  }>
  columns?: number
  gap?: number
  onImageClick?: (image: any, index: number) => void
  className?: string
}

export const LocalImageGrid = memo(function LocalImageGrid({
  images,
  columns = 3,
  gap = 8,
  onImageClick,
  className
}: ImageGridProps) {
  if (!images || images.length === 0) {
    return (
      <div className="image-grid-empty">
        <span className="empty-icon">📷</span>
        <span className="empty-text">暂无图片</span>
      </div>
    )
  }
  
  return (
    <div 
      className={`local-image-grid ${className || ''}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`
      }}
    >
      {images.map((image, index) => (
        <div 
          key={image.id}
          className="image-grid-item"
          onClick={() => onImageClick?.(image, index)}
        >
          <LocalImage
            src={image.src}
            alt={image.alt || `图片 ${index + 1}`}
            className="grid-image"
            loading="lazy"
          />
          {image.title && (
            <div className="image-title">{image.title}</div>
          )}
        </div>
      ))}
    </div>
  )
})

// CSS样式
const styles = `
.local-image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border: 1px dashed #ccc;
  border-radius: 4px;
  min-height: 100px;
}

.local-image-placeholder.loading {
  background: #fafafa;
}

.local-image-placeholder.error {
  background: #fff5f5;
  border-color: #fed7d7;
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e2e8f0;
  border-top: 2px solid #3182ce;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #e53e3e;
}

.error-icon {
  font-size: 24px;
  opacity: 0.7;
}

.error-text {
  font-size: 14px;
}

.clickable {
  transition: opacity 0.2s;
}

.clickable:hover {
  opacity: 0.8;
}

.image-preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  cursor: pointer;
}

.preview-content {
  position: relative;
  max-width: 95vw;
  max-height: 95vh;
  cursor: default;
}

.preview-close {
  position: absolute;
  top: -40px;
  right: 0;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.preview-close:hover {
  background: rgba(255, 255, 255, 1);
}

.local-image-grid {
  width: 100%;
}

.image-grid-item {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.image-grid-item:hover {
  transform: scale(1.02);
}

.grid-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-title {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  color: white;
  padding: 8px;
  font-size: 12px;
  text-align: center;
}

.image-grid-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
}
`

// 注入样式
if (typeof document !== 'undefined' && !document.getElementById('local-image-styles')) {
  const styleSheet = document.createElement('style')
  styleSheet.id = 'local-image-styles'
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}