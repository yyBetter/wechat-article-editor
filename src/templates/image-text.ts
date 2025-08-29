import { Template } from '../types/template'

// 图文并茂型模板 - 基于第二张参考图片
export const imageTextTemplate: Template = {
  id: 'image-text',
  name: '图文并茂',
  description: '适合图片展示、产品推荐、美食分享等',
  thumbnail: '/assets/thumbnails/image-text.png',
  category: 'image-text',
  
  styles: {
    // 容器样式
    container: {
      maxWidth: '100%',
      padding: '20px 16px',
      backgroundColor: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
      lineHeight: '1.6',
      textAlign: 'center'
    },
    
    // 字体排版
    typography: {
      // 主标题 - 大而醒目
      h1: {
        fontSize: '26px',
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: '40px',
        textAlign: 'center',
        lineHeight: '1.2'
      },
      
      // 二级标题
      h2: {
        fontSize: '20px',
        fontWeight: '600',
        color: '#000000',
        margin: '36px 0 20px 0',
        textAlign: 'center',
        lineHeight: '1.3'
      },
      
      // 三级标题  
      h3: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#333333',
        margin: '28px 0 16px 0',
        textAlign: 'center',
        lineHeight: '1.3'
      },
      
      // 正文段落
      p: {
        fontSize: '15px',
        color: '#333333',
        marginBottom: '16px',
        lineHeight: '1.7',
        textAlign: 'center'
      },
      
      // 链接样式
      a: {
        fontSize: '15px',
        color: '#1e6fff',
        textDecoration: 'none',
        fontWeight: '500'
      },
      
      // 加粗文本
      strong: {
        fontSize: '15px',
        fontWeight: '600',
        color: '#000000'
      },
      
      // 斜体文本
      em: {
        fontSize: '15px',
        fontStyle: 'italic',
        color: '#666666'
      }
    },
    
    // 其他元素
    elements: {
      // 图片 - 统一样式和间距
      img: {
        width: '100%',
        marginBottom: '12px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      },
      
      // 分割线
      hr: {
        border: 'none',
        height: '1px',
        backgroundColor: '#e1e4e8',
        margin: '40px 0'
      }
    },
    
    // 图文块专用样式
    imageBlock: {
      container: {
        marginBottom: '32px'
      },
      
      // 图片样式
      image: {
        width: '100%',
        marginBottom: '12px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      },
      
      // 图片标题
      title: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: '8px',
        textAlign: 'center',
        lineHeight: '1.3'
      },
      
      // 图片描述
      description: {
        fontSize: '14px',
        color: '#666666',
        lineHeight: '1.5',
        textAlign: 'center',
        marginBottom: '16px'
      }
    }
  },
  
  // 固定元素配置
  fixedElements: {
    // 文章头部
    header: {
      template: `
        <div class="article-header" style="text-align: center; margin-bottom: 48px;">
          {{#if logo}}
          <div class="brand-logo" style="margin-bottom: 20px;">
            <img src="{{logo}}" alt="Logo" style="height: 40px; width: auto;" />
          </div>
          {{/if}}
          <h1 style="margin: 0 0 12px 0; font-size: 28px; font-weight: bold; color: #000; letter-spacing: 1px;">{{title}}</h1>
          {{#if author}}
          <div class="article-meta" style="color: #666; font-size: 14px; margin-bottom: 32px;">
            <span>{{author}}</span>
            {{#if date}} · <span>{{date}}</span>{{/if}}
          </div>
          {{/if}}
        </div>
      `,
      position: 'before',
      variables: {
        logo: '{{logo}}',
        title: '{{title}}',
        author: '{{author}}',
        date: '{{date}}'
      }
    },
    
    // 文章尾部
    footer: {
      template: `
        <div class="article-footer" style="margin-top: 60px; text-align: center;">
          {{#if divider}}
          <div class="divider" style="margin: 40px 0;">
            <img src="{{divider}}" alt="分割线" style="width: 240px; height: auto; opacity: 0.5;" />
          </div>
          {{/if}}
          
          {{#if qrcode}}
          <div class="qr-section" style="margin: 32px 0; background: #f9f9f9; padding: 24px; border-radius: 12px;">
            <img src="{{qrcode}}" alt="关注二维码" style="width: 140px; height: 140px;" />
            <p style="margin: 12px 0 0 0; color: #333; font-size: 15px; font-weight: 500;">长按识别二维码关注</p>
            <p style="margin: 4px 0 0 0; color: #999; font-size: 13px;">获取更多精彩内容</p>
          </div>
          {{/if}}
          
          <div class="copyright" style="margin-top: 32px; color: #ccc; font-size: 12px; padding: 16px 0; border-top: 1px solid #f0f0f0;">
            <p style="margin: 0;">- END -</p>
          </div>
        </div>
      `,
      position: 'after', 
      variables: {
        qrcode: '{{qrcode}}',
        divider: '{{divider}}'
      }
    }
  }
}