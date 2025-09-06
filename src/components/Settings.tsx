import React, { useState } from 'react'
import { StorageSettings } from './StorageSettings'
import { DataBackup } from './DataBackup'
import '../styles/settings.css'

interface SettingsProps {
  // 添加需要的props
}

export const Settings: React.FC<SettingsProps> = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'storage' | 'backup'>('general')
  
  return (
    <div className="settings">
      <div className="settings-header">
        <h3>⚙️ 应用设置</h3>
        <div className="settings-tabs">
          <button
            className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            🔧 常规设置
          </button>
          <button
            className={`settings-tab ${activeTab === 'storage' ? 'active' : ''}`}
            onClick={() => setActiveTab('storage')}
          >
            🗄️ 存储设置
          </button>
          <button
            className={`settings-tab ${activeTab === 'backup' ? 'active' : ''}`}
            onClick={() => setActiveTab('backup')}
          >
            💾 数据备份
          </button>
        </div>
      </div>
      
      <div className="settings-content">
        {activeTab === 'general' && (
          <div className="general-settings">
            <h4>常规设置</h4>
            <div className="setting-group">
              <label className="setting-item">
                <span>自动保存</span>
                <input type="checkbox" defaultChecked />
              </label>
              <label className="setting-item">
                <span>实时预览</span>
                <input type="checkbox" defaultChecked />
              </label>
              <label className="setting-item">
                <span>启用快捷键</span>
                <input type="checkbox" defaultChecked />
              </label>
            </div>
            
            <div className="setting-group">
              <h5>编辑器选项</h5>
              <label className="setting-item">
                <span>自动换行</span>
                <input type="checkbox" defaultChecked />
              </label>
              <label className="setting-item">
                <span>显示行号</span>
                <input type="checkbox" />
              </label>
              <label className="setting-item">
                <span>Markdown提示</span>
                <input type="checkbox" defaultChecked />
              </label>
            </div>
          </div>
        )}
        
        {activeTab === 'storage' && (
          <div className="storage-settings-container">
            <StorageSettings />
          </div>
        )}
        
        {activeTab === 'backup' && (
          <div className="backup-settings-container">
            <DataBackup />
          </div>
        )}
      </div>
    </div>
  )
}