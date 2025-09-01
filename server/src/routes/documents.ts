// 文档管理API路由
import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken } from '../middleware/auth'
import { createSuccessResponse, createErrorResponse } from '../utils/validation'

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
    const wordCount = content ? content.replace(/[^\u4e00-\u9fa5\w]/g, ' ').split(/\s+/).filter((w: string) => w.length > 0).length : 0
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
    
    // 准备更新数据
    const updateData: any = {}
    
    if (title !== undefined) updateData.title = title
    if (content !== undefined) {
      updateData.content = content
      
      // 重新计算内容元数据
      const wordCount = content.replace(/[^\u4e00-\u9fa5\w]/g, ' ').split(/\s+/).filter((w: string) => w.length > 0).length
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
    
    const updatedDocument = await prisma.document.update({
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
    
    // 解析JSON字段
    const documentWithParsedData = {
      ...updatedDocument,
      templateVariables: JSON.parse(updatedDocument.templateVariables),
      metadata: JSON.parse(updatedDocument.metadata)
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

export default router