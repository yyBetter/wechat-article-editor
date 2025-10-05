// 微信公众号发布API路由
import express from 'express'
import axios from 'axios'
import FormData from 'form-data'
import { authenticateToken } from '../middleware/auth'
import { logError } from '../utils/logger'

const router = express.Router()

// 微信公众号配置
const WECHAT_CONFIG = {
  appId: process.env.WECHAT_APP_ID || '',
  appSecret: process.env.WECHAT_APP_SECRET || '',
  baseUrl: 'https://api.weixin.qq.com/cgi-bin'
}

// Access Token 缓存
let accessTokenCache: {
  token: string
  expiresAt: number
} | null = null

/**
 * 获取微信 Access Token
 * 会自动缓存token，避免频繁请求
 */
async function getAccessToken(): Promise<string> {
  // 检查缓存是否有效（提前5分钟刷新）
  if (accessTokenCache && Date.now() < accessTokenCache.expiresAt - 5 * 60 * 1000) {
    return accessTokenCache.token
  }

  try {
    const response = await axios.get(`${WECHAT_CONFIG.baseUrl}/token`, {
      params: {
        grant_type: 'client_credential',
        appid: WECHAT_CONFIG.appId,
        secret: WECHAT_CONFIG.appSecret
      }
    })

    if (response.data.errcode) {
      throw new Error(`获取Access Token失败: ${response.data.errmsg}`)
    }

    const token = response.data.access_token
    const expiresIn = response.data.expires_in || 7200

    // 缓存token
    accessTokenCache = {
      token,
      expiresAt: Date.now() + expiresIn * 1000
    }

    console.log('✅ Access Token 获取成功，有效期:', expiresIn, '秒')
    return token
  } catch (error) {
    logError(error as Error, { action: 'getAccessToken' })
    throw error
  }
}

/**
 * 上传图片到微信素材库
 * POST /api/wechat/upload-image
 */
router.post('/upload-image', authenticateToken, async (req, res) => {
  try {
    const { imageUrl, imageBuffer, imageType = 'image/jpeg' } = req.body

    if (!imageUrl && !imageBuffer) {
      return res.status(400).json({
        success: false,
        message: '请提供图片URL或图片数据'
      })
    }

    const accessToken = await getAccessToken()

    // 准备上传
    let imageData: Buffer

    if (imageBuffer) {
      // 使用base64编码的图片数据
      imageData = Buffer.from(imageBuffer, 'base64')
    } else {
      // 从URL下载图片
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer'
      })
      imageData = Buffer.from(imageResponse.data)
    }

    // 创建FormData
    const formData = new FormData()
    formData.append('media', imageData, {
      filename: `image_${Date.now()}.jpg`,
      contentType: imageType
    })

    // 上传到微信
    const uploadResponse = await axios.post(
      `${WECHAT_CONFIG.baseUrl}/media/upload?access_token=${accessToken}&type=image`,
      formData,
      {
        headers: formData.getHeaders()
      }
    )

    if (uploadResponse.data.errcode) {
      throw new Error(`上传图片失败: ${uploadResponse.data.errmsg}`)
    }

    res.json({
      success: true,
      data: {
        mediaId: uploadResponse.data.media_id,
        url: uploadResponse.data.url,
        createdAt: uploadResponse.data.created_at
      }
    })
  } catch (error) {
    logError(error as Error, { action: 'uploadImage' })
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '上传图片失败'
    })
  }
})

/**
 * 上传图文封面到微信素材库（永久素材）
 * POST /api/wechat/upload-cover
 */
router.post('/upload-cover', authenticateToken, async (req, res) => {
  try {
    const { imageUrl, imageBuffer, imageType = 'image/jpeg' } = req.body

    if (!imageUrl && !imageBuffer) {
      return res.status(400).json({
        success: false,
        message: '请提供封面图片'
      })
    }

    const accessToken = await getAccessToken()

    // 准备上传
    let imageData: Buffer

    if (imageBuffer) {
      imageData = Buffer.from(imageBuffer, 'base64')
    } else {
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer'
      })
      imageData = Buffer.from(imageResponse.data)
    }

    // 创建FormData
    const formData = new FormData()
    formData.append('media', imageData, {
      filename: `cover_${Date.now()}.jpg`,
      contentType: imageType
    })

    // 上传永久图片素材
    const uploadResponse = await axios.post(
      `${WECHAT_CONFIG.baseUrl}/material/add_material?access_token=${accessToken}&type=image`,
      formData,
      {
        headers: formData.getHeaders()
      }
    )

    if (uploadResponse.data.errcode) {
      throw new Error(`上传封面失败: ${uploadResponse.data.errmsg}`)
    }

    res.json({
      success: true,
      data: {
        mediaId: uploadResponse.data.media_id,
        url: uploadResponse.data.url
      }
    })
  } catch (error) {
    logError(error as Error, { action: 'uploadCover' })
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '上传封面失败'
    })
  }
})

/**
 * 创建草稿（新增图文素材到草稿箱）
 * POST /api/wechat/add-draft
 */
