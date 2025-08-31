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
        maxWidth: '100%',
        height: 'auto',
        marginBottom: '12px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'block'
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
        maxWidth: '100%',
        height: 'auto',
        marginBottom: '12px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'block'
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
    // 文章尾部 - 暂时禁用，等待后续配置
    footer: {
      template: ``,
      position: 'after',
      variables: {}
    }
  }
}