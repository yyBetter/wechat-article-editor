// 文档管理API路由
import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken } from '../middleware/auth'
import { createSuccessResponse, createErrorResponse } from '../utils/validation'

// 字数统计函数
function countWords(content: string): number {
  if (!content) return 0
  
  // 移除 markdown 语法字符
  const cleanContent = content
    .replace(/```[\s\S]*?```/g, '') // 移除代码块
    .replace(/`[^`]*`/g, '') // 移除内联代码
    .replace(/!\[.*?\]\(.*?\)/g, '') // 移除图片
    .replace(/\[.*?\]\(.*?\)/g, '') // 移除链接
    .replace(/#{1,6}\s/g, '') // 移除标题符号
    .replace(/[*_]{1,2}/g, '') // 移除加粗斜体
    .replace(/>/g, '') // 移除引用
    .replace(/[-*+]\s/g, '') // 移除列表符号
    .replace(/\d+\.\s/g, '') // 移除有序列表
  
  // 统计中文字符
  const chineseChars = (cleanContent.match(/[\u4e00-\u9fa5]/g) || []).length
  
  // 统计英文单词（包括数字）
  const englishWords = cleanContent
    .replace(/[\u4e00-\u9fa5]/g, ' ') // 替换中文为空格
    .replace(/[^\w\s]/g, ' ') // 移除标点符号
    .split(/\s+/)
    .filter(word => word.length > 0)
    .length
  
  return chineseChars + englishWords
}

const router = express.Router()
const prisma = new PrismaClient()

// 获取用户的所有文档 (支持分页和搜索)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const search = req.query.search as string
    const status = req.query.status as string
    
    const skip = (page - 1) * limit
    
    // 构建查询条件
    const where: any = { userId }
    
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } }
      ]
    }
    
    if (status && ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
      where.status = status
    }
    
    // 获取文档列表
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        select: {
          id: true,
          title: true,
          content: true,
          templateId: true,
          templateVariables: true,
          status: true,
          metadata: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.document.count({ where })
    ])
    
    // 解析JSON字段
    const documentsWithParsedData = documents.map(doc => ({
      ...doc,
      templateVariables: JSON.parse(doc.templateVariables),
      metadata: JSON.parse(doc.metadata),
      // 添加内容预览 (前100个字符)
      preview: doc.content.substring(0, 100) + (doc.content.length > 100 ? '...' : '')
    }))
    
    res.json(createSuccessResponse({
      documents: documentsWithParsedData,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }))
  } catch (error) {
    console.error('Get documents error:', error)
    res.status(500).json(createErrorResponse('获取文档列表失败'))
  }
})

// 获取单个文档详情
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    
    const document = await prisma.document.findFirst({
      where: { id, userId },
      select: {
        id: true,
        title: true,
        content: true,
        templateId: true,
        templateVariables: true,
        status: true,
        metadata: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    if (!document) {
      return res.status(404).json(createErrorResponse('文档不存在', 'DOCUMENT_NOT_FOUND'))
    }
    
    // 解析JSON字段
    const documentWithParsedData = {
      ...document,
      templateVariables: JSON.parse(document.templateVariables),
      metadata: JSON.parse(document.metadata)
    }
    
    res.json(createSuccessResponse(documentWithParsedData))
  } catch (error) {
    console.error('Get document error:', error)
    res.status(500).json(createErrorResponse('获取文档失败'))
  }
})

// 创建新文档
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id
    const { title, content, templateId, templateVariables, status = 'DRAFT' } = req.body
    
    // 计算内容元数据
    const wordCount = countWords(content || '')
    const imageCount = content ? (content.match(/!\[.*?\]\(.*?\)/g) || []).length : 0
    const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 200))
    
    const metadata = {
      wordCount,
      imageCount,
      estimatedReadTime
    }
    
    const newDocument = await prisma.document.create({
      data: {
        userId,
        title: title || '未命名文档',
        content: content || '',
        templateId: templateId || 'simple-doc',
        templateVariables: JSON.stringify(templateVariables || {}),
        status,
        metadata: JSON.stringify(metadata)
      },
      select: {
        id: true,
        title: true,
        content: true,
        templateId: true,
        templateVariables: true,
        status: true,
        metadata: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    // 解析JSON字段
    const documentWithParsedData = {
      ...newDocument,
      templateVariables: JSON.parse(newDocument.templateVariables),
      metadata: JSON.parse(newDocument.metadata)
    }
    
    res.status(201).json(createSuccessResponse(documentWithParsedData))
  } catch (error) {
    console.error('Create document error:', error)
    res.status(500).json(createErrorResponse('创建文档失败'))
  }
})

// 更新文档
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    const { title, content, templateId, templateVariables, status } = req.body
    
    // 验证文档是否属于当前用户
    const existingDocument = await prisma.document.findFirst({
      where: { id, userId }
    })
    
    if (!existingDocument) {
      return res.status(404).json(createErrorResponse('文档不存在', 'DOCUMENT_NOT_FOUND'))
    }
    
    // 检查内容是否有实质性变更（用于版本历史）
    const hasContentChange = content !== undefined && content !== existingDocument.content
    const hasTitleChange = title !== undefined && title !== existingDocument.title
    const hasTemplateChange = templateId !== undefined && templateId !== existingDocument.templateId
    const hasVariableChange = templateVariables !== undefined && 
      JSON.stringify(templateVariables) !== existingDocument.templateVariables
    
    const shouldCreateVersion = hasContentChange || hasTitleChange || hasTemplateChange || hasVariableChange
    
    // 使用事务确保版本历史和文档更新的一致性
    const result = await prisma.$transaction(async (tx) => {
      // 如果有实质性变更，先保存当前版本到历史记录
      if (shouldCreateVersion) {
        await tx.documentVersion.create({
          data: {
            documentId: id,
            title: existingDocument.title,
            content: existingDocument.content,
            templateId: existingDocument.templateId,
            templateVariables: existingDocument.templateVariables,
            metadata: existingDocument.metadata,
            changeType: 'AUTO_SAVE', // 自动保存类型
            changeReason: '自动保存版本',
            createdAt: existingDocument.updatedAt // 使用文档的最后更新时间作为版本时间
          }
        })
      }
      
      // 准备更新数据
      const updateData: any = {}
      
      if (title !== undefined) updateData.title = title
      if (content !== undefined) {
        updateData.content = content
        
        // 重新计算内容元数据
        const wordCount = countWords(content)
        const imageCount = (content.match(/!\[.*?\]\(.*?\)/g) || []).length
        const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 200))
        
        updateData.metadata = JSON.stringify({
          wordCount,
          imageCount,
          estimatedReadTime
        })
      }
      
      if (templateId !== undefined) updateData.templateId = templateId
      if (templateVariables !== undefined) updateData.templateVariables = JSON.stringify(templateVariables)
      if (status !== undefined) updateData.status = status
      
      // 更新文档
      const updatedDocument = await tx.document.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          title: true,
          content: true,
          templateId: true,
          templateVariables: true,
          status: true,
          metadata: true,
          createdAt: true,
          updatedAt: true
        }
      })
      
      return updatedDocument
    })
    
    // 解析JSON字段
    const documentWithParsedData = {
      ...result,
      templateVariables: JSON.parse(result.templateVariables),
      metadata: JSON.parse(result.metadata)
    }
    
    res.json(createSuccessResponse(documentWithParsedData))
  } catch (error) {
    console.error('Update document error:', error)
    res.status(500).json(createErrorResponse('更新文档失败'))
  }
})

// 删除文档
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    
    // 验证文档是否属于当前用户
    const existingDocument = await prisma.document.findFirst({
      where: { id, userId }
    })
    
    if (!existingDocument) {
      return res.status(404).json(createErrorResponse('文档不存在', 'DOCUMENT_NOT_FOUND'))
    }
    
    await prisma.document.delete({
      where: { id }
    })
    
    res.json(createSuccessResponse({ message: '文档删除成功' }))
  } catch (error) {
    console.error('Delete document error:', error)
    res.status(500).json(createErrorResponse('删除文档失败'))
  }
})

// 复制文档
router.post('/:id/duplicate', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    
    // 获取源文档
    const sourceDocument = await prisma.document.findFirst({
      where: { id, userId }
    })
    
    if (!sourceDocument) {
      return res.status(404).json(createErrorResponse('文档不存在', 'DOCUMENT_NOT_FOUND'))
    }
    
    // 创建副本
    const duplicatedDocument = await prisma.document.create({
      data: {
        userId,
        title: `${sourceDocument.title} - 副本`,
        content: sourceDocument.content,
        templateId: sourceDocument.templateId,
        templateVariables: sourceDocument.templateVariables,
        status: 'DRAFT', // 副本默认为草稿状态
        metadata: sourceDocument.metadata
      },
      select: {
        id: true,
        title: true,
        content: true,
        templateId: true,
        templateVariables: true,
        status: true,
        metadata: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    // 解析JSON字段
    const documentWithParsedData = {
      ...duplicatedDocument,
      templateVariables: JSON.parse(duplicatedDocument.templateVariables),
      metadata: JSON.parse(duplicatedDocument.metadata)
    }
    
    res.status(201).json(createSuccessResponse(documentWithParsedData))
  } catch (error) {
    console.error('Duplicate document error:', error)
    res.status(500).json(createErrorResponse('复制文档失败'))
  }
})

// ===== 版本历史相关API =====

// 获取文档的版本历史列表
router.get('/:id/versions', authenticateToken, async (req, res) => {
  try {
    const { id: documentId } = req.params
    const userId = req.user!.id
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    
    const skip = (page - 1) * limit
    
    // 验证文档是否属于当前用户
    const document = await prisma.document.findFirst({
      where: { id: documentId, userId }
    })
    
    if (!document) {
      return res.status(404).json(createErrorResponse('文档不存在', 'DOCUMENT_NOT_FOUND'))
    }
    
    // 获取版本历史列表
    const [versions, total] = await Promise.all([
      prisma.documentVersion.findMany({
        where: { documentId },
        select: {
          id: true,
          title: true,
          changeType: true,
          changeReason: true,
          metadata: true,
          createdAt: true,
          // 不返回完整内容，只在需要时获取
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.documentVersion.count({ where: { documentId } })
    ])
    
    // 解析JSON字段并格式化响应
    const versionsWithParsedData = versions.map(version => ({
      ...version,
      metadata: JSON.parse(version.metadata),
      // 添加版本序号 (最新版本号 = total - index)
      versionNumber: total - (versions.indexOf(version) + skip)
    }))
    
    res.json(createSuccessResponse({
      versions: versionsWithParsedData,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      document: {
        id: document.id,
        title: document.title,
        currentVersion: total + 1 // 当前文档版本号
      }
    }))
  } catch (error) {
    console.error('Get document versions error:', error)
    res.status(500).json(createErrorResponse('获取版本历史失败'))
  }
})

// 获取特定版本的详细内容
router.get('/:id/versions/:versionId', authenticateToken, async (req, res) => {
  try {
    const { id: documentId, versionId } = req.params
    const userId = req.user!.id
    
    // 验证文档是否属于当前用户
    const document = await prisma.document.findFirst({
      where: { id: documentId, userId }
    })
    
    if (!document) {
      return res.status(404).json(createErrorResponse('文档不存在', 'DOCUMENT_NOT_FOUND'))
    }
    
    // 获取版本详细内容
    const version = await prisma.documentVersion.findFirst({
      where: { 
        id: versionId,
        documentId 
      },
      select: {
        id: true,
        title: true,
        content: true,
        templateId: true,
        templateVariables: true,
        metadata: true,
        changeType: true,
        changeReason: true,
        createdAt: true
      }
    })
    
    if (!version) {
      return res.status(404).json(createErrorResponse('版本不存在', 'VERSION_NOT_FOUND'))
    }
    
    // 解析JSON字段
    const versionWithParsedData = {
      ...version,
      templateVariables: JSON.parse(version.templateVariables),
      metadata: JSON.parse(version.metadata)
    }
    
    res.json(createSuccessResponse(versionWithParsedData))
  } catch (error) {
    console.error('Get version detail error:', error)
    res.status(500).json(createErrorResponse('获取版本详情失败'))
  }
})

// 恢复到特定版本
router.post('/:id/versions/:versionId/restore', authenticateToken, async (req, res) => {
  try {
    const { id: documentId, versionId } = req.params
    const userId = req.user!.id
    
    // 验证文档是否属于当前用户
    const document = await prisma.document.findFirst({
      where: { id: documentId, userId }
    })
    
    if (!document) {
      return res.status(404).json(createErrorResponse('文档不存在', 'DOCUMENT_NOT_FOUND'))
    }
    
    // 获取要恢复的版本
    const version = await prisma.documentVersion.findFirst({
      where: { 
        id: versionId,
        documentId 
      }
    })
    
    if (!version) {
      return res.status(404).json(createErrorResponse('版本不存在', 'VERSION_NOT_FOUND'))
    }
    
    // 使用事务进行版本恢复
    const result = await prisma.$transaction(async (tx) => {
      // 先保存当前版本到历史记录
      await tx.documentVersion.create({
        data: {
          documentId,
          title: document.title,
          content: document.content,
          templateId: document.templateId,
          templateVariables: document.templateVariables,
          metadata: document.metadata,
          changeType: 'MANUAL_SAVE',
          changeReason: `恢复前备份 - 准备恢复到版本 ${versionId.slice(0, 8)}`,
          createdAt: document.updatedAt
        }
      })
      
      // 恢复文档到指定版本
      const restoredDocument = await tx.document.update({
        where: { id: documentId },
        data: {
          title: version.title,
          content: version.content,
          templateId: version.templateId,
          templateVariables: version.templateVariables,
          metadata: version.metadata
        },
        select: {
          id: true,
          title: true,
          content: true,
          templateId: true,
          templateVariables: true,
          status: true,
          metadata: true,
          createdAt: true,
          updatedAt: true
        }
      })
      
      // 创建恢复操作的版本记录
      await tx.documentVersion.create({
        data: {
          documentId,
          title: version.title,
          content: version.content,
          templateId: version.templateId,
          templateVariables: version.templateVariables,
          metadata: version.metadata,
          changeType: 'RESTORE',
          changeReason: `从版本 ${versionId.slice(0, 8)} 恢复`,
        }
      })
      
      return restoredDocument
    })
    
    // 解析JSON字段
    const documentWithParsedData = {
      ...result,
      templateVariables: JSON.parse(result.templateVariables),
      metadata: JSON.parse(result.metadata)
    }
    
    res.json(createSuccessResponse({
      document: documentWithParsedData,
      message: '文档已成功恢复到指定版本'
    }))
  } catch (error) {
    console.error('Restore version error:', error)
    res.status(500).json(createErrorResponse('版本恢复失败'))
  }
})

// 手动创建版本快照 (用户主动保存)
router.post('/:id/versions', authenticateToken, async (req, res) => {
  try {
    const { id: documentId } = req.params
    const userId = req.user!.id
    const { reason = '手动保存' } = req.body
    
    // 验证文档是否属于当前用户
    const document = await prisma.document.findFirst({
      where: { id: documentId, userId }
    })
    
    if (!document) {
      return res.status(404).json(createErrorResponse('文档不存在', 'DOCUMENT_NOT_FOUND'))
    }
    
    // 创建版本快照
    const version = await prisma.documentVersion.create({
      data: {
        documentId,
        title: document.title,
        content: document.content,
        templateId: document.templateId,
        templateVariables: document.templateVariables,
        metadata: document.metadata,
        changeType: 'MANUAL_SAVE',
        changeReason: reason
      },
      select: {
        id: true,
        title: true,
        changeType: true,
        changeReason: true,
        metadata: true,
        createdAt: true
      }
    })
    
    // 解析JSON字段
    const versionWithParsedData = {
      ...version,
      metadata: JSON.parse(version.metadata)
    }
    
    res.status(201).json(createSuccessResponse({
      version: versionWithParsedData,
      message: '版本快照创建成功'
    }))
  } catch (error) {
    console.error('Create version snapshot error:', error)
    res.status(500).json(createErrorResponse('创建版本快照失败'))
  }
})

// 删除版本记录 (谨慎操作)
router.delete('/:id/versions/:versionId', authenticateToken, async (req, res) => {
  try {
    const { id: documentId, versionId } = req.params
    const userId = req.user!.id
    
    // 验证文档是否属于当前用户
    const document = await prisma.document.findFirst({
      where: { id: documentId, userId }
    })
    
    if (!document) {
      return res.status(404).json(createErrorResponse('文档不存在', 'DOCUMENT_NOT_FOUND'))
    }
    
    // 验证版本是否存在
    const version = await prisma.documentVersion.findFirst({
      where: { 
        id: versionId,
        documentId 
      }
    })
    
    if (!version) {
      return res.status(404).json(createErrorResponse('版本不存在', 'VERSION_NOT_FOUND'))
    }
    
    // 删除版本记录
    await prisma.documentVersion.delete({
      where: { id: versionId }
    })
    
    res.json(createSuccessResponse({ 
      message: '版本记录删除成功',
      deletedVersionId: versionId
    }))
  } catch (error) {
    console.error('Delete version error:', error)
    res.status(500).json(createErrorResponse('删除版本失败'))
  }
})

// 批量重新计算所有文档的metadata
router.post('/batch-update-metadata', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id
    
    // 获取用户的所有文档
    const documents = await prisma.document.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        content: true
      }
    })
    
    let updatedCount = 0
    
    // 为每个文档重新计算metadata
    for (const doc of documents) {
      const wordCount = countWords(doc.content || '')
      const imageCount = doc.content ? (doc.content.match(/!\[.*?\]\(.*?\)/g) || []).length : 0
      const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 200))
      
      const metadata = {
        wordCount,
        imageCount,
        estimatedReadTime
      }
      
      await prisma.document.update({
        where: { id: doc.id },
        data: {
          metadata: JSON.stringify(metadata)
        }
      })
      
      updatedCount++
      console.log(`更新文档 "${doc.title}": ${wordCount}字, ${imageCount}图`)
    }
    
    res.json(createSuccessResponse({
      message: `成功更新 ${updatedCount} 个文档的metadata`,
      updatedCount
    }))
  } catch (error) {
    console.error('Batch update metadata error:', error)
    res.status(500).json(createErrorResponse('批量更新metadata失败'))
  }
})

export default router