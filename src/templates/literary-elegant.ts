import { Template } from '../types/template'

// 文艺优雅模板 - 适合文学创作、生活分享
export const literaryElegantTemplate: Template = {
  id: 'literary-elegant',
  name: '文艺优雅',
  description: '适合文学创作、生活随笔、情感文章',
  brandColors: ['#d4a574', '#8b7355', '#a0826d'],  // 预设配色：复古棕
  usage: `
## 模板使用说明

### Markdown 语法对应关系：
- **# 大标题** → 文章主标题（居中，优雅字体）
- **## 章节标题** → 各个章节的标题（居中，装饰性排版）
- **### 小标题** → 小节标题（居中）
- **普通文字** → 正文内容（舒适行高，优雅字体）
- **[链接](地址)** → 柔和色调链接
- **![图片](地址)** → 圆角图片，优雅展示
- **> 引用** → 诗意引用块
- **- 列表项** → 简洁列表
- **\`代码\`** → 柔和代码样式

### 适用场景：
- 文学创作发布
- 生活随笔记录
- 情感文章分享
- 美学内容展示
  `,
  thumbnail: '/assets/thumbnails/literary-elegant.png',
  category: 'document',
  
  styles: {
    container: {
      maxWidth: '100%',
      padding: '28px 24px',
      backgroundColor: '#fffef9',
      fontFamily: 'STKaiti, KaiTi, "楷体", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", serif',
      lineHeight: '2.0',
      textAlign: 'center'
    },
    
    typography: {
      h1: {
        fontSize: '28px',
        fontWeight: '500',
        color: '#3a3a3a',
        marginBottom: '36px',
        textAlign: 'center',
        lineHeight: '1.5',
        letterSpacing: '4px'
      },
      
      h2: {
        fontSize: '22px',
        fontWeight: '500',
        color: '#8b7355',
        margin: '40px 0 24px 0',
        textAlign: 'center',
        lineHeight: '1.6',
        letterSpacing: '2px'
      },
      
      h3: {
        fontSize: '19px',
        fontWeight: '500',
        color: '#a0826d',
        margin: '32px 0 16px 0',
        textAlign: 'center',
        lineHeight: '1.6',
        letterSpacing: '1px'
      },
      
      p: {
        fontSize: '16px',
        color: '#4a4a4a',
        marginBottom: '20px',
        lineHeight: '2.0',
        textAlign: 'left',
        textIndent: '2em'
      },
      
      a: {
        fontSize: '16px',
        color: '#d4a574',
        textDecoration: 'none',
        fontWeight: 'normal',
        borderBottom: '1px solid rgba(212, 165, 116, 0.3)'
      },
      
      strong: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#8b7355'
      },
      
      em: {
        fontSize: '16px',
        fontStyle: 'italic',
        color: '#a0826d'
      },
      
      code: {
        backgroundColor: '#f5f0e8',
        color: '#8b7355',
        padding: '2px 6px',
        borderRadius: '3px',
        fontSize: '14px'
      },
      
      blockquote: {
        fontSize: '16px',
        borderLeft: 'none',
        paddingLeft: '0',
        margin: '32px 0',
        color: '#8b7355',
        fontStyle: 'italic',
        backgroundColor: 'transparent',
        padding: '20px 24px',
        textAlign: 'center',
        borderTop: '1px solid #d4a574',
        borderBottom: '1px solid #d4a574'
      }
    },
    
    elements: {
      ul: {
        paddingLeft: '32px',
        marginBottom: '20px',
        listStyle: 'circle'
      },
      
      ol: {
        paddingLeft: '32px', 
        marginBottom: '20px',
        listStyle: 'decimal'
      },
      
      li: {
        marginBottom: '12px',
        lineHeight: '2.0',
        fontSize: '16px',
        color: '#4a4a4a',
        textAlign: 'left'
      },
      
      img: {
        width: '100%',
        maxWidth: '100%',
        height: 'auto',
        marginBottom: '24px',
        borderRadius: '12px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
        display: 'block',
        margin: '24px auto'
      },
      
      hr: {
        border: 'none',
        height: '1px',
        backgroundColor: '#d4a574',
        margin: '48px auto',
        width: '30%',
        opacity: 0.3
      }
    }
  },
  
  fixedElements: {
    footer: {
      template: ``,
      position: 'after',
      variables: {}
    }
  }
}

