/**
 * 大纲面板组件
 * 显示文档的标题结构，支持点击跳转和高亮当前位置
 */

import React, { useState, useEffect, useCallback } from 'react'
import { parseOutline, getActiveNodeId, getIndentLevel, getOutlineStats, OutlineNode } from '../utils/outline-parser'
import '../styles/outline-panel.css'

interface OutlinePanelProps {
  content: string                    // 文档内容
  cursorPosition?: number           // 光标位置
  onNodeClick?: (node: OutlineNode) => void  // 节点点击回调
  isCollapsed?: boolean             // 是否折叠
  onToggleCollapse?: () => void     // 切换折叠状态
}

export function OutlinePanel({
  content,
  cursorPosition = 0,
  onNodeClick,
  isCollapsed = false,
  onToggleCollapse
}: OutlinePanelProps) {
  const [nodes, setNodes] = useState<OutlineNode[]>([])
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null)
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set())

  // 解析大纲
  useEffect(() => {
    const parsedNodes = parseOutline(content)
    setNodes(parsedNodes)
  }, [content])

  // 更新当前激活的节点
  useEffect(() => {
    const activeId = getActiveNodeId(nodes, cursorPosition)
    setActiveNodeId(activeId)
  }, [nodes, cursorPosition])

  // 处理节点点击
  const handleNodeClick = useCallback((node: OutlineNode) => {
    if (onNodeClick) {
      onNodeClick(node)
    }
  }, [onNodeClick])

  // 切换节点折叠状态
  const toggleNodeCollapse = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setCollapsedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }, [])

  // 获取统计信息
  const stats = getOutlineStats(nodes)

  // 如果面板折叠，只显示切换按钮
  if (isCollapsed) {
    return (
      <div className="outline-panel collapsed">
        <button 
          className="outline-toggle-btn"
          onClick={onToggleCollapse}
          title="展开大纲"
        >
          <span className="icon">📋</span>
          <span className="label">大纲</span>
        </button>
      </div>
    )
  }

  // 如果没有标题
  if (nodes.length === 0) {
    return (
      <div className="outline-panel">
        <div className="outline-header">
          <h3 className="outline-title">
            <span className="icon">📋</span>
            文档大纲
          </h3>
          <button 
            className="outline-collapse-btn"
            onClick={onToggleCollapse}
            title="折叠大纲"
          >
            ✕
          </button>
        </div>
        
        <div className="outline-empty">
          <div className="empty-icon">📝</div>
          <div className="empty-text">暂无大纲</div>
          <div className="empty-hint">使用 # 标记创建标题</div>
        </div>
      </div>
    )
  }

  return (
    <div className="outline-panel">
      {/* 头部 */}
      <div className="outline-header">
        <h3 className="outline-title">
          <span className="icon">📋</span>
          文档大纲
          <span className="count">({stats.total})</span>
        </h3>
        <button 
          className="outline-collapse-btn"
          onClick={onToggleCollapse}
          title="折叠大纲"
        >
          ✕
        </button>
      </div>

      {/* 统计信息 */}
      <div className="outline-stats">
        {Object.entries(stats.byLevel).map(([level, count]) => (
          <span key={level} className="stat-item">
            H{level}: {count}
          </span>
        ))}
      </div>

      {/* 节点列表 */}
      <div className="outline-list">
        {nodes.map(node => {
          const isActive = node.id === activeNodeId
          const isCollapsed = collapsedNodes.has(node.id)
          const hasChildren = false // MVP 版本暂不支持树形结构，后续添加
          
          return (
            <div
              key={node.id}
              className={`outline-node ${isActive ? 'active' : ''} level-${node.level}`}
              style={{ paddingLeft: `${getIndentLevel(node.level) + 12}px` }}
              onClick={() => handleNodeClick(node)}
              title={`跳转到: ${node.text}`}
            >
              {/* 折叠按钮（暂时隐藏，树形结构时使用） */}
              {hasChildren && (
                <button
                  className="collapse-btn"
                  onClick={(e) => toggleNodeCollapse(node.id, e)}
                >
                  {isCollapsed ? '▶' : '▼'}
                </button>
              )}
              
              {/* 层级指示器 */}
              <span className="level-indicator">
                {'#'.repeat(node.level)}
              </span>
              
              {/* 标题文本 */}
              <span className="node-text">{node.text}</span>
              
              {/* 行号 */}
              <span className="node-line">L{node.line + 1}</span>
            </div>
          )
        })}
      </div>

      {/* 底部提示 */}
      <div className="outline-footer">
        <div className="hint">
          <span className="hint-icon">💡</span>
          <span className="hint-text">点击节点快速跳转</span>
        </div>
      </div>
    </div>
  )
}