router.post('/add-draft', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      author,
      content,
      digest,
      thumbMediaId,
      showCoverPic = 1,
      needOpenComment = 1,
      onlyFansCanComment = 0
    } = req.body

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: '标题和内容不能为空'
      })
    }

    const accessToken = await getAccessToken()

    // 构建图文消息
    const articles = {
      articles: [
        {
          title,
          author: author || '',
          digest: digest || '',
          content,
          content_source_url: '',
          thumb_media_id: thumbMediaId || '',
          show_cover_pic: showCoverPic,
          need_open_comment: needOpenComment,
          only_fans_can_comment: onlyFansCanComment
        }
      ]
    }

    // 添加草稿
    const response = await axios.post(
      `${WECHAT_CONFIG.baseUrl}/draft/add?access_token=${accessToken}`,
      articles
    )

    if (response.data.errcode && response.data.errcode !== 0) {
      throw new Error(`添加草稿失败: ${response.data.errmsg}`)
    }

    res.json({
      success: true,
      data: {
        mediaId: response.data.media_id
      },
      message: '草稿已添加到微信公众号草稿箱'
    })
  } catch (error) {
    logError(error as Error, { action: 'addDraft' })
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '添加草稿失败'
    })
  }
})

/**
 * 发布图文消息（从草稿箱发布）
 * POST /api/wechat/publish
 */
router.post('/publish', authenticateToken, async (req, res) => {
  try {
    const { mediaId } = req.body

    if (!mediaId) {
      return res.status(400).json({
        success: false,
        message: '请提供草稿ID (media_id)'
      })
    }

    const accessToken = await getAccessToken()

    // 发布草稿
    const response = await axios.post(
      `${WECHAT_CONFIG.baseUrl}/freepublish/submit?access_token=${accessToken}`,
      {
        media_id: mediaId
      }
    )

    if (response.data.errcode && response.data.errcode !== 0) {
      throw new Error(`发布失败: ${response.data.errmsg}`)
    }

    res.json({
      success: true,
      data: {
        publishId: response.data.publish_id,
        msgDataId: response.data.msg_data_id
      },
      message: '文章已成功发布到微信公众号'
    })
  } catch (error) {
    logError(error as Error, { action: 'publish' })
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '发布失败'
    })
  }
})

/**
 * 一键发布（完整流程）
 * POST /api/wechat/publish-article
 */
router.post('/publish-article', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      author,
      content,
      digest,
      coverImageUrl,
      coverImageBuffer,
      showCoverPic = 1,
      needOpenComment = 1,
      onlyFansCanComment = 0,
      pushToFollowers = false
    } = req.body

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: '标题和内容不能为空'
      })
    }

    // Step 1: 上传封面图片（如果有）
    let thumbMediaId = ''
    if (coverImageUrl || coverImageBuffer) {
      const accessToken = await getAccessToken()
      
      let imageData: Buffer
      if (coverImageBuffer) {
        imageData = Buffer.from(coverImageBuffer, 'base64')
      } else {
        const imageResponse = await axios.get(coverImageUrl, {
          responseType: 'arraybuffer'
        })
        imageData = Buffer.from(imageResponse.data)
      }

      const formData = new FormData()
      formData.append('media', imageData, {
        filename: `cover_${Date.now()}.jpg`,
        contentType: 'image/jpeg'
      })

      const uploadResponse = await axios.post(
        `${WECHAT_CONFIG.baseUrl}/material/add_material?access_token=${accessToken}&type=image`,
        formData,
        {
          headers: formData.getHeaders()
        }
      )

      if (uploadResponse.data.errcode) {
        throw new Error(`上传封面失败: ${uploadResponse.data.errmsg}`)
      }

      thumbMediaId = uploadResponse.data.media_id
    }

    // Step 2: 创建草稿
    const accessToken = await getAccessToken()
    const articles = {
      articles: [
        {
          title,
          author: author || '',
          digest: digest || '',
          content,
          content_source_url: '',
          thumb_media_id: thumbMediaId,
          show_cover_pic: showCoverPic,
          need_open_comment: needOpenComment,
          only_fans_can_comment: onlyFansCanComment
        }
      ]
    }

    const draftResponse = await axios.post(
      `${WECHAT_CONFIG.baseUrl}/draft/add?access_token=${accessToken}`,
      articles
    )

    if (draftResponse.data.errcode && draftResponse.data.errcode !== 0) {
      throw new Error(`添加草稿失败: ${draftResponse.data.errmsg}`)
    }

    const mediaId = draftResponse.data.media_id

    // Step 3: 发布文章
    if (pushToFollowers) {
      const publishResponse = await axios.post(
        `${WECHAT_CONFIG.baseUrl}/freepublish/submit?access_token=${accessToken}`,
        {
          media_id: mediaId
        }
      )

      if (publishResponse.data.errcode && publishResponse.data.errcode !== 0) {
        throw new Error(`发布失败: ${publishResponse.data.errmsg}`)
      }

      res.json({
        success: true,
        data: {
          mediaId,
          publishId: publishResponse.data.publish_id,
          msgDataId: publishResponse.data.msg_data_id
        },
        message: '文章已成功发布并推送给粉丝'
      })
    } else {
      res.json({
        success: true,
        data: {
          mediaId
        },
        message: '文章已添加到草稿箱，未推送给粉丝'
      })
    }
  } catch (error) {
    logError(error as Error, { action: 'publishArticle' })
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '发布失败'
    })
  }
})

/**
 * 测试微信API连接
 * GET /api/wechat/test
 */
router.get('/test', authenticateToken, async (req, res) => {
  try {
    const token = await getAccessToken()
    res.json({
      success: true,
      message: '微信API连接成功',
      data: {
        hasToken: !!token,
        config: {
          appId: WECHAT_CONFIG.appId ? '已配置' : '未配置',
          appSecret: WECHAT_CONFIG.appSecret ? '已配置' : '未配置'
        }
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '微信API连接失败'
    })
  }
})

export default router
