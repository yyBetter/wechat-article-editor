// 数据备份管理组件 - 导入导出功能界面
import React, { useState, useRef, useCallback } from 'react'
import {
  exportData,
  importData,
  downloadExport,
  readImportFile,
  getExportPreview,
  ExportOptions,
  ImportOptions,
  ImportResult,
  ExportData
} from '../utils/data-export-import'
import { formatStorageSize } from '../utils/local-storage-utils'

interface DataBackupProps {
  onClose?: () => void
}

interface ExportState {
  loading: boolean
  progress: string
  data: ExportData | null
  preview: {
    estimatedSize: string
    itemCounts: { documents: number; versions: number; images: number }
    timeRange: { earliest: string; latest: string } | null
  } | null
}

interface ImportState {
  loading: boolean
  progress: { current: number; total: number; step: string } | null
  result: ImportResult | null
  selectedFile: File | null
  fileData: ExportData | null
}

export function DataBackup({ onClose }: DataBackupProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export')
  const [exportState, setExportState] = useState<ExportState>({
    loading: false,
    progress: '',
    data: null,
    preview: null
  })
  
  const [importState, setImportState] = useState<ImportState>({
    loading: false,
    progress: null,
    result: null,
    selectedFile: null,
    fileData: null
  })
  
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeDocuments: true,
    includeVersions: true,
    includeImages: true,
    includeImageData: true,
    includeSettings: true
  })
  
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    overwriteExisting: false,
    mergeMode: 'skip',
    validateData: true
  })
  
  // 获取导出预览
  const handlePreviewExport = useCallback(async () => {
    setExportState(prev => ({ ...prev, loading: true, progress: '生成预览...' }))
    
    try {
      const preview = await getExportPreview(exportOptions)
      setExportState(prev => ({ ...prev, preview, loading: false, progress: '' }))
    } catch (error) {
      console.error('预览生成失败:', error)
      setExportState(prev => ({ 
        ...prev, 
        loading: false, 
        progress: `预览失败: ${error instanceof Error ? error.message : '未知错误'}` 
      }))
    }
  }, [exportOptions])
  
  // 执行数据导出
  const handleExport = useCallback(async () => {
    setExportState(prev => ({ ...prev, loading: true, progress: '导出数据中...' }))
    
    try {
      const data = await exportData(exportOptions)
      setExportState(prev => ({ ...prev, data, loading: false, progress: '导出完成' }))
    } catch (error) {
      console.error('数据导出失败:', error)
      setExportState(prev => ({ 
        ...prev, 
        loading: false, 
        progress: `导出失败: ${error instanceof Error ? error.message : '未知错误'}` 
      }))
    }
  }, [exportOptions])
  
  // 下载导出文件
  const handleDownload = useCallback(async () => {
    if (!exportState.data) return
    
    try {
      await downloadExport(exportState.data)
      setExportState(prev => ({ ...prev, progress: '文件已下载' }))
    } catch (error) {
      console.error('文件下载失败:', error)
      setExportState(prev => ({ 
        ...prev, 
        progress: `下载失败: ${error instanceof Error ? error.message : '未知错误'}` 
      }))
    }
  }, [exportState.data])
  
  // 选择导入文件
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    setImportState(prev => ({ ...prev, loading: true, selectedFile: file }))
    
    try {
      const fileData = await readImportFile(file)
      setImportState(prev => ({ 
        ...prev, 
        fileData, 
        loading: false,
        result: null 
      }))
    } catch (error) {
      console.error('文件读取失败:', error)
      setImportState(prev => ({ 
        ...prev, 
        loading: false,
        result: {
          success: false,
          imported: { documents: 0, versions: 0, images: 0 },
          skipped: { documents: 0, versions: 0, images: 0 },
          errors: [error instanceof Error ? error.message : '文件读取失败'],
          warnings: []
        }
      }))
    }
  }, [])
  
  // 执行数据导入
  const handleImport = useCallback(async () => {
    if (!importState.fileData) return
    
    setImportState(prev => ({ ...prev, loading: true, result: null }))
    
    try {
      const result = await importData(importState.fileData, {
        ...importOptions,
        onProgress: (progress) => {
          setImportState(prev => ({ ...prev, progress }))
        }
      })
      
      setImportState(prev => ({ ...prev, result, loading: false, progress: null }))
    } catch (error) {
      console.error('数据导入失败:', error)
      setImportState(prev => ({ 
        ...prev, 
        loading: false,
        progress: null,
        result: {
          success: false,
          imported: { documents: 0, versions: 0, images: 0 },
          skipped: { documents: 0, versions: 0, images: 0 },
          errors: [error instanceof Error ? error.message : '导入失败'],
          warnings: []
        }
      }))
    }
  }, [importState.fileData, importOptions])
  
  return (
    <div className="data-backup-container">
      <div className="backup-header">
        <h2>🗄️ 数据备份管理</h2>
        <p>导出、导入和备份您的所有本地数据</p>
        {onClose && (
          <button className="close-btn" onClick={onClose}>✕</button>
        )}
      </div>
      
      {/* 标签选择 */}
      <div className="backup-tabs">
        <button
          className={`tab-btn ${activeTab === 'export' ? 'active' : ''}`}
          onClick={() => setActiveTab('export')}
        >
          📤 导出数据
        </button>
        <button
          className={`tab-btn ${activeTab === 'import' ? 'active' : ''}`}
          onClick={() => setActiveTab('import')}
        >
          📥 导入数据
        </button>
      </div>
      
      {/* 导出面板 */}
      {activeTab === 'export' && (
        <div className="export-panel">
          <div className="options-section">
            <h3>导出选项</h3>
            <div className="option-group">
              <label className="option-item">
                <input
                  type="checkbox"
                  checked={exportOptions.includeDocuments}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    includeDocuments: e.target.checked
                  }))}
                />
                <span>包含文档内容</span>
                <small>所有文档的标题、内容和设置</small>
              </label>
              
              <label className="option-item">
                <input
                  type="checkbox"
                  checked={exportOptions.includeVersions}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    includeVersions: e.target.checked
                  }))}
                />
                <span>包含版本历史</span>
                <small>文档的所有历史版本记录</small>
              </label>
              
              <label className="option-item">
                <input
                  type="checkbox"
                  checked={exportOptions.includeImages}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    includeImages: e.target.checked
                  }))}
                />
                <span>包含图片</span>
                <small>所有上传的图片文件</small>
              </label>
              
              {exportOptions.includeImages && (
                <label className="option-item sub-option">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeImageData}
                    onChange={(e) => setExportOptions(prev => ({
                      ...prev,
                      includeImageData: e.target.checked
                    }))}
                  />
                  <span>包含图片数据</span>
                  <small>完整的图片文件数据（增加文件大小）</small>
                </label>
              )}
              
              <label className="option-item">
                <input
                  type="checkbox"
                  checked={exportOptions.includeSettings}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    includeSettings: e.target.checked
                  }))}
                />
                <span>包含应用设置</span>
                <small>用户偏好和应用配置</small>
              </label>
            </div>
          </div>
          
          {/* 导出预览 */}
          {exportState.preview && (
            <div className="preview-section">
              <h3>导出预览</h3>
              <div className="preview-info">
                <div className="info-item">
                  <span className="label">文档数量:</span>
                  <span className="value">{exportState.preview.itemCounts.documents}</span>
                </div>
                <div className="info-item">
                  <span className="label">版本记录:</span>
                  <span className="value">{exportState.preview.itemCounts.versions}</span>
                </div>
                <div className="info-item">
                  <span className="label">图片数量:</span>
                  <span className="value">{exportState.preview.itemCounts.images}</span>
                </div>
                <div className="info-item">
                  <span className="label">预计大小:</span>
                  <span className="value">{exportState.preview.estimatedSize}</span>
                </div>
                {exportState.preview.timeRange && (
                  <div className="info-item">
                    <span className="label">时间范围:</span>
                    <span className="value">
                      {new Date(exportState.preview.timeRange.earliest).toLocaleDateString()} - {' '}
                      {new Date(exportState.preview.timeRange.latest).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="action-section">
            <button
              className="action-btn preview-btn"
              onClick={handlePreviewExport}
              disabled={exportState.loading}
            >
              {exportState.loading && exportState.progress.includes('预览') ? '⏳' : '👀'} 预览导出
            </button>
            
            <button
              className="action-btn export-btn"
              onClick={handleExport}
              disabled={exportState.loading || !exportState.preview}
            >
              {exportState.loading && exportState.progress.includes('导出') ? '⏳' : '📤'} 导出数据
            </button>
            
            {exportState.data && (
              <button
                className="action-btn download-btn"
                onClick={handleDownload}
              >
                💾 下载文件
              </button>
            )}
          </div>
          
          {exportState.progress && (
            <div className="status-message">
              {exportState.progress}
            </div>
          )}
        </div>
      )}
      
      {/* 导入面板 */}
      {activeTab === 'import' && (
        <div className="import-panel">
          <div className="file-section">
            <h3>选择备份文件</h3>
            <div className="file-input-area">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="file-input"
              />
              <div className="file-input-display">
                {importState.selectedFile ? (
                  <div className="selected-file">
                    <span className="file-name">📄 {importState.selectedFile.name}</span>
                    <span className="file-size">
                      {formatStorageSize(importState.selectedFile.size)}
                    </span>
                  </div>
                ) : (
                  <div className="file-placeholder">
                    <span>点击选择JSON备份文件</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* 文件信息预览 */}
          {importState.fileData && (
            <div className="file-preview-section">
              <h3>文件信息</h3>
              <div className="file-info">
                <div className="info-item">
                  <span className="label">导出时间:</span>
                  <span className="value">
                    {new Date(importState.fileData.exportedAt).toLocaleString()}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">数据版本:</span>
                  <span className="value">{importState.fileData.version}</span>
                </div>
                <div className="info-item">
                  <span className="label">文档数量:</span>
                  <span className="value">{importState.fileData.metadata.totalDocuments}</span>
                </div>
                <div className="info-item">
                  <span className="label">版本记录:</span>
                  <span className="value">{importState.fileData.metadata.totalVersions}</span>
                </div>
                <div className="info-item">
                  <span className="label">图片数量:</span>
                  <span className="value">{importState.fileData.metadata.totalImages}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* 导入选项 */}
          {importState.fileData && (
            <div className="import-options-section">
              <h3>导入选项</h3>
              <div className="option-group">
                <label className="option-item">
                  <input
                    type="checkbox"
                    checked={importOptions.overwriteExisting}
                    onChange={(e) => setImportOptions(prev => ({
                      ...prev,
                      overwriteExisting: e.target.checked
                    }))}
                  />
                  <span>覆盖现有数据</span>
                  <small>如果存在相同ID的数据，是否覆盖</small>
                </label>
                
                <div className="radio-group">
                  <span className="group-label">冲突处理方式:</span>
                  <label className="radio-item">
                    <input
                      type="radio"
                      name="mergeMode"
                      value="skip"
                      checked={importOptions.mergeMode === 'skip'}
                      onChange={(e) => setImportOptions(prev => ({
                        ...prev,
                        mergeMode: e.target.value as any
                      }))}
                    />
                    <span>跳过冲突</span>
                  </label>
                  <label className="radio-item">
                    <input
                      type="radio"
                      name="mergeMode"
                      value="overwrite"
                      checked={importOptions.mergeMode === 'overwrite'}
                      onChange={(e) => setImportOptions(prev => ({
                        ...prev,
                        mergeMode: e.target.value as any
                      }))}
                    />
                    <span>覆盖现有</span>
                  </label>
                  <label className="radio-item">
                    <input
                      type="radio"
                      name="mergeMode"
                      value="rename"
                      checked={importOptions.mergeMode === 'rename'}
                      onChange={(e) => setImportOptions(prev => ({
                        ...prev,
                        mergeMode: e.target.value as any
                      }))}
                    />
                    <span>重命名导入</span>
                  </label>
                </div>
                
                <label className="option-item">
                  <input
                    type="checkbox"
                    checked={importOptions.validateData}
                    onChange={(e) => setImportOptions(prev => ({
                      ...prev,
                      validateData: e.target.checked
                    }))}
                  />
                  <span>验证数据完整性</span>
                  <small>导入前检查数据格式和完整性</small>
                </label>
              </div>
            </div>
          )}
          
          {/* 导入进度 */}
          {importState.progress && (
            <div className="progress-section">
              <h3>导入进度</h3>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${(importState.progress.current / importState.progress.total) * 100}%` }}
                />
              </div>
              <div className="progress-text">
                {importState.progress.step}: {importState.progress.current} / {importState.progress.total}
              </div>
            </div>
          )}
          
          {/* 导入结果 */}
          {importState.result && (
            <div className="result-section">
              <h3>导入结果</h3>
              <div className={`result-summary ${importState.result.success ? 'success' : 'error'}`}>
                {importState.result.success ? '✅ 导入成功' : '❌ 导入失败'}
              </div>
              
              <div className="result-details">
                <div className="result-stats">
                  <div className="stat-item">
                    <span className="label">已导入文档:</span>
                    <span className="value">{importState.result.imported.documents}</span>
                  </div>
                  <div className="stat-item">
                    <span className="label">已导入版本:</span>
                    <span className="value">{importState.result.imported.versions}</span>
                  </div>
                  <div className="stat-item">
                    <span className="label">已导入图片:</span>
                    <span className="value">{importState.result.imported.images}</span>
                  </div>
                  <div className="stat-item">
                    <span className="label">跳过项目:</span>
                    <span className="value">
                      {importState.result.skipped.documents + 
                       importState.result.skipped.versions + 
                       importState.result.skipped.images}
                    </span>
                  </div>
                </div>
                
                {importState.result.errors.length > 0 && (
                  <div className="error-list">
                    <h4>错误信息:</h4>
                    {importState.result.errors.map((error, index) => (
                      <div key={index} className="error-item">❌ {error}</div>
                    ))}
                  </div>
                )}
                
                {importState.result.warnings.length > 0 && (
                  <div className="warning-list">
                    <h4>警告信息:</h4>
                    {importState.result.warnings.map((warning, index) => (
                      <div key={index} className="warning-item">⚠️ {warning}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="action-section">
            <button
              className="action-btn select-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              📁 选择文件
            </button>
            
            <button
              className="action-btn import-btn"
              onClick={handleImport}
              disabled={!importState.fileData || importState.loading}
            >
              {importState.loading ? '⏳' : '📥'} 导入数据
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// CSS样式
const styles = `
.data-backup-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
}

.backup-header {
  position: relative;
  text-align: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.backup-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
}

.backup-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.close-btn {
  position: absolute;
  top: 0;
  right: 0;
  background: #f5f5f5;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-size: 16px;
}

.close-btn:hover {
  background: #e0e0e0;
}

.backup-tabs {
  display: flex;
  margin-bottom: 24px;
  border-bottom: 1px solid #e0e0e0;
}

.tab-btn {
  flex: 1;
  padding: 12px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: #f8f9fa;
}

.tab-btn.active {
  border-bottom-color: #007bff;
  color: #007bff;
  background: #f0f4ff;
}

.options-section,
.preview-section,
.file-section,
.file-preview-section,
.import-options-section {
  margin-bottom: 24px;
}

.options-section h3,
.preview-section h3,
.file-section h3,
.file-preview-section h3,
.import-options-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: background 0.2s;
}

.option-item:hover {
  background: #f8f9fa;
}

.option-item.sub-option {
  margin-left: 24px;
  border-left: 2px solid #e0e0e0;
  padding-left: 16px;
}

.option-item input[type="checkbox"],
.option-item input[type="radio"] {
  margin-top: 2px;
}

.option-item span {
  font-weight: 500;
}

.option-item small {
  display: block;
  color: #666;
  font-size: 12px;
  margin-top: 2px;
}

.preview-info,
.file-info {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-item .label {
  color: #666;
  font-size: 14px;
}

.info-item .value {
  font-weight: 600;
  font-size: 14px;
}

.file-input-area {
  border: 2px dashed #d0d7de;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.file-input-area:hover {
  border-color: #007bff;
  background: #f8f9ff;
}

.file-input {
  display: none;
}

.selected-file {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-name {
  font-weight: 600;
  color: #007bff;
}

.file-size {
  color: #666;
  font-size: 12px;
}

.file-placeholder span {
  color: #666;
  font-size: 14px;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-label {
  font-weight: 600;
  margin-bottom: 8px;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.radio-item:hover {
  background: #f8f9fa;
}

.progress-section {
  margin-bottom: 24px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(to right, #007bff, #0056b3);
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  font-size: 14px;
  color: #666;
}

.result-section {
  margin-bottom: 24px;
}

.result-summary {
  padding: 12px 16px;
  border-radius: 6px;
  font-weight: 600;
  margin-bottom: 16px;
}

.result-summary.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.result-summary.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.result-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.error-list,
.warning-list {
  margin-top: 16px;
}

.error-list h4,
.warning-list h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
}

.error-item,
.warning-item {
  padding: 8px 12px;
  margin-bottom: 4px;
  border-radius: 4px;
  font-size: 13px;
}

.error-item {
  background: #f8d7da;
  color: #721c24;
}

.warning-item {
  background: #fff3cd;
  color: #856404;
}

.action-section {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
}

.action-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.preview-btn {
  background: #e3f2fd;
  color: #1976d2;
}

.preview-btn:hover:not(:disabled) {
  background: #bbdefb;
}

.export-btn {
  background: #e8f5e8;
  color: #388e3c;
}

.export-btn:hover:not(:disabled) {
  background: #c8e6c9;
}

.download-btn {
  background: #f3e5f5;
  color: #7b1fa2;
}

.download-btn:hover:not(:disabled) {
  background: #e1bee7;
}

.select-btn {
  background: #f0f4ff;
  color: #007bff;
}

.select-btn:hover:not(:disabled) {
  background: #e6f0ff;
}

.import-btn {
  background: #fff3e0;
  color: #f57c00;
}

.import-btn:hover:not(:disabled) {
  background: #ffe0b2;
}

.status-message {
  text-align: center;
  padding: 12px;
  margin-top: 16px;
  background: #f8f9fa;
  border-radius: 6px;
  color: #666;
  font-size: 14px;
}
`

// 注入样式
if (typeof document !== 'undefined' && !document.getElementById('data-backup-styles')) {
  const styleSheet = document.createElement('style')
  styleSheet.id = 'data-backup-styles'
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}